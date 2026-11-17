# DevOps Work Tracker

**DevOps Work Tracker** adalah aplikasi internal monolith berbasis **Laravel 12**, **Inertia.js (React)**, dan **Shadcn UI** untuk mencatat pekerjaan operasional infrastruktur DevOps, memantau progres lintas hari tanpa menimpa histori, mengaitkan tiket dengan aset server/VM/database, mengompresi dan menyimpan bukti teknis (*evidence*) secara privat (otomatis WebP), serta menyajikan laporan eksekutif dan ekspor snapshot PDF bagi manajemen.

---

## 🚀 Fitur Utama

1. **Dashboard Operasional Berbasis Shadcn UI & Public Executive Board**
   - Kartu KPI ringkas: Total Task, Selesai (100%), In Progress, Blocked, Backlog, Overdue Tasks, dan Total Mesin/Aset Aktif.
   - Grafik distribusi status (Doughnut) dan sebaran kategori (Bar Chart) menggunakan Chart.js dengan palet Shadcn Slate.
   - **Executive Monitoring Board (`/board` & `/executive`)**: Dapat diakses langsung oleh Atasan/Manajemen secara *read-only* tanpa perlu login.

2. **Hybrid Activity Workflow & Progres Aman**
   - Satu task dibuat sekali, pembaruan progres dicatat setiap hari sebagai *record* baru (*immutable history*).
   - Validasi ketat antara status dan progres (Backlog: 0%, In Progress & Blocked: 1–99%, Completed: 100%).
   - Transaksi database atomik memperbarui status task dan mencatat log audit secara serentak.
   - Generator kode task unik yang aman dari *race condition* (`DWT-YYYY-NNNN`).

3. **Inventaris Aset Infrastruktur & Impor Spreadsheet (CSV / Excel)**
   - Katalog VM, server fisik, cluster database, container host / Kubernetes, service, dan network gateway.
   - Multi-environment tagging (`production`, `staging`, `development`, `disaster_recovery`).
   - Fitur impor data aset massal via file `.csv` atau `.xlsx` dengan template bawaan.

4. **Optimasi Gambar Otomatis & Private Evidence Storage**
   - Berkas teknis (*screenshot*, log dump, diagram topologi, konfigurasi, PDF) disimpan di private storage.
   - **Optimasi Gambar Otomatis**: Berkas gambar (PNG, JPG, WebP, GIF) otomatis di-downscale jika melebihi 1920px dan dikompresi menjadi format `.webp` (hemat storage 80%–95%).
   - Berkas dokumen/log (PDF, TXT, LOG) disimpan sesuai format asli.
   - Akses unduhan dan preview terotentikasi penuh dengan hak akses ketat.

5. **Laporan & Ekspor PDF**
   - Laporan harian, mingguan, dan bulanan berbasis zona waktu `Asia/Jakarta`.
   - Ekspor snapshot dokumen PDF resmi (`/reports/export`) menggunakan `barryvdh/laravel-dompdf`.

6. **Audit Logs & Keamanan RBAC**
   - **Admin (DevOps Engineer)**: Akses penuh untuk membuat/mengubah task, mencatat aktivitas harian, mengelola aset, dan mengunggah bukti.
   - **Viewer (Management)**: Akses *read-only* dengan proteksi middleware & policy.
   - Audit trail *append-only* dengan modal inspeksi diff data baru vs lama.

---

## 🛠️ Tech Stack & Persyaratan Sistem

- **Backend:** Laravel 12.x (PHP 8.2+ / PHP 8.5.x)
- **Frontend:** Inertia.js v2, React 18, TypeScript, Tailwind CSS, Vite
- **UI Components:** Shadcn UI (Radix UI Primitives, Lucide React)
- **Database:** MySQL 8.x / MariaDB (Production / Native VM), SQLite (Testing)
- **Web Server:** Nginx + PHP-FPM
- **Node.js:** Node.js v20.x & npm

---

## 🔑 Kredensial Admin Bawaan

| Role | Email | Password | Hak Akses |
|---|---|---|---|
| **Admin** | `admin@devops.internal` | `admin12345` | Akses Penuh (Write & Manage) |

*Catatan: Atasan/Manajemen dapat langsung memantau progres tanpa login melalui rute `/board`.*

---

## 🖥️ Panduan Deployment Native (Nginx + PHP 8.5 + MySQL + Node 20)

### 1. Persiapan Database MySQL di VM
Masuk ke terminal MySQL di VM dan buat database:
```sql
CREATE DATABASE devops_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dwt_user'@'localhost' IDENTIFIED BY 'PasswordAman123!';
GRANT ALL PRIVILEGES ON devops_tracker.* TO 'dwt_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Clone Repository & Pasang Dependensi
```bash
# Clone ke direktori web server (misal /var/www/devops-work-tracker)
cd /var/www
git clone <URL_REPOSITORY> devops-work-tracker
cd devops-work-tracker

# Salin environment file
cp .env.example .env

# Sesuaikan konfigurasi DB_DATABASE, DB_USERNAME, DB_PASSWORD di .env
nano .env

# Install dependensi PHP (Production)
composer install --no-dev --optimize-autoloader

# Generate Application Key
php artisan key:generate --force

# Install dependensi Node.js & Compile Asset Frontend
npm install
npm run build
```

### 3. Migrasi Database & Seeder Admin
```bash
# Jalankan migrasi dan seeder awal (kategori & akun admin)
php artisan migrate --force --seed
```

### 4. Konfigurasi Hak Akses Direktori
Pastikan Nginx dan PHP-FPM memiliki hak tulis pada folder storage dan cache:
```bash
sudo chown -R www-data:www-data /var/www/devops-work-tracker
sudo chmod -R 775 /var/www/devops-work-tracker/storage
sudo chmod -R 775 /var/www/devops-work-tracker/bootstrap/cache
```

### 5. Optimasi Cache Laravel untuk Production
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 6. Konfigurasi Nginx Server Block
Buat file konfigurasi Nginx di `/etc/nginx/sites-available/devops-tracker`:
```nginx
server {
    listen 80;
    server_name tracker.internal; # Atau IP VM Anda

    root /var/www/devops-work-tracker/public;
    index index.php index.html;
    charset utf-8;

    client_max_body_size 20M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.5-fpm.sock; # Sesuaikan socket PHP-FPM 8.5 Anda
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Aktifkan konfigurasi dan reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/devops-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Menjalankan Automated Tests

Aplikasi memiliki **62 automated tests** yang memverifikasi seluruh fungsionalitas (autentikasi, otorisasi, alur task, optimasi gambar WebP, impor spreadsheet, dan audit log):

```bash
php artisan test
```

---

## 💾 Pencadangan dan Pemulihan (Backup & Restore)

```bash
# Menjalankan pencadangan database MySQL dan evidence privat
./scripts/backup.sh

# Menjalankan pemulihan (restore)
./scripts/restore.sh backups/db_devops_tracker_YYYYMMDD_HHMMSS.sql.gz backups/evidences_YYYYMMDD_HHMMSS.tar.gz
```
