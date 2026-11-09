import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Schedule } from './schedule.entity';
import { Room } from './room.entity';

export enum ScheduleChangeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('schedule_change_requests')
export class ScheduleChangeRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'requester_user_id', type: 'bigint' })
  requesterUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_user_id' })
  requester: User;

  @Column({ name: 'schedule_id', type: 'bigint' })
  scheduleId: string;

  @ManyToOne(() => Schedule)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ name: 'proposed_day_of_week', type: 'smallint' })
  proposedDayOfWeek: number;

  @Column({ name: 'proposed_start_time', type: 'time' })
  proposedStartTime: string;

  @Column({ name: 'proposed_end_time', type: 'time' })
  proposedEndTime: string;

  @Column({ name: 'proposed_room_id', type: 'bigint' })
  proposedRoomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'proposed_room_id' })
  proposedRoom: Room;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate?: string;

  @Column({ name: 'previous_schedule_snapshot', type: 'jsonb', nullable: true })
  previousScheduleSnapshot?: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 30,
    default: ScheduleChangeStatus.PENDING,
  })
  status: ScheduleChangeStatus;

  @Column({ name: 'reviewed_by_user_id', type: 'bigint', nullable: true })
  reviewedByUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewer?: User;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

