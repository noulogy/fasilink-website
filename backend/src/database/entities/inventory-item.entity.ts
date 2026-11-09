import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'item_code', unique: true, length: 50 })
  itemCode: string;

  @Column({ name: 'item_name', length: 150 })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'total_quantity', type: 'integer' })
  totalQuantity: number;

  @Column({ name: 'condition_notes', type: 'text', nullable: true })
  conditionNotes?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

