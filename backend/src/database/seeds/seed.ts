import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/user.entity';
import { AcademicTerm, Course, ClassGroup, Lecturer, LecturerAvailability } from '../entities/academic.entity';
import { Room } from '../entities/room.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { Schedule } from '../entities/schedule.entity';
import * as bcrypt from 'bcrypt';

export async function runSeeder() {
  console.log('--- Memulai Seeding Database FasiLink ---');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const termRepo = AppDataSource.getRepository(AcademicTerm);
  const roomRepo = AppDataSource.getRepository(Room);
  const itemRepo = AppDataSource.getRepository(InventoryItem);
  const courseRepo = AppDataSource.getRepository(Course);
  const classRepo = AppDataSource.getRepository(ClassGroup);
  const lecturerRepo = AppDataSource.getRepository(Lecturer);
  const availRepo = AppDataSource.getRepository(LecturerAvailability);
  const scheduleRepo = AppDataSource.getRepository(Schedule);

  // 1. Seed Users
  const adminCount = await userRepo.count({ where: { username: 'admin' } });
  if (adminCount === 0) {
    const adminPass = await bcrypt.hash('admin123', 10);
    const userPass = await bcrypt.hash('user123', 10);
    await userRepo.save([
      userRepo.create({
        fullName: 'Administrator Kampus',
        username: 'admin',
        passwordHash: adminPass,
        role: UserRole.ADMIN,
      }),
      userRepo.create({
        fullName: 'Mahasiswa Pengguna',
        username: 'user',
        passwordHash: userPass,
        role: UserRole.USER,
      }),
    ]);
    console.log('✓ Users admin & user seeded.');
  }

  // 2. Seed Academic Term
  let term = await termRepo.findOne({ where: { termName: 'Semester Ganjil 2026/2027' } });
  if (!term) {
    term = await termRepo.save(
      termRepo.create({
        termName: 'Semester Ganjil 2026/2027',
        startDate: '2026-09-01',
        endDate: '2027-01-31',
        isActive: true,
      }),
    );
    console.log('✓ Academic term seeded.');
  }

  // 3. Seed Rooms
  const roomCount = await roomRepo.count();
  if (roomCount === 0) {
    await roomRepo.save([
      roomRepo.create({
        roomCode: 'R101',
        roomName: 'Ruang Teori 101',
        building: 'Gedung Kuliah Bersama A',
        floor: 1,
        capacity: 40,
        description: 'Dilengkapi AC, Proyektor, dan Whiteboard',
      }),
      roomRepo.create({
        roomCode: 'R102',
        roomName: 'Ruang Teori 102',
        building: 'Gedung Kuliah Bersama A',
        floor: 1,
        capacity: 35,
        description: 'Dilengkapi AC dan Whiteboard',
      }),
      roomRepo.create({
        roomCode: 'LAB-KOM',
        roomName: 'Laboratorium Komputer Terpadu',
        building: 'Gedung Sains & Teknologi',
        floor: 2,
        capacity: 45,
        description: '45 Unit PC Workstation + LAN Gigabit',
      }),
      roomRepo.create({
        roomCode: 'AULA-UTAMA',
        roomName: 'Auditorium Utama Kampus',
        building: 'Gedung Rektorat',
        floor: 3,
        capacity: 250,
        description: 'Panggung representatif, Sound System, 2 Proyektor Besar',
      }),
    ]);
    console.log('✓ Rooms seeded.');
  }

  // 4. Seed Inventory Items
  const itemCount = await itemRepo.count();
  if (itemCount === 0) {
    await itemRepo.save([
      itemRepo.create({
        itemCode: 'PRJ-01',
        itemName: 'Proyektor Epson EB-X51',
        totalQuantity: 5,
        conditionNotes: 'Semua berfungsi baik dengan kabel lengkap',
      }),
      itemRepo.create({
        itemCode: 'HDMI-01',
        itemName: 'Kabel HDMI 10 Meter',
        totalQuantity: 10,
        conditionNotes: 'Kondisi baik di dalam tas aksesoris',
      }),
      itemRepo.create({
        itemCode: 'SPK-01',
        itemName: 'Sound System Portable Wireless',
        totalQuantity: 3,
        conditionNotes: 'Baterai sehat, siap pakai seminar/kegiatan',
      }),
      itemRepo.create({
        itemCode: 'PTR-01',
        itemName: 'Laser Pointer Wireless Presenter',
        totalQuantity: 8,
        conditionNotes: 'Normal, baterai baru terisi',
      }),
    ]);
    console.log('✓ Inventory items seeded.');
  }

  // 5. Seed Courses, Lecturers, Class Groups, and Schedules
  let course1 = await courseRepo.findOne({ where: { courseCode: 'IF2101' } });
  if (!course1) {
    course1 = await courseRepo.save(
      courseRepo.create({
        courseCode: 'IF2101',
        courseName: 'Pemrograman Berorientasi Objek',
        sks: 3,
        isActive: true,
      }),
    );
  }

  let course2 = await courseRepo.findOne({ where: { courseCode: 'IF2102' } });
  if (!course2) {
    course2 = await courseRepo.save(
      courseRepo.create({
        courseCode: 'IF2102',
        courseName: 'Basis Data Terdistribusi',
        sks: 3,
        isActive: true,
      }),
    );
  }

  let lecturer1 = await lecturerRepo.findOne({ where: { lecturerCode: 'DOS-001' } });
  if (!lecturer1) {
    lecturer1 = await lecturerRepo.save(
      lecturerRepo.create({
        lecturerCode: 'DOS-001',
        fullName: 'Dr. Hendra Wijaya, S.T., M.T.',
        email: 'hendra.wijaya@campus.ac.id',
        phoneNumber: '081234567890',
        isActive: true,
      }),
    );
  }

  let lecturer2 = await lecturerRepo.findOne({ where: { lecturerCode: 'DOS-002' } });
  if (!lecturer2) {
    lecturer2 = await lecturerRepo.save(
      lecturerRepo.create({
        lecturerCode: 'DOS-002',
        fullName: 'Prof. Dr. Ir. Siti Aminah, M.Sc.',
        email: 'siti.aminah@campus.ac.id',
        phoneNumber: '081298765432',
        isActive: true,
      }),
    );
  }

  // Seed Lecturer Availability
  const availCount = await availRepo.count();
  if (availCount === 0 && term) {
    await availRepo.save([
      // Dosen 1 (Hendra): Senin s.d. Jumat 07:30 - 17:00
      ...[1, 2, 3, 4, 5].map((d) =>
        availRepo.create({
          lecturerId: lecturer1.id,
          termId: term.id,
          dayOfWeek: d,
          startTime: '07:30:00',
          endTime: '17:00:00',
          notes: 'Jam kerja reguler',
        }),
      ),
      // Dosen 2 (Siti): Senin s.d. Jumat 08:00 - 16:00
      ...[1, 2, 3, 4, 5].map((d) =>
        availRepo.create({
          lecturerId: lecturer2.id,
          termId: term.id,
          dayOfWeek: d,
          startTime: '08:00:00',
          endTime: '16:00:00',
          notes: 'Tersedia mengajar',
        }),
      ),
    ]);
    console.log('✓ Lecturer availability windows seeded.');
  }

  let classGroup1 = await classRepo.findOne({ where: { classCode: 'IF-3A' } });
  if (!classGroup1) {
    classGroup1 = await classRepo.save(
      classRepo.create({
        studyProgram: 'Teknik Informatika',
        cohortYear: 2024,
        classCode: 'IF-3A',
        studentCount: 35,
        isActive: true,
      }),
    );
  }

  let classGroup2 = await classRepo.findOne({ where: { classCode: 'IF-3B' } });
  if (!classGroup2) {
    classGroup2 = await classRepo.save(
      classRepo.create({
        studyProgram: 'Teknik Informatika',
        cohortYear: 2024,
        classCode: 'IF-3B',
        studentCount: 38,
        isActive: true,
      }),
    );
  }

  // Seed Schedules
  const scheduleCount = await scheduleRepo.count();
  if (scheduleCount === 0 && term) {
    const rooms = await roomRepo.find();
    const r101 = rooms.find((r) => r.roomCode === 'R101') || rooms[0];
    const labKom = rooms.find((r) => r.roomCode === 'LAB-KOM') || rooms[1];

    await scheduleRepo.save([
      scheduleRepo.create({
        termId: term.id,
        courseId: course1.id,
        classGroupId: classGroup1.id,
        lecturerId: lecturer1.id,
        roomId: r101.id,
        dayOfWeek: 1, // Senin
        startTime: '08:00:00',
        endTime: '10:30:00',
        isActive: true,
      }),
      scheduleRepo.create({
        termId: term.id,
        courseId: course2.id,
        classGroupId: classGroup2.id,
        lecturerId: lecturer2.id,
        roomId: labKom.id,
        dayOfWeek: 2, // Selasa
        startTime: '10:00:00',
        endTime: '12:30:00',
        isActive: true,
      }),
    ]);
    console.log('✓ Academic schedules seeded.');
  }

  await AppDataSource.destroy();
  console.log('--- Seeding Selesai ---');
}

if (require.main === module) {
  runSeeder().catch((err) => {
    console.error('Gagal menjalankan seeder:', err);
    process.exit(1);
  });
}

