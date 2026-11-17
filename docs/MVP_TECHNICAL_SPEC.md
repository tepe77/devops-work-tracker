# MVP Technical Specification & Implementation Plan

## DevOps Work Tracker

**Dokumen:** MVP Technical Specification v1.0\
**Berdasarkan:** PRD DevOps Work Tracker v1.0\
**Tujuan:** Panduan implementasi langsung untuk AI Coding Agent

------------------------------------------------------------------------

## 1. Objective

Bangun aplikasi Laravel monolith untuk personal DevOps work tracking
dengan: - Admin sebagai pencatat dan pengelola data. - Viewer sebagai
pembaca dashboard dan laporan. - Hybrid workflow: task dibuat sekali,
progres dicatat melalui daily activity update. - Infrastructure asset
inventory. - Private evidence storage. - Daily, Weekly, Monthly
reporting dan PDF export.

Implementasikan MVP secara end-to-end. Jangan hanya menghasilkan mockup,
placeholder, atau kode contoh.

## 2. Technology Baseline

-   PHP: versi yang kompatibel dengan Laravel 12.
-   Laravel: 12.x.
-   Frontend: Blade + Tailwind CSS + Vite.
-   Database: PostgreSQL.
-   Authentication: Laravel session authentication.
-   Authentication starter: gunakan Laravel Breeze jika kompatibilitas
    Laravel 12 terverifikasi; jika tidak, gunakan starter kit resmi
    Laravel yang kompatibel atau implementasi session auth standar.
    Jangan menambahkan dependency usang tanpa verifikasi.
-   Charts: Chart.js, hanya jika chart benar-benar diperlukan.
-   File storage: Laravel private local disk.
-   Deployment: Docker Compose + Nginx.
-   Timezone aplikasi: `Asia/Jakarta`.

Jangan mengganti stack dengan Next.js, microservices, atau SPA framework
tanpa kebutuhan yang disetujui.

## 3. Core Domain Model

### 3.1 Tables

MVP menggunakan sembilan tabel domain utama:

1.  `users`
2.  `projects`
3.  `categories`
4.  `infrastructure_assets`
5.  `tasks`
6.  `task_assets`
7.  `task_updates`
8.  `evidences`
9.  `audit_logs`

Laravel framework migrations/tables tambahan boleh ada bila dibutuhkan,
misalnya `password_reset_tokens`, `sessions`, `cache`, atau `jobs`.
Jangan membuat tabel `daily_reports` untuk data turunan kecuali ada
kebutuhan snapshot/archive yang jelas.

### 3.2 Schema requirements

#### users

-   id
-   name
-   email unique
-   password
-   role: `admin` atau `viewer`
-   is_active boolean default true
-   email_verified_at nullable bila starter auth menggunakannya
-   remember_token
-   timestamps

#### projects

-   id
-   name
-   slug unique
-   description nullable
-   status: `active`, `completed`, `archived`
-   start_date nullable
-   due_date nullable
-   timestamps
-   soft deletes bila diperlukan

#### categories

-   id
-   name unique
-   slug unique
-   description nullable
-   is_active boolean default true
-   timestamps

Seed kategori: - Infrastructure Provisioning - Server Administration -
Deployment & CI/CD - Infrastructure Monitoring - Database
Administration - Network & Security - Troubleshooting & Incident -
Backup & Disaster Recovery - Maintenance & Optimization - Infrastructure
Improvement - Documentation & Reporting

#### infrastructure_assets

-   id
-   name
-   asset_type: `virtual_machine`, `physical_server`, `database`,
    `container_host`, `application_service`, `network`, `storage`,
    `other`
-   environment: `production`, `staging`, `development`,
    `disaster_recovery`, `other`
-   hostname nullable
-   ip_address nullable
-   operating_system nullable
-   purpose nullable
-   description nullable
-   status: `active`, `maintenance`, `retired`
-   timestamps
-   soft deletes bila dibutuhkan

Jangan menambahkan field credential, password, private key, atau secret.

#### tasks

-   id
-   task_code unique
-   title
-   description text
-   project_id nullable FK
-   category_id FK
-   created_by FK users
-   priority: `low`, `medium`, `high`, `critical`
-   status: `backlog`, `in_progress`, `blocked`, `completed`,
    `cancelled`
