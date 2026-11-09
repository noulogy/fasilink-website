import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { User } from './entities/user.entity';
import { Room } from './entities/room.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { AcademicTerm, Course, ClassGroup, Lecturer, LecturerAvailability } from './entities/academic.entity';
import { Schedule } from './entities/schedule.entity';
import { RoomBookingRequest } from './entities/room-booking-request.entity';
import { InventoryLoanRequest } from './entities/inventory-loan-request.entity';
import { ScheduleChangeRequest } from './entities/schedule-change-request.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'fasilink_db',
  synchronize: false, // Strict migration adherence
  logging: process.env.NODE_ENV === 'development',
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
  migrations: ['dist/database/migrations/*.js'],
});

