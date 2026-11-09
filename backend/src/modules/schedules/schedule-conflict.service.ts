import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../../database/entities/schedule.entity';
import { Room } from '../../database/entities/room.entity';
import { ClassGroup, LecturerAvailability } from '../../database/entities/academic.entity';

export interface ScheduleConflictResult {
  type: 'ROOM' | 'LECTURER' | 'CLASS_GROUP' | 'CAPACITY' | 'LECTURER_UNAVAILABLE';
  message: string;
  source: string;
}

@Injectable()
export class ScheduleConflictService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(ClassGroup)
    private readonly classGroupRepo: Repository<ClassGroup>,
    @InjectRepository(LecturerAvailability)
    private readonly availabilityRepo: Repository<LecturerAvailability>,
  ) {}

  /**
   * Helper pemeriksaan bentrok jadwal universal.
   * Overlap interval rule: candidateStart < existingEnd AND candidateEnd > existingStart.
   * Titik batas singgung (e.g. 08:00-10:00 vs 10:00-12:00) BUKAN konflik.
   */
  async checkConflicts(
    termId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    roomId?: string,
    lecturerId?: string,
    classGroupId?: string,
    excludeScheduleId?: string,
  ): Promise<ScheduleConflictResult[]> {
    if (!startTime || !endTime) {
      throw new BadRequestException('Waktu mulai dan selesai wajib diisi');
    }
    if (startTime >= endTime) {
      throw new BadRequestException('Jam mulai harus lebih awal daripada jam selesai');
    }
    if (dayOfWeek < 1 || dayOfWeek > 7) {
      throw new BadRequestException('Hari perkuliahan tidak valid (1-7)');
    }

    const conflicts: ScheduleConflictResult[] = [];

    // Query jadwal yang overlap di hari dan semester yang sama
    const qb = this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.course', 'c')
      .leftJoinAndSelect('s.classGroup', 'cg')
      .leftJoinAndSelect('s.lecturer', 'lec')
      .leftJoinAndSelect('s.room', 'r')
      .where('s.term_id = :termId', { termId })
      .andWhere('s.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('s.is_active = true')
      .andWhere('s.start_time < :endTime AND s.end_time > :startTime', { startTime, endTime });

    if (excludeScheduleId) {
      qb.andWhere('s.id != :excludeScheduleId', { excludeScheduleId });
    }

    const overlapping = await qb.getMany();

    for (const s of overlapping) {
      if (roomId && s.roomId === roomId) {
        conflicts.push({
          type: 'ROOM',
          message: `Ruangan ${s.room?.roomCode} bentrok dengan perkuliahan ${s.course?.courseName} (${s.startTime} - ${s.endTime})`,
          source: s.room?.roomCode || roomId,
        });
      }
      if (lecturerId && s.lecturerId === lecturerId) {
        conflicts.push({
          type: 'LECTURER',
          message: `Dosen ${s.lecturer?.fullName} sudah memiliki jadwal mengajar ${s.course?.courseName} di kelas ${s.classGroup?.classCode} (${s.startTime} - ${s.endTime})`,
          source: s.lecturer?.fullName || lecturerId,
        });
      }
      if (classGroupId && s.classGroupId === classGroupId) {
        conflicts.push({
          type: 'CLASS_GROUP',
          message: `Kelas ${s.classGroup?.classCode} sudah memiliki jadwal kuliah ${s.course?.courseName} (${s.startTime} - ${s.endTime})`,
          source: s.classGroup?.classCode || classGroupId,
        });
      }
    }

    // Periksa kapasitas ruangan vs rombel
    if (roomId && classGroupId) {
      const room = await this.roomRepo.findOne({ where: { id: roomId } });
      const classGroup = await this.classGroupRepo.findOne({ where: { id: classGroupId } });

      if (room && classGroup && classGroup.studentCount) {
        if (room.capacity < classGroup.studentCount) {
          conflicts.push({
            type: 'CAPACITY',
            message: `Kapasitas ruangan ${room.roomCode} (${room.capacity} kursi) tidak mencukupi untuk rombel ${classGroup.classCode} (${classGroup.studentCount} mahasiswa)`,
            source: room.roomCode,
          });
        }
      }
    }

    // Periksa jendela ketersediaan dosen
    if (lecturerId) {
      const availWindows = await this.availabilityRepo.find({
        where: { lecturerId, termId, dayOfWeek },
      });

      if (availWindows.length > 0) {
        let insideWindow = false;
        for (const win of availWindows) {
          // Harus berada sepenuhnya di dalam jendela waktu
          if (startTime >= win.startTime && endTime <= win.endTime) {
            insideWindow = true;
            break;
          }
        }
        if (!insideWindow) {
          conflicts.push({
            type: 'LECTURER_UNAVAILABLE',
            message: 'Slot waktu yang dipilih berada di luar jendela ketersediaan mengajar dosen pada hari tersebut.',
            source: `Lecturer #${lecturerId}`,
          });
        }
      }
    }

    return conflicts;
  }
}