-   progress_percent small integer, 0..100
-   start_date date
-   due_date nullable date
-   completed_at nullable timestamp
-   timestamps
-   softDeletes

#### task_assets

-   id
-   task_id FK
-   infrastructure_asset_id FK
-   timestamps
-   unique composite (`task_id`, `infrastructure_asset_id`)

#### task_updates

-   id
-   task_id FK
-   user_id FK
-   activity_date date
-   summary string
-   work_done text
-   result text nullable
-   blocker text nullable
-   next_action text nullable
-   progress_percent small integer, 0..100
-   status enum/string sesuai TaskStatus
-   timestamps

Activity update adalah histori. Jangan mengedit atau menimpa update lama
untuk mencatat progres baru. Jika koreksi diperlukan, buat mekanisme
koreksi yang tercatat di audit log; MVP dapat membatasi edit/hapus
update hanya untuk Admin dan wajib mencatat perubahan.

#### evidences

-   id
-   task_id FK
-   task_update_id nullable FK
-   uploaded_by FK users
-   original_name
-   storage_path
-   mime_type
-   file_size bigint
-   caption nullable
-   timestamps

Evidence harus dimiliki sebuah task. Relasi ke update bersifat opsional.

#### audit_logs

-   id
-   user_id nullable FK users dengan on-delete set null
-   event string
-   auditable_type string
-   auditable_id bigint
-   old_values JSONB nullable
-   new_values JSONB nullable
-   metadata JSONB nullable
-   created_at timestamp
-   index (`auditable_type`, `auditable_id`)
-   index (`user_id`, `created_at`)

Audit log tidak boleh memiliki UI edit/delete.

### 3.3 Foreign key behavior

-   Task ke category: restrict delete jika masih digunakan.
-   Task ke project: set null jika project dihapus/diarsipkan sesuai
    keputusan implementasi.
-   Task ke creator: restrict atau set null dengan mempertimbangkan
    auditability; jangan menghapus histori.
-   Task update ke task: cascade hanya jika hard delete task memang
    dilakukan; normal operation menggunakan soft delete.
-   Task update ke user: restrict atau set null; jangan hilangkan
    atribusi histori.
-   Evidence ke task/update: hapus relasi dan file dengan prosedur aman;
    normal operation menggunakan controlled deletion.
-   Task-assets: cascade pada penghapusan relasi task/asset sesuai FK
    dan soft-delete strategy.

Tentukan dan dokumentasikan strategi soft delete serta foreign key
secara konsisten.

## 4. Domain Rules

### 4.1 Status and progress

  Status                   Progress
  ------------- -------------------
  backlog                         0
  in_progress                 1--99
  blocked                     1--99
  completed                     100
  cancelled       progress terakhir

Validasi di Form Request dan domain service. Database check constraints
dapat ditambahkan untuk rentang 0--100.

Jika task menjadi `completed`, set `completed_at`. Jika task dibuka
kembali, kosongkan `completed_at`, catat alasan, dan buat audit record.

### 4.2 Task code generation

Format: `DWT-YYYY-NNNN`, contoh `DWT-2026-0001`.

Generator harus aman dari race condition: - gunakan database sequence
atau mekanisme transaksi/locking yang sesuai; - tetap pasang unique
index; - jangan hanya menghitung jumlah task lalu menambahkan satu.

### 4.3 Activity update transaction

Dalam satu transaksi database: 1. Validasi task dan actor. 2. Validasi
status/progress. 3. Insert `task_updates`. 4. Update `tasks.status`,
`tasks.progress_percent`, dan `completed_at`. 5. Insert `audit_logs`.

Jangan mengubah task jika insert activity update gagal.

### 4.4 Date and timezone

-   Store timestamps menggunakan konfigurasi timezone yang konsisten;
    rekomendasi simpan timestamp dalam UTC dan render dengan
    `Asia/Jakarta`.
-   `activity_date`, `start_date`, dan `due_date` adalah date-only.
-   Filter daily/weekly/monthly menggunakan tanggal lokal
    `Asia/Jakarta`.
-   Definisikan awal minggu secara konsisten (Senin) dan tampilkan
    rentang tanggal laporan.

