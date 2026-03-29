-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CLINICS table
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  website TEXT,
  working_hours JSONB DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  plan TEXT NOT NULL DEFAULT 'TRIAL' CHECK (plan IN ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ANNUAL')),
  status TEXT NOT NULL DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '9 days'),
  google_calendar_token JSONB,
  google_calendar_id TEXT,
  retell_agent_id TEXT,
  custom_greeting TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAFF table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('dentist', 'orthodontist', 'hygienist', 'surgeon', 'pediatric', 'assistant', 'receptionist')),
  specialties TEXT[] DEFAULT '{}',
  working_days TEXT[] DEFAULT '{}',
  working_hours JSONB DEFAULT '{"open": "09:00", "close": "18:00"}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENTS table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
  created_by TEXT NOT NULL DEFAULT 'MANUAL' CHECK (created_by IN ('AI_PHONE', 'AI_CHAT', 'MANUAL', 'GOOGLE_CALENDAR')),
  notes TEXT,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CALL_LOGS table
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  retell_call_id TEXT,
  caller_number TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  transcript JSONB DEFAULT '[]',
  outcome TEXT NOT NULL DEFAULT 'INFO' CHECK (outcome IN ('BOOKED', 'INFO', 'TRANSFERRED', 'MISSED', 'SPAM')),
  sentiment TEXT NOT NULL DEFAULT 'NEUTRAL' CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT_MESSAGES table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  plan TEXT NOT NULL CHECK (plan IN ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ANNUAL')),
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  google_rating DECIMAL(3, 1),
  review_count INTEGER,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'НОВ',
  priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  cold_call_script TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  next_followup TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING_POSTS table
CREATE TABLE IF NOT EXISTS marketing_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'linkedin')),
  hook_category TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  engagement_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_call_logs_clinic_created ON call_logs(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_staff_clinic ON staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_clinic ON payments(clinic_id);

-- ROW LEVEL SECURITY
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Clinics: users see only their own clinic
CREATE POLICY "clinics_own" ON clinics
  FOR ALL USING (auth.uid() = user_id);

-- Staff: users see staff of their own clinic
CREATE POLICY "staff_own" ON staff
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );

-- Appointments: users see appointments of their own clinic
CREATE POLICY "appointments_own" ON appointments
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );

-- Call logs: users see call logs of their own clinic
CREATE POLICY "call_logs_own" ON call_logs
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );

-- Chat messages: users see chat messages of their own clinic
CREATE POLICY "chat_messages_own" ON chat_messages
  FOR ALL USING (
    clinic_id IS NULL OR
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );

-- Payments: users see payments of their own clinic
CREATE POLICY "payments_own" ON payments
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );

-- Leads: only admins (no RLS needed as admin panel handles auth differently)
-- Marketing posts: no RLS needed as it's admin only

-- Auto-update updated_at for clinics
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
