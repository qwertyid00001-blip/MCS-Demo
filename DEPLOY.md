# Deploy ke Domain

Proyek ini mendukung **2 mode deploy**:
1. **Hostinger Web Hosting / Paket Premium (hPanel — PHP + SQLite)** *(direkomendasikan untuk shared hosting)*
2. **Hosting Node.js (VPS / Hostinger Business+ / Cloud)**

---

## Opsi 1: Deploy ke Hostinger Premium (hPanel — PHP + SQLite)

Paket Premium Hostinger menggunakan Apache/LiteSpeed + PHP dan tidak menjalankan server Node.js. Untuk mode ini, gunakan file `.htaccess`, `api.php`, dan folder `storage/`.

### Langkah Upload ke hPanel
1. Buka **hPanel → File Manager → `public_html`**.
2. Upload file proyek berikut ke `public_html` (jangan upload folder `node_modules/`):
   - `index.html`, `app.js`, `style.css`
   - `api.php`, `.htaccess`
   - `storage/.htaccess`
   - `data.json`, `inquiries.json`, `pending-reviews.json` *(sebagai data awal untuk migrasi otomatis ke SQLite)*
   - `backups/` *(opsional, jika ingin membawa riwayat backup lama)*
3. Di hPanel → **Advanced → PHP Configuration**, pastikan versi PHP minimal **PHP 8.1** (atau 8.2 / 8.3) dan ekstensi `pdo_sqlite` aktif (aktif secara default di Hostinger).
4. Pastikan folder `storage/` dan `backups/` memiliki izin tulis (`0755`).
5. Buka domain Anda dengan **HTTPS** (aktifkan SSL gratis di hPanel).
   - Saat pertama kali diakses, `api.php` otomatis membuat `storage/database.sqlite` dan mengimpor data dari `data.json`, `inquiries.json`, dan `pending-reviews.json`.
   - File `.htaccess` otomatis melindungi `*.json`, `*.sqlite`, `storage/`, dan `backups/` agar tidak bisa diakses langsung dari browser.

---

## Opsi 2: Deploy ke Hosting Node.js (Business / Cloud / VPS)

Aplikasi mode Node.js membutuhkan hosting Node.js (`server.js`). Hosting statis saja tidak dapat menjalankan API Node.js.

## Pengaturan Hosting

- Install command: `npm ci`
- Start command: `npm start`
- Build command: tidak diperlukan
- Gunakan Node.js 18 atau lebih baru.
- Hubungkan domain melalui reverse proxy hosting dan aktifkan HTTPS.
- Gunakan satu instance Node.js selama aplikasi masih memakai file JSON.

Atur environment variables di dashboard hosting, bukan di source code:

- `NODE_ENV=production`
- `ADMIN_PIN`: PIN awal 6 sampai 12 angka. Wajib diisi jika `data.json` belum memiliki PIN tersimpan.
- `DATA_DIR`: path disk persisten yang dapat ditulis aplikasi, misalnya mount path disk hosting.
- `TRUST_PROXY_HOPS=1` jika hosting memakai satu reverse proxy tepercaya di depan Node.js.
- `PORT`: biasanya diisi otomatis oleh hosting.

Saat `DATA_DIR` masih kosong, server menyalin `data.json`, `inquiries.json`, dan `pending-reviews.json` awal ke disk tersebut. Setelah itu, semua data dan folder `backups/` disimpan di dalamnya. Pastikan disk tetap terpasang setelah deploy atau restart.

Login Admin menggunakan `ADMIN_PIN` untuk bootstrap. Setelah PIN diubah dari menu Keamanan, hash PIN tersimpan di data persisten dan menjadi acuan login berikutnya. Jangan masukkan nilai PIN ke file source atau repositori.

Dalam mode produksi, login Admin hanya diterima melalui HTTPS. Jika TLS berhenti di reverse proxy, pastikan proxy mengirim `X-Forwarded-Proto: https` dan atur `TRUST_PROXY_HOPS` sesuai jumlah proxy tepercaya.

## Batasan Penyimpanan JSON

Simpan aplikasi pada satu instance Node.js. Sesi Admin disimpan di memori proses, dan file JSON lokal tidak dibagi otomatis ke instance lain. Untuk beberapa instance atau banyak perubahan bersamaan, migrasikan data dan sesi ke database bersama seperti PostgreSQL atau MySQL.