## 5. Laravel Architecture

Gunakan Laravel standard structure dengan pemisahan berikut:

### Models

-   User
-   Project
-   Category
-   InfrastructureAsset
-   Task
-   TaskUpdate
-   Evidence
-   AuditLog

### Enums

-   UserRole
-   TaskStatus
-   TaskPriority
-   AssetType
-   AssetEnvironment
-   AssetStatus
-   ProjectStatus

### Controllers

-   DashboardController
-   TaskController
-   TaskUpdateController
-   ProjectController
-   CategoryController
-   InfrastructureAssetController
-   EvidenceController
-   ReportController
-   UserController
-   AuditLogController (read-only)

### Form Requests

-   StoreTaskRequest
-   UpdateTaskRequest
-   StoreTaskUpdateRequest
-   StoreInfrastructureAssetRequest
-   UpdateInfrastructureAssetRequest
-   StoreEvidenceRequest
-   StoreUserRequest
-   UpdateUserRequest

### Services / Actions

-   TaskService
-   TaskProgressService
-   TaskCodeGenerator
-   DashboardService
-   ReportService
-   EvidenceService
-   AuditLogService

### Policies

-   TaskPolicy
-   TaskUpdatePolicy
-   InfrastructureAssetPolicy
-   EvidencePolicy
-   ProjectPolicy
-   UserPolicy

Controller hanya menangani HTTP concerns. Business logic berada di
service/action layer. Gunakan dependency injection.

## 6. Routes and Authorization

Semua route aplikasi berada di middleware `auth`.

Read routes dapat diakses Admin dan Viewer setelah policy check: -
`GET /dashboard` - `GET /tasks` - `GET /tasks/{task}` -
`GET /infrastructure` - `GET /infrastructure/{asset}` - `GET /reports` -
`GET /reports/export` - `GET /evidences/{evidence}/download`

Admin-only routes: - `POST /tasks` - `PUT/PATCH /tasks/{task}` -
`DELETE /tasks/{task}` (soft delete) - `POST /tasks/{task}/updates` -
`POST /infrastructure` - `PUT/PATCH /infrastructure/{asset}` -
`DELETE /infrastructure/{asset}` (archive/soft delete) -
`POST /evidences` - `DELETE /evidences/{evidence}` - User management
write routes - Project/category write routes

Gunakan middleware role untuk pembatasan grup route dan Policy untuk
resource-level authorization. Uji direct HTTP request sebagai Viewer,
bukan hanya visibility tombol.

## 7. UI Pages

### 7.1 Shared layout

-   Sidebar navigation.
-   Topbar dengan nama user dan logout.
-   Responsive layout.
-   Flash success/error.
-   Breadcrumb.
-   Consistent badge untuk status dan priority.

### 7.2 Dashboard

Cards: - Total tasks. - Completed. - In Progress. - Blocked. - Backlog.

Sections: - Recent activity. - Tasks due soon/overdue. - Task by
category. - Completion trend untuk rentang waktu terpilih.

Semua angka harus berasal dari query database. Jangan gunakan hardcoded
demo metrics pada production.

### 7.3 Task list

-   Search task code/title.
-   Filter status, priority, category, project, asset, date.
-   Pagination.
-   Sort created date, due date, priority.

### 7.4 Task create/edit

-   Title.
-   Description.
-   Category.
-   Project optional.
-   Priority.
-   Start date.
-   Due date.
-   Infrastructure assets multi-select.
-   Status/progress sesuai domain rules.

### 7.5 Task detail

-   Task metadata.
-   Status/progress.
-   Asset references.
-   Activity timeline chronological.
-   Evidence list.
-   Audit history yang relevan.
-   Admin-only action untuk menambah update.

### 7.6 Daily activity form

-   Activity date.
-   Summary.
-   Work done.
-   Result.
-   Blocker.
-   Next action.
-   Progress.
-   Status.
-   Evidence attachments.

Form harus cukup ringkas agar pencatatan rutin tidak membebani Admin.

### 7.7 Infrastructure assets

-   List, search, filter environment/type/status.
-   Create/edit/archive.
-   Detail aset menampilkan task terkait.

### 7.8 Reports

