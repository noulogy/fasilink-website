# IMPLEMENTATION PLAN — CAMPUS FACILITY & SCHEDULE MANAGER (WEB)

**Dokumen:** Implementation Plan — Web Application  
**Versi:** 1.0  
**Tanggal:** 4 November 2026  
**Status:** Draft implementasi untuk direview sebelum coding  
**Platform:** Web application (responsive)  
**Acuan utama:** Standard Stack Frontend Web LSKK v1.0, Backend Standard Stack LSKK v1.0, Standar Arsitektur Sistem LSKK v1.1, dan Standar Kerja Sistem Development & Deployment Pustekhan ITB v1.0.

---

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan implementasi versi web dari **Campus Facility & Schedule Manager**, yaitu aplikasi pengelolaan fasilitas kampus yang sebelumnya telah dibuat dalam versi desktop.

Tujuan pengembangan web bukan membuat ulang aturan bisnis dari nol. Versi desktop yang sudah selesai menjadi **baseline perilaku dan fitur**. Versi web harus mempertahankan alur bisnis yang memang sudah disepakati, lalu menyesuaikan antarmuka dan integrasinya dengan standar arsitektur web LSKK.

Dokumen ini menjelaskan:

1. ruang lingkup dan asumsi migrasi dari desktop ke web;
2. arsitektur frontend, backend, API, dan database;
3. teknologi yang digunakan berdasarkan standar yang diberikan;
4. modul, alur bisnis, dan aturan validasi;
5. tahapan pengembangan mengikuti SOP Design → Build → Test → Deploy;
6. kriteria penerimaan, pengujian, risiko, dan instruksi kerja untuk Antigravity.

> **Penting:** kode sumber dan file database aplikasi desktop belum disertakan dalam percakapan ini. Karena itu, nama tabel, field, relasi, dan perilaku detail aplikasi desktop tidak boleh ditebak. Tahap pertama wajib mengaudit repository serta database desktop yang sebenarnya.

## 2. Sumber Standar dan Cara Membacanya

Dokumen ini disusun dengan urutan rujukan berikut. **Catatan status:** Standar Arsitektur Sistem LSKK v1.1 pada file yang diberikan mencantumkan status *Draft untuk Review* (8 September 2026). Karena itu, keputusan arsitektur yang diturunkan darinya tetap perlu ditinjau dan disetujui oleh pihak teknis yang berwenang sebelum menjadi keputusan final proyek.

| Sumber | Bagian yang menjadi acuan | Penerapan pada proyek |
|---|---|---|
| `Frontend_Web_Development_Standard_Stack_LSKK_v1_0.pdf` | Mandatory Rules, Response Wrapper, Lazy Loading, Memoize | Stack React, TypeScript, Vite, Tailwind, Ant Design, MUI X Data Grid, Axios, TanStack Query, Zustand/Context, React Router, React Hook Form, Zod, responsivitas |
| `Backend_Development_Standard_Stack_LSKK_v1_0.pdf` | Mandatory Rules, Exception Filter, Response Wrapper, Response Interceptor | NestJS, TypeScript, PostgreSQL/TypeORM, MongoDB/Mongoose sesuai kebutuhan data, Cache Manager, DTO validation, JWT/Passport, Guard, Socket.IO, SSE, rate limiter, CORS, Nest Logger, Jest |
| `Standar Arsitektur Sistem LSKK v1.1.pdf` | Prinsip arsitektur, peta layer, pemilihan penyimpanan, alur data, kontrak data, dokumen engineering | Pemisahan tanggung jawab, sumber data melalui jalur yang tepat, PostgreSQL untuk data relasional, satu kontrak response, pemisahan live dan laporan |
| `Standar Kerja Sistem Development & Deployment Pustekhan ITB-2.pdf` | SOP 01, SOP 02, SOP 03 | 10 langkah Design–Build–Test–Deploy, API contract, testing gate, GitHub Actions, release tag, deployment oleh admin, monitoring, dan SSH key pair |

### 2.1 Prinsip yang wajib dijaga

- Setiap layer memiliki tanggung jawab yang jelas.
- Browser hanya berkomunikasi dengan API atau layanan berkas yang ditentukan; browser tidak mengakses database secara langsung.
- Input pengguna masuk melalui REST API.
- Data dari perangkat/telemetri, bila suatu saat ada, harus menggunakan broker dan worker sesuai standar; jangan memasukkannya ke REST API seolah-olah input formulir biasa.
- API mengembalikan data yang sudah siap disajikan. Pemrosesan berat tidak boleh diletakkan pada request halaman.
- Satu kontrak response digunakan oleh frontend dan backend.
- Dokumentasi harus membedakan fakta kode yang sudah ada, keputusan desain, dan pekerjaan yang direncanakan.

## 3. Ringkasan Sistem

### 3.1 Nama sistem

**Campus Facility & Schedule Manager — Web Application**

### 3.2 Target tataran sistem

Target utama adalah **Level 2 — Sistem Informasi** menurut kerangka empat tataran pada Standar Arsitektur Sistem LSKK. Fokus sistem adalah pencatatan, pengelolaan, pencarian, dan penyajian informasi fasilitas serta jadwal kampus.

Fitur laporan operasional dapat disediakan, tetapi proyek ini tidak otomatis menjadi sistem Business Intelligence Level 3. Tidak ada kebutuhan instrumentasi Level 1 selama sistem tidak menerima data dari sensor atau perangkat IoT.

### 3.3 Pengguna dan role

Hanya ada dua role utama:

- **Admin:** mengelola data fasilitas dan akademik, mengelola inventaris, memproses pengajuan, mencatat serah-terima/pengembalian, serta mengelola data pengguna sesuai kewenangan.
- **User:** melihat informasi fasilitas dan jadwal, mencari alternatif jadwal, mengajukan peminjaman, dan memantau pengajuan miliknya.

### 3.4 Kapabilitas yang dipertahankan dari versi desktop

Daftar di bawah adalah baseline berdasarkan rancangan proyek yang telah disepakati. Pada Phase 0, setiap item harus dicocokkan dengan aplikasi desktop yang benar-benar selesai.

1. Autentikasi dan pembatasan menu berdasarkan role.
2. Pengelolaan data ruangan.
3. Pengelolaan jadwal kampus/perkuliahan.
4. Pengelolaan data akademik yang dibutuhkan untuk jadwal: mata kuliah, dosen, kelas/kelompok kelas, program studi, angkatan, dan semester aktif.
5. Pengelolaan inventaris barang fasilitas umum.
6. Pencarian ketersediaan ruangan.
7. Pengajuan dan persetujuan peminjaman ruangan.
8. Pengajuan dan persetujuan peminjaman barang.
9. Pencatatan serah-terima dan pengembalian barang.
10. Pencarian alternatif jadwal berdasarkan durasi mata kuliah, jadwal kelas, ketersediaan dosen, dan ketersediaan ruangan.
11. Riwayat/status pengajuan dan perubahan jadwal.

Fitur yang ternyata belum ada atau belum stabil pada desktop tidak boleh dianggap telah tersedia. Catat statusnya dalam feature parity matrix.

## 4. Asumsi dan Keputusan Arsitektur Awal

Bagian ini adalah keputusan awal agar implementasi dapat direncanakan. Keputusan yang ditandai **perlu konfirmasi** harus disepakati sebelum implementasi modul terkait.

| ID | Status Keputusan | Detail & Catatan Pasca-Audit Phase 0 |
|---|---|---|
| ADR-001 | **ACCEPTED** | React web (Vite + Tailwind + AntD + MUI DataGrid) menjadi client; NestJS API backend |
| ADR-002 | **ACCEPTED** | PostgreSQL 16 menjadi sumber data transaksional tunggal untuk seluruh domain data |
| ADR-003 | **ACCEPTED** | MongoDB secara resmi **TIDAK DIGUNAKAN** pada MVP (karakteristik data murni relasional) |
| ADR-004 | **ACCEPTED** | Tidak menggunakan MQTT, RabbitMQ, atau Worker Go pada MVP |
| ADR-005 | **ACCEPTED** | Cache Manager NestJS digunakan secara selektif untuk read caching non-otoritatif |
| ADR-006 | **ACCEPTED** | REST API menjadi jalur utama seluruh transaksi dan aksi pengguna |
| ADR-007 | **ACCEPTED** | Socket.IO dipakai untuk event operasional persetujuan/notifikasi status; REST sebagai fallback |
| ADR-008 | **ACCEPTED** | Versi web menggunakan satu backend dan database kanonis PostgreSQL (Opsi A: Web menggantikan desktop) |
| ADR-009 | **ACCEPTED** | Data desktop dimigrasikan dengan backup, mapping tipe data ketat, dan rekonsiliasi |
| ADR-010 | **ACCEPTED** | Perubahan jadwal berlaku mingguan (*recurring mutation*) sesuai paritas desktop dengan pencatatan `effective_date` & snapshot riwayat |
| ADR-011 | **ACCEPTED** | Master data akademik (semester, matkul, dosen, rombel) menggunakan seeding/impor terkontrol pada MVP; struktur backend dirancang *extensible* untuk CRUD masa depan |

### 4.1 Keputusan penting tentang desktop dan web

Pilih salah satu kondisi berikut saat Phase 0:

**Opsi A — Web menggantikan desktop.** PostgreSQL dan NestJS menjadi sistem aktif. Desktop dipertahankan sebagai arsip/demo atau dihentikan setelah migrasi tervalidasi.

**Opsi B — Desktop dan web berjalan bersamaan.** Aplikasi desktop tidak boleh terus menulis ke SQLite lokal yang terpisah. Desktop harus diubah menjadi client yang mengakses NestJS REST API yang sama, atau disepakati mekanisme sinkronisasi resmi. Jangan membuat dua sumber data aktif yang saling tidak mengetahui perubahan.

