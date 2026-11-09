import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../database/entities/room.entity';
import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { Schedule } from '../../database/entities/schedule.entity';
import { RoomBookingRequest, BookingStatus } from '../../database/entities/room-booking-request.entity';
import { InventoryLoanRequest, InventoryLoanStatus } from '../../database/entities/inventory-loan-request.entity';
import { ScheduleChangeRequest, ScheduleChangeStatus } from '../../database/entities/schedule-change-request.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(RoomBookingRequest)
    private readonly bookingRepo: Repository<RoomBookingRequest>,
    @InjectRepository(InventoryLoanRequest)
    private readonly loanRepo: Repository<InventoryLoanRequest>,
    @InjectRepository(ScheduleChangeRequest)
    private readonly changeRepo: Repository<ScheduleChangeRequest>,
  ) {}

  async getAdminSummary() {
    const totalRooms = await this.roomRepo.count();
    const activeRooms = await this.roomRepo.count({ where: { isActive: true } });

    const inventoryItems = await this.itemRepo.find({ where: { isActive: true } });
    const totalInventoryItems = inventoryItems.length;
    const totalQuantityItems = inventoryItems.reduce((acc, curr) => acc + curr.totalQuantity, 0);

    const reservedLoanResult = await this.loanRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.quantity), 0)', 'total')
      .where('l.status IN (:...statuses)', {
        statuses: [InventoryLoanStatus.APPROVED, InventoryLoanStatus.HANDED_OVER],
      })
      .getRawOne();
    const reservedQuantityItems = parseInt(reservedLoanResult?.total || '0', 10);
    const availableQuantityItems = Math.max(0, totalQuantityItems - reservedQuantityItems);

    const totalActiveSchedules = await this.scheduleRepo.count({ where: { isActive: true } });

    const pendingRoomBookings = await this.bookingRepo.count({ where: { status: BookingStatus.PENDING } });
    const pendingInventoryLoans = await this.loanRepo.count({ where: { status: InventoryLoanStatus.PENDING } });
    const pendingScheduleChanges = await this.changeRepo.count({ where: { status: ScheduleChangeStatus.PENDING } });

    return {
      totalRooms,
      activeRooms,
      totalInventoryItems,
      totalQuantityItems,
      availableQuantityItems,
      totalActiveSchedules,
      pendingRoomBookings,
      pendingInventoryLoans,
      pendingScheduleChanges,
      totalPendingApprovals: pendingRoomBookings + pendingInventoryLoans + pendingScheduleChanges,
    };
  }

  async getUserSummary(userId: string) {
    const activeRooms = await this.roomRepo.count({ where: { isActive: true } });
    const totalActiveSchedules = await this.scheduleRepo.count({ where: { isActive: true } });

    const myPendingBookings = await this.bookingRepo.count({
      where: { requesterUserId: userId, status: BookingStatus.PENDING },
    });
    const myApprovedBookings = await this.bookingRepo.count({
      where: { requesterUserId: userId, status: BookingStatus.APPROVED },
    });
    const myActiveLoans = await this.loanRepo.count({
      where: { requesterUserId: userId, status: InventoryLoanStatus.HANDED_OVER },
    });

    return {
      activeRooms,
      totalActiveSchedules,
      myPendingBookings,
      myApprovedBookings,
      myActiveLoans,
    };
  }
}

