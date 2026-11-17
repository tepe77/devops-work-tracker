# Product Requirements Document (PRD)

## DevOps Work Tracker

**Dokumen:** PRD v1.0\
**Produk:** DevOps Work Tracker\
**Jenis:** Internal web application\
**Target pengguna:** DevOps Engineer (Admin) dan Atasan/Management
(Viewer)\
**Status:** Baseline MVP --- siap menjadi acuan implementasi AI Agent

------------------------------------------------------------------------

## 1. Ringkasan Produk

DevOps Work Tracker adalah aplikasi internal untuk mencatat pekerjaan
operasional DevOps, memantau progres lintas hari, menghubungkan
pekerjaan dengan aset infrastruktur, menyimpan evidence teknis, serta
menyajikan laporan yang mudah dipahami oleh atasan.

Aplikasi ini ditujukan untuk membuat pekerjaan infrastruktur yang tidak
selalu terlihat melalui commit atau ticket eksternal menjadi transparan,
terukur, dan terdokumentasi.

### 1.1 Masalah yang ingin diselesaikan

-   Pekerjaan DevOps sering dilakukan langsung pada VM, server,
    database, jaringan, container, dan layanan production.
-   Aktivitas investigasi, maintenance, hardening, troubleshooting, dan
    optimasi tidak selalu menghasilkan jejak pekerjaan yang mudah
    dilihat management.
-   Progres pekerjaan yang berlangsung beberapa hari perlu dicatat tanpa
    menimpa histori sebelumnya.
-   Atasan membutuhkan ringkasan hasil, kendala, dan dampak pekerjaan
    tanpa harus membaca output terminal yang panjang.
-   Bukti teknis perlu disimpan dan dikaitkan dengan pekerjaan yang
    relevan.

### 1.2 Tujuan produk

1.  Menyediakan satu tempat untuk mencatat pekerjaan DevOps.
2.  Mempertahankan histori progres pekerjaan lintas hari.
3.  Mengaitkan pekerjaan dengan VM, database, service, dan aset
    infrastruktur.
4.  Menyimpan evidence secara aman.
5.  Menyediakan dashboard read-only bagi atasan.
6.  Menghasilkan laporan Daily, Weekly, dan Monthly berdasarkan data
    aktivitas.

### 1.3 Bukan tujuan MVP

-   Menjadi platform monitoring atau observability.
-   Menjalankan command atau mengubah konfigurasi VM dari aplikasi.
-   Memasang agent pada seluruh VM.
-   Menggantikan GitLab, Grafana, Uptime Kuma, ticketing, atau CMDB.
-   Menjadi project management multi-team yang kompleks.
-   Mengirim notifikasi otomatis atau menjalankan integrasi eksternal
    pada fase MVP.

------------------------------------------------------------------------

## 2. Pengguna dan Hak Akses

MVP memiliki dua role.

### 2.1 Admin --- DevOps Engineer

Admin dapat: - Login dan logout. - Melihat dashboard. - Membuat,
melihat, mengubah, dan mengarsipkan task. - Menambahkan daily activity
update. - Mengelola kategori dan project. - Mengelola infrastructure
assets. - Mengunggah dan mengelola evidence. - Melihat serta mengekspor
laporan. - Membuat dan mengelola akun Viewer. - Melihat audit log.

### 2.2 Viewer --- Atasan/Management

Viewer dapat: - Login dan logout. - Melihat dashboard. - Melihat daftar
dan detail task. - Melihat activity timeline. - Melihat detail aset yang
diizinkan untuk ditampilkan. - Melihat dan mengunduh evidence melalui
endpoint yang terotorisasi. - Melihat dan mengekspor laporan.

Viewer tidak boleh: - Membuat, mengubah, atau menghapus task. -
Menambahkan activity update. - Mengelola infrastructure assets. -
Mengunggah atau menghapus evidence. - Mengelola pengguna atau
konfigurasi aplikasi.

**Persyaratan keamanan:** pembatasan Viewer wajib ditegakkan di backend
melalui middleware, policy, dan authorization check. Menyembunyikan
tombol pada UI saja tidak cukup.

------------------------------------------------------------------------

## 3. Ruang Lingkup MVP

