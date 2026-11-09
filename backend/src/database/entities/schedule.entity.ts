import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AcademicTerm, Course, ClassGroup, Lecturer } from './academic.entity';
import { Room } from './room.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'term_id', type: 'bigint' })
  termId: string;

  @ManyToOne(() => AcademicTerm)
  @JoinColumn({ name: 'term_id' })
  term: AcademicTerm;

  @Column({ name: 'course_id', type: 'bigint' })
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'class_group_id', type: 'bigint' })
  classGroupId: string;

  @ManyToOne(() => ClassGroup)
  @JoinColumn({ name: 'class_group_id' })
  classGroup: ClassGroup;

  @Column({ name: 'lecturer_id', type: 'bigint' })
  lecturerId: string;

  @ManyToOne(() => Lecturer)
  @JoinColumn({ name: 'lecturer_id' })
  lecturer: Lecturer;

  @Column({ name: 'room_id', type: 'bigint' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

