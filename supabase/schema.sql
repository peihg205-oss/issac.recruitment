-- ============================================================
-- iSSAC RECRUITMENT MANAGEMENT SYSTEM
-- Database Schema v1.0
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(20) DEFAULT '#1e40af',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  student_id VARCHAR(20),
  university VARCHAR(255),
  cohort VARCHAR(20),
  major VARCHAR(255),
  high_school VARCHAR(255),
  address TEXT,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'super_admin')),
  department_id UUID REFERENCES departments(id),
  admin_role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECRUITMENT ROUNDS
-- ============================================================
CREATE TABLE recruitment_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  round_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUESTIONS
-- ============================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  round_id UUID REFERENCES recruitment_rounds(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL DEFAULT 'long_text'
    CHECK (question_type IN ('short_text','long_text','multiple_choice','checkbox','dropdown','file_upload')),
  placeholder TEXT,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUESTION OPTIONS (for multiple_choice, checkbox, dropdown)
-- ============================================================
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text VARCHAR(500) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  second_department_id UUID REFERENCES departments(id),
  round_id UUID REFERENCES recruitment_rounds(id),
  status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'submitted',
      'received',
      'reviewing',
      'approved',
      'rejected',
      'interview_scheduled',
      'interviewed',
      'evaluating',
      'evaluated',
      'finalized'
    )),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATION ANSWERS
-- ============================================================
CREATE TABLE application_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  answer_text TEXT,
  answer_options JSONB,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, question_id)
);

-- ============================================================
-- INTERVIEW SLOTS
-- ============================================================
CREATE TABLE interview_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  round_id UUID REFERENCES recruitment_rounds(id),
  interview_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  format VARCHAR(20) NOT NULL DEFAULT 'online' CHECK (format IN ('online','offline')),
  location TEXT,
  meeting_url TEXT,
  max_candidates INTEGER DEFAULT 1,
  current_candidates INTEGER DEFAULT 0,
  interviewers JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERVIEWS (candidate booking)
-- ============================================================
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES interview_slots(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVALUATION CRITERIA
-- ============================================================
CREATE TABLE evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL DEFAULT 20,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVALUATIONS (one per interviewer per application)
-- ============================================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  total_score DECIMAL(5,2),
  strengths TEXT,
  weaknesses TEXT,
  overall_comment TEXT,
  recommendation VARCHAR(20) CHECK (recommendation IN ('pass','waitlist','fail')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, interviewer_id)
);

-- ============================================================
-- EVALUATION SCORES (per criteria per evaluation)
-- ============================================================
CREATE TABLE evaluation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id),
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evaluation_id, criteria_id)
);

-- ============================================================
-- CANDIDATE RANKINGS
-- ============================================================
CREATE TABLE candidate_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  department_id UUID REFERENCES departments(id),
  final_score DECIMAL(5,2),
  rank_number INTEGER,
  result VARCHAR(20) DEFAULT 'pending' CHECK (result IN ('pending','pass','waitlist','fail')),
  is_tie BOOLEAN DEFAULT false,
  tie_resolved BOOLEAN DEFAULT false,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINAL RESULTS
-- ============================================================
CREATE TABLE final_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  result VARCHAR(20) NOT NULL CHECK (result IN ('pass','waitlist','fail')),
  announcement_message TEXT,
  is_published BOOLEAN DEFAULT false,
  finalized_by UUID REFERENCES auth.users(id),
  finalized_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(255),
  department VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  label VARCHAR(255),
  description TEXT,
  value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string','number','boolean','json','date')),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_department ON applications(department_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_application_answers_application ON application_answers(application_id);