### 3.1 Modul wajib

  -----------------------------------------------------------------------
  Modul                   Deskripsi               Prioritas
  ----------------------- ----------------------- -----------------------
  Authentication & RBAC   Login, logout, role     P0
                          Admin/Viewer, akun      
                          dibuat Admin            

  Dashboard               Ringkasan task, status, P0
                          aktivitas terbaru,      
                          filter tanggal          

  Task Management         CRUD task, prioritas,   P0
                          status, progress,       
                          deadline                

  Daily Activity Log      Update progres yang     P0
                          immutable sebagai       
                          histori                 

  Infrastructure Assets   Inventaris VM, server,  P0
                          database, service,      
                          network, storage        

  Task-Asset Relationship Satu task dapat terkait P0
                          dengan beberapa aset    

  Evidence Management     Upload dan akses file   P0
                          secara privat           

  Reporting               Daily, Weekly, Monthly  P0
                          report dan PDF export   

  Audit Log               Mencatat perubahan      P0
                          penting oleh Admin      

  User Management         Admin membuat akun      P1
                          Viewer dan mengelola    
                          akun                    
  -----------------------------------------------------------------------

### 3.2 Fitur di luar MVP

-   GitLab API integration.
-   Grafana/Prometheus integration.
-   Uptime Kuma integration.
-   Automated event ingestion.
-   Email, WhatsApp, atau chat notifications.
-   Recurring task scheduler.
-   Multi-team assignment dan workload balancing.
-   Mobile application.
-   SSH/remote command execution.
-   Public registration.

------------------------------------------------------------------------

## 4. Kategori Pekerjaan

Seed kategori awal berikut:

1.  Infrastructure Provisioning
2.  Server Administration
3.  Deployment & CI/CD
4.  Infrastructure Monitoring
5.  Database Administration
6.  Network & Security
7.  Troubleshooting & Incident
8.  Backup & Disaster Recovery
9.  Maintenance & Optimization
10. Infrastructure Improvement
11. Documentation & Reporting

Kategori dikelola Admin. Kategori yang sudah dipakai task sebaiknya
dinonaktifkan, bukan dihapus permanen.

------------------------------------------------------------------------

## 5. Kebutuhan Fungsional

### FR-01 --- Authentication

-   Pengguna harus login sebelum mengakses aplikasi.
-   Tidak ada public self-registration.
-   Admin membuat akun Viewer.
-   Password disimpan menggunakan mekanisme hashing Laravel.
-   Logout mengakhiri session.
-   Aplikasi menggunakan session authentication untuk web MVP.

### FR-02 --- Dashboard

Dashboard menampilkan data dari database, bukan angka statis.

Informasi minimum: - Total task. - Task Completed. - Task In Progress. -
Task Blocked. - Task Backlog. - Aktivitas terbaru. - Task berdasarkan
kategori. - Task yang melewati due date. - Filter periode tanggal.

Definisi metrik harus konsisten: - Total task dihitung berdasarkan task
yang tidak soft-deleted. - Status count menggunakan status terkini pada
tabel tasks. - Aktivitas harian dihitung berdasarkan `activity_date`
pada `task_updates`. - Task Completed tidak dihitung sebagai pekerjaan
aktif.

Dashboard Viewer hanya menampilkan informasi yang diizinkan untuk role
Viewer.

### FR-03 --- Task Management

Data minimum task: - `id` - `task_code` unik dan dapat dibaca manusia. -
`title` - `description` - `project_id` nullable. - `category_id` -
`created_by` - `priority` - `status` - `progress_percent` -
`start_date` - `due_date` nullable. - `completed_at` nullable. -
timestamps. - soft delete.

Task dapat dikaitkan dengan satu atau beberapa infrastructure assets
melalui tabel pivot.

Task code disarankan memiliki format seperti `DWT-YYYY-0001`. Generator
harus aman terhadap request bersamaan dan menjamin unique constraint di
database.

### FR-04 --- Status dan Progress

Status yang didukung: - `backlog` - `in_progress` - `blocked` -
`completed` - `cancelled`

Priority: - `low` - `medium` - `high` - `critical`

Aturan progress: - Backlog: 0%. - In Progress: 1--99%. - Blocked:
1--99%. - Completed: 100%. - Cancelled: mempertahankan progress terakhir
dan tidak dianggap selesai.

Perubahan status/progress harus divalidasi di server. Perubahan menjadi
Completed harus disertai hasil pekerjaan. Perubahan dari Completed ke
status lain harus dicatat di audit log dan memerlukan alasan.

Progress adalah estimasi penyelesaian yang diinput Admin berdasarkan
hasil teknis, bukan dihitung dari jumlah activity update.

### FR-05 --- Daily Activity Log

Setiap task dapat memiliki banyak activity update.

Field update: - `task_id` - `user_id` - `activity_date` - `summary` -
`work_done` - `result` nullable. - `blocker` nullable. - `next_action`
nullable. - `progress_percent` - `status` - timestamps.

