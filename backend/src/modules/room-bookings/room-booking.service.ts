import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  RoomBookingRequest,
  BookingStatus,
} from '../../database/entities/room-booking-request.entity';
import { Room } from '../../database/entities/room.entity';
import { Schedule } from '../../database/entities/schedule.entity';

@Injectable()
export class RoomBookingService {
  constructor(
    @InjectRepository(RoomBookingRequest)
    private readonly bookingRepo: Repository<RoomBookingRequest>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cek ketersediaan ruangan pada tanggal dan rentang jam tertentu.
   */
  async isRoomAvailable(roomId: string, bookingDate: string, startTime: string, endTime: string): Promise<boolean> {
    const room = await this.roomRepo.findOne({ where: { id: roomId, isActive: true } });
    if (!room) return false;

    const dateObj = new Date(bookingDate);
    // ISO Day of week: 1 = Monday, 7 = Sunday
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    // 1. Cek bentrok dengan perkuliahan mingguan aktif
    const conflictingSchedule = await this.scheduleRepo
      .createQueryBuilder('s')
      .where('s.room_id = :roomId', { roomId })
      .andWhere('s.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('s.is_active = true')
      .andWhere('s.start_time < :endTime AND s.end_time > :startTime', { startTime, endTime })
      .getCount();

    if (conflictingSchedule > 0) return false;

    // 2. Cek bentrok dengan booking ruangan yang APPROVED
    const conflictingBooking = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.room_id = :roomId', { roomId })
      .andWhere('b.booking_date = :bookingDate', { bookingDate })
      .andWhere('b.status = :status', { status: BookingStatus.APPROVED })
      .andWhere('b.start_time < :endTime AND b.end_time > :startTime', { startTime, endTime })
      .getCount();

    return conflictingBooking === 0;
  }

  async createBooking(userId: string, data: {
    roomId: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
    expectedAttendees: number;
    purpose: string;
  }) {
    const room = await this.roomRepo.findOne({ where: { id: data.roomId.toString() } });
    if (!room || !room.isActive) {
      throw new BadRequestException('Ruangan tidak valid atau sedang nonaktif');
    }

    if (data.expectedAttendees > room.capacity) {
      throw new BadRequestException(`Jumlah peserta (${data.expectedAttendees}) melebihi kapasitas ruangan (${room.capacity} kursi)`);
    }

    const available = await this.isRoomAvailable(room.id, data.bookingDate, data.startTime, data.endTime);
    if (!available) {
      throw new ConflictException(`Ruangan ${room.roomCode} tidak tersedia pada slot waktu tersebut`);
    }

    const booking = this.bookingRepo.create({
      requesterUserId: userId,
      roomId: room.id,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      expectedAttendees: data.expectedAttendees,
      purpose: data.purpose,
      status: BookingStatus.PENDING,
    });

    return await this.bookingRepo.save(booking);
  }

  async approveBooking(bookingId: string, adminUserId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const booking = await queryRunner.manager.findOne(RoomBookingRequest, {
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new NotFoundException('Pengajuan peminjaman ruangan tidak ditemukan');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException(`Pengajuan tidak dapat disetujui karena statusnya adalah ${booking.status}`);
      }

      // Re-validasi ketersediaan ruangan saat approval (Anti-Race Condition)
      const available = await this.isRoomAvailable(booking.roomId, booking.bookingDate, booking.startTime, booking.endTime);
      if (!available) {
        throw new ConflictException('Approval dibatalkan: Ruangan sudah terisi oleh jadwal atau peminjaman lain');
      }

      booking.status = BookingStatus.APPROVED;
      booking.reviewedByUserId = adminUserId;
      booking.reviewedAt = new Date();
      await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Peminjaman ruangan berhasil disetujui.' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectBooking(bookingId: string, adminUserId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Alasan penolakan wajib disertakan');
    }

    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Pengajuan tidak dapat ditolak karena statusnya adalah ${booking.status}`);
    }

    booking.status = BookingStatus.REJECTED;
    booking.reviewedByUserId = adminUserId;
    booking.reviewedAt = new Date();
    booking.rejectionReason = reason.trim();

    return await this.bookingRepo.save(booking);
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (booking.requesterUserId !== userId) {
      throw new BadRequestException('Anda tidak memiliki hak membatalkan pengajuan milik orang lain');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Hanya pengajuan berstatus PENDING yang dapat dibatalkan');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.rejectionReason = 'Dibatalkan oleh pemohon';
    return await this.bookingRepo.save(booking);
  }

  async getAllBookings() {
    return await this.bookingRepo.find({
      relations: ['room', 'requester'],
      order: { createdAt: 'DESC' },
    });
  }
}