Untuk rencana ini, asumsi default adalah **Opsi A** sampai pemilik proyek menyatakan bahwa desktop harus tetap digunakan.

## 5. Ruang Lingkup MVP

Prioritas mengikuti P0/P1 sebagaimana kerangka Dokumen Engineering LSKK.

### 5.1 P0 — Wajib untuk rilis web pertama

| Modul | Cakupan P0 | Kriteria hasil |
|---|---|---|
| Authentication | Login, logout, refresh session, halaman profil dasar | User dapat masuk; endpoint dan route terlindungi; session dapat diakhiri |
| Authorization | Role Admin dan User, backend guard dan frontend route guard | User tidak dapat mengakses data/aksi Admin dengan mengganti URL atau request |
| Master ruangan | Daftar, detail, tambah, ubah, aktif/nonaktif | Data ruangan tervalidasi dan tersimpan di PostgreSQL |
| Data akademik | Semester, mata kuliah, dosen, kelas/kelompok kelas, jadwal (Inisialisasi via seeding/impor terkelola sesuai ADR-011) | Data yang dibutuhkan pencarian jadwal tersedia dan konsisten di PostgreSQL tanpa UI CRUD terpisah di MVP |
| Jadwal kampus | Tampilan jadwal, filter tanggal/semester/ruangan/kelas | Jadwal dapat ditelusuri tanpa bentrok data yang tersembunyi |
| Inventaris | CRUD item, total stok, stok tersedia, kondisi/status | Stok tidak menjadi negatif; histori transaksi tercatat |
| Peminjaman ruangan | Lihat ketersediaan, ajukan, batalkan bila masih diizinkan, approve/reject | Pengajuan memeriksa bentrok dan status dengan benar |
| Peminjaman barang | Ajukan item dan kuantitas, approve/reject, serah-terima, pengembalian | Stok tersedia dan histori pergerakan barang konsisten |
| Alternatif jadwal | Input kebutuhan, cari kandidat, tampilkan alasan dan peringkat | Kandidat tidak melanggar hard constraints |
| Permintaan perubahan jadwal | User mengirim pilihan alternatif; Admin meninjau; mutasi jadwal mingguan resmi berulang (*recurring*) dengan pencatatan `effective_date` & snapshot riwayat sesuai ADR-010 | Jadwal resmi berubah hanya setelah approval yang sah tanpa distorsi retroaktif |
| Riwayat | User melihat pengajuan sendiri; Admin melihat pengajuan sesuai kewenangan | Riwayat tidak bocor lintas user |
| Dashboard operasional | Ringkasan pengajuan aktif, ruangan terpakai, stok, dan tugas Admin | Menampilkan kondisi terkini dengan sumber data yang jelas |
| Audit dasar | Pencatatan aktor, waktu, aksi, dan perubahan status penting | Perubahan penting dapat ditelusuri |

### 5.2 P1 — Setelah MVP stabil

- Ekspor laporan PDF/CSV/XLSX sesuai kebutuhan pemilik sistem.
- Lampiran foto bukti kondisi barang atau dokumen, menggunakan object storage yang disetujui.
- Rekap harian/mingguan/bulanan yang disiapkan melalui scheduled job jika query laporan mulai berat.
- Notifikasi yang lebih lengkap dan preferensi notifikasi.
- Integrasi SSO Google atau sistem akademik, hanya setelah akun dan akses resmi tersedia.
- Dashboard historis yang lebih komprehensif.

### 5.3 P2 — Tidak termasuk MVP

- Aplikasi mobile native.
- Integrasi IoT/sensor dan telemetri.
- AI atau machine learning untuk penjadwalan.
- Worker Go, MQTT, RabbitMQ, atau microservice tambahan tanpa kebutuhan throughput/pipeline yang jelas.
- Payment gateway; peminjaman fasilitas pada rancangan ini tidak menunjukkan kebutuhan pembayaran.

## 6. Arsitektur Sistem Web

### 6.1 Diagram arsitektur konseptual

```mermaid
flowchart TB
    U[Admin / User Browser]
    FE[Frontend Web\nReact + TypeScript + Vite]
    API[NestJS REST API\nAuth, Guard, DTO, Business Service]
    RT[Socket.IO Gateway / SSE Endpoint]
    CACHE[Nest Cache Manager]
    DB[(PostgreSQL\nTypeORM)]
    JOB[NestJS Scheduled Job\nJika diperlukan]
    STORE[Object Storage S3-Compatible\nP1 bila ada file]

    U --> FE
    FE -->|REST / Axios| API
    FE <-->|Authenticated realtime| RT
    API --> DB
    API <--> CACHE
    JOB --> DB
    API -.-> STORE
    RT --> API
```

### 6.2 Alur data utama

1. User membuka halaman React.
2. React mengambil data melalui Axios ke endpoint REST NestJS.
3. NestJS memverifikasi JWT/Passport, role Guard, dan DTO validation.
4. Controller meneruskan pekerjaan ke Service.
5. Service menjalankan aturan bisnis dan memanggil Repository.
6. Repository mengakses PostgreSQL melalui TypeORM.
7. ResponseInterceptor membentuk response wrapper standar.
8. TanStack Query menyimpan cache server-state dan memperbarui tampilan.
9. Untuk perubahan operasional yang perlu terlihat segera, backend menerbitkan event melalui kanal realtime yang ditentukan; REST tetap menyediakan pembacaan state terbaru.

### 6.3 Batas tanggung jawab

| Layer | Boleh / bertanggung jawab | Tidak boleh |
|---|---|---|
| Frontend React | Render UI, interaksi, validasi awal, state tampilan, mengirim request ke API | Menjadi sumber aturan bisnis, mengakses PostgreSQL langsung, menentukan approval final |
| API NestJS | REST, auth, authorization, transaksi, validasi bisnis, response contract, realtime gateway | Menjadi consumer telemetri bervolume tinggi |
| Processing | Scheduled job yang terkait aturan relasional dan data aplikasi | Membuat endpoint bisnis untuk browser atau menyimpan logika bisnis di consumer broker |
| PostgreSQL | Menyimpan data relasional dan transaksi | Menyembunyikan aturan bisnis di trigger/procedure yang tidak terdokumentasi |
| Broker | Mengantar pesan bila kelak ada kebutuhan asynchronous/device | Melakukan transformasi atau filtering bisnis |

## 7. Teknologi yang Digunakan

## 7.1 Frontend Web

| Teknologi | Status | Fungsi dan aturan penggunaan |
|---|---|---|
| TypeScript | Wajib | Bahasa utama frontend; definisikan type, interface, dan enum; hindari `any` |
| React JS Functional Components | Wajib | Seluruh halaman dan komponen menggunakan functional component dan hooks |
| Vite | Wajib | Development server dan build tool |
| Tailwind CSS | Wajib | Utility styling dan responsive layout; konsisten dengan design token aplikasi |
| Ant Design | Wajib | Komponen UI utama: Layout, Form, Input, Select, Modal, Drawer, DatePicker, Notification, Dropdown, Button |
| MUI X Data Grid | Wajib untuk tabel data | Tabel data ruangan, jadwal, inventaris, dan pengajuan; gunakan server-side pagination/filter/sort jika data berasal dari API |
| Axios | Wajib | Semua komunikasi HTTP ke backend melalui satu configured instance |
| TanStack Query | Wajib | Server-state: query, mutation, pagination, invalidation, retry policy |
| Context API | Wajib sesuai kebutuhan | Context untuk dependency atau konteks aplikasi yang benar-benar lintas pohon komponen |
| Zustand | Wajib sesuai kebutuhan state global | UI state ringan seperti sidebar, filter lintas halaman, atau state client yang bukan hasil API |
| React Router DOM | Wajib | Gunakan `createHashRouter` sesuai Standard Stack; route guard untuk role |
| React Hook Form | Wajib | Pengelolaan input form |
| Zod | Wajib | Schema validation di sisi frontend; skema frontend bukan pengganti validasi backend |
| Prettier | Wajib | Format kode konsisten |
| ESLint default Vite | Wajib | Lint kode; jangan mematikan rule tanpa alasan |
| React.lazy + Suspense | Wajib untuk page besar | Lazy-load route/page agar bundle awal tidak memuat seluruh modul |
| Memoization | Selektif | Gunakan `memo`, `useMemo`, atau `useCallback` bila ada manfaat yang terukur; jangan mengoptimasi setiap komponen secara berlebihan |

### 7.1.1 Aturan frontend

- Mobile-first responsive: halaman tetap dapat digunakan pada ponsel, tablet, dan desktop.
- Sediakan loading, empty, error, success, dan disabled state.
- Validasi form memiliki pesan yang spesifik dan dekat dengan field terkait.
- Semua request API menggunakan Axios instance; jangan membuat pemanggilan Axios tersebar tanpa interceptor standar.
- TanStack Query menjadi sumber server-state. Jangan menyalin seluruh response API ke Zustand.
- Zustand hanya untuk client/UI state yang perlu dibagi lintas komponen.
- Gunakan MUI X Data Grid untuk tabel data utama; jangan membuat tabel kompleks dari elemen HTML mentah.
- Jangan menaruh business rule approval, perhitungan stok final, atau pemeriksaan konflik final di frontend.
- Jangan menyimpan password atau refresh token di localStorage. Ikuti strategi token pada bagian keamanan.

### 7.1.2 Rute halaman yang disarankan

```text
/login

/app
  /dashboard
  /schedule
  /rooms
  /rooms/:roomId
  /inventory
  /inventory/:itemId
  /schedule-alternatives
  /room-loans
  /item-loans
  /my-requests
  /profile

/admin
  /dashboard
  /rooms
  /schedules
  /academic-data
  /inventory
  /loan-requests
  /schedule-change-requests
  /users
  /reports
  /audit-logs
```

