# REST API CONTRACT & OPENAPI SPECIFICATION
**Proyek:** Campus Facility & Schedule Manager (FasiLink — Web Application)  
**Dokumen:** Phase 1 — API Contract Specification  
**Format Kontrak:** Standar LSKK `IResponseEntity<T>`  
**Base URL:** `/api/v1`  
**Autentikasi:** Bearer JWT (`Authorization: Bearer <token>`)  
**Status:** Approved Specification for Phase 2  
**Tanggal:** 4 November 2026  

---

## 1. Standar Format Response LSKK

Semua response HTTP dari API (baik sukses maupun gagal) dibungkus menggunakan antarmuka standar:

### 1.1 Tipe Data TypeScript
```typescript
export interface IPaginationMeta {
  page: number;
  limit: number;
  totalData: number;
  totalDataPerPage: number;
  totalPages: number;
}

export interface IResponseEntity<T> {
  code: number;
  status: 'success' | 'error';
  message: string;
  data?: T;
  meta?: IPaginationMeta;
  errors?: Record<string, string[]>; // Khusus error validasi DTO
}
```

### 1.2 Contoh Format Response
#### Sukses Tunggal (HTTP 200 / 201)
```json
{
  "code": 200,
  "status": "success",
  "message": "Data ruangan berhasil diambil",
  "data": {
    "id": "1",
    "roomCode": "R101",
    "roomName": "Ruang Teori 101",
    "building": "Gedung Kuliah Bersama A",
    "floor": 1,
    "capacity": 40,
    "description": "Dilengkapi AC, Proyektor, dan Whiteboard",
    "isActive": true
  }
}
```

#### Sukses Paginated (HTTP 200)
```json
{
  "code": 200,
  "status": "success",
  "message": "Daftar inventaris berhasil diambil",
  "data": [
    {
      "id": "1",
      "itemCode": "PRJ-01",
      "itemName": "Proyektor Epson EB-X51",
      "totalQuantity": 5,
      "availableQuantity": 3,
      "conditionNotes": "Semua berfungsi baik"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalData": 1,
    "totalDataPerPage": 1,
    "totalPages": 1
  }
}
```

#### Error Validasi Input (HTTP 400 Bad Request)
```json
{
  "code": 400,
  "status": "error",
  "message": "Validasi formulir gagal",
  "errors": {
    "expectedAttendees": ["Jumlah peserta harus lebih dari 0."],
    "bookingDate": ["Tanggal peminjaman tidak boleh tanggal lampau."]
  }
}
```

#### Error Bentrok / Konflik (HTTP 409 Conflict)
```json
{
  "code": 409,
  "status": "error",
  "message": "Ruangan R101 sudah tidak tersedia pada tanggal 2026-11-10 jam 08:00 - 10:00 (bentrok dengan jadwal kuliah atau booking lain)."
}
```

---

## 2. Ringkasan Endpoint API

| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|---|---|
| **AUTH** | | | |
| `POST` | `/api/v1/auth/login` | Public | Login akun & penerbitan Access Token |
| `POST` | `/api/v1/auth/refresh` | User, Admin | Refresh access token |
| `GET` | `/api/v1/auth/me` | User, Admin | Profil pengguna login saat ini |
| `POST` | `/api/v1/auth/change-password` | User, Admin | Ubah password akun |
| `POST` | `/api/v1/auth/logout` | User, Admin | Invalidate session / client logout |
| **DASHBOARD** | | | |
| `GET` | `/api/v1/dashboard/admin` | Admin | Ringkasan statistik & KPI operasional admin |
| `GET` | `/api/v1/dashboard/user` | User, Admin | Ringkasan fasilitas cepat & status pengajuan aktif |
| **ROOMS** | | | |
| `GET` | `/api/v1/rooms` | User, Admin | Daftar ruangan (filter gedung, kapasitas, status) |
| `GET` | `/api/v1/rooms/:id` | User, Admin | Detail ruangan |
| `GET` | `/api/v1/rooms/:id/availability`| User, Admin | Cek ketersediaan ruangan pada tanggal & rentang jam |
| `POST` | `/api/v1/rooms` | Admin | Tambah ruangan baru |
| `PUT` | `/api/v1/rooms/:id` | Admin | Perbarui data ruangan |
| `DELETE`| `/api/v1/rooms/:id` | Admin | Soft-deactivate atau hard delete ruangan |
| **SCHEDULES** | | | |
| `GET` | `/api/v1/schedules` | User, Admin | Daftar jadwal kuliah mingguan (filter hari, term, room) |
| `GET` | `/api/v1/schedules/:id` | User, Admin | Detail satu jadwal kuliah |
| `POST` | `/api/v1/schedules` | Admin | Tambah jadwal perkuliahan baru (dengan conflict check) |
| `PUT` | `/api/v1/schedules/:id` | Admin | Perbarui jadwal perkuliahan |
| `DELETE`| `/api/v1/schedules/:id` | Admin | Nonaktifkan jadwal |
| **ALTERNATIVE SCHEDULE SEARCH** | | | |
| `POST` | `/api/v1/schedules/find-alternatives` | User, Admin | Algoritma pencarian alternatif slot bebas bentrok |
| **INVENTORY** | | | |
| `GET` | `/api/v1/inventory` | User, Admin | Katalog barang dengan perhitungan stok tersedia |
| `GET` | `/api/v1/inventory/:id` | User, Admin | Detail barang dan pantauan stok |
| `POST` | `/api/v1/inventory` | Admin | Tambah barang inventaris baru |
| `PUT` | `/api/v1/inventory/:id` | Admin | Perbarui data barang & total stok |
| `DELETE`| `/api/v1/inventory/:id` | Admin | Nonaktifkan / hapus barang (jika tidak sedang dipinjam) |
| **ROOM BOOKINGS** | | | |
| `GET` | `/api/v1/room-bookings/my` | User, Admin | Riwayat peminjaman ruangan milik sendiri |
| `GET` | `/api/v1/room-bookings` | Admin | Semua antrean peminjaman ruangan (filter status) |
| `POST` | `/api/v1/room-bookings` | User, Admin | Ajukan peminjaman ruangan baru (status PENDING) |
| `PATCH` | `/api/v1/room-bookings/:id/cancel` | Pemohon | Batalkan pengajuan (hanya jika PENDING) |
| `PATCH` | `/api/v1/room-bookings/:id/approve`| Admin | Setujui peminjaman (dengan validasi ulang anti-race) |
| `PATCH` | `/api/v1/room-bookings/:id/reject` | Admin | Tolak peminjaman ruangan (wajib sertakan alasan) |
| **INVENTORY LOANS** | | | |
| `GET` | `/api/v1/inventory-loans/my`| User, Admin | Riwayat peminjaman barang milik sendiri |
| `GET` | `/api/v1/inventory-loans` | Admin | Semua antrean peminjaman barang (filter status) |
| `POST` | `/api/v1/inventory-loans` | User, Admin | Ajukan peminjaman barang baru (status PENDING) |
| `PATCH` | `/api/v1/inventory-loans/:id/cancel`| Pemohon | Batalkan pengajuan barang (hanya jika PENDING) |
| `PATCH` | `/api/v1/inventory-loans/:id/approve`| Admin | Setujui peminjaman barang (dengan validasi ulang stok) |
| `PATCH` | `/api/v1/inventory-loans/:id/reject` | Admin | Tolak peminjaman barang (wajib sertakan alasan) |
| `PATCH` | `/api/v1/inventory-loans/:id/handover`| Admin | Catat serah terima fisik barang (status HANDED_OVER) |
| `PATCH` | `/api/v1/inventory-loans/:id/return` | Admin | Catat pengembalian barang & catatan kondisi fisik |
| **SCHEDULE CHANGE REQUESTS** | | | |
| `GET` | `/api/v1/schedule-changes/my`| User, Admin | Riwayat usulan perubahan jadwal milik sendiri |
| `GET` | `/api/v1/schedule-changes` | Admin | Antrean permohonan perubahan jadwal (filter status) |
| `POST` | `/api/v1/schedule-changes` | User, Admin | Ajukan perubahan jadwal resmi berdasarkan rekomendasi |
| `PATCH` | `/api/v1/schedule-changes/:id/cancel`| Pemohon | Batalkan usulan (hanya jika PENDING) |
| `PATCH` | `/api/v1/schedule-changes/:id/approve`| Admin | Setujui usulan & mutasi jadwal mingguan resmi secara atomik |
| `PATCH` | `/api/v1/schedule-changes/:id/reject` | Admin | Tolak usulan perubahan jadwal (wajib sertakan alasan) |
| **ACADEMIC DATA LOOKUP (ADR-011)** | | | |
| `GET` | `/api/v1/academic/terms` | User, Admin | Lookup semester aktif |
| `GET` | `/api/v1/academic/courses` | User, Admin | Lookup mata kuliah |
| `GET` | `/api/v1/academic/class-groups`| User, Admin | Lookup rombel kelas |
| `GET` | `/api/v1/academic/lecturers` | User, Admin | Lookup dosen |
| `POST` | `/api/v1/academic/import` | Admin | Endpoint import batch terkelola (JSON/CSV) untuk master data |

