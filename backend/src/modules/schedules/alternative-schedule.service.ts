import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../../database/entities/schedule.entity';
import { Room } from '../../database/entities/room.entity';
import { ClassGroup, LecturerAvailability } from '../../database/entities/academic.entity';
import { ScheduleConflictService } from './schedule-conflict.service';

export interface AlternativeQueryDto {
  scheduleId: number;
  preferredDays?: number[];
  preferredStartTime?: string;
  preferredEndTime?: string;
  preferredRoomId?: number;
  preferredBuilding?: string;
}

export interface CandidateScheduleResult {
  scheduleId: number;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
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

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

@Injectable()
export class AlternativeScheduleService {
  private readonly DAY_START = '07:30';
  private readonly DAY_END = '21:00';
  private readonly SLOT_INTERVAL = 30; // 30 minutes

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(ClassGroup)
    private readonly classGroupRepo: Repository<ClassGroup>,
    @InjectRepository(LecturerAvailability)
    private readonly availabilityRepo: Repository<LecturerAvailability>,
    private readonly conflictService: ScheduleConflictService,
  ) {}

  async findAlternatives(query: AlternativeQueryDto): Promise<CandidateScheduleResult[]> {
    if (!query || !query.scheduleId) {
      throw new BadRequestException('ID jadwal perkuliahan wajib dipilih');
    }

    const original = await this.scheduleRepo.findOne({
      where: { id: query.scheduleId.toString() },
      relations: ['room', 'course', 'classGroup', 'lecturer'],
    });

    if (!original || !original.isActive) {
      throw new NotFoundException('Jadwal perkuliahan tidak ditemukan atau sudah tidak aktif');
    }

    const durationMinutes = this.calculateMinutes(original.startTime, original.endTime);
    if (durationMinutes <= 0) {
      throw new BadRequestException('Durasi jadwal perkuliahan asal tidak valid');
    }

    let studentCount = 30;
    if (original.classGroup?.studentCount) {
      studentCount = original.classGroup.studentCount;
    }

    // Ambil ruangan aktif yang kapasitasnya mencukupi
    const activeRooms = await this.roomRepo.find({ where: { isActive: true } });
    const candidateRooms = activeRooms.filter((r) => r.capacity >= studentCount);

    const daysToSearch = query.preferredDays && query.preferredDays.length > 0
      ? query.preferredDays
      : [1, 2, 3, 4, 5]; // Senin - Jumat default

    const validCandidates: CandidateScheduleResult[] = [];

    for (const day of daysToSearch) {
      const availWindows = await this.availabilityRepo.find({
        where: { lecturerId: original.lecturerId, termId: original.termId, dayOfWeek: day },
      });

      // Hard constraint: Harus ada jendela ketersediaan dosen
      if (availWindows.length === 0) continue;

      let currentStartMinutes = this.timeToMinutes(this.DAY_START);
      const endLimitMinutes = this.timeToMinutes(this.DAY_END);

      while (currentStartMinutes + durationMinutes <= endLimitMinutes) {
        const slotStart = this.minutesToTime(currentStartMinutes);
        const slotEnd = this.minutesToTime(currentStartMinutes + durationMinutes);

        // Periksa apakah slot di dalam jendela dosen
        let inWindow = false;
        for (const w of availWindows) {
          if (slotStart >= w.startTime && slotEnd <= w.endTime) {
            inWindow = true;
            break;
          }
        }

        if (!inWindow) {
          currentStartMinutes += this.SLOT_INTERVAL;
          continue;
        }

        // Cek konflik dosen & kelas non-ruangan
        const nonRoomConflicts = await this.conflictService.checkConflicts(
          original.termId,
          day,
          slotStart,
          slotEnd,
          undefined,
          original.lecturerId,
          original.classGroupId,
          original.id,
        );

        if (nonRoomConflicts.length > 0) {
          currentStartMinutes += this.SLOT_INTERVAL;
          continue;
        }

        // Uji setiap ruangan yang muat kapasitas
        for (const room of candidateRooms) {
          if (
            day === original.dayOfWeek &&
            slotStart === original.startTime &&
            room.id === original.roomId
          ) {
            continue; // Slot sama persis dengan jadwal asal
          }

          const roomConflicts = await this.conflictService.checkConflicts(
            original.termId,
            day,
            slotStart,
            slotEnd,
            room.id,
            undefined,
            undefined,
            original.id,
          );

          if (roomConflicts.length > 0) continue;

          // Hitung skor kecocokan soft preferences
          const score = this.calculatePreferenceScore(original, query, day, slotStart, slotEnd, room, studentCount);
          const explanation = this.buildExplanation(query, day, slotStart, room);

          validCandidates.push({
            scheduleId: parseInt(original.id, 10),
            dayOfWeek: day,
            dayName: DAY_NAMES[day] || `Hari ke-${day}`,
            startTime: slotStart,
            endTime: slotEnd,
            durationMinutes,
            roomId: parseInt(room.id, 10),
            roomCode: room.roomCode,
            roomName: room.roomName,
            building: room.building,
            roomCapacity: room.capacity,
            studentCount,
            score,
            explanation,
          });
        }

        currentStartMinutes += this.SLOT_INTERVAL;
      }
    }

    // Urutkan skor tertinggi dan batasi 30 kandidat terbaik
    validCandidates.sort((a, b) => b.score - a.score);
    return validCandidates.slice(0, 30);
  }

  private calculatePreferenceScore(
    original: Schedule,
    query: AlternativeQueryDto,
    day: number,
    start: string,
    end: string,
    room: Room,
    studentCount: number,
  ): number {
    let score = 0;
    if (query.preferredDays?.includes(day)) score += 50;

    if (query.preferredStartTime && query.preferredEndTime) {
      if (start >= query.preferredStartTime && end <= query.preferredEndTime) {
        score += 40;
      } else if (start >= query.preferredStartTime || end <= query.preferredEndTime) {
        score += 20;
      }
    } else if (query.preferredStartTime) {
      const diff = Math.abs(this.timeToMinutes(start) - this.timeToMinutes(query.preferredStartTime));
      if (diff === 0) score += 35;
      else if (diff <= 60) score += 25;
      else if (diff <= 120) score += 15;
    }

    if (query.preferredRoomId && query.preferredRoomId.toString() === room.id) {
      score += 30;
    } else if (query.preferredBuilding && query.preferredBuilding.toLowerCase() === room.building.toLowerCase()) {
      score += 20;
    } else if (room.id === original.roomId) {
      score += 15;
    }

    if (room.capacity <= studentCount * 1.5) {
      score += 10;
    }

    return score;
  }

  private buildExplanation(query: AlternativeQueryDto, day: number, start: string, room: Room): string {
    const notes: string[] = ['Dosen tersedia & bebas bentrok', `Kapasitas muat (${room.capacity} kursi)`];
    if (query.preferredDays?.includes(day)) notes.push('Hari sesuai preferensi');
    if (query.preferredStartTime && start >= query.preferredStartTime) notes.push('Jam sesuai preferensi');
    if (query.preferredRoomId && query.preferredRoomId.toString() === room.id) notes.push('Ruangan persis yang diminta');
    return notes.join(' • ');
  }

  private timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(totalMin: number): string {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private calculateMinutes(start: string, end: string): number {
    return this.timeToMinutes(end) - this.timeToMinutes(start);
  }
}

