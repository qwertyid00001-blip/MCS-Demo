<?php
declare(strict_types=1);

/**
 * Backend PHP + SQLite untuk Focus Survey Solution
 * Kompatibel dengan Hostinger Shared/Premium Web Hosting (hPanel).
 */

const DEFAULT_PIN_HASH = 'c9f4c8d978856cbcc0b683b5db475aaee5c893dbfa94bb987c4680e2a5c7c3dc';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

$rootDir = __DIR__;
$storageDir = $rootDir . DIRECTORY_SEPARATOR . 'storage';
$backupsDir = $rootDir . DIRECTORY_SEPARATOR . 'backups';
$dbPath = $storageDir . DIRECTORY_SEPARATOR . 'database.sqlite';

if (!is_dir($storageDir)) {
    mkdir($storageDir, 0755, true);
}
if (!is_dir($backupsDir)) {
    mkdir($backupsDir, 0755, true);
}

// Header keamanan dasar
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
if (isHttps()) {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

function isHttps(): bool
{
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') {
        return true;
    }
    if (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443) {
        return true;
    }
    return false;
}

function isLocalHost(): bool
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    return str_starts_with($host, 'localhost') || str_starts_with($host, '127.0.0.1') || str_starts_with($host, '[::1]');
}

function clientIp(): string
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
        $first = trim($parts[0]);
        if ($first !== '') {
            return $first;
        }
    }
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function jsonResponse(int $status, mixed $payload, array $extraHeaders = []): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    foreach ($extraHeaders as $name => $value) {
        header($name . ': ' . $value);
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return is_array($_POST) ? $_POST : [];
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return [];
    }
    return $decoded;
}

function getDatabase(string $dbPath, string $rootDir): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA busy_timeout = 5000;');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS app_state (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1
        );
    ');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS inquiries (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            nama TEXT NOT NULL,
            pt TEXT NOT NULL,
            jenis TEXT NOT NULL,
            mode TEXT NOT NULL,
            pesan TEXT NOT NULL
        );
    ');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS pending_reviews (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            org TEXT NOT NULL,
            sector TEXT NOT NULL,
            rating INTEGER NOT NULL,
            date TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    ');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS admin_sessions (
            token TEXT PRIMARY KEY,
            expires_at INTEGER NOT NULL
        );
    ');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS rate_limits (
            scope TEXT NOT NULL,
            ip TEXT NOT NULL,
            started_at INTEGER NOT NULL,
            count INTEGER NOT NULL,
            PRIMARY KEY (scope, ip)
        );
    ');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS login_attempts (
            ip TEXT PRIMARY KEY,
            count INTEGER NOT NULL,
            locked_until INTEGER NOT NULL
        );
    ');

    migrateInitialJsonData($pdo, $rootDir);

    return $pdo;
}

