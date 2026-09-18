-- ============================================================
-- iSSAC RECRUITMENT - Migration v2: Cross-Device Data Sync
-- Run this in Supabase SQL Editor after the initial schema.sql
-- ============================================================

-- ============================================================
-- TABLE: admin_accounts (replaces localStorage issac_created_admins)
-- Stores admin accounts created by BCN
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  admin_role TEXT NOT NULL DEFAULT 'truyen-thong',
  title TEXT,
  password TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Unique constraint on email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_accounts_email_lower 
  ON admin_accounts (LOWER(email));

-- ============================================================
-- TABLE: deleted_accounts (replaces localStorage deleted lists)
-- Tracks deleted candidates and admin accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS deleted_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id TEXT NOT NULL,
  target_email TEXT,
  account_type TEXT NOT NULL DEFAULT 'candidate',
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_deleted_accounts_target 
  ON deleted_accounts (target_id);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email 
  ON deleted_accounts (LOWER(target_email));
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_type 
  ON deleted_accounts (account_type);

-- ============================================================
-- Add missing system_settings keys (if not present)
-- ============================================================
INSERT INTO system_settings (key, value, label, description, value_type) VALUES
  ('questions_published', 'true', 'Câu hỏi đã công bố', 'Khi true, ứng viên có thể xem và trả lời câu hỏi', 'boolean'),
  ('interview_min_score', '8.0', 'Điểm tối thiểu qua vòng PV', 'Điểm phỏng vấn tối thiểu để pass', 'number'),
  ('interview_format', 'Online & Offline', 'Hình thức phỏng vấn', 'Hình thức phỏng vấn', 'string'),
  ('interview_location', 'Trường Quốc tế VNU-IS / Google Meet', 'Địa điểm phỏng vấn', 'Địa điểm phỏng vấn', 'string'),
  ('auto_sync_evaluations', 'true', 'Tự động đồng bộ đánh giá', 'Tự động cập nhật điểm sau khi chấm', 'boolean')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY for new tables
-- ============================================================

-- admin_accounts: Public read (needed for login check), admin write
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_accounts_select_all" ON admin_accounts 
  FOR SELECT USING (true);

CREATE POLICY "admin_accounts_insert" ON admin_accounts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_accounts_update" ON admin_accounts 
  FOR UPDATE USING (true);

CREATE POLICY "admin_accounts_delete" ON admin_accounts 
  FOR DELETE USING (true);

-- deleted_accounts: Public read (needed for login check), admin write
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deleted_accounts_select_all" ON deleted_accounts 
  FOR SELECT USING (true);

CREATE POLICY "deleted_accounts_insert" ON deleted_accounts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "deleted_accounts_delete" ON deleted_accounts 
  FOR DELETE USING (true);

-- ============================================================
-- TRIGGERS for updated_at
-- ============================================================
CREATE TRIGGER trg_admin_accounts_updated_at
  BEFORE UPDATE ON admin_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Update system_settings RLS to allow unauthenticated reads
-- and admin writes (the existing policy uses get_user_role()
-- which requires auth — for cookie-based admin login we need
-- broader insert/update)
-- ============================================================

-- Allow insert for settings (for seeding / admin updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'settings_insert_all'
  ) THEN
    CREATE POLICY "settings_insert_all" ON system_settings 
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'settings_update_all'
  ) THEN
    CREATE POLICY "settings_update_all" ON system_settings 
      FOR UPDATE USING (true);
  END IF;
END $$;
