import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('academic_terms')
export class AcademicTerm {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'term_name', length: 100 })
  termName: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'course_code', unique: true, length: 20 })
  courseCode: string;

  @Column({ name: 'course_name', length: 150 })
  courseName: string;

  @Column({ type: 'integer', default: 3 })
  sks: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('class_groups')
export class ClassGroup {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'study_program', length: 100 })
  studyProgram: string;

  @Column({ name: 'cohort_year', type: 'integer' })
  cohortYear: number;

  @Column({ name: 'class_code', length: 50 })
  classCode: string;

  @Column({ name: 'student_count', type: 'integer', nullable: true })
  studentCount?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('lecturers')
export class Lecturer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'lecturer_code', unique: true, length: 30 })
  lecturerCode: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ nullable: true, length: 150 })
  email?: string;

  @Column({ name: 'phone_number', nullable: true, length: 30 })
  phoneNumber?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('lecturer_availability')
export class LecturerAvailability {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'lecturer_id', type: 'bigint' })
  lecturerId: string;

  @ManyToOne(() => Lecturer)
  @JoinColumn({ name: 'lecturer_id' })
  lecturer: Lecturer;

  @Column({ name: 'term_id', type: 'bigint' })
  termId: string;

  @ManyToOne(() => AcademicTerm)
  @JoinColumn({ name: 'term_id' })
  term: AcademicTerm;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

