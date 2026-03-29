export type ClinicPlan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ANNUAL";
export type ClinicStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
export type AppointmentStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type AppointmentCreatedBy = "AI_PHONE" | "AI_CHAT" | "MANUAL" | "GOOGLE_CALENDAR";
export type CallOutcome = "BOOKED" | "INFO" | "TRANSFERRED" | "MISSED" | "SPAM";
export type CallSentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type LeadStatus =
  | "НОВ"
  | "ПРОУЧЕН"
  | "КОНТАКТУВАН"
  | "ЗАИНТЕРЕСОВАН"
  | "ДЕМО"
  | "ПРЕГОВОРИ"
  | "КОНВЕРТИРАН"
  | "ЗАГУБЕН";
export type ChatRole = "user" | "assistant" | "system";
export type StaffRole =
  | "dentist"
  | "orthodontist"
  | "hygienist"
  | "surgeon"
  | "pediatric"
  | "assistant"
  | "receptionist";
export type Platform = "facebook" | "instagram" | "tiktok" | "linkedin";
export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";

export interface WorkingHours {
  monday?: { open: string; close: string; isOpen: boolean };
  tuesday?: { open: string; close: string; isOpen: boolean };
  wednesday?: { open: string; close: string; isOpen: boolean };
  thursday?: { open: string; close: string; isOpen: boolean };
  friday?: { open: string; close: string; isOpen: boolean };
  saturday?: { open: string; close: string; isOpen: boolean };
  sunday?: { open: string; close: string; isOpen: boolean };
}

export interface GoogleCalendarToken {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface Clinic {
  id: string;
  user_id: string;
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  website?: string;
  working_hours: WorkingHours;
  services: string[];
  plan: ClinicPlan;
  status: ClinicStatus;
  trial_ends_at?: string;
  google_calendar_token?: GoogleCalendarToken;
  google_calendar_id?: string;
  retell_agent_id?: string;
  custom_greeting?: string;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  clinic_id: string;
  name: string;
  role: StaffRole;
  specialties: string[];
  working_days: string[];
  working_hours: { open: string; close: string };
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  staff_id?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  service: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  created_by: AppointmentCreatedBy;
  notes?: string;
  google_event_id?: string;
  created_at: string;
  staff?: Staff;
}

export interface CallLog {
  id: string;
  clinic_id: string;
  retell_call_id?: string;
  caller_number: string;
  duration_seconds: number;
  transcript?: { role: string; content: string }[];
  outcome: CallOutcome;
  sentiment: CallSentiment;
  appointment_id?: string;
  recording_url?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  clinic_id?: string;
  session_id: string;
  role: ChatRole;
  content: string;
  appointment_id?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  clinic_id: string;
  amount: number;
  currency: string;
  plan: ClinicPlan;
  stripe_payment_id?: string;
  stripe_subscription_id?: string;
  status: PaymentStatus;
  receipt_url?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  clinic_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  google_rating?: number;
  review_count?: number;
  website?: string;
  status: LeadStatus;
  priority: number;
  cold_call_script?: string;
  notes?: string;
  tags: string[];
  next_followup?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingPost {
  id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  platform: Platform;
  hook_category?: string;
  status: PostStatus;
  scheduled_for?: string;
  published_at?: string;
  engagement_metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    reach?: number;
    impressions?: number;
  };
  created_at: string;
}

export interface DashboardStats {
  todayAppointments: number;
  todayCalls: number;
  aiHandledPercent: number;
  savedClients: number;
  weeklyAppointments: { day: string; count: number }[];
}
