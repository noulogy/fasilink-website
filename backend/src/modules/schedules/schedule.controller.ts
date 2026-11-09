import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../../database/entities/schedule.entity';
import {
  AlternativeScheduleService,
  AlternativeQueryDto,
} from './alternative-schedule.service';

@Controller('schedules')
export class ScheduleController {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    private readonly alternativeService: AlternativeScheduleService,
  ) {}

  @Get()
  async getSchedules(
    @Query('dayOfWeek') dayOfWeek?: number,
    @Query('roomId') roomId?: string,
  ) {
    const qb = this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.course', 'c')
      .leftJoinAndSelect('s.classGroup', 'cg')
      .leftJoinAndSelect('s.lecturer', 'lec')
      .leftJoinAndSelect('s.room', 'r')
      .where('s.is_active = true');

    if (dayOfWeek) {
      qb.andWhere('s.day_of_week = :dayOfWeek', { dayOfWeek });
    }
    if (roomId) {
      qb.andWhere('s.room_id = :roomId', { roomId });
    }

    const schedules = await qb.orderBy('s.day_of_week', 'ASC').addOrderBy('s.start_time', 'ASC').getMany();

    return {
      message: 'Daftar jadwal perkuliahan berhasil diambil',
      data: schedules,
    };
  }

  @Post('find-alternatives')
  async findAlternatives(@Body() dto: AlternativeQueryDto) {
    const candidates = await this.alternativeService.findAlternatives(dto);
    return {
      message: `Ditemukan ${candidates.length} alternatif jadwal bebas bentrok`,
      data: candidates,
    };
  }
}

