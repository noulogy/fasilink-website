import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { InventoryLoanService } from './inventory-loan.service';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateInventoryLoanDto {
  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsString()
  loanDate: string;

  @IsNotEmpty()
  @IsString()
  expectedReturnDate: string;

  @IsNotEmpty()
  @IsString()
  purpose: string;
}

@Controller('inventory-loans')
export class InventoryLoanController {
  constructor(private readonly loanService: InventoryLoanService) {}

  @Get()
  async getAllLoans() {
    const list = await this.loanService.getAllLoans();
    return {
      message: 'Daftar pengajuan peminjaman barang berhasil diambil',
      data: list,
    };
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateInventoryLoanDto) {
    const userId = req.user?.id || '2';
    const saved = await this.loanService.createLoan(userId, dto);
    return {
      message: 'Pengajuan peminjaman barang berhasil dikirim.',
      data: saved,
    };
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id || '1';
    return await this.loanService.approveLoan(id, adminId);
  }

  @Patch(':id/handover')
  async handover(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id || '1';
    const updated = await this.loanService.handoverLoan(id, adminId);
    return {
      message: 'Serah terima fisik barang berhasil dicatat.',
      data: updated,
    };
  }

  @Patch(':id/return')
  async returnLoan(
    @Param('id') id: string,
    @Request() req: any,
    @Body('conditionNotes') conditionNotes?: string,
  ) {
    const adminId = req.user?.id || '1';
    const updated = await this.loanService.returnLoan(id, adminId, conditionNotes);
    return {
      message: 'Pengembalian barang berhasil dicatat.',
      data: updated,
    };
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Request() req: any, @Body('reason') reason: string) {
    const adminId = req.user?.id || '1';
    const updated = await this.loanService.rejectLoan(id, adminId, reason);
    return {
      message: 'Pengajuan peminjaman barang berhasil ditolak.',
      data: updated,
    };
  }
}

