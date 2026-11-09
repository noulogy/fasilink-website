# ARCHITECTURE DECISION RECORDS (ADR)
## Campus Facility & Schedule Manager (FasiLink — Web Application)

**Status Proyek:** Persiapan Masuk Phase 1 (SOP Pustekhan ITB Gate 01)  
**Tanggal Terakhir Diperbarui:** 4 November 2026  
**Otoritas Persetujuan:** Product Owner / Project Owner

---

## Daftar Rekaman Keputusan (Summary Table)

| ID | Judul Keputusan | Status | Tanggal | Konteks Singkat |
|---|---|---|---|---|
| **ADR-001** | Stack Arsitektur Web (React + NestJS) | **ACCEPTED** | 04-11-2026 | Mengikuti Standar LSKK Frontend & Backend |
| **ADR-002** | PostgreSQL sebagai Database Transaksional Utama | **ACCEPTED** | 04-11-2026 | Integritas relasional dan konsistensi data |
| **ADR-003** | Penolakan Penggunaan MongoDB pada MVP | **ACCEPTED** | 04-11-2026 | Tidak ada telemetri/dokumen masif; efisiensi operasional |
| **ADR-010** | Kebijakan Perubahan Jadwal Mingguan Berulang (*Recurring*) & Perlindungan Non-Retroaktif | **ACCEPTED** | 04-11-2026 | Paritas desktop & integritas historis |
| **ADR-011** | Strategi Inisialisasi Master Data Akademik Tanpa Full CRUD pada MVP | **ACCEPTED** | 04-11-2026 | Seeding/impor terkontrol yang *extensible* untuk CRUD masa depan |

---

## Detail ADR

### ADR-002: PostgreSQL sebagai Database Transaksional Tunggal
- **Status:** **ACCEPTED**
- **Tanggal Keputusan:** 4 November 2026
- **Konteks:**  
  Standar Arsitektur Sistem LSKK v1.1 menyediakan dua opsi penyimpanan utama (PostgreSQL untuk relasional dan MongoDB untuk data dokumen/telemetri). Audit Phase 0 terhadap desktop `fasilink` membuktikan seluruh domain data (pengguna, jadwal, ruangan, inventaris, sirkulasi peminjaman, dan riwayat persetujuan) adalah data relasional yang memerlukan integritas *foreign key*, transaksi ACID, dan pencegahan *race condition*.
- **Keputusan:**  
  Menggunakan PostgreSQL 16 (melalui TypeORM) sebagai satu-satunya database transaksional untuk aplikasi web. Seluruh migrasi skema dikelola melalui TypeORM migrations tanpa fitur `synchronize` di produksi.
- **Konsekuensi:**  
  - *Positif:* Konsistensi data tinggi, integritas referensial terjamin dengan foreign keys, transaksi multi-tabel (seperti mutasi jadwal dan approval peminjaman) aman.
  - *Mitigasi:* Pemetaan tipe tanggal/waktu dari teks SQLite ke tipe native PostgreSQL (`DATE`, `TIME`, `TIMESTAMPTZ`) dilakukan secara ketat.

---

### ADR-003: Penolakan Penggunaan MongoDB pada MVP
- **Status:** **ACCEPTED**
- **Tanggal Keputusan:** 4 November 2026
- **Konteks:**  
  Sesuai *Standar Arsitektur Sistem LSKK v1.1*, pemilihan penyimpanan harus berbasis karakteristik data. FasiLink tidak memiliki sensor IoT, telemetri log perangkat frekuensi tinggi, maupun payload dokumen tidak terstruktur.
- **Keputusan:**  
  MongoDB secara eksplisit **TIDAK DIGUNAKAN** pada MVP aplikasi web. Tidak ada dependensi Mongoose atau cluster MongoDB yang akan ditambahkan ke backend NestJS.
