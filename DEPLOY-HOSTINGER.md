# Panduan Deploy ke Hostinger (Shared Hosting + Free Domain)

Panduan ini menjelaskan langkah demi langkah untuk men-deploy aplikasi ke **Hostinger** menggunakan paket *shared hosting* (seperti **Hostinger Premium Web Hosting** dengan promo **Free Domain**), menggunakan mode **PHP + SQLite** tanpa perlu VPS atau Node.js.

---

## 1. Persiapan di Hostinger
1. **Beli Paket Hosting + Klaim Free Domain:**
   - Pilih paket **Premium Web Hosting** (atau **Business Web Hosting**) dengan durasi minimal **12 bulan** agar mendapatkan **Free Domain `.com`** tahun pertama.
   - Selesaikan proses klaim dan aktivasi domain di dashboard **hPanel**.
2. **Tunggu Propagasi DNS:**
   - Pastikan status domain di hPanel sudah **Active** dan mengarah ke hosting Hostinger Anda.

---

## 2. Daftar File yang Diupload ke `public_html`

Siapkan file proyek berikut (bisa dikompres menjadi `.zip` terlebih dahulu agar upload ke File Manager lebih cepat):

### Wajib Diupload
- `index.html`
- `app.js`
- `style.css`
- `api.php`
- `.htaccess` *(file tersembunyi — pastikan ikut ter-select/terkompres)*
- `storage/` *(beserta `storage/.htaccess` di dalamnya)*
- `data.json`
- `inquiries.json`
- `pending-reviews.json`

### Opsional
- `backups/` *(jika ingin membawa riwayat backup lama)*

### Jangan Diupload
- `node_modules/`
- `server.js`, `package.json`, `package-lock.json`
- File dokumentasi/administrasi (`*.md`, `*.pdf`)

> **Tips:** Saat mengompres di macOS/Windows, pastikan file tersembunyi seperti `.htaccess` dan `storage/.htaccess` ikut masuk ke dalam arsip `.zip`.

---

## 3. Langkah Upload & Konfigurasi di hPanel

### Langkah 1: Upload File ke `public_html`
1. Login ke **hPanel Hostinger** → pilih website/domain Anda → klik **Manage**.
2. Buka menu **Files → File Manager**.
3. Masuk ke folder `public_html`.
4. Jika ada file bawaan seperti `default.php`, hapus atau pindahkan terlebih dahulu.
5. Upload seluruh file pada daftar wajib di atas (atau upload `.zip` lalu klik kanan → **Extract** langsung di dalam `public_html`).
6. Pastikan struktur di dalam `public_html` terlihat seperti ini:
   ```text
   public_html/
   ├── .htaccess
   ├── api.php
   ├── app.js
   ├── data.json
   ├── index.html
   ├── inquiries.json
   ├── pending-reviews.json
   ├── style.css
   ├── backups/          (opsional)
   └── storage/
       └── .htaccess
   ```

### Langkah 2: Cek Versi PHP & Ekstensi SQLite
1. Di hPanel, buka **Advanced → PHP Configuration**.
2. Pilih versi PHP minimal **PHP 8.1** (disarankan **PHP 8.2** atau **8.3**).
3. Buka tab **PHP Extensions** dan pastikan **`pdo_sqlite`** (dan `sqlite3`) dalam kondisi **tercentang/aktif** *(umumnya aktif secara default di Hostinger)*.

### Langkah 3: Atur Izin Folder (*Permissions*)
1. Di **File Manager**, klik kanan folder `storage/` → **Permissions**.
2. Pastikan nilainya **`0755`** (Owner dapat Read, Write, Execute).
3. Lakukan hal yang sama untuk folder `backups/` jika Anda menguploadnya.

### Langkah 4: Aktifkan SSL Gratis (HTTPS)
1. Di hPanel, buka **Security → SSL**.
2. Instal **Lifetime SSL (Gratis)** untuk domain Anda dan tunggu hingga statusnya **Active**.
3. Aktifkan opsi **Force HTTPS** agar seluruh akses otomatis diarahkan ke `https://`.

---

## 4. Migrasi Otomatis & Keamanan
- **Migrasi Database Otomatis:** Saat website pertama kali dibuka melalui browser, `api.php` akan otomatis membuat file `storage/database.sqlite` dan mengimpor data awal dari `data.json`, `inquiries.json`, serta `pending-reviews.json`.
- **Proteksi File Sensitif:** File `.htaccess` di `public_html` dan `storage/.htaccess` otomatis memblokir akses langsung dari browser ke `*.json`, `*.sqlite`, `storage/`, dan `backups/`, serta mengarahkan seluruh request `/api/*` ke `api.php`.

---

## 5. Verifikasi Setelah Deploy
1. Buka `https://domainanda.com` di browser dan pastikan halaman utama tampil normal tanpa error.
2. Uji fitur yang memakai API (misalnya memuat data atau login Admin melalui HTTPS) untuk memastikan routing `/api/*` → `api.php` berjalan lancar.
3. Cek kembali di **File Manager → `public_html/storage/`**: pastikan file `database.sqlite` sudah terbentuk otomatis.

---

## 6. Troubleshooting Umum
- **Endpoint `/api/...` mengembalikan 404 Not Found:**
  - Pastikan file `.htaccess` benar-benar ada di dalam `public_html/` (di File Manager Hostinger, cek pengaturan tampilan *Show Hidden Files* jika tidak terlihat).
- **Error 500 atau data gagal disimpan:**
  - Cek versi PHP minimal **8.1** dan pastikan ekstensi `pdo_sqlite` aktif.
  - Pastikan izin folder `storage/` adalah `0755`.
- **Perubahan tampilan JS/CSS tidak langsung muncul:**
  - Bersihkan cache browser atau lakukan *hard refresh* (`Ctrl+Shift+R` / `Cmd+Shift+R`), dan jika memakai CDN/LiteSpeed Cache di hPanel, lakukan **Purge All Cache**.
