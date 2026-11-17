# AI Agent Execution Prompt --- DevOps Work Tracker

Anda bertindak sebagai Senior Laravel Engineer, Software Architect, dan
QA Engineer.

Bangun aplikasi **DevOps Work Tracker** berdasarkan dua dokumen
spesifikasi yang disertakan: - `PRD.md` - `MVP_TECHNICAL_SPEC.md`

## Tujuan

Hasilkan aplikasi Laravel 12 monolith yang berjalan dan dapat diuji,
bukan hanya desain, mockup, pseudocode, atau potongan kode.

## Instruksi awal

1.  Baca seluruh PRD dan MVP Technical Specification.
2.  Periksa struktur repository dan file yang sudah ada sebelum mengubah
    apa pun.
3.  Jika repository kosong, buat project Laravel 12.
4.  Jika repository sudah berisi aplikasi, identifikasi stack dan
    kondisi saat ini lalu integrasikan tanpa menghapus pekerjaan yang
    sudah ada.
5.  Buat implementation plan singkat dan lanjutkan implementasi secara
    bertahap.

## Stack yang harus dipertahankan

-   Laravel 12
-   PHP versi kompatibel
-   Blade + Tailwind CSS + Vite
-   PostgreSQL
-   Session authentication
-   Admin dan Viewer roles
-   Private file storage
-   Docker Compose untuk deployment

Jangan mengganti stack menjadi Next.js, SPA, microservices, atau
database lain tanpa persetujuan.

## Prioritas implementasi

1.  Foundation, authentication, dan role authorization.
2.  PostgreSQL migrations, constraints, models, relationships, enums,
    seeders.
3.  Task CRUD dan task code generator yang aman dari race condition.
4.  Hybrid activity workflow: satu task memiliki banyak daily updates
    yang tidak menimpa histori.
5.  Infrastructure asset inventory dan relasi many-to-many ke task.
6.  Evidence upload dan authorized private download.
7.  Dashboard berbasis data aktual.
8.  Daily, Weekly, Monthly reports dan PDF export.
9.  Audit logging.
10. Docker, Nginx, backup/restore documentation, dan automated tests.

## Aturan penting

-   Admin adalah satu-satunya role yang dapat menulis data operasional.
-   Viewer read-only harus ditegakkan di backend, bukan hanya UI.
-   Jangan mengaktifkan public registration.
-   Jangan membuat fitur SSH atau remote command execution.
-   Jangan menyimpan password VM, private key, token, atau credential.
-   Evidence harus private dan tidak boleh diakses melalui public URL.
-   Gunakan database transaction untuk update activity, task state, dan
    audit.
-   Simpan histori activity; jangan menimpa update lama.
-   Gunakan timezone `Asia/Jakarta` untuk tanggal laporan.
-   Jangan mengisi dashboard production dengan data dummy.
-   Jangan menambah integrasi GitLab/Grafana/Uptime Kuma pada MVP.
-   Jangan menambahkan dependency tanpa mengecek kompatibilitas dan
    alasan teknis.
-   Jangan menyatakan test/build/deployment berhasil kecuali command
    benar-benar dijalankan dan hasilnya sukses.

## Cara bekerja

-   Implementasikan satu fase pada satu waktu.
-   Setelah setiap fase, jalankan migration/test/build yang relevan.
-   Perbaiki error sebelum melanjutkan.
-   Pertahankan kode yang sudah benar.
-   Gunakan Form Request, Service/Action, Policy, dan Enum sesuai
    spesifikasi.
-   Buat UI yang minimalis, profesional, responsif, dan berbahasa
    Indonesia.
-   Pastikan halaman task detail menyatukan metadata, infrastructure
    assets, activity timeline, dan evidence.
-   Pastikan form daily update ringkas dan nyaman digunakan.

## Hasil yang wajib diserahkan

1.  Source code aplikasi.
2.  Database migrations dan seeders.
3.  Akun Admin dibuat melalui mekanisme aman, bukan credential
    hardcoded.
4.  README instalasi dan konfigurasi.
5.  `.env.example` tanpa secret.
6.  Dockerfile dan compose.yaml.
7.  Nginx configuration atau panduan integrasinya.
8.  Automated tests.
9.  Dokumentasi backup dan restore.
10. Ringkasan implementasi, file utama, command yang dijalankan, hasil
    test, keterbatasan, dan pekerjaan lanjutan.

Mulai dengan memeriksa repository dan membaca kedua dokumen spesifikasi.
Jangan berhenti setelah membuat rencana; lanjutkan implementasi sampai
deliverable yang dapat dijalankan tercapai. Jika akses environment atau
dependency tidak tersedia, jelaskan hambatan yang benar-benar terjadi
dan tetap selesaikan bagian yang dapat dikerjakan.
