-- Migration: Bổ sung các cột thông tin học vấn & cá nhân cho ứng viên
-- Đảm bảo profiles table có đầy đủ high_school, major, date_of_birth, university, cohort, student_id

DO $$
BEGIN
  -- 1. Bổ sung cột high_school (Trường THPT từng theo học)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'high_school'
  ) THEN
    ALTER TABLE profiles ADD COLUMN high_school VARCHAR(255);
  END IF;

  -- 2. Bổ sung cột major (Ngành học)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'major'
  ) THEN
    ALTER TABLE profiles ADD COLUMN major VARCHAR(255);
  END IF;

  -- 3. Bổ sung cột date_of_birth (Ngày sinh)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
  END IF;

  -- 4. Bổ sung cột student_id (Mã số sinh viên)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN student_id VARCHAR(50);
  END IF;

  -- 5. Bổ sung cột university (Trường đại học)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'university'
  ) THEN
    ALTER TABLE profiles ADD COLUMN university VARCHAR(255) DEFAULT 'Trường Quốc tế - ĐHQGHN';
  END IF;

  -- 6. Bổ sung cột cohort (Khóa sinh viên)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cohort'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cohort VARCHAR(20) DEFAULT 'K22';
  END IF;
END $$;