Route aktual harus disesuaikan dengan navigasi desktop yang telah selesai, tetapi prefix dan role separation harus tetap konsisten. Route guard frontend hanya untuk pengalaman navigasi; backend Guard tetap wajib mengamankan endpoint.

## 7.2 Backend

| Teknologi | Status | Fungsi dan aturan penggunaan |
|---|---|---|
| TypeScript | Wajib | Bahasa utama backend; gunakan type/interface/enum dan minimalkan `any` |
| NestJS | Wajib | Framework backend, modular berdasarkan domain |
| PostgreSQL | Database utama MVP | Menyimpan user, role, data akademik, ruangan, jadwal, inventaris, transaksi peminjaman, dan audit |
| TypeORM | Wajib untuk PostgreSQL | Entity, Repository, QueryBuilder, migration, dan transaction |
| `typeorm-transactional` | Wajib untuk operasi lintas tabel | Mengelola transaksi yang memerlukan konsistensi beberapa repository/tabel |
| MongoDB + Mongoose | Tidak digunakan pada MVP kecuali audit membuktikan kebutuhan | Standar arsitektur memilih MongoDB untuk data telemetri/log bervolume tinggi dan bentuk yang berubah; domain saat ini dominan relasional |
| Nest Cache Manager | Wajib sebagai mekanisme caching standar | Cache data baca yang cocok; bukan sumber kebenaran; gunakan invalidation |
| class-transformer + class-validator | Wajib | DTO validation dan transformasi input request |
| JWT + Passport | Wajib | Authentication dan refresh token rotation |
| Nest Guards | Wajib | Authorization berbasis role dan hak akses modul |
| Socket.IO melalui NestJS Gateway | Wajib sesuai kebutuhan realtime operasional | Mengirim event perubahan operasional yang perlu terlihat segera; autentikasi melalui handshake, bukan token pada query string |
| SSE | Wajib sesuai kebutuhan aliran satu arah | Untuk stream satu arah yang jelas use case-nya; jangan menduplikasi event Socket.IO tanpa alasan |
| Rate Limiter | Wajib | Membatasi request berisiko, khususnya login dan endpoint sensitif |
| CORS | Wajib | Allowlist origin frontend; jangan menggunakan wildcard pada production |
| Nest Logger | Wajib | Gunakan Logger dari NestJS; sertakan HTTP logging middleware |
| Global Exception Filter | Wajib | Menangkap exception dan mengembalikan bentuk error standar termasuk path endpoint |
| Response Interceptor | Wajib | Membungkus success response menjadi `IResponseEntity<T>` |
| Jest / Nest Testing | Wajib | Unit test dan integration/e2e test backend |

### 7.2.1 Keputusan PostgreSQL dan MongoDB

Aplikasi ini memiliki relasi yang kuat: satu pengajuan terkait user, ruangan/barang, periode, jadwal, status, dan approval. Karena itu PostgreSQL menjadi database utama.

MongoDB tidak ditambahkan hanya untuk memenuhi daftar teknologi. Standar Arsitektur LSKK menjelaskan pemilihan database berdasarkan bentuk dan pola akses data: PostgreSQL untuk relasi yang membutuhkan integritas; MongoDB untuk telemetri mentah/log perangkat bervolume tinggi dan struktur yang berubah. Jika reviewer mengharuskan MongoDB aktif, keputusan tersebut harus dicatat sebagai ADR beserta data domain yang benar-benar disimpan di MongoDB; jangan menggandakan data relasional ke MongoDB tanpa kebutuhan. Apabila MongoDB akhirnya digunakan, konfigurasi Replica Set dan dukungan transaksi MongoDB sebagaimana diwajibkan Backend Standard Stack harus disiapkan dan diuji.

### 7.2.2 Cache

Cache hanya dipakai untuk data baca yang aman di-cache, misalnya daftar master ruangan atau referensi akademik yang jarang berubah. Cache ketersediaan ruangan memiliki TTL pendek dan wajib diinvalidasi saat:

- jadwal resmi dibuat/diubah/dihapus;
- peminjaman ruangan disetujui atau dibatalkan;
- perubahan jadwal disetujui;
- kapasitas atau status ruangan diubah.

Pemeriksaan final sebelum approval selalu membaca kondisi terkini dari PostgreSQL, bukan mempercayai cache.

### 7.2.3 Pemrosesan dan worker

- Tidak ada kebutuhan Worker Go pada MVP karena aplikasi tidak mengonsumsi telemetri MQTT/RabbitMQ dan tidak memiliki pekerjaan throughput tinggi yang harus hidup terpisah dari API.
- Scheduled job NestJS dapat dipakai untuk pekerjaan berkala yang berhubungan erat dengan data relasional, misalnya pembersihan refresh token kedaluwarsa atau rekap terjadwal bila fitur laporan memerlukannya.
- Pencarian alternatif jadwal awalnya dijalankan sebagai business service NestJS selama benchmark menunjukkan waktu respons dapat diterima. Jika proses konsisten lebih dari sekitar satu detik atau beban meningkat, evaluasi pemindahan ke job/worker dan dokumentasikan keputusan. Jangan membuat microservice hanya berdasarkan perkiraan.
- MQTT dan RabbitMQ baru ditambahkan bila kelak ada sumber perangkat atau antrean antar-service/asynchronous yang benar-benar dibutuhkan.

## 8. Modul dan Matriks Akses

| Modul | User | Admin |
|---|---|---|
| Login, logout, profil sendiri | Lihat/ubah data yang diizinkan | Lihat/ubah profil sendiri |
| Dashboard | Ringkasan pengajuan dan informasi yang relevan untuk dirinya | Ringkasan operasional dan pekerjaan yang perlu ditindaklanjuti |
| Jadwal kampus | Lihat dan filter | Lihat, tambah, ubah, nonaktifkan sesuai aturan |
| Data ruangan | Lihat | CRUD dan ubah status |
| Data akademik | Lihat informasi yang dibutuhkan | CRUD/import sesuai kewenangan |
| Inventaris | Lihat ketersediaan | CRUD dan kelola stok/kondisi |
| Peminjaman ruangan | Buat, lihat milik sendiri, batalkan sesuai status | Lihat semua, approve/reject, catat keputusan |
| Peminjaman barang | Buat, lihat milik sendiri, batalkan sesuai status | Lihat semua, approve/reject, serah-terima/pengembalian |
| Alternatif jadwal | Cari dan ajukan perubahan | Tinjau dan kelola permintaan sesuai kewenangan |
| Pengguna | Lihat/ubah profil sendiri | Kelola akun dan status pengguna |
| Laporan | Lihat riwayat milik sendiri | Lihat laporan seluruh sistem |
| Audit log | Tidak | Lihat sesuai hak akses |

Matriks ini harus diterjemahkan menjadi NestJS Guards/permission policy. Jangan hanya menyembunyikan tombol Admin di frontend.

## 9. Rancangan Data Konseptual

Struktur di bawah adalah **rancangan konseptual**, bukan klaim bahwa tabel desktop memiliki nama yang sama. Nama tabel final harus ditetapkan setelah audit database desktop dan ERD disetujui.

### 9.1 Kelompok entitas

**A. Identitas dan akses**

- `users`: akun, identifier login, password hash, role, status akun, timestamps.
- `refresh_tokens` atau tabel sesi: hash token, expiry, revoked_at, device/session metadata secukupnya.
- `user_profiles`: nama dan data profil yang diperlukan; hindari menyimpan atribut yang tidak dibutuhkan.

**B. Data akademik**

- `academic_terms`: tahun akademik, semester, tanggal mulai, tanggal selesai, status aktif.
- `study_programs`: program studi.
- `class_groups`: prodi, angkatan, kelas/kelompok kelas, jumlah peserta.
- `courses`: kode dan nama mata kuliah serta durasi standar bila memang menjadi data resmi.
- `lecturers`: identitas dosen dan status.
- `lecturer_availabilities`: jendela waktu dosen yang boleh dijadikan kandidat; definisi sumber data dan pihak yang berwenang mengubahnya harus ditentukan.
- `class_schedules`: jadwal resmi, kelas, mata kuliah, dosen, ruangan, hari/tanggal, jam mulai/selesai, rentang semester, status.
- `schedule_exceptions`: pengecualian untuk hari libur, kelas pengganti, atau perubahan pertemuan tertentu jika dibutuhkan oleh perilaku desktop.

**C. Fasilitas**

- `rooms`: nama/kode, lokasi, kapasitas, tipe, fasilitas, status.
- `inventory_items`: kode barang, nama, kategori, total stok, kondisi, lokasi penyimpanan, status.
- `inventory_movements`: pencatatan stok masuk/keluar, serah-terima, pengembalian, kehilangan/kerusakan jika fitur tersebut disetujui.

**D. Peminjaman dan perubahan jadwal**

- `room_loan_requests`: pemohon, ruangan, tanggal, waktu mulai/selesai, tujuan, status, keputusan.
- `item_loan_requests`: pemohon, tujuan, periode pinjam, status, keputusan.
- `item_loan_request_details`: item dan kuantitas untuk tiap permintaan.
- `schedule_change_requests`: jadwal asal, kandidat jadwal yang dipilih, alasan, pemohon, status, keputusan.
- `approval_histories`: aktor, aksi, catatan, waktu, status sebelum/sesudah.
- `request_status_histories`: jejak perubahan status transaksi.
- `audit_logs`: aksi penting pada data master dan transaksi.
- `notifications`: notifikasi dalam aplikasi dan status baca bila dibutuhkan.

### 9.2 Aturan rancangan database