- **Konsekuensi:**  
  - *Positif:* Menyederhanakan infrastruktur, menekan konsumsi memori/resource, meniadakan risiko inkonsistensi data antar-database (*dual-write problem*).
  - *Catatan:* Jika di kemudian hari sistem diperluas ke instrumentasi fasilitas fisik (Level 1 LSKK), keputusan ini dapat ditinjau kembali melalui ADR baru.

---

### ADR-010: Kebijakan Perubahan Jadwal Mingguan Berulang (*Recurring Mutation*) & Perlindungan Non-Retroaktif
- **Status:** **ACCEPTED**
- **Tanggal Keputusan:** 4 November 2026
- **Konteks:**  
  Hasil audit kode sumber desktop (`ScheduleChangeService` dan `ScheduleChangeRepository`) membuktikan bahwa persetujuan perubahan jadwal langsung memutasi baris jadwal pada tabel `schedules`. Product Owner menyetujui mempertahankan perilaku ini untuk versi MVP (berlaku berulang setiap minggu selama semester aktif), namun meminta agar tidak merusak data historis perkuliahan yang telah lewat.
- **Keputusan:**  
  1. Untuk MVP, usulan dan persetujuan perubahan jadwal tetap mengubah sesi mingguan resmi (*recurring mutation*).
  2. Fitur pengecualian jadwal pertemuan tunggal (*single-session exception*) ditunda setelah MVP.
  3. **Perlindungan Non-Retroaktif:** Entitas `schedule_change_requests` dan `schedules` di backend web dilengkapi pencatatan:
     - `effective_date`: tanggal mulai berlakunya jadwal baru.
     - `previous_schedule_snapshot`: snapshot JSON kondisi jadwal lama sebelum dimutasi.
     - Audit log approval tercatat permanen di riwayat persetujuan.
- **Konsekuensi:**  
  - *Positif:* Menjaga paritas fitur dengan desktop, proses bisnis sederhana dan dapat dipahami pengguna, riwayat pertemuan lampau terlindungi dari distorsi retroaktif.
  - *Negatif:* Perubahan jadwal insidental (hanya untuk 1 hari tertentu) belum dapat diakomodasi dan harus menggunakan mekanisme peminjaman ruangan reguler.

---

### ADR-011: Strategi Inisialisasi Master Data Akademik Tanpa Full CRUD pada MVP
- **Status:** **ACCEPTED**
- **Tanggal Keputusan:** 4 November 2026
- **Konteks:**  
  Master data akademik terdiri dari semester (`academic_terms`), mata kuliah (`courses`), rombel kelas (`class_groups`), dan dosen (`lecturers`). Pada aplikasi desktop, data ini tidak memiliki tampilan CRUD terpisah dan hanya diinisialisasi melalui database script. Product Owner memutuskan bahwa untuk MVP belum perlu dibuat antarmuka full CRUD untuk data tersebut guna menjaga fokus rilis, namun arsitektur backend/database harus siap mendukungnya di masa mendatang.
- **Keputusan:**  
  1. Frontend MVP tidak menyediakan halaman Full CRUD untuk master data akademik (fokus CRUD ada pada Ruangan, Jadwal, dan Inventaris).
  2. Data awal diinisialisasi melalui TypeORM Seeder / Migration terstruktur.
  3. Backend NestJS merancang entitas dan modul data akademik (`AcademicModule`) dengan pola repositori standar LSKK, sehingga jika di kemudian hari ditambahkan controller/endpoint CRUD admin, tidak memerlukan refactoring skema maupun arsitektur backend.
  4. Menyediakan *Controlled Data Import Service* (CLI / administrative seed script berbasis file JSON/CSV terstruktur) untuk memudahkan pembaruan master data akademik oleh operator secara aman.
- **Konsekuensi:**  
  - *Positif:* Mempercepat delivery MVP, menjaga kompleksitas UI tetap terfokus pada alur bisnis utama (jadwal, ruangan, inventaris, persetujuan).
  - *Negatif:* Pembaruan master data akademik pada masa MVP dilakukan melalui seed/script import terkelola oleh administrator teknis, bukan melalui tombol di UI web.

