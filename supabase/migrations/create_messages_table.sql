CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('member', 'admin')),
  sender_name TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own messages"
  ON messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert own messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can insert messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can update messages"
  ON messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Members can update own received messages"
  ON messages FOR UPDATE TO authenticated
  USING (application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()) AND sender_role = 'admin');

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