- PostgreSQL menjadi sumber data transaksi yang kanonis.
- Gunakan foreign key untuk relasi yang memang harus valid.
- Gunakan enum atau tabel referensi untuk status yang memiliki daftar nilai terbatas.
- Tambahkan `created_at`, `updated_at`, dan identitas aktor (`created_by`, `updated_by`) untuk entitas penting.
- Gunakan migration TypeORM; jangan mengandalkan `synchronize: true` pada production.
- Tambahkan index untuk kolom pencarian/filter yang sering dipakai: status, tanggal, semester, room_id, user_id, course_id, lecturer_id.
- Semua waktu harus konsisten. Simpan timestamp absolut dengan zona waktu yang jelas; untuk jadwal berulang simpan day-of-week, jam lokal kampus, dan rentang periode. Zona waktu operasional kampus default `Asia/Jakarta`, tetapi harus dikonfirmasi pada Phase 0.
- Hindari menghapus transaksi historis yang sudah disetujui. Gunakan status, arsip, atau soft delete sesuai kebutuhan audit.
- Jangan menaruh aturan approval atau perhitungan stok tersembunyi dalam trigger database; aturan bisnis berada di service dan terdokumentasi.

### 9.3 Data migration dari desktop

Phase 0 wajib memastikan database desktop aktual. Jika desktop menggunakan SQLite, lakukan proses berikut:

1. buat backup file database sebelum proses apa pun;
2. inventarisasi tabel, kolom, relasi, constraint, enum/status, dan contoh data;
3. identifikasi data tidak valid, duplikat, orphan record, dan format tanggal/jam;
4. buat mapping desktop → PostgreSQL yang disetujui;
5. tulis migration/import script yang dapat dijalankan ulang secara aman (idempotent);
6. pertahankan identifier lama bila tidak menimbulkan konflik; simpan mapping ID jika perlu;
7. jalankan import pada database staging, bukan production;
8. bandingkan jumlah data per entitas, relasi, status, dan sampel transaksi;
9. uji alur utama pada data hasil migrasi;
10. catat hasil rekonsiliasi dan siapkan rollback/restore.

Jangan menggabungkan database lokal dan database web secara manual setiap kali aplikasi digunakan.

## 10. Aturan Bisnis Inti

### 10.1 Status transaksi

Status final harus mengikuti kode desktop dan disepakati dalam API contract. Rancangan awal yang dapat dipakai untuk review:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `IN_PROGRESS` atau `BORROWED` untuk barang yang sudah diserahterimakan
- `RETURNED`
- `OVERDUE` hanya jika konsep tenggat dan keterlambatan memang digunakan

Jangan membuat status baru tanpa mendefinisikan transisi yang sah.

### 10.2 Peminjaman ruangan

1. User memilih tanggal, waktu mulai, waktu selesai, ruangan/kriteria ruangan, dan tujuan.
2. Frontend melakukan validasi awal: field wajib, waktu mulai sebelum waktu selesai, dan periode yang masuk akal.
3. API memeriksa status ruangan, kapasitas, jadwal perkuliahan, dan booking yang sudah disetujui.
4. API menyimpan request dengan status `PENDING` jika tidak ada hard conflict.
5. Admin approve/reject dengan catatan keputusan.
6. Saat approval, backend memeriksa ulang ketersediaan di dalam transaksi database.
7. Jika valid, status menjadi `APPROVED`, histori approval tercatat, cache terkait diinvalidasi, dan event notifikasi dikirim setelah transaksi berhasil commit.

### 10.3 Peminjaman barang

1. User memilih item dan kuantitas.
2. API mengecek stok tersedia dan status item.
3. Pengajuan menunggu approval.
4. Saat approval, stok dicek ulang di dalam transaksi.
5. Saat serah-terima, catat jumlah aktual dan kondisi awal.
6. Saat pengembalian, catat tanggal, jumlah, kondisi akhir, dan kekurangan/kerusakan jika fitur tersebut disepakati.
7. Stok tersedia dihitung konsisten dari total stok dikurangi barang yang sedang dipinjam/keluar, atau dari inventory movement ledger yang disepakati. Jangan memperbarui stok melalui banyak jalur yang berbeda.

### 10.4 Deteksi bentrok waktu

Untuk interval waktu pada resource yang sama, dua interval bertabrakan bila:

```text
requested_start < existing_end
AND requested_end > existing_start
```

Konsekuensinya, dua kegiatan yang berakhir tepat saat kegiatan berikutnya dimulai tidak dianggap bertabrakan, selama kebijakan jeda/setup ruangan tidak menetapkan buffer tambahan.

Conflict checker minimal memeriksa:

- ruangan yang sama pada waktu yang beririsan;
- kelompok kelas yang sama pada waktu yang beririsan;
- dosen yang sama pada waktu yang beririsan;
- booking ruangan yang sudah disetujui;
- jadwal resmi dan pengecualian kalender yang relevan;
- kapasitas ruangan dibanding jumlah peserta.

Validasi konflik tidak boleh hanya dilakukan di frontend. Backend harus melakukan pemeriksaan ulang saat pengajuan dan saat approval.

### 10.5 Pencarian alternatif jadwal

**Input minimum**

- kelas/kelompok kelas atau mata kuliah yang akan dijadwalkan ulang;
- durasi mata kuliah;
- dosen terkait;
- semester/periode pencarian;
- preferensi hari atau rentang waktu bila diberikan;
- kebutuhan kapasitas ruangan.

**Hard constraints — wajib dipenuhi**

1. Durasi kandidat sama dengan durasi yang dibutuhkan.
2. Kandidat berada dalam periode akademik yang valid.
3. Dosen tidak memiliki jadwal lain pada interval tersebut.
4. Kelompok kelas tidak memiliki jadwal lain pada interval tersebut.
5. Ruangan tersedia dan tidak sedang digunakan.
6. Kapasitas ruangan mencukupi.
7. Tidak ada booking ruangan yang telah disetujui pada interval tersebut.
8. Kalender/pengecualian akademik dihormati jika datanya tersedia.

**Soft preferences — digunakan untuk ranking, bukan melanggar hard constraints**

- hari yang lebih disukai;
- rentang jam yang lebih disukai;
- ruangan/lokasi tertentu;
- preferensi lain yang disetujui pemilik sistem.

**Alur algoritma**

1. Ambil konfigurasi periode akademik dan kandidat slot yang relevan.
2. Bentuk slot waktu berdasarkan durasi yang diminta dan aturan jam kampus yang telah dikonfirmasi.
3. Saring kandidat yang melanggar konflik dosen atau kelas.
4. Saring kandidat yang melanggar ketersediaan/kapsitas ruangan dan booking.
5. Hitung skor untuk soft preferences pada kandidat yang masih valid.
6. Urutkan dari skor tertinggi; tampilkan alasan ringkas mengapa kandidat direkomendasikan.
7. Jika tidak ada kandidat, tampilkan kondisi yang menyebabkan tidak ada hasil; jangan membuat slot palsu.
8. Saat user memilih kandidat, simpan sebagai permintaan perubahan jadwal, bukan langsung mengubah jadwal resmi.
9. Saat Admin menyetujui, ulangi validasi dalam transaksi; baru ubah jadwal resmi.

**Catatan penting:** Phase 0 harus memastikan perubahan jadwal pada desktop berlaku untuk satu pertemuan atau seluruh pertemuan berulang sampai akhir semester. Algoritma dan skema data mengikuti perilaku resmi yang dipilih, bukan asumsi developer.

### 10.6 Race condition dan approval bersamaan

Dua Admin dapat membuka request yang sama atau dua request dapat memperebutkan slot yang sama. Untuk itu:

- approval dijalankan dalam database transaction;
- status request diperiksa ulang di dalam transaction;
- ketersediaan ruang/dosen/kelas diperiksa ulang sebelum menulis jadwal;
- transaksi yang saling bertentangan harus gagal secara terkendali dan menampilkan pesan yang dapat dimengerti;
- gunakan locking/constraint/strategi isolation PostgreSQL yang tepat setelah ERD dan pola jadwal final disepakati;
- event realtime dikirim setelah commit, bukan sebelum data tersimpan.

## 11. API Contract

Dokumen API contract adalah kesepakatan FE dan BE. Buat OpenAPI/Swagger atau Postman Collection yang menjadi satu sumber rujukan. Frontend boleh menggunakan mock server berdasarkan contract tersebut sebelum backend selesai.

### 11.1 Konvensi umum

- Base path: `/api/v1`.
- Content type: `application/json` kecuali upload/download berkas.
- Semua endpoint list harus mendukung pagination.
- Parameter pagination default awal: `page=1`, `limit=10`; batas maksimum `limit` ditentukan di backend dan didokumentasikan.
- Filter/sort hanya menerima field yang di-whitelist backend.
- Jangan pernah menerima SQL/order expression mentah dari browser.

### 11.2 Response wrapper success

```typescript
export interface ImetaPagination {
  totalPages: number;
  totalData: number;
  totalDataPerPage: number;
  page: number;
  limit: number;
}

export interface IResponseEntity<T> {
  code: number;
  status: boolean;
  message: string;
  data?: T;
  meta?: ImetaPagination;
}

export interface IResponsePageWrapper<T> {
  data: T[];
  meta: ImetaPagination;
}
```

Contoh response list:

```json
{
  "code": 200,
  "status": true,
  "message": "Rooms retrieved successfully",
  "data": [],
  "meta": {
    "totalPages": 0,
    "totalData": 0,
    "totalDataPerPage": 10,
    "page": 1,
    "limit": 10
  }
}
```

ResponseInterceptor NestJS membungkus data yang dikembalikan controller. Controller tidak membuat wrapper manual berulang kali.

### 11.3 Error response

Global Exception Filter mengembalikan bentuk konsisten dan menyertakan path endpoint sebagaimana Backend Standard Stack.

```json
{
  "code": 409,
  "status": false,
  "message": "The selected room is no longer available",
  "path": "/api/v1/room-loans/123/approve"
}
```

`message` dijaga sebagai string yang aman ditampilkan. Detail stack trace dan informasi internal tidak dikirim kepada browser.

