# Spesifikasi Aplikasi — Focus Survey Solution

- **Nama Proyek:** `focus-survey-solution` (v1.0.0)
- **Judul Web:** Focus Survey Solution | Kalibrasi Onsite & Inlab
- **Jenis Aplikasi:** Website Company Profile, Layanan Kalibrasi & Survey, Formulir Konsultasi, Ulasan Pelanggan, dan Panel Admin (SPA)

---

## 1. Arsitektur & Teknologi

### Frontend
- **Teknologi:** HTML5, CSS3, dan JavaScript murni (Single Page Application)
- **File Utama:**
  - `index.html` — Struktur halaman utama dan tampilan panel admin
  - `style.css` — Styling antarmuka
  - `app.js` — Logika interaktif, sinkronisasi data via `/api/*`, dan manajemen panel admin

### Backend (Mendukung 2 Mode)
1. **Mode PHP + SQLite (Untuk Hostinger Paket Premium / Shared Hosting hPanel):**
   - **Runtime:** PHP 8.1+ (dengan ekstensi `pdo_sqlite` aktif)
   - **Web Server:** Apache / LiteSpeed (`.htaccess` dengan `mod_rewrite` & `mod_headers`)
   - **Entry Point API:** `api.php`
2. **Mode Node.js (Untuk Lokal / VPS / Hosting Node.js):**
   - **Runtime:** Node.js (`v18+`)
   - **Framework:** Express (`express` `^5.2.1`)
   - **Entry Point:** `server.js`

---

## 2. Database & Penyimpanan Data

### Mode PHP (`api.php`)
Menggunakan **SQLite** di `storage/database.sqlite` (mode `WAL`, timeout 5000 ms) dengan tabel:
- `app_state` — Menyimpan data utama aplikasi (konten web, katalog/layanan, ulasan disetujui, hash PIN admin) beserta nomor versi
- `inquiries` — Menyimpan data pesan konsultasi dari pengunjung (`id`, `created_at`, `nama`, `pt`, `jenis`, `mode`, `pesan`)
- `pending_reviews` — Antrean ulasan pelanggan sebelum disetujui atau ditolak admin
- `admin_sessions` — Token sesi admin aktif beserta waktu kedaluwarsa (8 jam)
- `rate_limits` — Pencatat batas permintaan per IP untuk endpoint publik
- `login_attempts` — Pencatat percobaan login gagal per IP untuk proteksi brute-force

> **Migrasi Otomatis:** Pada akses pertama saat database masih kosong, `api.php` otomatis mengimpor data awal dari `data.json`, `inquiries.json`, dan `pending-reviews.json`.

### Mode Node.js (`server.js`)
Menyimpan data langsung pada file JSON lokal (`data.json`, `inquiries.json`, `pending-reviews.json`) dan menyimpan sesi/rate-limit di memori proses.

### Backup
- Setiap penyimpanan data admin (`POST /api/data`) dan unggah backup (`POST /api/backup/upload`) otomatis membuat arsip JSON ber-timestamp di folder `backups/`.

---

## 3. Daftar Endpoint API

### Endpoint Publik
| Method | Endpoint | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/data` | Mengambil data utama aplikasi (tanpa `pinHash` jika belum login admin) |
| `GET` | `/api/data/version` | Mengecek versi data terbaru (`version`) |
| `POST` | `/api/reviews` | Mengirim ulasan baru ke antrean moderasi (rate limit: 5 per 10 menit/IP) |
| `POST` | `/api/inquiry` | Mengirim pesan konsultasi (rate limit: 10 per 10 menit/IP) |
| `POST` | `/api/admin/login` | Login admin dengan PIN 6–12 digit |
| `POST` | `/api/admin/logout` | Logout admin dan menghapus cookie sesi |

### Endpoint Admin (Wajib Cookie Sesi `fss_admin_access`)
| Method | Endpoint | Keterangan |
| :--- | :--- | :--- |
| `POST` | `/api/data` | Menyimpan perubahan data utama dan membuat file backup baru |
| `GET` | `/api/admin/reviews/pending` | Melihat daftar ulasan yang menunggu persetujuan |
| `POST` | `/api/admin/reviews/:id/:decision` | Menyetujui (`approve`) atau menolak (`reject`) ulasan |
| `GET` | `/api/inquiries/download` | Mengunduh seluruh data konsultasi dalam format `inquiries.json` |
| `GET` | `/api/backups` | Mengambil daftar riwayat file backup di folder `backups/` |
| `GET` | `/api/backup/download?file=...` | Mengunduh file backup tertentu |
| `POST` | `/api/backup/restore` | Memulihkan data utama dari file backup di server |
| `POST` | `/api/backup/upload` | Mengunggah dan menerapkan file backup JSON dari perangkat lokal |

---

## 4. Keamanan
- **Autentikasi Admin:** PIN 6–12 digit di-hash menggunakan `SHA-256` (`fss-pin:<PIN>`) dan dibandingkan secara timing-safe (`hash_equals` / `crypto.timingSafeEqual`).
- **Brute-Force Protection:** 5 kali gagal login akan mengunci percobaan dari IP tersebut selama 30 detik.
- **Sesi Cookie:** Menggunakan cookie `fss_admin_access` dengan atribut `HttpOnly`, `SameSite=Strict`, `Path=/api`, masa berlaku 8 jam, dan `Secure` saat diakses melalui HTTPS.
- **Wajib HTTPS di Produksi:** Login admin menolak koneksi non-HTTPS saat berjalan di domain produksi.
- **Security Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Strict-Transport-Security` saat HTTPS aktif.
- **Proteksi Akses File:** `.htaccess` dan `storage/.htaccess` memblokir akses HTTP langsung ke `*.json`, `*.sqlite`, `*.md`, `server.js`, `package*.json`, `storage/`, `backups/`, dan `node_modules/`.

---

## 5. Kebutuhan Lingkungan Hosting (Hostinger Premium hPanel)
- **Web Server:** Apache / LiteSpeed dengan dukungan `.htaccess` (`mod_rewrite`, `mod_headers`)
- **Versi PHP:** Minimal **PHP 8.1** (direkomendasikan PHP 8.2 / 8.3)
- **Ekstensi PHP:** `pdo_sqlite`, `json`, `mbstring`
- **Izin Direktori:** Folder `storage/` dan `backups/` dapat ditulis oleh PHP (`0755`)
- **SSL:** HTTPS aktif di domain