Setiap update merupakan histori baru. Update lama tidak boleh ditimpa
ketika progres berubah.

Ketika update disimpan: 1. Validasi user dan task. 2. Validasi
progress/status. 3. Simpan record task update. 4. Perbarui status dan
progress terkini pada task. 5. Atur `completed_at` sesuai status. 6.
Tulis audit log dalam transaksi database.

### FR-06 --- Infrastructure Assets

Asset type: - `virtual_machine` - `physical_server` - `database` -
`container_host` - `application_service` - `network` - `storage` -
`other`

Environment: - `production` - `staging` - `development` -
`disaster_recovery` - `other`

Status: - `active` - `maintenance` - `retired`

Field minimum: - name - asset_type - environment - hostname nullable -
ip_address nullable - operating_system nullable - purpose nullable -
description nullable - status - timestamps

Jangan menyimpan password, SSH private key, API secret, token, atau
credential pada asset record.

### FR-07 --- Evidence Management

-   Evidence dapat terkait dengan task dan opsional dengan task update.
-   File disimpan di private storage, bukan public disk.
-   Download/preview harus melalui controller yang melakukan
    authorization.
-   Validasi ukuran file, MIME type, dan ekstensi.
-   Baseline batas upload: 10 MB per file, dapat dikonfigurasi.
-   Tolak executable dan file berisiko.
-   Simpan nama asli, nama/path tersimpan, MIME type, ukuran, uploader,
    dan timestamps.
-   Jangan mengandalkan nama file dari pengguna sebagai nama fisik file.
-   Hapus file fisik hanya setelah operasi database dan aturan retensi
    ditangani dengan aman.

### FR-08 --- Reporting

Laporan dibangun secara dinamis dari task, task_updates, assets, dan
evidences.

Daily report: - tanggal laporan; - total aktivitas pada tanggal
tersebut; - task terkait; - summary, tindakan, hasil, blocker, next
action; - status dan progress terkini; - evidence terkait.

Weekly report: - rentang tanggal; - ringkasan aktivitas; - task
completed, in progress, blocked; - highlight pekerjaan; - kendala dan
tindak lanjut.

Monthly report: - ringkasan kontribusi berdasarkan kategori; - pekerjaan
selesai dan berjalan; - highlight reliability, security, performance,
efficiency, deployment, dan resilience jika didukung data; - kendala dan
rencana tindak lanjut.

Default timezone: `Asia/Jakarta`.

PDF yang sudah diterbitkan untuk diserahkan ke atasan harus dapat
disimpan sebagai snapshot agar isi historis tidak berubah ketika task
diperbarui kemudian. Snapshot PDF dapat disimpan di private storage;
tidak wajib membuat tabel report pada MVP kecuali implementasi
membutuhkan metadata arsip.

### FR-09 --- Audit Log

Catat minimal: - task created/updated/soft-deleted/restored; - status
dan progress changes; - task update created; - asset
created/updated/archived; - evidence uploaded/deleted; - user
created/updated/deactivated.

Audit record minimal: - actor/user ID nullable jika akun sudah tidak
tersedia; - event; - auditable type dan ID; - old values; - new
values; - timestamp; - metadata terbatas bila diperlukan.

Jangan menyimpan password, token, secret, atau isi file ke audit log.
Audit log harus append-only melalui aplikasi dan tidak memiliki fitur
edit/delete untuk user biasa.

### FR-10 --- User Management

-   Hanya Admin yang dapat membuat akun.
-   Role hanya `admin` atau `viewer` pada MVP.
-   Admin dapat menonaktifkan akun Viewer.
-   Tidak boleh menonaktifkan atau menghapus satu-satunya akun Admin
    aktif.
-   Pengelolaan akun harus tercatat dalam audit log.

------------------------------------------------------------------------

## 6. Kebutuhan Non-Fungsional

### Security

-   HTTPS wajib pada production.
-   CSRF protection.
-   Validasi server-side.
-   Eloquent/query binding untuk mencegah SQL injection.
-   Authorization pada setiap endpoint dan file download.
-   Rate limiting login.
-   Secure session configuration.
-   Secrets hanya melalui environment variables.
-   Database tidak diekspos ke jaringan publik.
-   Tidak ada remote shell/SSH execution dari aplikasi.

### Reliability & Data Integrity

-   Operasi update task dan activity log menggunakan database
    transaction.