CREATE INDEX idx_questions_department ON questions(department_id);
CREATE INDEX idx_evaluations_application ON evaluations(application_id);
CREATE INDEX idx_evaluations_interviewer ON evaluations(interviewer_id);
CREATE INDEX idx_candidate_rankings_department ON candidate_rankings(department_id);
CREATE INDEX idx_candidate_rankings_score ON candidate_rankings(final_score DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['departments','profiles','recruitment_rounds','questions','applications',
    'application_answers','interview_slots','interviews','evaluation_criteria',
    'evaluations','evaluation_scores','candidate_rankings','final_results','system_settings']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- Create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Calculate evaluation total score
CREATE OR REPLACE FUNCTION calculate_evaluation_total(eval_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(es.score), 0)
  INTO total
  FROM evaluation_scores es
  WHERE es.evaluation_id = eval_id;
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Recalculate candidate ranking
CREATE OR REPLACE FUNCTION recalculate_rankings(dept_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  quota INTEGER;
BEGIN
  -- Get quota from settings
  SELECT COALESCE(NULLIF(value,'')::INTEGER, 15)
  INTO quota
  FROM system_settings
  WHERE key = 'recruitment_quota';

  -- Update final_score for each application
  WITH avg_scores AS (
    SELECT
      e.application_id,
      AVG(e.total_score) as avg_score
    FROM evaluations e
    WHERE e.status = 'submitted'
    GROUP BY e.application_id
  ),
  ranked AS (
    SELECT
      a.id as application_id,
      a.department_id,
      COALESCE(av.avg_score, 0) as final_score,
      RANK() OVER (
        PARTITION BY a.department_id
        ORDER BY COALESCE(av.avg_score, 0) DESC
      ) as rank_num
    FROM applications a
    LEFT JOIN avg_scores av ON av.application_id = a.id
    WHERE a.status IN ('evaluated','finalized','interviewed','evaluating')
    AND (dept_id IS NULL OR a.department_id = dept_id)
  )
  INSERT INTO candidate_rankings (application_id, department_id, final_score, rank_number, result)
  SELECT
    r.application_id,
    r.department_id,
    r.final_score,
    r.rank_num,
    CASE
      WHEN r.rank_num <= quota THEN 'pass'
      WHEN r.rank_num <= quota * 1.5 THEN 'waitlist'
      ELSE 'fail'
    END
  FROM ranked r
  ON CONFLICT (application_id)
  DO UPDATE SET
    final_score = EXCLUDED.final_score,
    rank_number = EXCLUDED.rank_number,
    result = EXCLUDED.result,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() IN ('admin','super_admin'));

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid() OR get_user_role() IN ('admin','super_admin'));

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- APPLICATIONS policies
CREATE POLICY "applications_select_member" ON applications FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_user_role() IN ('admin','super_admin')
  );

CREATE POLICY "applications_insert_member" ON applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "applications_update" ON applications FOR UPDATE
  USING (
    user_id = auth.uid()
    OR get_user_role() IN ('admin','super_admin')
  );

-- APPLICATION ANSWERS policies
CREATE POLICY "answers_select" ON application_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR get_user_role() IN ('admin','super_admin'))
    )
  );

CREATE POLICY "answers_insert" ON application_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "answers_update" ON application_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR get_user_role() IN ('admin','super_admin'))
    )
  );

-- QUESTIONS policies (public read, admin write)
CREATE POLICY "questions_select_all" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_insert_admin" ON questions FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','super_admin'));
CREATE POLICY "questions_update_admin" ON questions FOR UPDATE
  USING (get_user_role() IN ('admin','super_admin'));
CREATE POLICY "questions_delete_admin" ON questions FOR DELETE
  USING (get_user_role() IN ('admin','super_admin'));

-- QUESTION OPTIONS policies
CREATE POLICY "options_select_all" ON question_options FOR SELECT USING (true);
CREATE POLICY "options_insert_admin" ON question_options FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','super_admin'));
CREATE POLICY "options_update_admin" ON question_options FOR UPDATE
  USING (get_user_role() IN ('admin','super_admin'));
CREATE POLICY "options_delete_admin" ON question_options FOR DELETE
  USING (get_user_role() IN ('admin','super_admin'));

