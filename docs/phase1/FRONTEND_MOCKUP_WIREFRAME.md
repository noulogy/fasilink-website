# FRONTEND WIREFRAME, UI MOCKUP & NAVIGATION ARCHITECTURE
**Proyek:** Campus Facility & Schedule Manager (FasiLink — Web Application)  
**Dokumen:** Phase 1 — Frontend Design & Mockup Specification  
**Tech Stack:** React 18+ (Functional Components), TypeScript, Vite, Tailwind CSS, Ant Design (AntD), MUI X Data Grid  
**State & Data Fetching:** TanStack Query (Server State), Zustand (Client Session/Theme), React Hook Form + Zod  
**Routing:** React Router v6 (`createHashRouter`)  
**Status:** Approved Specification for Phase 2  
**Tanggal:** 4 November 2026  

---

## 1. Tata Letak Global & App Shell (Responsive Layout)

Kerangka antarmuka mengadopsi standar **mobile-first responsive design** dengan memanfaatkan Ant Design `Layout` dan Tailwind utility classes:

```text
+-----------------------------------------------------------------------------------------+
| [FasiLink Logo]  Semester: Ganjil 2026/2027       [Search]  (Notif)  [Admin Profile v]  |
+-------------------+---------------------------------------------------------------------+
| SIDEBAR NAV       | MAIN WORKSPACE CONTENT                                              |
|                   |                                                                     |
| - Dashboard       | Breadcrumb: Beranda > Ruangan                                       |
| - Ruangan         | ------------------------------------------------------------------- |
| - Jadwal Kuliah   | [Page Title & Action Button]                                        |
| - Cari Alternatif |                                                                     |
| - Inventaris      | [Filter Bar: Input Pencarian | Filter Gedung | Status | Reset]      |
| - Pengajuan Saya  |                                                                     |
| - Persetujuan (A) | [MUI X Data Grid / Ant Design Table]                                |
|                   | [Kolom: Kode | Nama | Gedung | Kapasitas | Status | Aksi]           |
| [Collapse Toggle] | [Pagination & Total Records: 1-10 dari 40]                          |
+-------------------+---------------------------------------------------------------------+
```

### 1.1 Navigasi Berbasis Role (Role-Adaptive Navigation)
- **Umum (Semua Role):**
  - Dashboard (`#/dashboard`)
  - Jadwal Perkuliahan (`#/schedules`)
  - Katalog Ruangan (`#/rooms`)
  - Katalog Inventaris (`#/inventory`)
  - Cari Alternatif Jadwal (`#/schedules/alternatives`)
  - Formulir Pinjam Ruangan (`#/room-bookings/new`)
  - Formulir Pinjam Barang (`#/inventory-loans/new`)
  - Pengajuan Saya (`#/my-requests`) — Terdiri dari 3 Tab: Ruangan, Barang, Jadwal
- **Khusus Admin (`role === 'ADMIN'`):**
  - Pusat Persetujuan / Approvals (`#/admin/approvals`) — Antrean Peminjaman Ruangan, Siklus Sirkulasi Barang (Approve, Handover, Return), dan Perubahan Jadwal Side-by-Side
  - Tambah / Edit Ruangan Modal
  - Tambah / Edit Jadwal Modal
  - Tambah / Edit Inventaris Modal

---

## 2. Peta Halaman & Alur Pengguna (User Journey)

### 2.1 Alur Autentikasi (`#/login`)
1. Pengguna membuka aplikasi web, jika belum ada token aktif, otomatis diarahkan ke `#/login`.
2. Halaman menampilkan:
   - Formulir login (Username & Password) dengan validasi real-time via Zod.
   - Demo Credential Quick-Fill Card (membantu penguji langsung memilih tombol "Masuk sebagai Admin" atau "Masuk sebagai User").
3. Submit login memanggil `POST /api/v1/auth/login`. Token disimpan di memory/cookie terproteksi dan Zustand `useAuthStore`.
4. Pengguna di-*redirect* ke dashboard sesuai role.

### 2.2 Alur Pencarian Alternatif Jadwal & Pengajuan Perubahan (`#/schedules/alternatives`)
1. **Langkah 1 (Pilih Jadwal Asal):**
   Pengguna memilih mata kuliah dari *dropdown* jadwal kuliah aktif miliknya/kampus. Sistem otomatis menampilkan informasi sesi asli: Hari, Jam (`08:00 - 10:30`), Ruangan, Dosen, dan Durasi (`150 menit`).
2. **Langkah 2 (Preferensi):**
   Pengguna dapat memilih filter hari yang diinginkan (Checkbox Senin s/d Sabtu) dan preferensi jam (Pagi `07:30-12:00`, Siang `12:00-16:00`, dsb).
3. **Langkah 3 (Eksekusi Pencarian):**
   Tombol "Cari Alternatif" memanggil `POST /api/v1/schedules/find-alternatives`.
