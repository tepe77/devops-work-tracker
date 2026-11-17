# Prosedur Backup & Restore DevOps Work Tracker

Dokumen ini menjelaskan prosedur pencadangan (backup) berkala dan pemulihan bencana (disaster recovery / restore) untuk database PostgreSQL dan berkas teknis (evidence) aplikasi DevOps Work Tracker.

---

## 1. Komponen yang Wajib Dicadangkan

1. **Database PostgreSQL**: Berisi 9 tabel domain inti (`users`, `tasks`, `task_updates`, `infrastructure_assets`, `task_assets`, `evidences`, `categories`, `projects`, `audit_logs`).
2. **Direktori Evidence Privat**: Berkas fisik lampiran teknis (screenshot, dump log, diagram, file konfigurasi) yang disimpan di path privat `storage/app/private/evidences`.

---

## 2. Prosedur Backup Otomatis

Gunakan skrip `scripts/backup.sh` yang telah disediakan:

```bash
# Menjalankan backup standar (output ke ./backups/)
./scripts/backup.sh
```

Atau atur cron job harian pada host server (contoh setiap pukul 02:00 WIB):

```cron
0 2 * * * cd /path/to/devops-work-tracker && ./scripts/backup.sh >> /var/log/dwt_backup.log 2>&1
```

### Mekanisme Manual (Docker Compose)

Jika ingin melakukan manual dump database via Docker:

```bash
# 1. Backup Database PostgreSQL
docker exec -t dwt_postgres pg_dump -U dwt_user devops_tracker | gzip > backups/db_$(date +%Y%m%d_%H%M%S).sql.gz

# 2. Backup File Evidence
tar -czf backups/evidences_$(date +%Y%m%d_%H%M%S).tar.gz -C storage/app/private evidences
```

---

## 3. Prosedur Restore (Pemulihan)

Untuk memulihkan sistem dari kondisi bencana atau server baru:

### Langkah 1: Siapkan Container & Skema

Pastikan container PostgreSQL dan Nginx sudah berjalan:

```bash
docker compose up -d postgres
```

### Langkah 2: Jalankan Pemulihan Menggunakan Skrip

```bash
./scripts/restore.sh backups/db_devops_tracker_20261116_120000.sql.gz backups/evidences_20261116_120000.tar.gz
```

### Langkah 3: Verifikasi Integritas Data

1. Jalankan `php artisan migrate --status` untuk memastikan migrasi sinkron.
2. Login sebagai Admin dan verifikasi jumlah task dan timeline aktivitas pada Dashboard.
3. Buka halaman detail salah satu task dan unduh berkas evidence untuk memverifikasi checksum file.