-- DEPARTMENTS policies
CREATE POLICY "departments_select_all" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_write_admin" ON departments FOR ALL
  USING (get_user_role() = 'super_admin');

-- RECRUITMENT ROUNDS
CREATE POLICY "rounds_select_all" ON recruitment_rounds FOR SELECT USING (true);
CREATE POLICY "rounds_write_admin" ON recruitment_rounds FOR ALL
  USING (get_user_role() IN ('admin','super_admin'));

-- INTERVIEW SLOTS policies
CREATE POLICY "slots_select_all" ON interview_slots FOR SELECT USING (is_active = true OR get_user_role() IN ('admin','super_admin'));
CREATE POLICY "slots_write_admin" ON interview_slots FOR ALL
  USING (get_user_role() IN ('admin','super_admin'));

-- INTERVIEWS policies
CREATE POLICY "interviews_select" ON interviews FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_user_role() IN ('admin','super_admin')
  );

CREATE POLICY "interviews_insert" ON interviews FOR INSERT
  WITH CHECK (user_id = auth.uid() OR get_user_role() IN ('admin','super_admin'));

CREATE POLICY "interviews_update" ON interviews FOR UPDATE
  USING (user_id = auth.uid() OR get_user_role() IN ('admin','super_admin'));

-- EVALUATIONS policies
CREATE POLICY "evaluations_select_admin" ON evaluations FOR SELECT
  USING (
    interviewer_id = auth.uid()
    OR get_user_role() IN ('admin','super_admin')
  );

CREATE POLICY "evaluations_insert_admin" ON evaluations FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','super_admin'));

CREATE POLICY "evaluations_update_own" ON evaluations FOR UPDATE
  USING (
    (interviewer_id = auth.uid() AND status = 'draft')
    OR get_user_role() = 'super_admin'
  );

-- EVALUATION SCORES
CREATE POLICY "scores_select_admin" ON evaluation_scores FOR SELECT
  USING (get_user_role() IN ('admin','super_admin'));

CREATE POLICY "scores_write_admin" ON evaluation_scores FOR ALL
  USING (get_user_role() IN ('admin','super_admin'));

-- EVALUATION CRITERIA
CREATE POLICY "criteria_select_all" ON evaluation_criteria FOR SELECT USING (true);
CREATE POLICY "criteria_write_admin" ON evaluation_criteria FOR ALL
  USING (get_user_role() IN ('admin','super_admin'));

-- CANDIDATE RANKINGS
CREATE POLICY "rankings_select_admin" ON candidate_rankings FOR SELECT
  USING (get_user_role() IN ('admin','super_admin'));

CREATE POLICY "rankings_write_admin" ON candidate_rankings FOR ALL
  USING (get_user_role() IN ('admin','super_admin'));

-- FINAL RESULTS policies
CREATE POLICY "results_select" ON final_results FOR SELECT
  USING (
    (user_id = auth.uid() AND is_published = true)
    OR get_user_role() IN ('admin','super_admin')
  );

CREATE POLICY "results_write_superadmin" ON final_results FOR ALL
  USING (get_user_role() = 'super_admin');

-- NOTIFICATIONS policies
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin" ON notifications FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','super_admin') OR user_id = auth.uid());

-- AUDIT LOGS
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT
  USING (get_user_role() IN ('admin','super_admin'));

CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT WITH CHECK (true);

