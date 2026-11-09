import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../database/entities/room.entity';
import { RoomBookingService } from '../room-bookings/room-booking.service';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty({ message: 'Kode ruangan wajib diisi' })
  @IsString()
  roomCode: string;

  @IsNotEmpty({ message: 'Nama ruangan wajib diisi' })
  @IsString()
  roomName: string;

  @IsNotEmpty({ message: 'Gedung wajib diisi' })
  @IsString()
  building: string;

  @IsNotEmpty({ message: 'Lantai wajib diisi' })
  @IsNumber()
  floor: number;

  @IsNotEmpty({ message: 'Kapasitas wajib diisi' })
  @IsNumber()
  @Min(1, { message: 'Kapasitas harus lebih dari 0' })
  capacity: number;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('rooms')
export class RoomController {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    private readonly bookingService: RoomBookingService,
  ) {}

  @Get()
  async getAllRooms(@Query('building') building?: string) {
    const qb = this.roomRepo.createQueryBuilder('r').where('r.is_active = true');
    if (building) {
      qb.andWhere('LOWER(r.building) LIKE LOWER(:building)', { building: `%${building}%` });
    }
    const rooms = await qb.orderBy('r.room_code', 'ASC').getMany();
    return {
      message: 'Daftar ruangan berhasil diambil',
      data: rooms,
    };
  }

  @Get(':id')
  async getRoomById(@Param('id') id: string) {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Ruangan dengan ID ${id} tidak ditemukan`);
    }
    return {
      message: 'Detail ruangan berhasil diambil',
      data: room,
    };
  }

  @Get(':id/availability')
  async checkAvailability(
    @Param('id') id: string,
    @Query('bookingDate') bookingDate: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    const isAvailable = await this.bookingService.isRoomAvailable(id, bookingDate, startTime, endTime);
    return {
      message: 'Ketersediaan ruangan berhasil diperiksa',
      data: { isAvailable },
    };
  }

  @Post()
  async createRoom(@Body() dto: CreateRoomDto) {
    const existing = await this.roomRepo.findOne({ where: { roomCode: dto.roomCode.trim() } });
    if (existing) {
      throw new ConflictException(`Kode ruangan '${dto.roomCode}' sudah digunakan`);
    }
    const room = this.roomRepo.create(dto);
    const saved = await this.roomRepo.save(room);
    return {
      message: 'Ruangan berhasil ditambahkan',
      data: saved,
    };
  }

  @Put(':id')
  async updateRoom(@Param('id') id: string, @Body() dto: CreateRoomDto) {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Ruangan dengan ID ${id} tidak ditemukan`);
    }
    Object.assign(room, dto);
    const updated = await this.roomRepo.save(room);
    return {
      message: 'Data ruangan berhasil diperbarui',
      data: updated,
    };
  }

  @Delete(':id')
  async deleteRoom(@Param('id') id: string) {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Ruangan dengan ID ${id} tidak ditemukan`);
    }
    room.isActive = false;
    await this.roomRepo.save(room);
    return {
      message: 'Ruangan berhasil dinonaktifkan',
      data: null,
    };
  }
}

