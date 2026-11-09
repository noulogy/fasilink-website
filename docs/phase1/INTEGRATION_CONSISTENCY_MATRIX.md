# INTEGRATION CONSISTENCY & TRACEABILITY MATRIX
**Proyek:** Campus Facility & Schedule Manager (FasiLink — Web Application)  
**Dokumen:** Phase 1 — Integration & Verification Matrix  
**Status:** Complete  
**Tanggal:** 4 November 2026  

---

## 1. Pemetaan Konsistensi Nama Entitas, Field & Status (Desktop → DB → API → Frontend)

Untuk mencegah konflik integrasi (*drift*) antara lapisan Database PostgreSQL, NestJS Backend, dan React Frontend, tabel berikut menjadi acuan kanonis tunggal:

| Domain / Objek | Entitas Java Desktop | Tabel PostgreSQL 16 | TypeScript / TypeORM Entity | Status Enums yang Sah | Frontend Component & Route |
|---|---|---|---|---|---|
| **Pengguna** | `User.java` | `users` | `User` | `Role: 'ADMIN', 'USER'` | `LoginForm`, `#/login` |
| **Ruangan** | `Room.java` | `rooms` | `Room` | `isActive: boolean` | `RoomList`, `#/rooms` |
| **Inventaris** | `InventoryItem.java` | `inventory_items` | `InventoryItem` | `isActive: boolean` | `InventoryCatalog`, `#/inventory` |
| **Jadwal Kuliah**| `Schedule.java` | `schedules` | `Schedule` | `isActive: boolean`, `dayOfWeek: 1..7` | `ScheduleCalendar`, `#/schedules` |
| **Pinjam Ruangan**| `RoomBookingRequest.java` | `room_booking_requests` | `RoomBookingRequest` | `BookingStatus: 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'` | `RoomBookingForm`, `#/room-bookings/new` |
| **Pinjam Barang**| `InventoryLoanRequest.java`| `inventory_loan_requests`| `InventoryLoanRequest` | `LoanStatus: 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'HANDED_OVER', 'RETURNED'` | `InventoryLoanForm`, `#/inventory-loans/new` |
| **Ubah Jadwal** | `ScheduleChangeRequest.java`| `schedule_change_requests`| `ScheduleChangeRequest` | `ChangeStatus: 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'` | `AlternativeSearchPage`, `#/schedules/alternatives` |

---

## 2. Verifikasi Konsistensi Bisnis

1. **Format Waktu dan Tanggal:**
   - Database PostgreSQL: `DATE` dan `TIME WITHOUT TIME ZONE`.
   - API JSON Payload: format string ISO `YYYY-MM-DD` dan `HH:mm`.
   - Zod Schema di Frontend: Regex `/^([01]\d|2[0-3]):[0-5]\d$/` untuk jam dan format date string untuk tanggal.
2. **Kalkulasi Stok Tersedia:**
   - Formula: $\text{stok\_tersedia} = \text{total\_quantity} - \sum_{(\text{APPROVED} + \text{HANDED\_OVER})} \text{quantity}$.
   - Formula ini diimplementasikan seragam di TypeORM Service (`InventoryService.getAvailableStock`) dan ditampilkan di tabel katalog frontend.
3. **Pencegahan Overlap Waktu Universal:**
   - Formula: $\text{start}_1 < \text{end}_2 \land \text{end}_1 > \text{start}_2$.
   - Diterapkan identik di database query indexing, NestJS conflict service, dan modal visualisasi kalender frontend.

---

## 3. Identifikasi Risiko Desain & Mitigasi Integrasi

| Potensi Risiko Desain | Tingkat Risiko | Mitigasi yang Ditetapkan pada Phase 1 |
|---|---|---|
| Perbedaan zona waktu pada `bookingDate` antara client browser dan server | Sedang | Tanggal peminjaman diperlakukan sebagai *calendar date* murni (`YYYY-MM-DD`), tidak di-*offset* oleh UTC timezone converter di client. |
| Perubahan jadwal mengubah catatan masa lalu (*retroactive bug*) | Tinggi | Ditambahkan kolom `effective_date` dan `previous_schedule_snapshot` JSONB pada `schedule_change_requests` sesuai ADR-010. |
| Inkonsistensi data master akademik | Rendah | Menggunakan *Controlled Data Import Service* dengan validasi Zod/class-validator sebelum di-*commit* ke PostgreSQL sesuai ADR-011. |

