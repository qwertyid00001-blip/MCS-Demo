const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || '';

// Path file data utama
const DATA_DIR = path.resolve(process.env.DATA_DIR || __dirname);
fs.mkdirSync(DATA_DIR, { recursive: true });
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const PENDING_REVIEWS_FILE = path.join(DATA_DIR, 'pending-reviews.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DEFAULT_PIN_HASH = 'c9f4c8d978856cbcc0b683b5db475aaee5c893dbfa94bb987c4680e2a5c7c3dc';
const adminSessions = new Map();
const loginAttempts = new Map();
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(proxyHops) && proxyHops > 0) app.set('trust proxy', proxyHops);

for (const filename of ['data.json', 'inquiries.json', 'pending-reviews.json']) {
  const target = path.join(DATA_DIR, filename);
  const source = path.join(__dirname, filename);
  if (!fs.existsSync(target) && fs.existsSync(source) && source !== target) fs.copyFileSync(source, target);
}

// Pastikan direktori backups tersedia
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

if (ADMIN_PIN && !/^\d{6,12}$/.test(ADMIN_PIN)) throw new Error('ADMIN_PIN must contain 6 to 12 digits.');
if (process.env.NODE_ENV === 'production' && !ADMIN_PIN) {
  const savedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  if (!savedData.pinHash) throw new Error('Set ADMIN_PIN in the hosting environment before first production start.');
}

// Middleware parsing Body (JSON & Form)
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.secure || req.get('x-forwarded-proto') === 'https') res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

function readPendingReviews() {
  if (!fs.existsSync(PENDING_REVIEWS_FILE)) return [];
  const pending = JSON.parse(fs.readFileSync(PENDING_REVIEWS_FILE, 'utf-8'));
  return Array.isArray(pending) ? pending : [];
}