4. **Langkah 4 (Tampilan Hasil Terurut):**
   Menampilkan daftar kartu rekomendasi yang telah lolos *hard constraints* dan diurutkan berdasarkan skor tertinggi:
   - Badge Skor: Misal "Skor Kecocokan: 125/145 (Sangat Direkomendasikan)".
   - Detail Usulan: Hari, Rentang Jam, Ruangan baru beserta kapasitas.
   - Tag Alasan: *“Dosen tersedia & bebas konflik”*, *“Hari sesuai preferensi”*, *“Kapasitas efisien”*.
5. **Langkah 5 (Aksi Pengajuan):**
   Pengguna menekan tombol "Ajukan Jadwal Ini", mengisi modal alasan perubahan, dan mengirim usulan ke antrean admin (`POST /api/v1/schedule-changes`).

### 2.3 Alur Persetujuan Admin (`#/admin/approvals`)
1. Halaman admin menampilkan 3 Tab transaksi:
   - **Tab 1: Peminjaman Ruangan:** Menampilkan antrean `PENDING`. Admin dapat menekan "Setujui" (sistem melakukan revalidasi otomatis) atau "Tolak" (membuka prompt alasan penolakan wajib).
   - **Tab 2: Sirkulasi Inventaris:**
     - Status `PENDING`: Tombol "Setujui" (revalidasi ketersediaan stok fisik) & "Tolak".
     - Status `APPROVED`: Tombol "Serahkan Barang" (mengubah status ke `HANDED_OVER` saat barang diambil fisik).
     - Status `HANDED_OVER`: Tombol "Catat Pengembalian" (modal input catatan kondisi barang, memulihkan stok fisik kembali ke `RETURNED`).
   - **Tab 3: Perubahan Jadwal:**
     - Menampilkan kartu komparasi visual *Side-by-Side*:
       - Kolom Kiri: **Jadwal Asal** (Hari, Jam, Ruangan lama).
       - Kolom Kanan: **Jadwal Usulan Baru** (Hari, Jam, Ruangan baru).
     - Tombol "Setujui Perubahan" mengeksekusi mutasi jadwal atomik di database dan mencatat tanggal efektif serta snapshot kondisi lama.

---

## 3. Matriks State Komponen (State Matrix Specification)

Setiap komponen data view dan formulir wajib mengimplementasikan 6 state visual secara konsisten:

| State | Tampilan Visual & Perilaku UX | Komponen AntD / Tailwind yang Digunakan |
|---|---|---|
| **Loading State** | Skeleton table atau spinning loader saat mengambil data dari REST API | AntD `<Skeleton active />` atau `<Spin size="large" />` |
| **Empty State** | Pesan informatif saat data pencarian/tabel tidak memiliki baris data | AntD `<Empty description="Tidak ada jadwal/ruangan yang cocok" />` dengan tombol aksi reset filter |
| **Error State** | Alert banner berwarna merah dengan deskripsi error dan tombol *Retry* | AntD `<Alert type="error" showIcon message="..." action={<Button>Coba Lagi</Button>} />` |
| **Validation State**| Pesan feedback di bawah input field sebelum form dikirim | `<Form.Item help="Jam mulai wajib lebih awal dari jam selesai" validateStatus="error">` |
| **Disabled State** | Tombol atau input redup (*opacity 50%*) dan cursor `not-allowed` jika user tidak memiliki hak akses atau stok 0 | `<Button disabled={availableStock === 0}>Stok Habis</Button>` |
| **Success State** | Notifikasi toast atau dialog konfirmasi sukses aksi | AntD `notification.success({ message: 'Pengajuan Berhasil Disimpan' })` |

---

## 4. Struktur Direktori Frontend Target (Phase 2)

```text
fasilink-web/frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/             # AlertBanner, LoadingSkeleton, EmptyState, RoleBadge
│   │   ├── layout/             # AppShell, Navbar, Sidebar, Breadcrumb
│   │   └── data-grid/          # Reusable MUI X Data Grid wrapper
│   ├── features/
│   │   ├── auth/               # LoginForm, useAuth, authStore
│   │   ├── dashboard/          # AdminDashboard, UserDashboard, KPICards
│   │   ├── rooms/              # RoomList, RoomAvailabilityModal, RoomFormModal
│   │   ├── schedules/          # ScheduleCalendar, ScheduleFilter, AlternativeSearchPage
│   │   ├── inventory/          # InventoryCatalog, InventoryFormModal
│   │   ├── bookings/           # RoomBookingForm, InventoryLoanForm
│   │   ├── my-requests/        # MyRequestsTabs, StatusTimeline
│   │   └── approvals/          # AdminApprovalsPage, SideBySideScheduleDiff
│   ├── hooks/                  # useDebounce, useMediaQuery
│   ├── services/               # Axios instance, apiClients per modul
│   ├── types/                  # IResponseEntity, Entity interfaces, Status enums
│   ├── routes/                 # AppRoutes, createHashRouter configuration
│   ├── App.tsx
│   └── main.tsx
```