function migrateInitialJsonData(PDO $pdo, string $rootDir): void
{
    $now = gmdate('c');

    // 1. Migrasi data.json -> app_state
    $hasMainData = (int) $pdo->query("SELECT COUNT(*) FROM app_state WHERE key = 'main_data'")->fetchColumn();
    if ($hasMainData === 0) {
        $dataFile = $rootDir . DIRECTORY_SEPARATOR . 'data.json';
        $initialJson = '{}';
        if (is_file($dataFile)) {
            $raw = file_get_contents($dataFile);
            if ($raw !== false && json_decode($raw, true) !== null) {
                $initialJson = $raw;
            }
        }
        $stmt = $pdo->prepare('INSERT INTO app_state (key, value, updated_at, version) VALUES (:key, :value, :updated_at, 1)');
        $stmt->execute([
            ':key' => 'main_data',
            ':value' => $initialJson,
            ':updated_at' => $now,
        ]);
    }

    // 2. Migrasi inquiries.json -> inquiries
    $hasInquiries = (int) $pdo->query('SELECT COUNT(*) FROM inquiries')->fetchColumn();
    if ($hasInquiries === 0) {
        $inqFile = $rootDir . DIRECTORY_SEPARATOR . 'inquiries.json';
        if (is_file($inqFile)) {
            $raw = file_get_contents($inqFile);
            $items = $raw !== false ? json_decode($raw, true) : null;
            if (is_array($items) && count($items) > 0) {
                $stmt = $pdo->prepare('
                    INSERT OR IGNORE INTO inquiries (id, created_at, nama, pt, jenis, mode, pesan)
                    VALUES (:id, :created_at, :nama, :pt, :jenis, :mode, :pesan)
                ');
                foreach ($items as $item) {
                    if (!is_array($item)) {
                        continue;
                    }
                    $stmt->execute([
                        ':id' => (string) ($item['id'] ?? ('inq_' . bin2hex(random_bytes(6)))),
                        ':created_at' => (string) ($item['created_at'] ?? $now),
                        ':nama' => (string) ($item['nama'] ?? ''),
                        ':pt' => (string) ($item['pt'] ?? ''),
                        ':jenis' => (string) ($item['jenis'] ?? ''),
                        ':mode' => (string) ($item['mode'] ?? ''),
                        ':pesan' => (string) ($item['pesan'] ?? ''),
                    ]);
                }
            }
        }
    }

    // 3. Migrasi pending-reviews.json -> pending_reviews
    $hasPending = (int) $pdo->query('SELECT COUNT(*) FROM pending_reviews')->fetchColumn();
    if ($hasPending === 0) {
        $revFile = $rootDir . DIRECTORY_SEPARATOR . 'pending-reviews.json';
        if (is_file($revFile)) {
            $raw = file_get_contents($revFile);
            $items = $raw !== false ? json_decode($raw, true) : null;
            if (is_array($items) && count($items) > 0) {
                $stmt = $pdo->prepare('
                    INSERT OR IGNORE INTO pending_reviews (id, name, org, sector, rating, date, text, created_at)
                    VALUES (:id, :name, :org, :sector, :rating, :date, :text, :created_at)
                ');
                foreach ($items as $item) {
                    if (!is_array($item)) {
                        continue;
                    }
                    $stmt->execute([
                        ':id' => (string) ($item['id'] ?? ('review_' . bin2hex(random_bytes(12)))),
                        ':name' => (string) ($item['name'] ?? ''),
                        ':org' => (string) ($item['org'] ?? ''),
                        ':sector' => (string) ($item['sector'] ?? ''),
                        ':rating' => (int) ($item['rating'] ?? 5),
                        ':date' => (string) ($item['date'] ?? gmdate('Y-m-d')),
                        ':text' => (string) ($item['text'] ?? ''),
                        ':created_at' => (string) ($item['created_at'] ?? $now),
                    ]);
                }
            }
        }
    }
}

function getMainDataRow(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT value, updated_at, version FROM app_state WHERE key = 'main_data' LIMIT 1");
    $row = $stmt->fetch();
    if (!$row) {
        return ['data' => [], 'version' => '1:0'];
    }
    $decoded = json_decode((string) $row['value'], true);
    if (!is_array($decoded)) {
        $decoded = [];
    }
    $ver = (string) $row['version'] . ':' . strlen((string) $row['value']);
    return ['data' => $decoded, 'version' => $ver];
}

function saveMainData(PDO $pdo, array $dataObj): void
{
    $json = json_encode($dataObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('Gagal mengkodekan data JSON.');
    }
    $stmt = $pdo->prepare("
        UPDATE app_state
        SET value = :value, updated_at = :updated_at, version = version + 1
        WHERE key = 'main_data'
    ");
    $stmt->execute([
        ':value' => $json,
        ':updated_at' => gmdate('c'),
    ]);
}

function effectivePinHash(array $data): string
{
    if (!empty($data['pinHash']) && is_string($data['pinHash'])) {
        return $data['pinHash'];
    }
    $envPin = getenv('ADMIN_PIN');
    if (is_string($envPin) && $envPin !== '') {
        return hash('sha256', 'fss-pin:' . $envPin);
    }
    return DEFAULT_PIN_HASH;
}

function hasAdminSession(PDO $pdo): bool
{
    $token = (string) ($_COOKIE['fss_admin_access'] ?? '');
    if ($token === '') {
        return false;
    }

    $stmt = $pdo->prepare('SELECT expires_at FROM admin_sessions WHERE token = :token LIMIT 1');
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();
    if (!$row || (int) $row['expires_at'] <= time()) {
        $del = $pdo->prepare('DELETE FROM admin_sessions WHERE token = :token');
        $del->execute([':token' => $token]);
        return false;
    }
    return true;
}

function requireAdminSession(PDO $pdo): void
{
    if (!hasAdminSession($pdo)) {
        jsonResponse(401, ['ok' => false, 'error' => 'Sesi admin berakhir. Silakan masuk kembali.']);
    }
}

function enforceRateLimit(PDO $pdo, string $scope, int $maxRequests, int $windowSeconds): void
{
    $now = time();
    $ip = clientIp();

    $stmt = $pdo->prepare('SELECT started_at, count FROM rate_limits WHERE scope = :scope AND ip = :ip LIMIT 1');
    $stmt->execute([':scope' => $scope, ':ip' => $ip]);
    $row = $stmt->fetch();

    if (!$row || ($now - (int) $row['started_at']) >= $windowSeconds) {
        $upsert = $pdo->prepare('
            INSERT INTO rate_limits (scope, ip, started_at, count)
            VALUES (:scope, :ip, :started_at, 1)
            ON CONFLICT(scope, ip) DO UPDATE SET started_at = excluded.started_at, count = 1
        ');
        $upsert->execute([':scope' => $scope, ':ip' => $ip, ':started_at' => $now]);
        return;
    }

    if ((int) $row['count'] >= $maxRequests) {
        $retrySeconds = max(1, $windowSeconds - ($now - (int) $row['started_at']));
        jsonResponse(429, ['ok' => false, 'error' => 'Terlalu banyak permintaan. Coba lagi nanti.'], [
            'Retry-After' => (string) $retrySeconds,
        ]);
    }

    $upd = $pdo->prepare('UPDATE rate_limits SET count = count + 1 WHERE scope = :scope AND ip = :ip');
    $upd->execute([':scope' => $scope, ':ip' => $ip]);
}

function makeBackupFilename(string $prefix): string
{
    $micro = sprintf('%03d', (int) ((microtime(true) - floor(microtime(true))) * 1000));
    return $prefix . '-' . gmdate('Y-m-d\THis') . '-' . $micro . 'Z.json';
}

// =================================================================
// ROUTING
// =================================================================
try {
    $pdo = getDatabase($dbPath, $rootDir);

    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    $uriPath = (string) (parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?? '/');
    $scriptDir = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? ''))), '/');
    if ($scriptDir !== '' && $scriptDir !== '/' && str_starts_with($uriPath, $scriptDir)) {
        $uriPath = substr($uriPath, strlen($scriptDir));
    }
    $path = '/' . ltrim($uriPath, '/');

    // 1. POST /api/admin/login
    if ($method === 'POST' && $path === '/api/admin/login') {
        if (!isLocalHost() && !isHttps()) {
            jsonResponse(400, ['ok' => false, 'error' => 'Login Admin hanya tersedia melalui HTTPS.']);
        }

        $ip = clientIp();
        $now = time();
        $stmt = $pdo->prepare('SELECT count, locked_until FROM login_attempts WHERE ip = :ip LIMIT 1');
        $stmt->execute([':ip' => $ip]);
        $attempt = $stmt->fetch() ?: ['count' => 0, 'locked_until' => 0];

        if ((int) $attempt['locked_until'] > $now) {
            jsonResponse(429, ['ok' => false, 'error' => 'Terlalu banyak percobaan. Coba lagi dalam 30 detik.']);
        }

        $body = readJsonBody();
        $submittedPin = (string) ($body['pin'] ?? '');
        $main = getMainDataRow($pdo);
        $expectedHash = effectivePinHash($main['data']);
        $actualHash = hash('sha256', 'fss-pin:' . $submittedPin);

        if (!preg_match('/^\d{6,12}$/', $submittedPin) || !hash_equals($expectedHash, $actualHash)) {
            $count = (int) $attempt['count'] + 1;
            $lockedUntil = 0;
            if ($count >= 5) {
                $count = 0;
                $lockedUntil = $now + 30;
            }
            $upsert = $pdo->prepare('
                INSERT INTO login_attempts (ip, count, locked_until)
                VALUES (:ip, :count, :locked_until)
                ON CONFLICT(ip) DO UPDATE SET count = excluded.count, locked_until = excluded.locked_until
            ');
            $upsert->execute([':ip' => $ip, ':count' => $count, ':locked_until' => $lockedUntil]);
            jsonResponse(401, ['ok' => false, 'error' => 'PIN admin salah.']);
        }

        $delAttempt = $pdo->prepare('DELETE FROM login_attempts WHERE ip = :ip');
        $delAttempt->execute([':ip' => $ip]);

        // Bersihkan sesi kedaluwarsa sesekali
        $pdo->prepare('DELETE FROM admin_sessions WHERE expires_at <= :now')->execute([':now' => $now]);

        $token = bin2hex(random_bytes(32));
        $expiresAt = $now + SESSION_TTL_SECONDS;
        $ins = $pdo->prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (:token, :expires_at)');
        $ins->execute([':token' => $token, ':expires_at' => $expiresAt]);

        setcookie('fss_admin_access', $token, [
            'expires' => $expiresAt,
            'path' => '/api',
            'secure' => isHttps(),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        jsonResponse(200, ['ok' => true]);
    }

    // 2. POST /api/admin/logout
    if ($method === 'POST' && $path === '/api/admin/logout') {
        $token = (string) ($_COOKIE['fss_admin_access'] ?? '');
        if ($token !== '') {
            $pdo->prepare('DELETE FROM admin_sessions WHERE token = :token')->execute([':token' => $token]);
        }
        setcookie('fss_admin_access', '', [
            'expires' => time() - 3600,
            'path' => '/api',
            'secure' => isHttps(),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        jsonResponse(200, ['ok' => true]);
    }

    // 3. POST /api/reviews
    if ($method === 'POST' && $path === '/api/reviews') {
        enforceRateLimit($pdo, 'reviews', 5, 10 * 60);

        $body = readJsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $org = trim((string) ($body['org'] ?? ''));
        $text = trim((string) ($body['text'] ?? ''));
        $ratingRaw = $body['rating'] ?? null;
        $score = filter_var($ratingRaw, FILTER_VALIDATE_INT);

        if ($name === '' || $score === false || $score < 1 || $score > 5 || $text === '') {
            jsonResponse(400, ['ok' => false, 'error' => 'Nama, rating 1 sampai 5, dan isi ulasan wajib diisi.']);
        }
        if (mb_strlen($name) > 120 || mb_strlen($org) > 160 || mb_strlen($text) > 3000) {
            jsonResponse(400, ['ok' => false, 'error' => 'Ulasan melebihi batas panjang yang diizinkan.']);
        }

        $id = 'review_' . bin2hex(random_bytes(12));
        $stmt = $pdo->prepare('
            INSERT INTO pending_reviews (id, name, org, sector, rating, date, text, created_at)
            VALUES (:id, :name, :org, :sector, :rating, :date, :text, :created_at)
        ');
        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':org' => $org,
            ':sector' => '',
            ':rating' => $score,
            ':date' => gmdate('Y-m-d'),
            ':text' => $text,
            ':created_at' => gmdate('c'),
        ]);

        jsonResponse(201, ['ok' => true, 'message' => 'Ulasan dikirim dan menunggu persetujuan admin.']);
    }

    // 4. GET /api/admin/reviews/pending
    if ($method === 'GET' && $path === '/api/admin/reviews/pending') {
        requireAdminSession($pdo);
        $reviews = $pdo->query('SELECT id, name, org, sector, rating, date, text, created_at FROM pending_reviews ORDER BY created_at ASC')->fetchAll();
        foreach ($reviews as &$rev) {
            $rev['rating'] = (int) $rev['rating'];
        }
        jsonResponse(200, ['ok' => true, 'reviews' => $reviews], ['Cache-Control' => 'no-store']);
    }

    // 5. POST /api/admin/reviews/:id/:decision
    if ($method === 'POST' && preg_match('#^/api/admin/reviews/([^/]+)/([^/]+)$#', $path, $matches)) {
        requireAdminSession($pdo);
        $id = urldecode($matches[1]);
        $decision = $matches[2];
        if (!in_array($decision, ['approve', 'reject'], true)) {
            jsonResponse(404, ['ok' => false, 'error' => 'Tindakan tidak dikenali.']);
        }

        $stmt = $pdo->prepare('SELECT id, name, org, sector, rating, date, text FROM pending_reviews WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $review = $stmt->fetch();
        if (!$review) {
            jsonResponse(404, ['ok' => false, 'error' => 'Ulasan tidak ditemukan atau sudah ditinjau.']);
        }

        $pdo->beginTransaction();
        try {
            if ($decision === 'approve') {
                $main = getMainDataRow($pdo);
                $data = $main['data'];
                $approved = (isset($data['reviews']) && is_array($data['reviews'])) ? $data['reviews'] : [];
                $approved[] = [
                    'id' => $review['id'],
                    'name' => $review['name'],
                    'org' => $review['org'],
                    'sector' => $review['sector'],
                    'rating' => (int) $review['rating'],
                    'date' => $review['date'],
                    'text' => $review['text'],
                    'show' => true,
                ];
                $data['reviews'] = $approved;
                saveMainData($pdo, $data);
            }

            $del = $pdo->prepare('DELETE FROM pending_reviews WHERE id = :id');
            $del->execute([':id' => $id]);
            $remaining = (int) $pdo->query('SELECT COUNT(*) FROM pending_reviews')->fetchColumn();
            $pdo->commit();

            jsonResponse(200, ['ok' => true, 'decision' => $decision, 'remaining' => $remaining]);
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    // 6. GET /api/data/version
    if ($method === 'GET' && $path === '/api/data/version') {
        $main = getMainDataRow($pdo);
        jsonResponse(200, ['version' => $main['version']], ['Cache-Control' => 'no-store']);
    }

    // 7. GET /api/data
    if ($method === 'GET' && $path === '/api/data') {
        $main = getMainDataRow($pdo);
        $data = $main['data'];
        if (hasAdminSession($pdo)) {
            $data['pinHash'] = effectivePinHash($data);
        } else {
            unset($data['pinHash']);
        }
        jsonResponse(200, $data, [
            'Cache-Control' => 'no-store',
            'X-Data-Version' => $main['version'],
        ]);
    }

    // 8. POST /api/data
    if ($method === 'POST' && $path === '/api/data') {
        requireAdminSession($pdo);
        $dataObj = readJsonBody();
        if (empty($dataObj) || array_is_list($dataObj)) {
            jsonResponse(400, ['ok' => false, 'error' => 'Format data tidak valid.']);
        }

        saveMainData($pdo, $dataObj);

        $backupFileName = makeBackupFilename('backup');
        $prettyJson = json_encode($dataObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        file_put_contents($backupsDir . DIRECTORY_SEPARATOR . $backupFileName, $prettyJson);

        jsonResponse(200, ['ok' => true, 'message' => 'Data berhasil disimpan dan dibackup!']);
    }

    // 9. POST /api/inquiry
    if ($method === 'POST' && $path === '/api/inquiry') {
        enforceRateLimit($pdo, 'inquiry', 10, 10 * 60);

        $body = readJsonBody();
        $nama = trim((string) ($body['nama'] ?? ''));
        $pt = trim((string) ($body['pt'] ?? ''));
        $jenis = trim((string) ($body['jenis'] ?? ''));
        $mode = trim((string) ($body['mode'] ?? ''));
        $pesan = trim((string) ($body['pesan'] ?? ''));

        if ($nama === '' || mb_strlen($nama) > 120 || mb_strlen($pt) > 160 || mb_strlen($jenis) > 200 || mb_strlen($mode) > 80 || mb_strlen($pesan) > 3000) {
            jsonResponse(400, ['ok' => false, 'error' => 'Data konsultasi tidak valid atau terlalu panjang.']);
        }

        $id = 'inq_' . (string) round(microtime(true) * 1000);
        $stmt = $pdo->prepare('
            INSERT INTO inquiries (id, created_at, nama, pt, jenis, mode, pesan)
            VALUES (:id, :created_at, :nama, :pt, :jenis, :mode, :pesan)
        ');
        $stmt->execute([
            ':id' => $id,
            ':created_at' => gmdate('c'),
            ':nama' => $nama,
            ':pt' => $pt,
            ':jenis' => $jenis,
            ':mode' => $mode,
            ':pesan' => $pesan,
        ]);

        jsonResponse(200, ['ok' => true, 'message' => 'Pesan konsultasi berhasil dicatat.']);
    }

    // 10. GET /api/inquiries/download
    if ($method === 'GET' && $path === '/api/inquiries/download') {
        requireAdminSession($pdo);
        $rows = $pdo->query('SELECT id, created_at, nama, pt, jenis, mode, pesan FROM inquiries ORDER BY created_at ASC')->fetchAll();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="inquiries.json"');
        echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 11. GET /api/backups
    if ($method === 'GET' && $path === '/api/backups') {
        requireAdminSession($pdo);
        if (!is_dir($backupsDir)) {
            jsonResponse(200, []);
        }
        $files = [];
        foreach (scandir($backupsDir) ?: [] as $filename) {
            if (!str_ends_with($filename, '.json')) {
                continue;
            }
            $full = $backupsDir . DIRECTORY_SEPARATOR . $filename;
            if (!is_file($full)) {
                continue;
            }
            $mtime = filemtime($full) ?: time();
            $files[] = [
                'filename' => $filename,
                'date' => gmdate('c', $mtime),
                'size' => filesize($full) ?: 0,
            ];
        }
        usort($files, static fn(array $a, array $b): int => strcmp($b['date'], $a['date']));
        jsonResponse(200, $files);
    }

    // 12. GET /api/backup/download
    if ($method === 'GET' && $path === '/api/backup/download') {
        requireAdminSession($pdo);
        $filename = (string) ($_GET['file'] ?? '');
        if ($filename === '') {
            jsonResponse(400, ['ok' => false, 'error' => 'Parameter file harus diisi.']);
        }
        $safeFilename = basename($filename);
        $filePath = $backupsDir . DIRECTORY_SEPARATOR . $safeFilename;
        if (!is_file($filePath)) {
            jsonResponse(404, ['ok' => false, 'error' => 'File backup tidak ditemukan.']);
        }
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
        header('Content-Length: ' . (string) filesize($filePath));
        readfile($filePath);
        exit;
    }

    // 13. POST /api/backup/restore
    if ($method === 'POST' && $path === '/api/backup/restore') {
        requireAdminSession($pdo);
        $body = readJsonBody();
        $filename = (string) ($body['filename'] ?? '');
        if ($filename === '') {
            jsonResponse(400, ['ok' => false, 'error' => 'Nama file backup diperlukan.']);
        }
        $safeFilename = basename($filename);
        $backupPath = $backupsDir . DIRECTORY_SEPARATOR . $safeFilename;
        if (!is_file($backupPath)) {
            jsonResponse(404, ['ok' => false, 'error' => 'File backup tidak ditemukan.']);
        }
        $raw = file_get_contents($backupPath);
        $decoded = $raw !== false ? json_decode($raw, true) : null;
        if (!is_array($decoded) || array_is_list($decoded)) {
            jsonResponse(400, ['ok' => false, 'error' => 'Isi file backup tidak valid.']);
        }
        saveMainData($pdo, $decoded);
        jsonResponse(200, ['ok' => true, 'message' => 'Data berhasil dipulihkan dari backup!']);
    }

    // 14. POST /api/backup/upload
    if ($method === 'POST' && $path === '/api/backup/upload') {
        requireAdminSession($pdo);
        $dataObj = readJsonBody();
        if (empty($dataObj) || array_is_list($dataObj)) {
            jsonResponse(400, ['ok' => false, 'error' => 'Format file backup tidak valid.']);
        }
        saveMainData($pdo, $dataObj);

        $backupFileName = makeBackupFilename('uploaded');
        $prettyJson = json_encode($dataObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        file_put_contents($backupsDir . DIRECTORY_SEPARATOR . $backupFileName, $prettyJson);

        jsonResponse(200, ['ok' => true, 'message' => 'File backup berhasil diunggah dan diterapkan!']);
    }

    jsonResponse(404, ['ok' => false, 'error' => 'Endpoint tidak ditemukan.']);
} catch (Throwable $e) {
    error_log('Focus Survey Solution API Error: ' . $e->getMessage());
    jsonResponse(500, ['ok' => false, 'error' => 'Terjadi kesalahan pada server.']);
}