-- SYSTEM SETTINGS
CREATE POLICY "settings_select_all" ON system_settings FOR SELECT USING (true);
CREATE POLICY "settings_write_superadmin" ON system_settings FOR ALL
  USING (get_user_role() = 'super_admin');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO departments (id, name, slug, description, color, icon) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Ban Truyền thông', 'truyen-thong', 'Quản lý truyền thông, design, content và marketing cho CLB', '#2563eb', 'Megaphone'),
  ('11111111-0000-0000-0000-000000000002', 'Ban Tư vấn', 'tu-van', 'Tư vấn hướng nghiệp và hỗ trợ sinh viên', '#059669', 'MessageSquare'),
  ('11111111-0000-0000-0000-000000000003', 'Ban Nhân sự', 'nhan-su', 'Quản lý nhân sự, tổ chức sự kiện nội bộ và tuyển dụng', '#7c3aed', 'Users'),
  ('11111111-0000-0000-0000-000000000004', 'Ban Chủ nhiệm', 'chu-nhiem', 'Ban lãnh đạo và quản lý toàn bộ CLB', '#dc2626', 'Crown');

-- Recruitment Rounds
INSERT INTO recruitment_rounds (id, name, slug, round_number, description, is_active) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Vòng 1 - Nộp đơn', 'vong-1', 1, 'Vòng nộp đơn và điền thông tin ứng tuyển', true),
  ('22222222-0000-0000-0000-000000000002', 'Vòng 2 - Phỏng vấn', 'vong-2', 2, 'Vòng phỏng vấn trực tiếp với Ban tuyển dụng', true);

-- Questions for Ban Truyền thông
INSERT INTO questions (department_id, round_id, question_text, question_type, is_required, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Bạn biết đến iSSAC qua kênh nào?', 'multiple_choice', true, 1),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Vì sao bạn muốn tham gia Ban Truyền thông iSSAC?', 'long_text', true, 2),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Bạn đã từng có kinh nghiệm làm truyền thông, content hoặc design chưa? Hãy mô tả.', 'long_text', true, 3),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Bạn có thể sử dụng phần mềm nào trong số sau?', 'checkbox', false, 4),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Link portfolio hoặc tác phẩm của bạn (nếu có)', 'short_text', false, 5),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Bạn có thể dành bao nhiêu giờ mỗi tuần cho hoạt động CLB?', 'dropdown', true, 6),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Mục tiêu của bạn khi tham gia iSSAC là gì?', 'long_text', true, 7);

-- Questions for Ban Tư vấn
INSERT INTO questions (department_id, round_id, question_text, question_type, is_required, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Bạn biết đến iSSAC qua kênh nào?', 'multiple_choice', true, 1),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Vì sao bạn muốn tham gia Ban Tư vấn iSSAC?', 'long_text', true, 2),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Mô tả một tình huống bạn đã giúp ai đó giải quyết vấn đề. Kết quả như thế nào?', 'long_text', true, 3),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Bạn đánh giá kỹ năng giao tiếp của mình như thế nào?', 'dropdown', true, 4),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Bạn đã từng tham gia hoạt động tư vấn, mentoring chưa? Nếu có, hãy mô tả.', 'long_text', false, 5),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Bạn có thể dành bao nhiêu giờ mỗi tuần cho hoạt động CLB?', 'dropdown', true, 6),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Điều bạn muốn đóng góp cho cộng đồng sinh viên VNU-IS là gì?', 'long_text', true, 7);

