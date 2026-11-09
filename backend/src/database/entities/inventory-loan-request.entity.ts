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
import { InventoryItem } from './inventory-item.entity';

export enum InventoryLoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  HANDED_OVER = 'HANDED_OVER',
  RETURNED = 'RETURNED',
}

@Entity('inventory_loan_requests')
export class InventoryLoanRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'requester_user_id', type: 'bigint' })
  requesterUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_user_id' })
  requester: User;

  @Column({ name: 'item_id', type: 'bigint' })
  itemId: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'loan_date', type: 'date' })
  loanDate: string;

  @Column({ name: 'expected_return_date', type: 'date' })
  expectedReturnDate: string;

  @Column({ type: 'text' })
  purpose: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: InventoryLoanStatus.PENDING,
  })
  status: InventoryLoanStatus;

  @Column({ name: 'reviewed_by_user_id', type: 'bigint', nullable: true })
  reviewedByUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewer?: User;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'handed_over_at', type: 'timestamptz', nullable: true })
  handedOverAt?: Date;

  @Column({ name: 'returned_at', type: 'timestamptz', nullable: true })
  returnedAt?: Date;

  @Column({ name: 'return_condition_notes', type: 'text', nullable: true })
  returnConditionNotes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

