import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  InventoryLoanRequest,
  InventoryLoanStatus,
} from '../../database/entities/inventory-loan-request.entity';
import { InventoryItem } from '../../database/entities/inventory-item.entity';

@Injectable()
export class InventoryLoanService {
  constructor(
    @InjectRepository(InventoryLoanRequest)
    private readonly loanRepo: Repository<InventoryLoanRequest>,
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Menghitung stok tersedia aktual: totalQuantity - sum(quantity APPROVED + HANDED_OVER)
   */
  async getAvailableStock(itemId: string): Promise<number> {
    const item = await this.itemRepo.findOne({ where: { id: itemId, isActive: true } });
    if (!item) return 0;

    const reserved = await this.loanRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.quantity), 0)', 'total')
      .where('l.item_id = :itemId', { itemId })
      .andWhere('l.status IN (:...statuses)', {
        statuses: [InventoryLoanStatus.APPROVED, InventoryLoanStatus.HANDED_OVER],
      })
      .getRawOne();

    const reservedCount = parseInt(reserved?.total || '0', 10);
    return Math.max(0, item.totalQuantity - reservedCount);
  }

  async createLoan(userId: string, data: {
    itemId: number;
    quantity: number;
    loanDate: string;
    expectedReturnDate: string;
    purpose: string;
  }) {
    const item = await this.itemRepo.findOne({ where: { id: data.itemId.toString(), isActive: true } });
    if (!item) {
      throw new BadRequestException('Barang inventaris tidak valid atau sedang nonaktif');
    }

    if (data.quantity <= 0) {
      throw new BadRequestException('Jumlah peminjaman harus lebih dari 0 unit');
    }

    const available = await this.getAvailableStock(item.id);
    if (data.quantity > available) {
      throw new ConflictException(`Jumlah yang diajukan (${data.quantity} unit) melebihi stok yang tersedia saat ini (${available} unit)`);
    }

    const loan = this.loanRepo.create({
      requesterUserId: userId,
      itemId: item.id,
      quantity: data.quantity,
      loanDate: data.loanDate,
      expectedReturnDate: data.expectedReturnDate,
      purpose: data.purpose,
      status: InventoryLoanStatus.PENDING,
    });

    return await this.loanRepo.save(loan);
  }

  async approveLoan(loanId: string, adminUserId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const loan = await queryRunner.manager.findOne(InventoryLoanRequest, {
        where: { id: loanId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!loan) {
        throw new NotFoundException('Pengajuan peminjaman barang tidak ditemukan');
      }

      if (loan.status !== InventoryLoanStatus.PENDING) {
        throw new BadRequestException(`Pengajuan tidak dapat disetujui karena statusnya adalah ${loan.status}`);
      }

      // Re-validasi stok fisik anti-race condition
      const available = await this.getAvailableStock(loan.itemId);
      if (loan.quantity > available) {
        throw new ConflictException(`Persetujuan dibatalkan: Stok yang tersedia (${available} unit) sudah tidak mencukupi`);
      }

      loan.status = InventoryLoanStatus.APPROVED;
      loan.reviewedByUserId = adminUserId;
      loan.reviewedAt = new Date();
      await queryRunner.manager.save(loan);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Peminjaman barang berhasil disetujui.' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async handoverLoan(loanId: string, adminUserId: string) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (loan.status !== InventoryLoanStatus.APPROVED) {
      throw new BadRequestException('Hanya pengajuan berstatus APPROVED yang dapat dicatat serah-terima fisiknya');
    }

    loan.status = InventoryLoanStatus.HANDED_OVER;
    loan.handedOverAt = new Date();
    return await this.loanRepo.save(loan);
  }

  async returnLoan(loanId: string, adminUserId: string, conditionNotes?: string) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (loan.status !== InventoryLoanStatus.HANDED_OVER) {
      throw new BadRequestException('Hanya pengajuan berstatus HANDED_OVER yang dapat dicatat pengembaliannya');
    }

    loan.status = InventoryLoanStatus.RETURNED;
    loan.returnedAt = new Date();
    loan.returnConditionNotes = conditionNotes || 'Barang dikembalikan dalam kondisi lengkap dan baik';
    return await this.loanRepo.save(loan);
  }

  async rejectLoan(loanId: string, adminUserId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Alasan penolakan wajib disertakan');
    }

    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (loan.status !== InventoryLoanStatus.PENDING) {
      throw new BadRequestException(`Pengajuan tidak dapat ditolak karena statusnya adalah ${loan.status}`);
    }

    loan.status = InventoryLoanStatus.REJECTED;
    loan.reviewedByUserId = adminUserId;
    loan.reviewedAt = new Date();
    loan.rejectionReason = reason.trim();

    return await this.loanRepo.save(loan);
  }

  async getAllLoans() {
    return await this.loanRepo.find({
      relations: ['item', 'requester'],
      order: { createdAt: 'DESC' },
    });
  }
}