-   Daily, Weekly, Monthly tabs atau selector.
-   Date/date range picker.
-   Summary metrics.
-   Activity detail.
-   Evidence references.
-   Export PDF.
-   Printable HTML fallback.

### 7.9 User management

-   List users.
-   Create Viewer.
-   Change active state.
-   Reset password secara aman.
-   Cegah deaktivasi satu-satunya Admin aktif.

## 8. Reporting Rules

### Daily

Filter `task_updates.activity_date` berdasarkan tanggal lokal yang
dipilih. Satu task dapat muncul lebih dari sekali jika ada beberapa
update pada tanggal yang sama; tampilkan setiap update sebagai aktivitas
terpisah.

### Weekly

Default minggu Senin--Minggu. Filter berdasarkan `activity_date` dalam
rentang tersebut.

### Monthly

Filter berdasarkan bulan kalender lokal. Kelompokkan ringkasan menurut
kategori dan status task terkini. Bedakan: - pekerjaan yang memiliki
update pada bulan tersebut; - task yang completed pada bulan tersebut; -
task yang masih aktif di akhir periode.

Jangan menyimpulkan task selesai pada bulan laporan hanya karena saat
ini statusnya Completed. Gunakan `completed_at` untuk waktu penyelesaian
dan activity history untuk pekerjaan yang dilakukan dalam periode.

### PDF

-   Header nama aplikasi dan periode laporan.
-   Ringkasan angka.
-   Daftar aktivitas.
-   Hasil, blocker, next action.
-   Footer tanggal generate dan nomor halaman jika library mendukung.
-   Simpan snapshot final di private storage bila laporan akan dijadikan
    dokumen resmi.

## 9. Evidence Security

-   Gunakan private filesystem disk.
-   Simpan dengan generated UUID/random filename.
-   Simpan original filename hanya sebagai metadata.
-   Validasi file size dan MIME type berdasarkan allowlist.
-   Allowlist awal: PDF, PNG, JPEG, WebP, TXT, LOG, MD, CSV. Sesuaikan
    bila dibutuhkan.
-   Tolak executable, script, archive berisiko, dan file yang tidak
    dikenal.
-   Jangan serve file dari public directory.
-   Download melalui controller yang memeriksa login dan policy.
-   Set `Content-Disposition` yang aman.
-   Jangan render HTML/SVG upload secara inline.
-   Pastikan file tidak dapat diakses hanya dengan menebak path.

## 10. Seed Data

Seeder wajib: - Satu akun Admin dari environment variables atau perintah
setup interaktif; jangan hardcode password. - Kategori pekerjaan awal. -
Tidak wajib membuat demo tasks di production.

Sediakan `.env.example` tanpa secret nyata. Sediakan instruksi pembuatan
Admin, misalnya Artisan command khusus `app:create-admin` atau seeder
yang membaca environment variables.

## 11. Testing Requirements

### Authentication

-   Guest tidak dapat mengakses dashboard.
-   Admin dapat login.
-   Viewer dapat login.
-   Public registration tidak tersedia.

### Authorization

-   Viewer dapat GET halaman read-only.
-   Viewer tidak dapat POST/PUT/PATCH/DELETE task.
-   Viewer tidak dapat menambah activity.
-   Viewer tidak dapat mengelola assets.
-   Viewer tidak dapat upload/delete evidence.
-   Viewer tidak dapat mengelola users.
-   Viewer hanya dapat mengunduh evidence melalui authorized route.

### Task workflow

-   Admin dapat membuat task.
-   Task code unik.
-   Task dapat dikaitkan dengan beberapa assets.
-   Activity update membuat histori baru.
-   Progress task berubah sesuai update.
-   Completed menetapkan 100% dan completed_at.
-   Reopen mencatat audit event.
-   Invalid progress/status ditolak.

### Evidence

-   File valid dapat diupload.
-   File tidak valid/terlalu besar ditolak.
-   Viewer yang login dapat membaca evidence yang diizinkan.
-   Guest tidak dapat mengunduh.
-   Path storage tidak terekspos secara publik.

### Reports

-   Daily filter menggunakan activity_date.
-   Weekly menggunakan Senin--Minggu.
-   Monthly menggunakan bulan kalender.
-   PDF export dapat dihasilkan.
-   Timezone Asia/Jakarta diterapkan konsisten.

