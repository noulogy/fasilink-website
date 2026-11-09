import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { ScheduleChangeService } from './schedule-change.service';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SubmitScheduleChangeDto {
  @IsNotEmpty()
  @IsNumber()
  scheduleId: number;

  @IsNotEmpty()
  @IsNumber()
  proposedDayOfWeek: number;

  @IsNotEmpty()
  @IsString()
  proposedStartTime: string;

  @IsNotEmpty()
  @IsString()
  proposedEndTime: string;

  @IsNotEmpty()
  @IsNumber()
  proposedRoomId: number;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

@Controller('schedule-changes')
export class ScheduleChangeController {
  constructor(private readonly changeService: ScheduleChangeService) {}

  @Get()
  async getAllRequests() {
    const list = await this.changeService.getAllRequests();
    return {
      message: 'Daftar permohonan perubahan jadwal berhasil diambil',
      data: list,
    };
  }

  @Post()
  async submit(@Request() req: any, @Body() dto: SubmitScheduleChangeDto) {
    const userId = req.user?.id || '2';
    const saved = await this.changeService.submitRequest(userId, dto);
    return {
      message: 'Permohonan perubahan jadwal berhasil diajukan.',
      data: saved,
    };
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id || '1';
    return await this.changeService.approveRequest(id, adminId);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Request() req: any, @Body('reason') reason: string) {
    const adminId = req.user?.id || '1';
    const updated = await this.changeService.rejectRequest(id, adminId, reason);
    return {
      message: 'Permohonan perubahan jadwal berhasil ditolak.',
      data: updated,
    };
  }
}