### 11.4 Endpoint awal yang perlu dirancang

| Modul | Method | Endpoint usulan | Keterangan |
|---|---|---|---|
| Auth | POST | `/auth/login` | Login |
| Auth | POST | `/auth/refresh` | Rotasi refresh token |
| Auth | POST | `/auth/logout` | Revoke session/token |
| Auth | GET | `/auth/me` | Profil dan role aktif |
| Users | GET | `/users` | Admin: daftar user, pagination |
| Users | GET/PATCH | `/users/:id` | Detail/ubah user sesuai permission |
| Rooms | GET | `/rooms` | List dan filter |
| Rooms | GET | `/rooms/:id` | Detail |
| Rooms | POST/PATCH | `/rooms` dan `/rooms/:id` | Admin CRUD |
| Schedules | GET | `/schedules` | Jadwal dengan filter semester/tanggal/ruangan/kelas |
| Schedules | POST/PATCH | `/schedules` dan `/schedules/:id` | Admin mengelola jadwal resmi |
| Inventory | GET | `/inventory` | List stok dan ketersediaan |
| Inventory | POST/PATCH | `/inventory` dan `/inventory/:id` | Admin CRUD |
| Room loans | GET/POST | `/room-loans` | User membuat request; Admin dapat melihat sesuai permission |
| Room loans | POST | `/room-loans/:id/approve` | Admin approval |
| Room loans | POST | `/room-loans/:id/reject` | Admin rejection |
| Item loans | GET/POST | `/item-loans` | List/mengajukan peminjaman barang |
| Item loans | POST | `/item-loans/:id/approve` | Admin approval |
| Item loans | POST | `/item-loans/:id/hand-over` | Mencatat serah-terima |
| Item loans | POST | `/item-loans/:id/return` | Mencatat pengembalian |
| Alternatives | POST | `/schedule-alternatives/search` | Mencari kandidat alternatif |
| Schedule changes | GET/POST | `/schedule-change-requests` | User mengirim permintaan perubahan |
| Schedule changes | POST | `/schedule-change-requests/:id/approve` | Admin approve dan menerapkan jadwal |
| Schedule changes | POST | `/schedule-change-requests/:id/reject` | Admin reject |
| Notifications | GET | `/notifications` | Riwayat notifikasi via REST |
| Reports | GET | `/reports/...` | Admin laporan historis dengan pagination/filter |

Endpoint ini adalah rancangan awal. Finalisasi nama, payload, status code, permission, dan response schema pada tahap Backend & Frontend Contract.

## 12. Real-time, Dashboard, dan Scheduled Processing

### 12.1 Event real-time

Gunakan event hanya untuk perubahan yang memang perlu segera terlihat lintas sesi.

| Event | Target | Kapan dikirim |
|---|---|---|
| `room-loan.created` | Admin | Setelah user berhasil mengirim request |
| `item-loan.created` | Admin | Setelah request tersimpan |
| `loan.status-changed` | User pemilik request | Setelah Admin approve/reject/cancel |
| `schedule-change.created` | Admin | Setelah request perubahan tersimpan |
| `schedule-change.status-changed` | User pemilik request | Setelah keputusan tersimpan |
| `room-availability.changed` | Client yang sedang melihat jadwal/ruangan terkait | Setelah transaksi yang mengubah ketersediaan berhasil commit |

### 12.2 Socket.IO dan SSE

- Socket.IO Gateway digunakan untuk event operasional pada dashboard Admin dan kanal yang memerlukan session/room event. Authentication dilakukan pada handshake, bukan melalui query string.
- SSE digunakan untuk stream satu arah yang memiliki kebutuhan jelas, misalnya stream notifikasi user atau progres ekspor laporan bila ekspor menjadi proses asynchronous.
- Jangan menjalankan dua koneksi untuk mengirim event yang sama kepada client yang sama tanpa kebutuhan yang terdokumentasi.
- REST menjadi fallback: ketika koneksi putus, UI mengambil status terakhir melalui endpoint REST.
- Jika tahap desain membuktikan tidak ada kebutuhan SSE atau Socket.IO pada MVP, catat keputusan dan alasan pada ADR, lalu jangan membuat implementasi kosong hanya demi menambah dependency.

### 12.3 Pisahkan mode operasional dan mode laporan

Jika dashboard memuat dua jenis informasi, pisahkan sumber dan pola pengambilannya:

- **Mode operasional/live:** request aktif, ruangan yang sedang terpakai, status pengajuan terbaru; event Socket.IO/SSE sesuai use case dan REST fallback.
- **Mode laporan:** histori harian/mingguan/bulanan dan filter rentang; REST dengan pagination/filter dari PostgreSQL.

Jangan menggunakan satu query/event stream untuk menggantikan kedua kebutuhan tersebut. Jangan menghitung agregasi laporan berat setiap kali halaman dibuka; evaluasi scheduled summary hanya jika beban/query membutuhkannya.

### 12.4 Scheduled job

Pekerjaan berkala yang erat dengan aturan data relasional dapat menggunakan `@nestjs/schedule`, misalnya:

- pembersihan refresh token yang sudah kedaluwarsa;
- penandaan request melewati batas waktu, hanya jika konsep batas waktu disepakati;
- pembuatan ringkasan laporan jika dibutuhkan.

Frekuensi dan perilaku job harus ditentukan dari kebutuhan, diuji, dan dicatat. Jangan membuat job yang mengubah jadwal akademik tanpa keputusan manusia yang berwenang.

## 13. Struktur Repository yang Disarankan

Jika repository desktop saat ini berisi proyek Java, pertahankan folder/kode desktop. Letakkan aplikasi web di folder terpisah agar konfigurasi Maven tidak tercampur dengan Node/NPM.

```text
campus-facility-manager/
├── desktop/                         # aplikasi Java yang sudah selesai; jangan dihapus
├── apps/
│   ├── web/                         # React + TypeScript + Vite
│   │   ├── public/
│   │   └── src/
│   │       ├── app/                 # router, providers, app shell
│   │       ├── assets/
│   │       ├── components/          # reusable UI
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── dashboard/
│   │       │   ├── rooms/
│   │       │   ├── schedules/
│   │       │   ├── academic-data/
│   │       │   ├── inventory/
│   │       │   ├── room-loans/
│   │       │   ├── item-loans/
│   │       │   ├── schedule-alternatives/
│   │       │   ├── schedule-change-requests/
│   │       │   └── reports/
│   │       ├── hooks/
│   │       ├── lib/                 # axios, query client, utilities
│   │       ├── routes/
│   │       ├── schemas/              # Zod schemas
│   │       ├── stores/               # Zustand UI/client state
│   │       ├── types/                # API/domain types
│   │       └── styles/
│   └── api/                          # NestJS backend
│       └── src/
│           ├── common/
│           │   ├── decorators/
│           │   ├── filters/
│           │   ├── guards/
│           │   ├── interceptors/
│           │   ├── middleware/
│           │   ├── dto/
│           │   ├── enums/
│           │   └── interfaces/
│           ├── config/
│           ├── database/
│           │   ├── migrations/
│           │   ├── seeds/
│           │   └── entities/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── rooms/
│           │   ├── academic-data/
│           │   ├── schedules/
│           │   ├── inventory/
│           │   ├── room-loans/
│           │   ├── item-loans/
│           │   ├── schedule-alternatives/
│           │   ├── schedule-change-requests/
│           │   ├── notifications/
│           │   └── reports/
│           ├── realtime/
│           ├── scheduled-jobs/
│           └── main.ts
├── docs/
│   ├── IMPLEMENTATION_PLAN_WEB.md
│   ├── FRONTEND_TECHNICAL_DESIGN.md
│   ├── BACKEND_TECHNICAL_DESIGN.md
│   ├── API_CONTRACT.yaml
│   ├── DATABASE_ERD.md
│   ├── ADR/
│   ├── test-cases/
│   └── release-notes/
├── .github/
│   └── workflows/
├── .gitignore
└── README.md
```

Struktur final mengikuti kondisi repository aktual. Antigravity tidak boleh memindahkan atau menghapus proyek desktop hanya untuk menyesuaikan contoh ini.

## 14. Rencana Implementasi Mengikuti SOP Pustekhan ITB

SOP Pustekhan menetapkan 10 langkah berurutan dari detailed engineering hingga production. Untuk proyek migrasi desktop ke web, tambahkan **Phase 0 — Audit Desktop & Data** sebelum 10 langkah tersebut. Setiap tahap memiliki output dan gate; jangan melewati tahap yang belum diterima.

### Phase 0 — Audit versi desktop dan repository

**Tujuan:** menjadikan aplikasi desktop sebagai sumber baseline yang dapat diperiksa.

**Pekerjaan:**

- periksa struktur repository dan branch Git;
- identifikasi framework, versi Java, cara build, dan cara menjalankan desktop;
- identifikasi database yang benar-benar digunakan dan lokasi file database;
- inventarisasi semua halaman, role, tombol, validasi, status, dan alur bisnis desktop;
- jalankan aplikasi desktop dan catat fitur yang berfungsi serta bug yang masih ada;
- baca seluruh skema database dan contoh data tanpa mengubah database sumber;
- buat feature parity matrix: fitur desktop, status aktual, perilaku, dan target web;
- identifikasi laporan/export, file attachment, notifikasi, dan kebutuhan yang belum digunakan;
- tentukan apakah desktop dihentikan atau akan menjadi client tambahan ke API yang sama.

**Deliverables:**

- `docs/DESKTOP_AS_BUILT_AUDIT.md`;
- `docs/FEATURE_PARITY_MATRIX.md`;
- salinan backup database desktop;
- inventaris tabel dan relasi aktual;
- daftar asumsi dan open decisions;
- laporan baseline build/test desktop.

**Exit criteria:** tim dapat menunjukkan fitur desktop yang nyata, sumber data yang digunakan, serta keputusan awal migrasi tanpa mengubah data sumber.