### Audit

-   Perubahan penting tercatat.
-   Secret/password tidak masuk audit payload.
-   User biasa tidak dapat mengubah audit records.

Gunakan PHPUnit atau Pest sesuai standar proyek yang dipilih. Test harus
berjalan dengan PostgreSQL test database atau database test yang
kompatibel dengan fitur SQL yang dipakai.

## 12. Deployment Deliverables

-   Dockerfile production-oriented.
-   compose.yaml untuk app, queue worker bila diperlukan, dan
    PostgreSQL.
-   Nginx configuration atau dokumentasi integrasi ke Nginx host.
-   Persistent volume PostgreSQL.
-   Persistent private evidence storage.
-   Health check.
-   `.env.example`.
-   README instalasi lokal dan production.
-   Backup database command/procedure.
-   Backup evidence procedure.
-   Restore procedure yang telah diuji.
-   GitLab CI pipeline minimal: dependency install, lint/static checks
    bila tersedia, automated tests, build/deploy sesuai environment.

Jangan expose PostgreSQL port ke internet. Gunakan Docker network
internal. Jangan commit `.env`, key, password, token, atau dump
database.

## 13. Suggested Build Sequence

### Phase 0 --- Repository inspection and setup

-   Inspect current repository.
-   Create Laravel 12 project if empty.
-   Confirm PHP/Composer/Node compatibility.
-   Configure PostgreSQL.
-   Set timezone.
-   Install and verify authentication.
-   Disable public registration.

### Phase 1 --- Database and domain

-   Create enums.
-   Create migrations.
-   Add constraints and indexes.
-   Create models and relationships.
-   Create seeders.
-   Add safe Admin creation flow.
-   Run migrations and tests.

### Phase 2 --- Authentication and authorization

-   Implement roles.
-   Register middleware alias.
-   Implement policies.
-   Add feature tests for Viewer restrictions.

### Phase 3 --- Task and activity workflow

-   Implement task CRUD.
-   Implement safe task code generator.
-   Implement asset pivot.
-   Implement daily activity form and timeline.
-   Implement transactional progress service.
-   Implement audit logging.

### Phase 4 --- Infrastructure and evidence

-   Implement asset CRUD.
-   Implement evidence upload/private download.
-   Implement validation and security tests.

### Phase 5 --- Dashboard and reports

-   Implement dashboard queries.
-   Implement filters and pagination.
-   Implement daily/weekly/monthly reports.
-   Implement PDF and printable HTML.

### Phase 6 --- Production readiness

-   Implement Docker and Nginx.
-   Add backup/restore documentation.
-   Run full test suite.
-   Verify Viewer cannot write.
-   Verify private evidence access.
-   Document environment variables and deployment.

## 14. Definition of Done

MVP is complete only when: - Application runs locally using documented
commands. - PostgreSQL migrations run from a clean database. - Admin and
Viewer flows work. - Core task-to-update workflow works end-to-end. -
Infrastructure assets can be attached to tasks. - Evidence is private
and authorization-protected. - Dashboard and reports use real persisted
data. - PDF export works. - Audit log records key mutations. - Automated
tests pass. - Docker deployment is documented and tested. - Backup and
restore process is documented. - No secrets or credentials are
committed. - No placeholder data remains in production views.

## 15. Implementation Guardrails for AI Agent

1.  Read this document and PRD before editing code.
2.  Inspect the repository before generating or replacing files.
3.  Do not overwrite existing project files blindly.
4.  Work in small phases and keep the application runnable after each
    phase.
5.  Before adding a dependency, verify compatibility with Laravel 12 and
    explain why it is needed.
6.  Do not invent API integrations; integrations are out of MVP scope.
7.  Do not implement SSH/remote command execution.
8.  Do not store infrastructure credentials.
9.  Enforce authorization server-side.
10. Use transactions for multi-table state changes.
11. Add tests with each core feature.
12. Run migrations, tests, and build commands; report actual results,
    not assumed success.
13. If a requirement is ambiguous, choose the least complex secure
    implementation and document the assumption.
14. At the end, provide a summary of files changed, commands run, test
    results, known limitations, and next steps.
