import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ScheduleChangeRequest,
  ScheduleChangeStatus,
} from '../../database/entities/schedule-change-request.entity';
import { Schedule } from '../../database/entities/schedule.entity';
import { ScheduleConflictService } from '../schedules/schedule-conflict.service';

@Injectable()
export class ScheduleChangeService {
  constructor(
    @InjectRepository(ScheduleChangeRequest)
    private readonly changeRepo: Repository<ScheduleChangeRequest>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    private readonly conflictService: ScheduleConflictService,
    private readonly dataSource: DataSource,
  ) {}

  async submitRequest(userId: string, data: {
    scheduleId: number;
    proposedDayOfWeek: number;
    proposedStartTime: string;
    proposedEndTime: string;
    proposedRoomId: number;
    reason: string;
  }) {
    const original = await this.scheduleRepo.findOne({
      where: { id: data.scheduleId.toString() },
    });

    if (!original || !original.isActive) {
      throw new NotFoundException('Jadwal asal tidak ditemukan atau sudah tidak aktif');
    }

    // Validasi bentrok usulan awal
    const conflicts = await this.conflictService.checkConflicts(
      original.termId,
      data.proposedDayOfWeek,
      data.proposedStartTime,
      data.proposedEndTime,
      data.proposedRoomId.toString(),
      original.lecturerId,
      original.classGroupId,
      original.id,
    );

    if (conflicts.length > 0) {
      const msgs = conflicts.map((c) => c.message).join(' | ');
      throw new ConflictException(`Usulan jadwal bentrok: ${msgs}`);
    }

    const req = this.changeRepo.create({
      requesterUserId: userId,
      scheduleId: data.scheduleId.toString(),
      proposedDayOfWeek: data.proposedDayOfWeek,
      proposedStartTime: data.proposedStartTime,
      proposedEndTime: data.proposedEndTime,
      proposedRoomId: data.proposedRoomId.toString(),
      reason: data.reason,
      status: ScheduleChangeStatus.PENDING,
    });

    return await this.changeRepo.save(req);
  }

  /**
   * Persetujuan perubahan jadwal resmi dalam 1 transaksi atomik (ADR-010).
   * Mencegah race condition dan mencatat effective_date & snapshot kondisi lama.
   */
  async approveRequest(requestId: string, adminUserId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const req = await queryRunner.manager.findOne(ScheduleChangeRequest, {
        where: { id: requestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!req) {
        throw new NotFoundException('Permohonan perubahan jadwal tidak ditemukan');
      }

      if (req.status !== ScheduleChangeStatus.PENDING) {
        throw new BadRequestException(`Pengajuan tidak dapat disetujui karena statusnya adalah ${req.status}`);
      }

      const schedule = await queryRunner.manager.findOne(Schedule, {
        where: { id: req.scheduleId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!schedule || !schedule.isActive) {
        throw new NotFoundException('Jadwal perkuliahan asli tidak aktif');
      }

      // Revalidasi ketersediaan saat approval
      const conflicts = await this.conflictService.checkConflicts(
        schedule.termId,
        req.proposedDayOfWeek,
        req.proposedStartTime,
        req.proposedEndTime,
        req.proposedRoomId,
        schedule.lecturerId,
        schedule.classGroupId,
        schedule.id,
      );

      if (conflicts.length > 0) {
        const msgs = conflicts.map((c) => c.message).join(' | ');
        throw new ConflictException(`Persetujuan gagal karena terjadi bentrok terkini: ${msgs}`);
      }

      // Ambil snapshot kondisi jadwal sebelum dimutasi
      const snapshot = {
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        roomId: schedule.roomId,
        mutatedAt: new Date().toISOString(),
      };

      // 1. Update status request
      req.status = ScheduleChangeStatus.APPROVED;
      req.reviewedByUserId = adminUserId;
      req.reviewedAt = new Date();
      req.effectiveDate = new Date().toISOString().split('T')[0];
      req.previousScheduleSnapshot = snapshot;
      await queryRunner.manager.save(req);

      // 2. Mutasi jadwal perkuliahan mingguan resmi
      schedule.dayOfWeek = req.proposedDayOfWeek;
      schedule.startTime = req.proposedStartTime;
      schedule.endTime = req.proposedEndTime;
      schedule.roomId = req.proposedRoomId;
      await queryRunner.manager.save(schedule);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Perubahan jadwal resmi berhasil disetujui dan diterapkan.' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectRequest(requestId: string, adminUserId: string, rejectionReason: string) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new BadRequestException('Alasan penolakan wajib disertakan');
    }

    const req = await this.changeRepo.findOne({ where: { id: requestId } });
    if (!req) {
      throw new NotFoundException('Permohonan tidak ditemukan');
    }
    if (req.status !== ScheduleChangeStatus.PENDING) {
      throw new BadRequestException(`Pengajuan tidak dapat ditolak karena statusnya adalah ${req.status}`);
    }

    req.status = ScheduleChangeStatus.REJECTED;
    req.reviewedByUserId = adminUserId;
    req.reviewedAt = new Date();
    req.rejectionReason = rejectionReason.trim();

    return await this.changeRepo.save(req);
  }

  async getAllRequests() {
    return await this.changeRepo.find({
      relations: ['schedule', 'schedule.course', 'schedule.classGroup', 'schedule.lecturer', 'schedule.room', 'proposedRoom', 'requester'],
      order: { createdAt: 'DESC' },
    });
  }
}