### Step 1 — Detailed Engineering & Design

**Tujuan:** menetapkan rancangan teknis sebelum implementasi.

**Pekerjaan:**

- tetapkan arsitektur React–NestJS–PostgreSQL;
- buat arsitektur diagram dan alur data;
- susun ERD konseptual lalu final berdasarkan audit desktop;
- buat daftar modul dan matriks akses Admin/User;
- definisikan aturan bisnis, status transaksi, conflict checker, dan algorithm schedule search;
- tetapkan strategi data migration desktop → PostgreSQL;
- definisikan API contract awal, pagination, response wrapper, error response, dan auth;
- buat threat/risk register dan environment plan;
- catat setiap penyimpangan dari standar sebagai ADR dengan alasan.

**Deliverables:** `docs/WEB_ENGINEERING_DESIGN.md`, `docs/DATABASE_ERD.md`, `docs/ACCESS_MATRIX.md`, `docs/ADR/`, dan rencana migration.

**Exit criteria:** ERD, scope P0/P1, aturan bisnis, permission matrix, dan arsitektur disetujui stakeholder/pembimbing.

### Step 2 — Frontend Mockup

**Tujuan:** memvalidasi rancangan antarmuka sebelum frontend fungsional dibuat.

**Pekerjaan:**

- buat wireframe dan high-fidelity mockup untuk login, dashboard, jadwal, ruangan, inventaris, peminjaman, alternatif jadwal, approval, dan laporan;
- definisikan design tokens: warna, typography, spacing, grid, responsive breakpoints;
- tentukan navigasi terpisah berdasarkan Admin/User;
- definisikan empty/loading/error/success state;
- validasi semua alur inti bersama pemilik produk/pengguna perwakilan.

**Deliverables:** wireframe, high-fidelity mockup, style guide, component inventory, dan approval mockup.

**Exit criteria:** tidak ada alur inti yang belum memiliki rancangan layar dan navigasi sudah disetujui.

### Step 3 — Frontend Versi Awal dengan Mock Data

**Tujuan:** membuat frontend berjalan tanpa menunggu backend.

**Pekerjaan:**

- setup Vite + React + TypeScript;
- pasang Tailwind CSS dan konfigurasi Ant Design/MUI X Data Grid;
- setup `createHashRouter`, layout, navigation, route guard sementara, dan lazy route;
- bangun komponen reusable, form, table/grid, dialog, badge status, dan notification;
- implementasikan seluruh halaman prioritas dengan mock data terisolasi;
- pastikan responsivitas serta loading/empty/error state terlihat;
- siapkan Axios instance dan TanStack Query provider, tetapi jangan mengklaim integrasi backend sudah selesai.

**Deliverables:** frontend dapat dijalankan, seluruh route mock dapat diklik, komponen UI dan repo frontend terstruktur.

**Exit criteria:** mockup sudah diterjemahkan menjadi UI yang berjalan dan lolos review visual dasar.

### Step 4 — Backend & Frontend Contract

**Tujuan:** membekukan kesepakatan integrasi FE–BE.

**Pekerjaan:**

- definisikan endpoint, method, query params, request payload, response payload, status code, dan auth;
- dokumentasikan OpenAPI/Swagger atau Postman Collection;
- tetapkan interface `IResponseEntity<T>` dan `ImetaPagination`;
- definisikan error wrapper dengan path;
- tetapkan enum status dan transisi yang sah;
- sepakati format tanggal/waktu dan timezone;
- buat mock server berdasarkan API contract;
- frontend mengganti mock lokal dengan mock server untuk pengujian integrasi kontrak;
- setiap perubahan contract harus direview FE dan BE serta memperbarui dokumentasi.

**Deliverables:** `docs/API_CONTRACT.yaml` atau Postman Collection, mock server, contoh payload, dan daftar contract test.

**Exit criteria:** frontend dan backend menyetujui contract yang sama; field dan status tidak ditentukan sepihak oleh salah satu layer.

### Step 5 — Backend Implementation

**Urutan pengerjaan yang disarankan:**

1. Setup NestJS, TypeScript, config, environment validation, logger, CORS, rate limiter, filter, dan interceptor.
2. Setup PostgreSQL, TypeORM, entities, migrations, seed, dan connection health check.
3. Implementasi auth: login, JWT, refresh rotation, logout, password hash, Passport strategy.
4. Implementasi Guards dan permission matrix.
5. Implementasi master data: users, rooms, academic terms, courses, lecturers, class groups, schedules.
6. Implementasi inventory dan inventory movement.
7. Implementasi room loan request dan approval dengan transaction.
8. Implementasi item loan, handover, return, dan stok transaction.
9. Implementasi conflict checker dan alternative schedule search.
10. Implementasi schedule change request dan approval final.
11. Implementasi notifications, Socket.IO/SSE sesuai keputusan desain, serta REST fallback.
12. Implementasi reports, pagination, filter, dan scheduled jobs yang dibutuhkan.
13. Implementasi migration/import data desktop dan uji rekonsiliasi.

**Aturan implementasi:**

- controller tipis; business rule berada di service;
- repository mengurus akses data;
- semua input eksternal divalidasi melalui DTO;
- semua query memakai TypeORM parameterized API/QueryBuilder, bukan string SQL dari input pengguna;
- operasi lintas tabel menggunakan transaction;
- semua endpoint list memiliki pagination;
- setiap module/service penting memiliki Jest unit test;
- jangan menyimpan secret/kredensial di repository;
- jangan mengubah database sumber desktop selama import/test.

**Deliverables:** backend endpoints sesuai contract, migrations, unit/integration tests, data seed yang aman untuk development, dan laporan migration.

**Exit criteria:** endpoint P0 berjalan, unit test module lulus, contract dipenuhi, dan migration staging tervalidasi.

### Step 6 — Functional Test

**Tujuan:** menguji fungsi secara terpisah dan menutup bug sebelum skenario end-to-end.

Contoh test case minimum:

| Area | Kasus uji |
|---|---|
| Auth | login benar/salah, token expired, refresh rotation, logout, user nonaktif |
| Authorization | User memanggil endpoint Admin; akses data pengajuan user lain |
| Room | CRUD valid, kapasitas tidak valid, ruangan nonaktif, filter dan pagination |
| Schedule | jadwal valid, durasi tidak valid, jadwal overlap, perubahan periode |
| Inventory | stok cukup, stok habis, kuantitas melebihi stok, pengembalian parsial bila diizinkan |
| Room loan | request valid, conflict, cancel, reject, approve, approval bersamaan |
| Alternative schedule | kandidat valid, dosen bentrok, kelas bentrok, ruangan penuh, tidak ada kandidat |
| API contract | success wrapper, pagination meta, error wrapper, validation error, status code |
| Realtime | auth handshake, event hanya ke penerima yang benar, fallback REST setelah disconnect |

**Deliverables:** test cases per fungsi, test report, issue list, bug status, dan bukti penutupan bug.

**Exit criteria:** bug blocker/critical pada fungsi P0 ditutup; seluruh hasil uji dicatat.

### Step 7 — Scenario Test / End-to-End

**Tujuan:** menguji perjalanan pengguna nyata pada staging dengan data representatif.

Skenario utama:

1. User login → melihat jadwal → mencari ruangan kosong → mengajukan peminjaman.
2. Admin login → memeriksa request → menyetujui → user melihat status terbaru.
3. User mengajukan peminjaman barang → Admin approve → serah-terima → pengembalian → stok kembali terbarui.
4. User mengisi parameter pencarian alternatif → sistem mengembalikan kandidat valid → user mengajukan perubahan → Admin approve → jadwal resmi diperbarui.
5. Dua user mengajukan ruangan yang sama pada waktu yang sama → sistem mencegah approval konflik.
6. Dua Admin mencoba approve request yang bertabrakan → hanya transaksi yang valid yang berhasil.
7. User mencoba membuka URL/API milik Admin → backend menolak.
8. Koneksi realtime terputus → halaman masih dapat membaca status terbaru melalui REST.

**Deliverables:** skenario end-to-end, staging data, laporan hasil, screenshot/bukti, dan status temuan.

**Exit criteria:** seluruh alur utama P0 berjalan dari login sampai transaksi selesai; tidak ada bug blocker.

### Step 8 — User Acceptance Test (UAT)

**Tujuan:** memastikan sistem sesuai kebutuhan pengguna, bukan hanya lolos uji teknis.

**Pekerjaan:**

- siapkan akun Admin dan User uji;
- siapkan data ruangan, dosen, kelas, mata kuliah, inventaris, dan request uji;
- minta perwakilan calon pengguna menjalankan use case yang disepakati;
- kumpulkan feedback dan klasifikasikan menjadi blocker, perlu sebelum rilis, atau backlog;
- dokumentasikan hasil dan persetujuan penerimaan.

**Deliverables:** UAT test cases, feedback list, daftar keputusan, dan acceptance sign-off.

**Exit criteria:** pemilik produk/perwakilan pengguna menyatakan P0 dapat diterima atau memberi daftar syarat perbaikan yang disepakati.

### Step 9 — Vulnerability Test

**Tujuan:** memastikan keamanan aplikasi dan konfigurasi layak sebelum production.

Cakupan minimal:

- OWASP Top 10 yang relevan untuk web/API;
- autentikasi, refresh token, logout, dan session handling;
- broken access control/IDOR pada request milik user lain;
- SQL injection melalui filter/sort/search;
- XSS dan sanitasi konten input;
- CSRF sesuai strategi cookie yang digunakan;
- CORS dan security headers;
- rate limit login dan endpoint sensitif;
- validasi upload berkas jika fitur upload diaktifkan;
- secret, `.env`, dan konfigurasi production;
- dependency vulnerability scan.

