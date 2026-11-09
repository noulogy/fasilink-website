import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { InventoryLoanService } from '../inventory-loans/inventory-loan.service';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateInventoryDto {
  @IsNotEmpty({ message: 'Kode barang wajib diisi' })
  @IsString()
  itemCode: string;

  @IsNotEmpty({ message: 'Nama barang wajib diisi' })
  @IsString()
  itemName: string;

  @IsNotEmpty({ message: 'Jumlah total wajib diisi' })
  @IsNumber()
  @Min(0, { message: 'Jumlah barang tidak boleh negatif' })
  totalQuantity: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  conditionNotes?: string;
}

@Controller('inventory')
export class InventoryController {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    private readonly loanService: InventoryLoanService,
  ) {}

  @Get()
  async getAllItems() {
    const items = await this.itemRepo.find({ where: { isActive: true }, order: { itemCode: 'ASC' } });
    const itemsWithAvailable = await Promise.all(
      items.map(async (item) => ({
        ...item,
        availableQuantity: await this.loanService.getAvailableStock(item.id),
      })),
    );
    return {
      message: 'Katalog inventaris berhasil diambil',
      data: itemsWithAvailable,
    };
  }

  @Post()
  async createItem(@Body() dto: CreateInventoryDto) {
    const existing = await this.itemRepo.findOne({ where: { itemCode: dto.itemCode.trim() } });
    if (existing) {
      throw new ConflictException(`Kode barang '${dto.itemCode}' sudah digunakan`);
    }
    const item = this.itemRepo.create(dto);
    const saved = await this.itemRepo.save(item);
    return {
      message: 'Barang inventaris berhasil ditambahkan',
      data: saved,
    };
  }

  @Delete(':id')
  async deleteItem(@Param('id') id: string) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Barang dengan ID ${id} tidak ditemukan`);
    }
    const reserved = item.totalQuantity - (await this.loanService.getAvailableStock(id));
    if (reserved > 0) {
      throw new ConflictException(`Barang sedang dalam peminjaman aktif (${reserved} unit)`);
    }
    item.isActive = false;
    await this.itemRepo.save(item);
    return {
      message: 'Barang inventaris berhasil dinonaktifkan',
      data: null,
    };
  }
}