-   Foreign keys dan unique constraints.
-   Soft delete task.
-   Backup PostgreSQL dan evidence.
-   Prosedur restore harus diuji.

### Performance

-   Pagination untuk task, activity, assets, dan audit logs.
-   Eager loading untuk menghindari N+1 query.
-   Index pada foreign keys, status, activity_date, due_date, dan
    task_code.
-   Dashboard menggunakan query agregasi yang efisien.

### Usability

-   UI responsif desktop dan mobile.
-   Bahasa antarmuka Bahasa Indonesia.
-   Form activity update ringkas.
-   Empty state, validation error, loading, dan success state tersedia.
-   Status dan prioritas konsisten di semua halaman.

### Maintainability

-   Laravel monolith.
-   Controller tipis.
-   Business logic pada service/action class.
-   Form Request untuk validasi.
-   Policy untuk authorization.
-   Enum untuk status, role, priority, dan asset type.
-   Feature test untuk akses role dan workflow inti.

------------------------------------------------------------------------

## 7. Informasi Dashboard dan UI

Menu utama: 1. Dashboard 2. My Activities 3. Tasks & Projects 4.
Infrastructure Assets 5. Evidence & Documentation 6. Reports & Analytics
7. User Management (Admin only) 8. Settings (Admin only, bila
diperlukan)

Task detail page menampilkan: - informasi task; - status dan progress; -
project/category; - aset terkait; - activity timeline; - evidence; -
riwayat perubahan yang relevan.

Management dashboard memprioritaskan hasil, status, kendala, dan dampak
pekerjaan. Hindari menjadikan raw terminal output sebagai konten utama.

------------------------------------------------------------------------

## 8. Metrik Keberhasilan

MVP dianggap berhasil apabila: - Admin dapat mencatat pekerjaan baru
dalam waktu singkat. - Progres task dapat dilanjutkan lintas hari tanpa
kehilangan histori. - Atasan dapat melihat progres tanpa meminta laporan
manual terpisah. - Setiap pekerjaan penting dapat dikaitkan dengan aset
dan evidence. - Daily/Weekly/Monthly report dapat dihasilkan dari data
yang sama. - Viewer tidak dapat mengubah data melalui UI maupun direct
HTTP request. - Backup dan restore database serta evidence telah diuji.

Jangan menggunakan jumlah task semata sebagai ukuran produktivitas.
Laporan harus menampilkan konteks, hasil, dan dampak.

------------------------------------------------------------------------

## 9. Asumsi dan Keputusan

  Area                  Keputusan MVP
  --------------------- ---------------------------------------------
  Pengguna              Satu Admin utama, satu atau beberapa Viewer
  Metode pencatatan     Hybrid: task + daily activity
  Backend               Laravel 12
  Frontend              Blade + Tailwind CSS
  Database              PostgreSQL
  Authentication        Laravel session authentication
  Role                  Admin, Viewer
  Architecture          Monolith
  Timezone              Asia/Jakarta
  Deployment            Docker Compose + Nginx
  Integrasi eksternal   Di luar MVP
  File storage          Private local persistent storage
  Reporting             Dinamis; PDF snapshot untuk laporan final
  Registration          Nonaktif

------------------------------------------------------------------------

## 10. Acceptance Criteria Tingkat Produk

MVP dapat diterima apabila seluruh kondisi berikut terpenuhi:

1.  Admin dan Viewer dapat login dengan akun yang dibuat Admin.
2.  Admin dapat membuat task dengan kategori, prioritas, status,
    tanggal, dan aset.
3.  Task code unik meskipun ada request bersamaan.
4.  Admin dapat menambahkan beberapa activity update pada satu task.
5.  Activity update lama tetap tersedia setelah update baru dibuat.
6.  Progress/status terkini pada task konsisten dengan update terakhir.
7.  Perubahan status/progress tercatat dalam audit log.
8.  Admin dapat mengelola infrastructure assets.
9.  Evidence disimpan secara privat dan hanya dapat diakses user
    terotorisasi.
10. Dashboard menggunakan data aktual.
11. Viewer dapat membaca task, timeline, evidence, dan laporan.
12. Viewer menerima HTTP 403/redirect yang sesuai saat mencoba operasi
    write secara langsung.
13. Daily, Weekly, dan Monthly report dapat difilter berdasarkan
    tanggal.
14. PDF report dapat dihasilkan dan snapshot final tidak berubah ketika
    data operasional berubah.
15. Automated tests mencakup workflow utama, role authorization, dan
    akses evidence.
16. Dokumentasi instalasi, konfigurasi, backup, dan restore tersedia.