**Deliverables:** hasil vulnerability scan otomatis/manual, daftar temuan severity, bukti perbaikan, dan security checklist.

**Exit criteria:** seluruh temuan severity tinggi/kritis diremediasi sebelum production; temuan lain memiliki keputusan tertulis.

### Step 10 — Production Deployment

**Tujuan:** merilis versi yang telah lolos seluruh gate ke production secara terkontrol.

**Alur berdasarkan SOP Pustekhan:**

1. Repositori GitHub menjadi sumber kebenaran; branch utama dilindungi dan perubahan melalui Pull Request.
2. Developer menyiapkan GitHub Actions workflow.
3. Developer membuat semantic version tag pada commit yang stabil. Tag menjadi pemicu pipeline release; artifact production tidak diambil dari hasil build lokal yang tidak terlacak.
4. Tag memicu workflow build, lint, test, dan packaging secara otomatis.
5. Artifact hasil build dilampirkan ke GitHub Release bersama tag, tanggal, commit, dan changelog.
6. Admin mengambil artifact dari Release dan melakukan deployment melalui Dr Octopus jika alat tersebut tersedia/berlaku pada lingkungan target.
7. Admin memantau health endpoint, log, metrik, dan error; rollback ke versi sebelumnya disiapkan.

Jika Dr Octopus tidak tersedia untuk proyek ini, deployment tool pengganti harus disetujui admin/pengelola server dan dicatat sebagai penyesuaian SOP. Jangan mengasumsikan akses server atau membuat deployment manual tanpa izin.

**SSH access:**

- developer membuat SSH key pair;
- private key tetap rahasia dan tidak pernah dikirim ke pihak lain/repository;
- public key diserahkan kepada admin melalui kanal resmi;
- admin memverifikasi, memasang key, membatasi hak akses sesuai kebutuhan, dan mencatat audit;
- koneksi server hanya menggunakan key yang terdaftar.

**Deliverables:** GitHub Actions workflow, build log, GitHub Release artifact, changelog, deployment log, monitoring checklist, dan rollback plan.

**Exit criteria:** versi production berasal dari artifact release yang dapat ditelusuri; health check berfungsi; admin menyelesaikan monitoring intensif 24 jam pertama.

## 15. Strategi Testing

### 15.1 Frontend

Standard Stack FE menetapkan lint, format, validasi, dan performa. Rencana test tambahan yang disarankan:

- component test untuk reusable components;
- form validation test untuk React Hook Form + Zod;
- query/mutation test untuk loading, success, error, dan invalidation TanStack Query;
- route guard test untuk role Admin/User;
- responsive check pada viewport mobile, tablet, desktop;
- end-to-end browser test untuk use case utama.

Tool test frontend yang belum ditentukan di Standard Stack harus disepakati tim sebelum dipasang (misalnya Vitest/React Testing Library untuk component test dan Playwright untuk E2E). Jangan menambahkan library besar tanpa kebutuhan.

### 15.2 Backend

- Jest unit test untuk service dan utilitas bisnis.
- Integration test untuk repository dan transaksi database.
- NestJS e2e test untuk endpoint, Guard, Filter, dan Interceptor.
- Test conflict checker mencakup waktu yang overlap dan waktu bersebelahan.
- Test concurrency untuk approval yang memperebutkan resource sama.
- Test migration dan rollback pada database staging/salinan.

### 15.3 Definisi status test

Gunakan status `NOT RUN`, `PASS`, `FAIL`, atau `BLOCKED`. Jangan mengubah status menjadi PASS tanpa menjalankan test dan menyimpan bukti output.

## 16. Environment dan Konfigurasi

Minimal siapkan environment terpisah:

- `development`: data dummy/seed yang tidak sensitif;
- `staging`: data representatif untuk scenario test/UAT;
- `production`: data nyata dengan secret dan akses terbatas.

Contoh variabel (nama final ditentukan pada setup):

```env
NODE_ENV=development
API_PORT=3000
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_ACCESS_SECRET=REPLACE_WITH_SECRET
JWT_REFRESH_SECRET=REPLACE_WITH_SECRET
JWT_ACCESS_TTL=...
JWT_REFRESH_TTL=...
```

Aturan:

- buat `.env.example` dengan placeholder, jangan masukkan kredensial asli;
- validasi environment saat aplikasi startup;
- jangan commit `.env`;
- gunakan secret berbeda untuk setiap environment;
- jangan log password, token, atau data sensitif;
- batasi CORS origin production ke domain frontend yang disetujui.

## 17. Security Requirements

- Password disimpan dalam bentuk hash menggunakan algoritma password hashing yang disetujui; jangan simpan plaintext.
- JWT access token berumur pendek; refresh token memakai rotasi dan dapat dicabut.
- Untuk web, pertimbangkan refresh token pada cookie `HttpOnly`, `Secure`, dan `SameSite` yang sesuai; access token dikelola secara aman dan tidak ditulis ke URL. Jika cookie digunakan, desain proteksi CSRF harus dicatat.
- Jangan meletakkan token di query string, termasuk saat koneksi Socket.IO.
- Semua endpoint sensitif memerlukan Guard dan pemeriksaan kepemilikan data.
- User hanya dapat melihat request miliknya kecuali role/permission memberi akses lain.
- Rate limit endpoint login dan endpoint sensitif.
- CORS memakai allowlist, bukan wildcard production.
- Error response tidak membocorkan stack trace, query, secret, atau path filesystem internal.
- Semua aksi approval dan perubahan data penting mencatat aktor dan waktu.
- Validasi backend tetap wajib meskipun frontend memakai Zod.

## 18. Kriteria Non-Fungsional

| Area | Target implementasi |
|---|---|
| Responsivitas | Mobile-first sesuai Frontend Standard Stack |
| Performance | Lazy load halaman; pagination server-side; query tidak menarik semua record |
| Consistency | Transaksi database untuk approval dan operasi stok/jadwal lintas tabel |
| Reliability | REST fallback untuk data terakhir ketika realtime disconnect |
| Security | JWT/Passport, Guard, DTO validation, rate limit, CORS, vulnerability gate |
| Maintainability | Feature modules, types/interfaces/enums, migration, lint/format, dokumentasi contract |
| Observability | Nest Logger, HTTP logging middleware, health endpoint, build/deploy log |
| Auditability | Riwayat approval, status history, audit log, release tag/changelog |

Target angka performa/availability belum ditentukan oleh dokumen sumber. Tetapkan bersama stakeholder setelah baseline diukur; jangan membuat SLA fiktif.

## 19. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Skema desktop tidak terdokumentasi | Migrasi data salah atau kehilangan relasi | Audit DB, backup, ERD, mapping, dan rekonsiliasi staging sebelum cutover |
| Desktop dan web menulis ke database berbeda | Informasi jadwal/stok tidak konsisten | Tetapkan satu sumber data kanonis; desktop lama dihentikan atau menjadi API client |
| Perilaku jadwal berulang tidak jelas | Alternatif jadwal salah | Verifikasi aturan satu pertemuan vs sisa semester pada Phase 0 |
| Jadwal bentrok akibat approval paralel | Ruangan/dosen/kelas terpakai ganda | Recheck di transaction, locking/constraint, concurrency test |
| Stok negatif atau double issue | Inventaris tidak valid | Inventory ledger, transaction, recheck saat approval/serah-terima |
| Cache menampilkan ketersediaan lama | User dapat memilih slot yang sudah terisi | TTL pendek, invalidation, final check di DB |
| API contract berubah sepihak | Integrasi FE–BE rusak | OpenAPI contract, mock server, review bersama, versioning |
| Antigravity membuat terlalu banyak fitur sekaligus | Sulit diuji dan banyak regression | Kerjakan per phase/milestone dengan exit criteria |
| Credential atau secret masuk Git | Risiko akses tidak sah | `.env.example`, secret manager/environment, review repository |
| Server deployment belum jelas | Rilis tertunda | Konfirmasi admin dan deployment target sebelum Step 10 |

## 20. Definition of Done (DoD)

Sebuah modul hanya boleh dianggap selesai jika:

- [ ] sesuai requirement dan feature parity yang disetujui;
- [ ] role dan kepemilikan data diperiksa pada backend;
- [ ] frontend memiliki loading, empty, error, success, dan validation state;
- [ ] request/response sesuai API contract;
- [ ] tidak ada business rule kritis yang hanya berada di frontend;
- [ ] operasi lintas tabel memakai transaction yang sesuai;
- [ ] pagination diterapkan pada endpoint list;
- [ ] unit/integration test yang relevan telah dijalankan;
- [ ] lint dan formatter berjalan tanpa error yang belum disepakati;
- [ ] dokumentasi teknis diperbarui;
- [ ] hasil test dan bukti dicatat; status yang tidak diuji tetap NOT RUN.

## 21. Instruksi Kerja untuk Antigravity

### 21.1 File yang harus tersedia di root workspace

Letakkan file berikut agar Antigravity dapat membacanya:

```text
project-root/
├── IMPLEMENTATION_PLAN_WEB.md
├── Frontend_Web_Development_Standard_Stack_LSKK_v1_0.pdf
├── Backend_Development_Standard_Stack_LSKK_v1_0.pdf
├── Standar_Arsitektur_Sistem_LSKK_v1_1.pdf
├── Standar_Kerja_Sistem_Development_Deployment_Pustekhan_ITB.pdf
├── desktop/                         # jika source desktop berada dalam repository
└── ...
```

Jika nama file aktual berbeda, sesuaikan path instruksi Antigravity. Jangan menyalin kredensial, database production, atau private key ke workspace.

### 21.2 Prompt utama untuk Antigravity

Salin prompt di bawah setelah dokumen dan source desktop yang relevan tersedia di workspace.

