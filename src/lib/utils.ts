import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: bg });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "d MMM yyyy, HH:mm", { locale: bg });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString: string): string {
  try {
    // Handle "HH:mm:ss" or "HH:mm" format
    const parts = timeString.split(":");
    return `${parts[0]}:${parts[1]}`;
  } catch {
    return timeString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: bg });
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  if (currency === "BGN") {
    return `${amount.toFixed(2)} лв`;
  }
  return `€${amount.toFixed(2)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}с`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}м`;
  return `${minutes}м ${remainingSeconds}с`;
}

export const BULGARIAN_DAYS = {
  monday: "Понеделник",
  tuesday: "Вторник",
  wednesday: "Сряда",
  thursday: "Четвъртък",
  friday: "Петък",
  saturday: "Събота",
  sunday: "Неделя",
};

export const STAFF_ROLE_LABELS: Record<string, string> = {
  dentist: "Зъболекар",
  orthodontist: "Ортодонт",
  hygienist: "Хигиенист",
  surgeon: "Хирург",
  pediatric: "Детски дентист",
  assistant: "Асистент",
  receptionist: "Рецепционист",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Потвърден",
  CANCELLED: "Отменен",
  COMPLETED: "Завършен",
  NO_SHOW: "Не се яви",
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  NO_SHOW: "bg-yellow-500/20 text-yellow-400",
};

export const CALL_OUTCOME_LABELS: Record<string, string> = {
  BOOKED: "Записан час",
  INFO: "Информация",
  TRANSFERRED: "Прехвърлен",
  MISSED: "Пропуснато",
  SPAM: "Спам",
};

export const CALL_OUTCOME_COLORS: Record<string, string> = {
  BOOKED: "bg-green-500/20 text-green-400",
  INFO: "bg-blue-500/20 text-blue-400",
  TRANSFERRED: "bg-purple-500/20 text-purple-400",
  MISSED: "bg-yellow-500/20 text-yellow-400",
  SPAM: "bg-red-500/20 text-red-400",
};

export const CALL_SENTIMENT_EMOJI: Record<string, string> = {
  POSITIVE: "😊",
  NEUTRAL: "😐",
  NEGATIVE: "😞",
};

export const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Пробен",
  STARTER: "Стартов",
  PROFESSIONAL: "Професионален",
  ANNUAL: "Годишен",
};

export const PLAN_COLORS: Record<string, string> = {
  TRIAL: "bg-yellow-500/20 text-yellow-400",
  STARTER: "bg-blue-500/20 text-blue-400",
  PROFESSIONAL: "bg-purple-500/20 text-purple-400",
  ANNUAL: "bg-amber-500/20 text-amber-400",
};
