import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RoomBookingService } from './room-booking.service';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateRoomBookingDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsString()
  bookingDate: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  expectedAttendees: number;

  @IsNotEmpty()
  @IsString()
  purpose: string;
}

@Controller('room-bookings')
export class RoomBookingController {
  constructor(private readonly bookingService: RoomBookingService) {}

  @Get()
  async getAllBookings(@Request() req: any) {
    const list = await this.bookingService.getAllBookings();
    return {
      message: 'Daftar pengajuan peminjaman ruangan berhasil diambil',
      data: list,
    };
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateRoomBookingDto) {
    const userId = req.user?.id || '2'; // Default user demo jika tanpa auth guard
    const saved = await this.bookingService.createBooking(userId, dto);
    return {
      message: 'Pengajuan peminjaman ruangan berhasil dikirim.',
      data: saved,
    };
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id || '1';
    return await this.bookingService.approveBooking(id, adminId);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Request() req: any, @Body('reason') reason: string) {
    const adminId = req.user?.id || '1';
    const updated = await this.bookingService.rejectBooking(id, adminId, reason);
    return {
      message: 'Pengajuan peminjaman ruangan berhasil ditolak.',
      data: updated,
    };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || '2';
    const updated = await this.bookingService.cancelBooking(id, userId);
    return {
      message: 'Pengajuan peminjaman ruangan berhasil dibatalkan.',
      data: updated,
    };
  }
}

