# FASILINK WEB — DEVELOPER & OPERATOR GUIDE
**Proyek:** Campus Facility & Schedule Manager (FasiLink — Web Application)  
**Versi:** 1.0.0  
**Stack Utama:** React (TypeScript + Vite + Tailwind + Ant Design) & NestJS (PostgreSQL 16 + TypeORM)  
**Dokumen:** SOP 01 - SOP 03 Pustekhan ITB Implementation Guide  

---

## 1. Persiapan Lingkungan (Prerequisites)

1. **Node.js:** Versi 20+ LTS (terverifikasi Node.js `v24.13.0` terpasang di host).
2. **NPM / PNPM:** NPM `11.6.2`.
3. **Database:** PostgreSQL 16 (Dapat dijalankan melalui Docker atau service lokal host port 5432).

---

## 2. Cara Menjalankan Backend (NestJS API)

Masuk ke direktori backend:
```bash
cd fasilink-web/backend
```

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Konfigurasi Database (.env):**
   Pastikan variabel basis data di berkas `.env` sesuai dengan konfigurasi PostgreSQL Anda:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=fasilink_db
   JWT_SECRET=super-secret-jwt-key-for-fasilink-campus-manager-2026
   CORS_ORIGIN=http://localhost:5173
   ```
3. **Jalankan Database via Docker (Opsional jika belum ada PostgreSQL lokal):**
   ```bash
   # Di root fasilink-web
   docker compose up -d
   ```
4. **Jalankan Migrasi Skema & Seeding Data Awal:**
   ```bash
   npm run migration:run
   npm run seed
   ```
5. **Jalankan Development Server:**
   ```bash
   npm run start:dev
   ```
   - API Aktif di: `http://localhost:3000/api/v1`
   - Dokumentasi Swagger di: `http://localhost:3000/api/docs`

---

## 3. Cara Menjalankan Frontend (React + Vite)

Buka terminal baru, masuk ke direktori frontend:
```bash
cd fasilink-web/frontend
```

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Jalankan Frontend Dev Server:**
   ```bash
   npm run dev
   ```
   - Akses aplikasi di browser: `http://localhost:5173`

---

## 4. Akun Percobaan (Demo Seed)

| Role | Username | Password | Deskripsi |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Akses penuh dashboard analitik, persetujuan ruangan, sirkulasi barang, dan mutasi jadwal |
| **User** | `user` | `user123` | Akses penelusuran jadwal, form peminjaman ruangan/barang, dan algoritma pencarian alternatif |