-- Questions for Ban Nhân sự
INSERT INTO questions (department_id, round_id, question_text, question_type, is_required, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Bạn biết đến iSSAC qua kênh nào?', 'multiple_choice', true, 1),
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Vì sao bạn muốn tham gia Ban Nhân sự iSSAC?', 'long_text', true, 2),
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Bạn hiểu gì về vai trò của Ban Nhân sự trong một tổ chức?', 'long_text', true, 3),
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Mô tả một tình huống xung đột nhóm và cách bạn xử lý.', 'long_text', true, 4),
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Bạn đánh giá khả năng tổ chức sự kiện của mình như thế nào?', 'dropdown', true, 5),
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Bạn có kinh nghiệm làm việc nhóm lớn (>10 người) chưa?', 'multiple_choice', true, 6),
  ('11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Điều bạn muốn đóng góp cho iSSAC là gì?', 'long_text', true, 7);

-- Question Options
-- Bạn biết iSSAC qua đâu (common for all)
INSERT INTO question_options (question_id, option_text, sort_order)
SELECT q.id, opt.text, opt.ord
FROM questions q
CROSS JOIN (VALUES
  ('Facebook', 1), ('Instagram', 2), ('TikTok', 3),
  ('Từ bạn bè / người quen', 4), ('Poster/Banner tại trường', 5), ('Khác', 6)
) AS opt(text, ord)
WHERE q.question_text = 'Bạn biết đến iSSAC qua kênh nào?';

-- Software options for Truyền thông
INSERT INTO question_options (question_id, option_text, sort_order)
SELECT q.id, opt.text, opt.ord
FROM questions q
CROSS JOIN (VALUES
  ('Canva', 1), ('Adobe Photoshop', 2), ('Adobe Illustrator', 3),
  ('CapCut', 4), ('Adobe Premiere', 5), ('Figma', 6), ('Chưa có kinh nghiệm', 7)
) AS opt(text, ord)
WHERE q.question_text LIKE '%phần mềm%';

-- Hours per week options
INSERT INTO question_options (question_id, option_text, sort_order)
SELECT q.id, opt.text, opt.ord
FROM questions q
CROSS JOIN (VALUES
  ('Dưới 5 giờ', 1), ('5-10 giờ', 2), ('10-15 giờ', 3), ('Trên 15 giờ', 4)
) AS opt(text, ord)
WHERE q.question_text LIKE '%giờ mỗi tuần%';

-- Communication skill rating
INSERT INTO question_options (question_id, option_text, sort_order)
SELECT q.id, opt.text, opt.ord
FROM questions q
CROSS JOIN (VALUES
  ('Tốt - Tự tin khi nói chuyện với người lạ', 1),
  ('Khá - Cần một chút thời gian để quen', 2),
  ('Trung bình - Thường ngại ngùng ban đầu', 3),
  ('Cần cải thiện', 4)
) AS opt(text, ord)
WHERE q.question_text LIKE '%giao tiếp%';

-- Organization skill rating
INSERT INTO question_options (question_id, option_text, sort_order)
SELECT q.id, opt.text, opt.ord
FROM questions q
CROSS JOIN (VALUES
  ('Tốt - Đã tổ chức sự kiện quy mô lớn', 1),
  ('Khá - Có tham gia vào công tác tổ chức', 2),
  ('Trung bình - Chưa có nhiều kinh nghiệm', 3),
  ('Cần cải thiện', 4)
) AS opt(text, ord)
WHERE q.question_text LIKE '%tổ chức sự kiện%';

-- Teamwork experience
INSERT INTO question_options (question_id, option_text, sort_order)
SELECT q.id, opt.text, opt.ord
FROM questions q
CROSS JOIN (VALUES
  ('Có, nhiều lần', 1),
  ('Có, một vài lần', 2),
  ('Chưa nhưng sẵn sàng học', 3)
) AS opt(text, ord)
WHERE q.question_text LIKE '%nhóm lớn%';

-- Evaluation Criteria (common for all departments)
INSERT INTO evaluation_criteria (department_id, name, description, max_score, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Kỹ năng giao tiếp', 'Khả năng diễn đạt, trình bày rõ ràng và tự tin', 20, 1),
  ('11111111-0000-0000-0000-000000000001', 'Tư duy & Giải quyết vấn đề', 'Khả năng phân tích tình huống và đề xuất giải pháp', 20, 2),
  ('11111111-0000-0000-0000-000000000001', 'Kiến thức chuyên môn', 'Hiểu biết về truyền thông, design, content', 20, 3),
  ('11111111-0000-0000-0000-000000000001', 'Tinh thần trách nhiệm', 'Cam kết và khả năng hoàn thành công việc đúng hạn', 15, 4),
  ('11111111-0000-0000-0000-000000000001', 'Phù hợp văn hóa CLB', 'Giá trị cá nhân phù hợp với sứ mệnh iSSAC', 15, 5),
  ('11111111-0000-0000-0000-000000000001', 'Ấn tượng tổng thể', 'Đánh giá chung của interviewer', 10, 6),

  ('11111111-0000-0000-0000-000000000002', 'Kỹ năng giao tiếp', 'Khả năng lắng nghe, đồng cảm và diễn đạt', 20, 1),
  ('11111111-0000-0000-0000-000000000002', 'Tư duy tư vấn', 'Khả năng đặt câu hỏi và định hướng giải pháp', 20, 2),
  ('11111111-0000-0000-0000-000000000002', 'Kiến thức về hướng nghiệp', 'Hiểu biết về career path, học bổng, kỹ năng mềm', 20, 3),
  ('11111111-0000-0000-0000-000000000002', 'Tinh thần trách nhiệm', 'Cam kết với người được tư vấn', 15, 4),
  ('11111111-0000-0000-0000-000000000002', 'Phù hợp văn hóa CLB', 'Giá trị cá nhân phù hợp với sứ mệnh iSSAC', 15, 5),
  ('11111111-0000-0000-0000-000000000002', 'Ấn tượng tổng thể', 'Đánh giá chung của interviewer', 10, 6),

  ('11111111-0000-0000-0000-000000000003', 'Kỹ năng giao tiếp', 'Khả năng truyền đạt và tương tác hiệu quả', 20, 1),
  ('11111111-0000-0000-0000-000000000003', 'Tư duy tổ chức', 'Khả năng lên kế hoạch và phối hợp công việc', 20, 2),
  ('11111111-0000-0000-0000-000000000003', 'Hiểu biết về nhân sự', 'Kiến thức về quản trị nhân sự và tuyển dụng', 20, 3),
  ('11111111-0000-0000-0000-000000000003', 'Tinh thần trách nhiệm', 'Cam kết và khả năng quản lý thời gian', 15, 4),
  ('11111111-0000-0000-0000-000000000003', 'Phù hợp văn hóa CLB', 'Giá trị cá nhân phù hợp với sứ mệnh iSSAC', 15, 5),
  ('11111111-0000-0000-0000-000000000003', 'Ấn tượng tổng thể', 'Đánh giá chung của interviewer', 10, 6);

-- System Settings
INSERT INTO system_settings (key, value, label, description, value_type) VALUES
  ('recruitment_quota', '15', 'Chỉ tiêu tuyển', 'Số lượng thành viên được tuyển mỗi mùa', 'number'),
  ('recruitment_start', '2026-09-01', 'Ngày mở đơn', 'Ngày bắt đầu nhận đơn ứng tuyển', 'date'),
  ('recruitment_end', '2026-10-15', 'Ngày đóng đơn', 'Ngày kết thúc nhận đơn ứng tuyển', 'date'),
  ('interview_start', '2026-10-20', 'Ngày bắt đầu phỏng vấn', 'Ngày bắt đầu vòng phỏng vấn', 'date'),
  ('interview_end', '2026-10-30', 'Ngày kết thúc phỏng vấn', 'Ngày kết thúc vòng phỏng vấn', 'date'),
  ('result_announcement', '2026-11-05', 'Ngày công bố kết quả', 'Ngày thông báo kết quả tuyển thành viên', 'date'),
  ('scoring_method', 'average', 'Phương pháp tính điểm', 'average = trung bình cộng, weighted = trung bình có trọng số', 'string'),
  ('allow_second_department', 'true', 'Cho phép chọn nguyện vọng 2', 'Cho phép ứng viên chọn ban thứ 2', 'boolean'),
  ('max_applications_per_user', '1', 'Số đơn tối đa mỗi ứng viên', 'Số lần ứng tuyển tối đa', 'number'),
  ('results_published', 'false', 'Kết quả đã công bố', 'Khi true, ứng viên có thể xem kết quả', 'boolean');