```text
Anda bertindak sebagai software engineering agent untuk mengembangkan versi web dari Campus Facility & Schedule Manager.

BACA TERLEBIH DAHULU:
1. IMPLEMENTATION_PLAN_WEB.md
2. Frontend_Web_Development_Standard_Stack_LSKK_v1_0.pdf
3. Backend_Development_Standard_Stack_LSKK_v1_0.pdf
4. Standar_Arsitektur_Sistem_LSKK_v1_1.pdf
5. Standar_Kerja_Sistem_Development_Deployment_Pustekhan_ITB.pdf
6. Source code dan database aplikasi desktop yang telah selesai, jika tersedia dalam workspace.

PRIORITAS SUMBER KEBENARAN:
- Source desktop dan hasil pengujian aktual menjadi baseline perilaku fitur yang sudah berjalan.
- Standard Stack LSKK menentukan teknologi frontend/backend.
- Standar Arsitektur LSKK menentukan pemisahan layer, jalur data, database, response contract, serta kapan worker/broker dibutuhkan.
- SOP Pustekhan menentukan urutan Design, Build, Test, dan Deploy.
- IMPLEMENTATION_PLAN_WEB.md merangkum keputusan dan tahapan proyek web.
Jika ada konflik antar dokumen atau kode, jangan menebak. Catat conflict, dampak, opsi, dan keputusan yang dibutuhkan dalam docs/OPEN_DECISIONS.md.

ATURAN UTAMA:
1. Mulai dari Phase 0 (audit), bukan langsung menulis fitur.
2. Audit repository, source desktop, database, fitur aktual, role, aturan bisnis, build, dan test.
3. Jangan menghapus, memindahkan, atau menulis ulang source desktop yang sudah selesai.
4. Jangan menebak skema database desktop. Periksa kode dan database aktual terlebih dahulu.
5. Pertahankan satu sumber data kanonis. Jangan membuat desktop dan web menulis ke database berbeda tanpa mekanisme yang disetujui.
6. Frontend wajib TypeScript + React Functional Components + Vite + Tailwind + Ant Design + MUI X Data Grid + Axios + TanStack Query + Context/Zustand + React Router DOM createHashRouter + React Hook Form + Zod.
7. Backend wajib TypeScript + NestJS + PostgreSQL/TypeORM, DTO validation class-transformer/class-validator, JWT/Passport, Guards, Nest Cache Manager, Nest Logger, HTTP logging middleware, global Exception Filter, Response Interceptor, rate limiter, CORS, dan Jest sesuai dokumen standar.
8. Gunakan type/interface/enum. Hindari any. Jangan menonaktifkan lint rule tanpa alasan tertulis.
9. Semua input manusia masuk lewat REST API. Frontend tidak boleh mengakses database langsung.
10. Gunakan response wrapper IResponseEntity<T> dan pagination meta persis sesuai kontrak.
11. Setiap endpoint list harus memiliki pagination, dan setiap endpoint sensitif harus memiliki authorization di backend.
12. Approval peminjaman, perubahan jadwal, dan perubahan stok harus memvalidasi ulang kondisi terkini di dalam transaksi.
13. Pencarian alternatif jadwal harus memeriksa konflik kelas, dosen, ruangan, durasi, kapasitas, semester, dan booking yang relevan. Hard constraints tidak boleh dikalahkan oleh preference/ranking.
14. Jangan menambahkan MongoDB, MQTT, RabbitMQ, Worker Go, atau service lain tanpa use case yang dibuktikan dan ADR yang disetujui.
15. Cache tidak boleh menjadi sumber kebenaran ketersediaan ruangan atau stok.
16. Socket.IO harus memakai authentication handshake, bukan token di query string. REST fallback harus tetap tersedia untuk membaca state terakhir.
17. Jangan menyimpan secret di source code. Buat .env.example dengan placeholder.
18. Jangan mengklaim build/test berhasil kecuali command benar-benar dijalankan dan outputnya diperiksa.

METODE KERJA:
- Kerjakan satu Phase/SOP step dalam satu waktu.
- Sebelum coding, tulis rencana file yang akan dibuat/diubah.
- Setelah perubahan, jalankan lint, build, dan test yang relevan.
- Jangan lanjut ke gate berikutnya sebelum exit criteria tahap saat ini terpenuhi.
- Gunakan mock data hanya pada Phase 3 dan mock server sesuai API contract pada Phase 4; jangan jadikan mock sebagai data final.
- Setiap perubahan API harus memperbarui OpenAPI/contract dan diberitahukan ke frontend.
- Simpan keputusan arsitektur dalam docs/ADR/ dan pekerjaan yang belum pasti dalam docs/OPEN_DECISIONS.md.

MULAI SEKARANG:
Kerjakan Phase 0 saja. Jangan mulai implementasi fitur web sampai audit selesai. Buat:
- docs/DESKTOP_AS_BUILT_AUDIT.md
- docs/FEATURE_PARITY_MATRIX.md
- docs/DATABASE_SOURCE_AUDIT.md
- docs/OPEN_DECISIONS.md
- docs/PHASE_0_REPORT.md

Laporan Phase 0 harus memuat:
1. struktur repository aktual;
2. teknologi dan command build/test desktop;
3. daftar fitur desktop yang benar-benar berjalan;
4. role dan hak akses aktual;
5. database dan skema aktual;
6. aturan jadwal dan status transaksi aktual;
7. data yang dapat/tidak dapat dimigrasikan;
8. perbedaan terhadap rencana web;
9. risiko dan keputusan yang harus disetujui;
10. rekomendasi urutan Phase 1.

Jika source desktop atau database tidak tersedia, laporkan blocker tersebut secara eksplisit. Jangan mengarang hasil audit. Tetap selesaikan bagian repository dan dokumen yang dapat diverifikasi.
```

### 21.3 Prompt lanjutan setelah Phase 0 disetujui

```text
Phase 0 sudah direview. Lanjutkan hanya ke Step 1 — Detailed Engineering & Design sesuai IMPLEMENTATION_PLAN_WEB.md dan temuan docs/PHASE_0_REPORT.md.

Perbarui ERD, scope P0/P1, API contract awal, permission matrix, jadwal berulang/pengecualian, strategi migrasi, serta ADR. Jangan mulai implementasi fitur sebelum dokumen desain disetujui. Setelah selesai, laporkan deliverables dan open decisions.
```

## 22. Hal yang Wajib Diputuskan Sebelum Coding Fitur

| Keputusan | Default sementara | Mengapa perlu dipastikan |
|---|---|---|
| Apakah desktop tetap dipakai? | Web menjadi aplikasi utama; desktop tidak lagi menulis ke SQLite sendiri | Menentukan strategi satu sumber data |
| Database desktop aktual | Audit dulu; SQLite hanya jika benar-benar ditemukan | Menentukan migrasi dan mapping |
| Perubahan jadwal | Ikuti perilaku desktop yang teruji | Menentukan recurrence dan exception model |
| Siapa berhak menyetujui perubahan jadwal? | Admin sesuai model desktop saat ini | Bisa jadi kewenangan akademik berbeda dari admin aplikasi |
| Sumber data ketersediaan dosen | Data yang dikelola Admin atau sumber akademik resmi | Tanpa data ini, sistem tidak bisa menjamin dosen tersedia |
| Aturan kalender libur | Kalender akademik yang disetujui | Mencegah rekomendasi pada hari yang tidak valid |
| Satuan durasi mata kuliah | Menit, berdasarkan data akademik | Mencegah konversi durasi yang tidak konsisten |
| Apakah ada lampiran? | Tidak di P0 kecuali desktop sudah menggunakan | Menentukan kebutuhan object storage |
| Deployment target | Konfirmasi admin/pengelola server | Menentukan workflow dan credential/SSH yang sah |
| Realtime | Event operasional yang benar-benar dibutuhkan | Menentukan penggunaan Socket.IO/SSE tanpa membuat kompleksitas sia-sia |

## 23. Release Checklist

### Design readiness

- [ ] Desktop audit dan feature parity selesai.
- [ ] Scope P0/P1 disetujui.
- [ ] Arsitektur dan ADR disetujui.
- [ ] ERD dan data migration plan disetujui.
- [ ] Mockup dan style guide disetujui.
- [ ] API contract dan permission matrix disetujui.

### Build readiness

- [ ] Frontend P0 memakai data API sesuai contract.
- [ ] Backend endpoint P0 selesai dan diuji.
- [ ] Migration dan seed script terdokumentasi.
- [ ] Konflik jadwal dan approval transaksional sudah diuji.
- [ ] Tidak ada mock data yang digunakan untuk proses production.

### Test readiness

- [ ] Functional test selesai.
- [ ] Scenario test selesai di staging.
- [ ] UAT diterima.
- [ ] Vulnerability test selesai.
- [ ] Semua temuan severity tinggi/kritis ditutup.

### Deploy readiness

- [ ] Branch utama terlindungi dan PR telah direview.
- [ ] GitHub Actions berhasil.
- [ ] Semantic version tag dan release artifact tersedia.
- [ ] Database backup dan migration plan siap.
- [ ] Deployment disetujui admin.
- [ ] SSH key pair terdaftar sesuai SOP bila diperlukan.
- [ ] Health check, monitoring, dan rollback plan siap.
- [ ] Changelog dan release notes tersedia.

---

## 24. Catatan Akhir

Fokus proyek web adalah memindahkan pengalaman aplikasi desktop ke arsitektur web standar LSKK tanpa menggandakan sumber data atau mengubah aturan bisnis yang sudah benar. Implementasi harus dimulai dari audit desktop, dilanjutkan desain dan contract, baru kemudian build, test, UAT, vulnerability test, dan deployment.

Antigravity digunakan sebagai engineering agent yang bekerja berdasarkan dokumen, source code, API contract, dan hasil test. Agent tidak boleh melewati tahap audit, menciptakan data/schema yang tidak ada, atau melaporkan status selesai tanpa bukti yang dapat diperiksa.
