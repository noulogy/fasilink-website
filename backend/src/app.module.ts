import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from './database/entities/user.entity';
import { Room } from './database/entities/room.entity';
import { InventoryItem } from './database/entities/inventory-item.entity';
import { AcademicTerm, Course, ClassGroup, Lecturer, LecturerAvailability } from './database/entities/academic.entity';
import { Schedule } from './database/entities/schedule.entity';
import { RoomBookingRequest } from './database/entities/room-booking-request.entity';
import { InventoryLoanRequest } from './database/entities/inventory-loan-request.entity';
import { ScheduleChangeRequest } from './database/entities/schedule-change-request.entity';

import { AuthController } from './modules/auth/auth.controller';
import { RoomController } from './modules/rooms/room.controller';
import { ScheduleController } from './modules/schedules/schedule.controller';
import { InventoryController } from './modules/inventory/inventory.controller';
import { RoomBookingController } from './modules/room-bookings/room-booking.controller';
import { InventoryLoanController } from './modules/inventory-loans/inventory-loan.controller';
import { ScheduleChangeController } from './modules/schedule-changes/schedule-change.controller';
import { DashboardController } from './modules/dashboard/dashboard.controller';

import { ScheduleConflictService } from './modules/schedules/schedule-conflict.service';
import { AlternativeScheduleService } from './modules/schedules/alternative-schedule.service';
import { RoomBookingService } from './modules/room-bookings/room-booking.service';
import { InventoryLoanService } from './modules/inventory-loans/inventory-loan.service';
import { ScheduleChangeService } from './modules/schedule-changes/schedule-change.service';
import { DashboardService } from './modules/dashboard/dashboard.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'fasilink_db'),
        entities: [
          User,
          Room,
          InventoryItem,
          AcademicTerm,
          Course,
          ClassGroup,
          Lecturer,
          LecturerAvailability,
          Schedule,
          RoomBookingRequest,
          InventoryLoanRequest,
          ScheduleChangeRequest,
        ],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Room,
      InventoryItem,
      AcademicTerm,
      Course,
      ClassGroup,
      Lecturer,
      LecturerAvailability,
      Schedule,
      RoomBookingRequest,
      InventoryLoanRequest,
      ScheduleChangeRequest,
    ]),
  ],
  controllers: [
    AuthController,
    RoomController,
    ScheduleController,
    InventoryController,
    RoomBookingController,
    InventoryLoanController,
    ScheduleChangeController,
    DashboardController,
  ],
  providers: [
    ScheduleConflictService,
    AlternativeScheduleService,
    RoomBookingService,
    InventoryLoanService,
    ScheduleChangeService,
    DashboardService,
  ],
  exports: [
    ScheduleConflictService,
    AlternativeScheduleService,
    RoomBookingService,
    InventoryLoanService,
    ScheduleChangeService,
    DashboardService,
  ],
})
export class AppModule {}