---

## 3. Detail Payload & Validasi DTO Endpoint Utama

### 3.1 `POST /api/v1/auth/login`
- **Request DTO:**
```typescript
export class LoginDto {
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Password wajib diisi' })
  @IsString()
  password: string;
}
```
- **Response Data (`data`):**
```typescript
export interface LoginResponseData {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    role: 'ADMIN' | 'USER';
    email?: string;
  };
}
```

### 3.2 `POST /api/v1/schedules/find-alternatives`
- **Request DTO:**
```typescript
export class FindAlternativeScheduleDto {
  @IsNotEmpty({ message: 'ID Jadwal asal wajib diisi' })
  @IsNumber()
  scheduleId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  preferredDays?: number[]; // Misal [1, 2, 3] = Sen, Sel, Rab

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format jam mulai harus HH:mm' })
  preferredStartTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format jam selesai harus HH:mm' })
  preferredEndTime?: string;

  @IsOptional()
  @IsNumber()
  preferredRoomId?: number;

  @IsOptional()
  @IsString()
  preferredBuilding?: string;
}
```
- **Response Data (`data`):**
```typescript
export interface AlternativeCandidateItem {
  scheduleId: number;
  dayOfWeek: number;
  dayName: string; // "Senin", "Selasa", dll
  startTime: string; // "08:00"
  endTime: string; // "10:30"
  durationMinutes: number;
  roomId: number;
  roomCode: string;
  roomName: string;
  building: string;
  roomCapacity: number;
  studentCount: number;
  score: number;
  explanation: string;
}
```

### 3.3 `POST /api/v1/room-bookings`
- **Request DTO:**
```typescript
export class CreateRoomBookingDto {
  @IsNotEmpty({ message: 'Ruangan wajib dipilih' })
  @IsNumber()
  roomId: number;

  @IsNotEmpty({ message: 'Tanggal peminjaman wajib diisi' })
  @IsDateString({}, { message: 'Format tanggal harus YYYY-MM-DD' })
  bookingDate: string;

  @IsNotEmpty({ message: 'Jam mulai wajib diisi' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format jam mulai harus HH:mm' })
  startTime: string;

  @IsNotEmpty({ message: 'Jam selesai wajib diisi' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format jam selesai harus HH:mm' })
  endTime: string;

  @IsNotEmpty({ message: 'Jumlah peserta wajib diisi' })
  @IsInt()
  @Min(1, { message: 'Estimasi jumlah peserta minimal 1 orang' })
  expectedAttendees: number;

  @IsNotEmpty({ message: 'Tujuan peminjaman ruangan wajib diisi' })
  @IsString()
  @MinLength(5, { message: 'Tujuan peminjaman minimal 5 karakter' })
  purpose: string;
}
```

### 3.4 `PATCH /api/v1/inventory-loans/:id/return`
- **Request DTO:**
```typescript
export class ReturnInventoryLoanDto {
  @IsOptional()
  @IsString()
  returnConditionNotes?: string; // Catatan kondisi fisik saat dikembalikan
}
```

---

## 4. OpenAPI / Swagger Definition File

Spesifikasi OpenAPI 3.0 dalam format YAML disimpan terpisah di `fasilink-web/docs/phase1/openapi-spec.yaml` agar dapat diimpor langsung ke Postman, Swagger UI, atau OpenAPI Generator.

