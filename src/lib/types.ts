export type ShiftType = "day" | "night" | "overnight" | "rest" | "off";

export interface Calendar {
  id: string;
  name: string;
  share_code: string;
  created_at: string;
  app_password?: string;
  password_version?: number;
}

export interface CalendarLockInfo {
  id: string;
  app_password: string;
  password_version: number;
}

export interface Shift {
  id: string;
  calendar_id: string;
  date: string; // YYYY-MM-DD
  shift_type: ShiftType;
  note: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftChangeLog {
  id: string;
  calendar_id: string;
  date: string;
  kind: "single" | "pattern";
  from_type: ShiftType | null;
  to_type: ShiftType | null;
  note: string;
  pattern_days: number | null;
  updated_by: string;
  summary: string;
  created_at: string;
}

/** 달력에 등록된 기기(접속) 이력 */
export interface CalendarDevice {
  id: string;
  calendar_id: string;
  device_id: string;
  display_name: string;
  device_label: string;
  user_agent: string;
  created_at: string;
  last_seen_at: string;
}

/** 공유 메시지(남긴 말) */
export interface CalendarMessage {
  id: string;
  calendar_id: string;
  body: string;
  updated_by: string;
  created_at: string;
}

export const SHIFT_LABELS: Record<ShiftType, string> = {
  day: "주간",
  night: "야간",
  overnight: "심야",
  rest: "비번",
  off: "휴무",
};

/** 달력 셀용 짧은 라벨 (가로 한 줄) */
export const SHIFT_SHORT_LABELS: Record<ShiftType, string> = {
  day: "주",
  night: "야",
  overnight: "심",
  rest: "비",
  off: "휴",
};

/** 근무 형태별 색상 테마 */
export const SHIFT_STYLES: Record<
  ShiftType,
  {
    bg: string;
    text: string;
    border: string;
    chip: string;
    solid: string;
  }
> = {
  day: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-300",
    chip: "bg-orange-500 text-white",
    solid: "bg-orange-500 border-orange-500 text-white",
  },
  night: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-400",
    chip: "bg-[#1B3A5F] text-white",
    solid: "bg-[#1B3A5F] border-[#1B3A5F] text-white",
  },
  overnight: {
    bg: "bg-slate-200",
    text: "text-slate-900",
    border: "border-slate-500",
    chip: "bg-[#0F2744] text-white ring-1 ring-inset ring-white/30",
    solid: "bg-[#0F2744] border-[#0F2744] text-white",
  },
  rest: {
    bg: "bg-white",
    text: "text-gray-400",
    border: "border-gray-200",
    chip: "bg-white text-gray-500 border border-gray-200",
    solid: "bg-white border-gray-300 text-gray-500",
  },
  off: {
    bg: "bg-white",
    text: "text-gray-400",
    border: "border-gray-200",
    chip: "bg-white text-gray-500 border border-gray-200",
    solid: "bg-white border-gray-300 text-gray-500",
  },
};

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const STORAGE_CALENDAR_ID = "shift-calendar-id";
const STORAGE_SHARE_CODE = "shift-calendar-share-code";
const STORAGE_DISPLAY_NAME = "shift-calendar-display-name";
const STORAGE_UNLOCKED = "shift-calendar-unlocked-v3";
const STORAGE_PASSWORD_VERSION = "shift-calendar-password-version";
const STORAGE_SEEN_CHANGES = "shift-calendar-seen-changes";
const STORAGE_DEVICE_ID = "shift-calendar-device-id";

/** 이 기기의 고유 ID (없으면 생성) */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(STORAGE_DEVICE_ID);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(STORAGE_DEVICE_ID, id);
  return id;
}

/** User-Agent 기반 간단한 기기 라벨 */
export function detectDeviceLabel(): string {
  if (typeof navigator === "undefined") return "기타 기기";
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? "Android 폰" : "Android 태블릿";
  }
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/CrOS/i.test(ua)) return "Chromebook";
  if (/Linux/i.test(ua)) return "Linux";
  return "기타 기기";
}

export function getStoredCalendarId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_CALENDAR_ID);
}

export function getStoredShareCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_SHARE_CODE);
}

export function getStoredDisplayName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_DISPLAY_NAME) ?? "";
}

export function storeDisplayName(displayName: string) {
  localStorage.setItem(STORAGE_DISPLAY_NAME, displayName.trim());
}

export function isDeviceUnlocked(currentVersion?: number): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(STORAGE_UNLOCKED) !== "1") return false;

  // 서버 비밀번호 버전이 올라가면 재잠금
  if (typeof currentVersion === "number") {
    const stored = Number(localStorage.getItem(STORAGE_PASSWORD_VERSION) ?? "0");
    if (!Number.isFinite(stored) || stored < currentVersion) {
      localStorage.removeItem(STORAGE_UNLOCKED);
      return false;
    }
  }
  return true;
}

export function unlockDevice(passwordVersion = 1) {
  localStorage.setItem(STORAGE_UNLOCKED, "1");
  localStorage.setItem(STORAGE_PASSWORD_VERSION, String(passwordVersion));
}

export function lockDevice() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_UNLOCKED);
}

/** 이 기기에서 확인한 변경 로그 ID 목록 */
export function getSeenChangeIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_SEEN_CHANGES);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markChangesSeen(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  const set = getSeenChangeIds();
  for (const id of ids) set.add(id);
  // 너무 커지지 않게 최근 400개만 유지
  const trimmed = Array.from(set).slice(-400);
  localStorage.setItem(STORAGE_SEEN_CHANGES, JSON.stringify(trimmed));
}

export function storeCalendarSession(
  calendarId: string,
  shareCode: string,
  displayName: string,
) {
  localStorage.setItem(STORAGE_CALENDAR_ID, calendarId);
  localStorage.setItem(STORAGE_SHARE_CODE, shareCode);
  localStorage.setItem(STORAGE_DISPLAY_NAME, displayName);
}

export function clearCalendarSession() {
  localStorage.removeItem(STORAGE_CALENDAR_ID);
  localStorage.removeItem(STORAGE_SHARE_CODE);
}

/** 6자리 공유 코드 생성 */
export function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
