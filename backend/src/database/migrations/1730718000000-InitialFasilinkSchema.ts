import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialFasilinkSchema1730718000000 implements MigrationInterface {
  name = 'InitialFasilinkSchema1730718000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK(role IN ('ADMIN', 'USER')),
        email VARCHAR(150),
        phone_number VARCHAR(30),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Academic Terms
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS academic_terms (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        term_name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Rooms
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        room_code VARCHAR(50) NOT NULL UNIQUE,
        room_name VARCHAR(100) NOT NULL,
        building VARCHAR(100) NOT NULL,
        floor SMALLINT NOT NULL,
        capacity INTEGER NOT NULL CHECK (capacity > 0),
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Inventory Items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        item_code VARCHAR(50) NOT NULL UNIQUE,
        item_name VARCHAR(150) NOT NULL,
        description TEXT,
        total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
        condition_notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Courses
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        course_code VARCHAR(20) NOT NULL UNIQUE,
        course_name VARCHAR(150) NOT NULL,
        sks INTEGER NOT NULL DEFAULT 3,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 6. Class Groups
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS class_groups (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        study_program VARCHAR(100) NOT NULL,
        cohort_year INTEGER NOT NULL,
        class_code VARCHAR(50) NOT NULL,
        student_count INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_class_groups_composite UNIQUE (study_program, cohort_year, class_code)
      );
    `);

    // 7. Lecturers
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lecturers (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        lecturer_code VARCHAR(30) NOT NULL UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        phone_number VARCHAR(30),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 8. Lecturer Availability
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lecturer_availability (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        lecturer_id BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE RESTRICT,
        term_id BIGINT NOT NULL REFERENCES academic_terms(id) ON DELETE RESTRICT,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
        start_time TIME WITHOUT TIME ZONE NOT NULL,
        end_time TIME WITHOUT TIME ZONE NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 9. Schedules
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        term_id BIGINT NOT NULL REFERENCES academic_terms(id) ON DELETE RESTRICT,
        course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
        class_group_id BIGINT NOT NULL REFERENCES class_groups(id) ON DELETE RESTRICT,
        lecturer_id BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE RESTRICT,
        room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
        start_time TIME WITHOUT TIME ZONE NOT NULL,
        end_time TIME WITHOUT TIME ZONE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 10. Room Booking Requests
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS room_booking_requests (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        requester_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
        booking_date DATE NOT NULL,
        start_time TIME WITHOUT TIME ZONE NOT NULL,
        end_time TIME WITHOUT TIME ZONE NOT NULL,
        expected_attendees INTEGER NOT NULL CHECK (expected_attendees > 0),
        purpose TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
        reviewed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 11. Inventory Loan Requests
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS inventory_loan_requests (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        requester_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        item_id BIGINT NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        loan_date DATE NOT NULL,
        expected_return_date DATE NOT NULL,
        purpose TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'HANDED_OVER', 'RETURNED')),
        reviewed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        rejection_reason TEXT,
        handed_over_at TIMESTAMPTZ,
        returned_at TIMESTAMPTZ,
        return_condition_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 12. Schedule Change Requests
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS schedule_change_requests (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        requester_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE RESTRICT,
        proposed_day_of_week SMALLINT NOT NULL CHECK (proposed_day_of_week BETWEEN 1 AND 7),
        proposed_start_time TIME WITHOUT TIME ZONE NOT NULL,
        proposed_end_time TIME WITHOUT TIME ZONE NOT NULL,
        proposed_room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
        reason TEXT NOT NULL,
        effective_date DATE,
        previous_schedule_snapshot JSONB,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
        reviewed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS schedule_change_requests;`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_loan_requests;`);
    await queryRunner.query(`DROP TABLE IF EXISTS room_booking_requests;`);
    await queryRunner.query(`DROP TABLE IF EXISTS schedules;`);
    await queryRunner.query(`DROP TABLE IF EXISTS lecturer_availability;`);
    await queryRunner.query(`DROP TABLE IF EXISTS lecturers;`);
    await queryRunner.query(`DROP TABLE IF EXISTS class_groups;`);
    await queryRunner.query(`DROP TABLE IF EXISTS courses;`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_items;`);
    await queryRunner.query(`DROP TABLE IF EXISTS rooms;`);
    await queryRunner.query(`DROP TABLE IF EXISTS academic_terms;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}