function writePendingReviews(reviews) {
  fs.writeFileSync(PENDING_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
}

function adminToken(req) {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)fss_admin_access=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function hasAdminSession(req) {
  const token = adminToken(req);
  const expiresAt = adminSessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

function requireAdminSession(req, res, next) {
  if (!hasAdminSession(req)) {
    return res.status(401).json({ ok: false, error: 'Sesi admin berakhir. Silakan masuk kembali.' });
  }
  next();
}

function effectivePinHash(data) {
  if (data.pinHash) return data.pinHash;
  if (ADMIN_PIN) return crypto.createHash('sha256').update('fss-pin:' + ADMIN_PIN).digest('hex');
  return DEFAULT_PIN_HASH;
}

function rateLimit(maxRequests, windowMs) {
  const clients = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip;
    let client = clients.get(ip);
    if (!client || now - client.startedAt >= windowMs) {
      client = { startedAt: now, count: 0 };
      clients.set(ip, client);
    }
    if (client.count >= maxRequests) {
      const retrySeconds = Math.ceil((windowMs - (now - client.startedAt)) / 1000);
      res.set('Retry-After', String(retrySeconds));
      return res.status(429).json({ ok: false, error: 'Terlalu banyak permintaan. Coba lagi nanti.' });
    }
    client.count += 1;
    if (clients.size > 10000) {
      for (const [key, value] of clients){
        if (now - value.startedAt >= windowMs) clients.delete(key);
      }
    }
    next();
  };
}

app.post('/api/admin/login', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.status(400).json({ ok: false, error: 'Login Admin hanya tersedia melalui HTTPS.' });
    }
    const ip = req.ip;
    const attempt = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
    if (attempt.lockedUntil > Date.now()) {
      return res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 30 detik.' });
    }

    const submittedPin = String(req.body.pin || '');
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const expectedHash = effectivePinHash(data);
    const actualHash = crypto.createHash('sha256').update('fss-pin:' + submittedPin).digest('hex');
    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(actualHash, 'hex');
    if (!/^\d{6,12}$/.test(submittedPin) || expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.count = 0;
        attempt.lockedUntil = Date.now() + 30000;
      }
      loginAttempts.set(ip, attempt);
      return res.status(401).json({ ok: false, error: 'PIN admin salah.' });
    }

    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
    const secure = req.secure || req.get('x-forwarded-proto') === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `fss_admin_access=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800${secure}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Gagal membuat sesi admin:', err);
    res.status(500).json({ ok: false, error: 'Gagal memverifikasi PIN admin di server.' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  adminSessions.delete(adminToken(req));
  res.setHeader('Set-Cookie', 'fss_admin_access=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');
  res.json({ ok: true });
});

app.post('/api/reviews', rateLimit(5, 10 * 60 * 1000), (req, res) => {
  const { name, org, rating, text } = req.body;
  const score = Number(rating);
  if (!String(name || '').trim() || !Number.isInteger(score) || score < 1 || score > 5 || !String(text || '').trim()) {
    return res.status(400).json({ ok: false, error: 'Nama, rating 1 sampai 5, dan isi ulasan wajib diisi.' });
  }
  if (String(name).length > 120 || String(org || '').length > 160 || String(text).length > 3000) {
    return res.status(400).json({ ok: false, error: 'Ulasan melebihi batas panjang yang diizinkan.' });
  }

  try {
    const reviews = readPendingReviews();
    const review = {
      id: 'review_' + crypto.randomBytes(12).toString('hex'),
      name: String(name).trim(),
      org: String(org || '').trim(),
      sector: '',
      rating: score,
      date: new Date().toISOString().slice(0, 10),
      text: String(text).trim(),
      created_at: new Date().toISOString()
    };
    reviews.push(review);
    writePendingReviews(reviews);
    res.status(201).json({ ok: true, message: 'Ulasan dikirim dan menunggu persetujuan admin.' });
  } catch (err) {
    console.error('Gagal menyimpan ulasan:', err);
    res.status(500).json({ ok: false, error: 'Gagal menyimpan ulasan. Silakan coba lagi.' });
  }
});

app.get('/api/admin/reviews/pending', requireAdminSession, (req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json({ ok: true, reviews: readPendingReviews() });
  } catch (err) {
    console.error('Gagal membaca antrean ulasan:', err);
    res.status(500).json({ ok: false, error: 'Gagal membaca antrean ulasan.' });
  }
});

app.post('/api/admin/reviews/:id/:decision', requireAdminSession, (req, res) => {
  const { id, decision } = req.params;
  if (!['approve', 'reject'].includes(decision)) return res.status(404).json({ ok: false, error: 'Tindakan tidak dikenali.' });

  try {
    const pending = readPendingReviews();
    const index = pending.findIndex(review => review.id === id);
    if (index < 0) return res.status(404).json({ ok: false, error: 'Ulasan tidak ditemukan atau sudah ditinjau.' });
    const [review] = pending.splice(index, 1);

    if (decision === 'approve') {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      const approved = Array.isArray(data.reviews) ? data.reviews : [];
      approved.push({ id: review.id, name: review.name, org: review.org, sector: review.sector, rating: review.rating, date: review.date, text: review.text, show: true });
      data.reviews = approved;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    writePendingReviews(pending);
    res.json({ ok: true, decision, remaining: pending.length });
  } catch (err) {
    console.error('Gagal memproses ulasan:', err);
    res.status(500).json({ ok: false, error: 'Gagal memproses ulasan.' });
  }
});

// Serve only browser assets; JSON data and backups remain private.
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app.js', (req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(__dirname, 'app.js')));
app.get('/style.css', (req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(__dirname, 'style.css')));

// =================================================================
// 1. ENDPOINT PENGELOLAAN DATA (`data.json`)
// =================================================================

function dataVersion() {
  const stats = fs.statSync(DATA_FILE);
  return `${stats.mtimeMs}:${stats.size}`;
}

app.get('/api/data/version', (req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json({ version: dataVersion() });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Gagal memeriksa versi data.' });
  }
});

app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (hasAdminSession(req)) data.pinHash = effectivePinHash(data);
    else delete data.pinHash;
    res.set('Cache-Control', 'no-store');
    res.set('X-Data-Version', dataVersion());
    res.json(data);
  } catch (err) {
    console.error('Gagal membaca data:', err);
    res.status(500).json({ ok: false, error: 'Gagal membaca data dari server.' });
  }
});

// Save & Auto Backup Data Utama
app.post('/api/data', requireAdminSession, (req, res) => {
  try {
    const dataObj = req.body;
    if (!dataObj || typeof dataObj !== 'object' || Array.isArray(dataObj)) {
      return res.status(400).json({ ok: false, error: 'Format data tidak valid.' });
    }
    
    // 1. Simpan ke data.json
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataObj, null, 2), 'utf-8');

    // 2. Buat file backup otomatis berdasarkan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    fs.writeFileSync(path.join(BACKUPS_DIR, backupFileName), JSON.stringify(dataObj, null, 2), 'utf-8');

    res.json({ ok: true, message: 'Data berhasil disimpan dan dibackup!' });
  } catch (err) {
    console.error('Gagal menyimpan data:', err);
    res.status(500).json({ ok: false, error: 'Gagal menyimpan data ke server.' });
  }
});

// =================================================================
// 2. ENDPOINT INQUIRIES / KONSULTASI (`inquiries.json`)
// =================================================================

// Tambah pesan konsultasi baru
app.post('/api/inquiry', rateLimit(10, 10 * 60 * 1000), (req, res) => {
  try {
    const body = req.body || {};
    const inquiry = {
      nama: String(body.nama || '').trim(),
      pt: String(body.pt || '').trim(),
      jenis: String(body.jenis || '').trim(),
      mode: String(body.mode || '').trim(),
      pesan: String(body.pesan || '').trim()
    };
    if (!inquiry.nama || inquiry.nama.length > 120 || inquiry.pt.length > 160 || inquiry.jenis.length > 200 || inquiry.mode.length > 80 || inquiry.pesan.length > 3000) {
      return res.status(400).json({ ok: false, error: 'Data konsultasi tidak valid atau terlalu panjang.' });
    }

    let inquiries = [];
    if (fs.existsSync(INQUIRIES_FILE)) {
      const raw = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
      inquiries = raw ? JSON.parse(raw) : [];
    }
    if (!Array.isArray(inquiries)) inquiries = [];

    const newInquiry = {
      id: 'inq_' + Date.now(),
      created_at: new Date().toISOString(),
      ...inquiry
    };

    inquiries.push(newInquiry);
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');

    res.json({ ok: true, message: 'Pesan konsultasi berhasil dicatat.' });
  } catch (err) {
    console.error('Gagal mencatat inquiry:', err);
    res.status(500).json({ ok: false, error: 'Gagal menyimpan data konsultasi.' });
  }
});

// Unduh file inquiries.json
app.get('/api/inquiries/download', requireAdminSession, (req, res) => {
  if (fs.existsSync(INQUIRIES_FILE)) {
    res.download(INQUIRIES_FILE, 'inquiries.json');
  } else {
    res.status(404).json({ ok: false, message: 'File data konsultasi belum tersedia.' });
  }
});

// =================================================================
// 3. ENDPOINT MANAJEMEN BACKUP
// =================================================================

// Dapatkan daftar file backup di server
app.get('/api/backups', requireAdminSession, (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ ok: true, backups: [] });
    }

    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(filename => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, filename));
        return {
          filename,
          date: stats.mtime.toISOString(),
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(files);
  } catch (err) {
    console.error('Gagal mengambil daftar backup:', err);
    res.status(500).json({ ok: false, error: 'Gagal mengambil riwayat backup.' });
  }
});

// Unduh file backup tertentu
app.get('/api/backup/download', requireAdminSession, (req, res) => {
  const filename = req.query.file;
  if (!filename) {
    return res.status(400).json({ ok: false, error: 'Parameter file harus diisi.' });
  }

  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUPS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, safeFilename);
  } else {
    res.status(404).json({ ok: false, error: 'File backup tidak ditemukan.' });
  }
});

// Pulihkan (Restore) data dari file backup server
app.post('/api/backup/restore', requireAdminSession, (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ ok: false, error: 'Nama file backup diperlukan.' });
    }

    const safeFilename = path.basename(filename);
    const backupPath = path.join(BACKUPS_DIR, safeFilename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ ok: false, error: 'File backup tidak ditemukan.' });
    }

    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    fs.writeFileSync(DATA_FILE, backupContent, 'utf-8');

    res.json({ ok: true, message: 'Data berhasil dipulihkan dari backup!' });
  } catch (err) {
    console.error('Gagal restore backup:', err);
    res.status(500).json({ ok: false, error: 'Gagal memulihkan data.' });
  }
});

// Unggah & terapkan backup manual dari lokal
app.post('/api/backup/upload', requireAdminSession, (req, res) => {
  try {
    const dataObj = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataObj, null, 2), 'utf-8');

    // Buat file arsip backup upload
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `uploaded-${timestamp}.json`;
    fs.writeFileSync(path.join(BACKUPS_DIR, backupFileName), JSON.stringify(dataObj, null, 2), 'utf-8');

    res.json({ ok: true, message: 'File backup berhasil diunggah dan diterapkan!' });
  } catch (err) {
    console.error('Gagal unggah backup:', err);
    res.status(500).json({ ok: false, error: 'Gagal memproses file backup.' });
  }
});

// Fallback route untuk Single Page Application (SPA)
app.get('/{*path}', (req, res) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'Endpoint tidak ditemukan.' });
  if (path.extname(req.path)) return res.status(404).json({ ok: false, error: 'File tidak ditemukan.' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Server Focus Survey Solution Aktif`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`=================================`);
});
