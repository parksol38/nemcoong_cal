export type ShiftType =
  | "day"
  | "night"
  | "overnight"
  | "rest"
  | "off"
  | "day_support"
  | "night_support";

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
  start_time?: string | null; // HH:mm
  end_time?: string | null; // HH:mm
  /** 교육 등 근무시간 외 추가 시간 */
  extra_hours?: number | null;
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
  day_support: "주간자원",
  night_support: "야간자원",
};

/** 달력 셀용 짧은 라벨 (가로 한 줄) */
export const SHIFT_SHORT_LABELS: Record<ShiftType, string> = {
  day: "주",
  night: "야",
  overnight: "심",
  rest: "비",
  off: "휴",
  day_support: "주자",
  night_support: "야자",
};

/** 달력 셀 본문용 라벨 (가운데 표시) */
export const SHIFT_CELL_LABELS: Record<ShiftType, string> = {
  day: "주간",
  night: "야간",
  overnight: "심야",
  rest: "비번",
  off: "휴무",
  day_support: "주자",
  night_support: "야자",
};

/** 근무 형태별 기본 근무시간(시간). 비번·휴무는 0 */
export const SHIFT_HOURS: Record<ShiftType, number> = {
  day: 10,
  night: 14,
  overnight: 6,
  rest: 0,
  off: 0,
  day_support: 10,
  night_support: 14,
};

/** 기본 시작·종료 시각 (자원 근무 기본값에도 사용) */
export const SHIFT_DEFAULT_TIMES: Record<
  ShiftType,
  { start: string; end: string } | null
> = {
  day: { start: "08:00", end: "18:00" },
  night: { start: "18:00", end: "08:00" },
  overnight: { start: "22:00", end: "04:00" },
  rest: null,
  off: null,
  day_support: { start: "08:00", end: "18:00" },
  night_support: { start: "18:00", end: "08:00" },
};

export function isSupportShift(type: ShiftType) {
  return type === "day_support" || type === "night_support";
}

/** HH:mm ~ HH:mm 근무시간(시간). 자정 넘김 허용 */
export function calcWorkHours(start: string, end: string): number {
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };
  const s = parse(start);
  const e = parse(end);
  if (s == null || e == null) return 0;
  let mins = e - s;
  if (mins <= 0) mins += 24 * 60;
  const hours = mins / 60;
  return Math.round(hours * 10) / 10;
}

export function getShiftBaseHours(shift: {
  shift_type: ShiftType;
  start_time?: string | null;
  end_time?: string | null;
}): number {
  if (shift.start_time && shift.end_time) {
    return calcWorkHours(shift.start_time, shift.end_time);
  }
  return SHIFT_HOURS[shift.shift_type] ?? 0;
}

export function getShiftExtraHours(shift: {
  extra_hours?: number | null;
}): number {
  const n = Number(shift.extra_hours);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 10) / 10;
}

/** 기본 근무 + 추가 시간 (합계, 월급·월합계용) */
export function getShiftDisplayHours(shift: {
  shift_type: ShiftType;
  start_time?: string | null;
  end_time?: string | null;
  extra_hours?: number | null;
}): number {
  const total = getShiftBaseHours(shift) + getShiftExtraHours(shift);
  return Math.round(total * 10) / 10;
}

export function formatHoursLabel(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "";
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

/** 달력 표시: 6 / 6+2 / +2 */
export function formatShiftHoursDisplay(shift: {
  shift_type: ShiftType;
  start_time?: string | null;
  end_time?: string | null;
  extra_hours?: number | null;
}): string {
  const base = getShiftBaseHours(shift);
  const extra = getShiftExtraHours(shift);
  const baseLabel = formatHoursLabel(base);
  const extraLabel = formatHoursLabel(extra);
  if (extra > 0 && base > 0) return `${baseLabel}+${extraLabel}`;
  if (extra > 0) return `+${extraLabel}`;
  return baseLabel;
}

/** 사용자가 바꿀 수 있는 근무 색 키 (자원은 주간/야간 색을 따름) */
export type ShiftColorKey = "day" | "night" | "overnight" | "rest" | "off";

export type ShiftColors = Record<ShiftColorKey, string>;

export const DEFAULT_SHIFT_COLORS: ShiftColors = {
  day: "#F97316",
  night: "#1B3A5F",
  overnight: "#0F2744",
  rest: "#9CA3AF",
  off: "#CBD5E1",
};

/** 설정에서 고를 수 있는 근무 색 팔레트 (기본 5색 포함) */
export const SHIFT_COLOR_PALETTE: string[] = [
  // 처음 세팅한 기본색
  "#F97316",
  "#1B3A5F",
  "#0F2744",
  "#9CA3AF",
  "#CBD5E1",
  // 추가 선택색
  "#EF4444",
  "#EC4899",
  "#A855F7",
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#14B8A6",
  "#22C55E",
  "#84CC16",
  "#EAB308",
  "#78716C",
];

export const SHIFT_COLOR_KEYS: ShiftColorKey[] = [
  "day",
  "night",
  "overnight",
  "rest",
  "off",
];

export function resolveShiftColorKey(type: ShiftType): ShiftColorKey {
  if (type === "day_support") return "day";
  if (type === "night_support") return "night";
  if (
    type === "day" ||
    type === "night" ||
    type === "overnight" ||
    type === "rest" ||
    type === "off"
  ) {
    return type;
  }
  return "day";
}

function normalizeHex(hex: string): string | null {
  const raw = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const h = raw.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  return null;
}

export function hexToRgba(hex: string, alpha: number): string {
  const n = normalizeHex(hex) ?? "#888888";
  const v = parseInt(n.slice(1), 16);
  const r = (v >> 16) & 255;
  const g = (v >> 8) & 255;
  const b = v & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function relativeLuminance(hex: string): number {
  const n = normalizeHex(hex) ?? "#888888";
  const v = parseInt(n.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((v >> 16) & 255);
  const g = channel((v >> 8) & 255);
  const b = channel(v & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export type ShiftVisual = {
  hex: string;
  bg: string;
  text: string;
  border: string;
  solidBg: string;
  solidText: string;
  solidBorder: string;
};

/** 커스텀 색 기반 달력/버튼용 시각 스타일 */
export function getShiftVisual(
  type: ShiftType,
  colors: ShiftColors = DEFAULT_SHIFT_COLORS,
): ShiftVisual {
  const key = resolveShiftColorKey(type);
  const hex =
    normalizeHex(colors[key]) ?? DEFAULT_SHIFT_COLORS[key];
  const pale = key === "rest" || key === "off";
  const solidText =
    pale || relativeLuminance(hex) > 0.62 ? "#1F2937" : "#FFFFFF";

  return {
    hex,
    bg: hexToRgba(hex, pale ? 0.1 : 0.16),
    text: hex,
    border: hexToRgba(hex, pale ? 0.4 : 0.5),
    solidBg: pale ? "#FFFFFF" : hex,
    solidText: pale ? hex : solidText,
    solidBorder: hex,
  };
}

/** @deprecated Tailwind 클래스 — 커스텀 색은 getShiftVisual 사용 */
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
    bg: "bg-orange-50 dark:bg-orange-950/45",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-700/60",
    chip: "bg-orange-500 text-white",
    solid: "bg-orange-500 border-orange-500 text-white",
  },
  night: {
    bg: "bg-slate-100 dark:bg-slate-800/70",
    text: "text-slate-800 dark:text-slate-200",
    border: "border-slate-400 dark:border-slate-500",
    chip: "bg-[#1B3A5F] text-white",
    solid: "bg-[#1B3A5F] border-[#1B3A5F] text-white",
  },
  overnight: {
    bg: "bg-slate-200 dark:bg-slate-900/80",
    text: "text-slate-900 dark:text-slate-100",
    border: "border-slate-500 dark:border-slate-600",
    chip: "bg-[#0F2744] text-white ring-1 ring-inset ring-white/30",
    solid: "bg-[#0F2744] border-[#0F2744] text-white",
  },
  rest: {
    bg: "bg-white dark:bg-white/5",
    text: "text-gray-400 dark:text-gray-500",
    border: "border-gray-200 dark:border-white/10",
    chip: "bg-white text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/15",
    solid: "bg-white border-gray-300 text-gray-500 dark:bg-white/5 dark:border-white/20 dark:text-gray-400",
  },
  off: {
    bg: "bg-white dark:bg-white/5",
    text: "text-gray-400 dark:text-gray-500",
    border: "border-gray-200 dark:border-white/10",
    chip: "bg-white text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/15",
    solid: "bg-white border-gray-300 text-gray-500 dark:bg-white/5 dark:border-white/20 dark:text-gray-400",
  },
  day_support: {
    bg: "bg-orange-50 dark:bg-orange-950/45",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-700/60",
    chip: "bg-orange-500 text-white",
    solid: "bg-orange-500 border-orange-500 text-white",
  },
  night_support: {
    bg: "bg-slate-100 dark:bg-slate-800/70",
    text: "text-slate-800 dark:text-slate-200",
    border: "border-slate-400 dark:border-slate-500",
    chip: "bg-[#1B3A5F] text-white",
    solid: "bg-[#1B3A5F] border-[#1B3A5F] text-white",
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
const STORAGE_SHOW_HOURS = "shift-calendar-show-hours";
const STORAGE_THEME = "shift-calendar-theme";
const STORAGE_THEME_SCHEDULE = "shift-calendar-theme-schedule";

export type AppTheme = "light" | "dark" | "schedule";
export type ResolvedTheme = "light" | "dark";

export type ThemeSchedule = {
  /** 밝게 유지할 시작 시각 (HH:mm) */
  lightStart: string;
  /** 밝게 유지할 종료 시각 (HH:mm, 이 시각부터는 어두움) */
  lightEnd: string;
};

export const DEFAULT_THEME_SCHEDULE: ThemeSchedule = {
  lightStart: "07:00",
  lightEnd: "19:00",
};

function parseHHMM(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function normalizeHHMM(value: string, fallback: string): string {
  const mins = parseHHMM(value);
  if (mins == null) return fallback;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 지정 구간이 현재 시각을 포함하는지 (종료 시각은 미포함, 자정 넘김 허용) */
export function isWithinTimeRange(
  startHHMM: string,
  endHHMM: string,
  now: Date = new Date(),
): boolean {
  const start = parseHHMM(startHHMM);
  const end = parseHHMM(endHHMM);
  if (start == null || end == null) return true;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  if (start === end) return true;
  if (start < end) return nowMins >= start && nowMins < end;
  return nowMins >= start || nowMins < end;
}

export function getThemeSchedule(): ThemeSchedule {
  if (typeof window === "undefined") return { ...DEFAULT_THEME_SCHEDULE };
  try {
    const raw = localStorage.getItem(STORAGE_THEME_SCHEDULE);
    if (!raw) return { ...DEFAULT_THEME_SCHEDULE };
    const parsed = JSON.parse(raw) as Partial<ThemeSchedule>;
    return {
      lightStart: normalizeHHMM(
        parsed.lightStart ?? DEFAULT_THEME_SCHEDULE.lightStart,
        DEFAULT_THEME_SCHEDULE.lightStart,
      ),
      lightEnd: normalizeHHMM(
        parsed.lightEnd ?? DEFAULT_THEME_SCHEDULE.lightEnd,
        DEFAULT_THEME_SCHEDULE.lightEnd,
      ),
    };
  } catch {
    return { ...DEFAULT_THEME_SCHEDULE };
  }
}

export function storeThemeSchedule(schedule: ThemeSchedule) {
  if (typeof window === "undefined") return;
  const next: ThemeSchedule = {
    lightStart: normalizeHHMM(
      schedule.lightStart,
      DEFAULT_THEME_SCHEDULE.lightStart,
    ),
    lightEnd: normalizeHHMM(schedule.lightEnd, DEFAULT_THEME_SCHEDULE.lightEnd),
  };
  localStorage.setItem(STORAGE_THEME_SCHEDULE, JSON.stringify(next));
}

/** 설정값 → 실제 적용할 밝음/어두움 */
export function resolveAppTheme(
  preference: AppTheme,
  schedule: ThemeSchedule = DEFAULT_THEME_SCHEDULE,
  now: Date = new Date(),
): ResolvedTheme {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return isWithinTimeRange(schedule.lightStart, schedule.lightEnd, now)
    ? "light"
    : "dark";
}

/** 앱 테마 설정 (기본: 밝음) */
export function getThemePreference(): AppTheme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_THEME);
  if (stored === "dark" || stored === "schedule") return stored;
  return "light";
}

export function storeThemePreference(theme: AppTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_THEME, theme);
}

export function applyThemeClass(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0B0F14" : "#F2F2F7");
  }
}

/** 달력에 근무시간 숫자 표시 여부 (기본: 보기) */
export function getShowHoursPreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_SHOW_HOURS);
  // 저장된 값이 없으면 기본 ON, 명시적으로 "0"일 때만 숨김
  if (stored == null) return true;
  return stored === "1";
}

export function storeShowHoursPreference(show: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SHOW_HOURS, show ? "1" : "0");
}

const STORAGE_SHOW_PAY = "shift-calendar-show-pay";

/** 예상 월급·시급 계산 표시 여부 (기본: 켜짐) */
export function getShowPayPreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_SHOW_PAY);
  if (stored == null) return true;
  return stored === "1";
}

export function storeShowPayPreference(show: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SHOW_PAY, show ? "1" : "0");
}

const STORAGE_SHIFT_COLORS = "shift-calendar-shift-colors";

export function getShiftColors(): ShiftColors {
  if (typeof window === "undefined") return { ...DEFAULT_SHIFT_COLORS };
  try {
    const raw = localStorage.getItem(STORAGE_SHIFT_COLORS);
    if (!raw) return { ...DEFAULT_SHIFT_COLORS };
    const parsed = JSON.parse(raw) as Partial<ShiftColors>;
    const next = { ...DEFAULT_SHIFT_COLORS };
    for (const key of SHIFT_COLOR_KEYS) {
      const normalized = parsed[key] ? normalizeHex(parsed[key]!) : null;
      if (normalized) next[key] = normalized;
    }
    return next;
  } catch {
    return { ...DEFAULT_SHIFT_COLORS };
  }
}

export function storeShiftColors(colors: ShiftColors) {
  if (typeof window === "undefined") return;
  const next = { ...DEFAULT_SHIFT_COLORS };
  for (const key of SHIFT_COLOR_KEYS) {
    next[key] = normalizeHex(colors[key]) ?? DEFAULT_SHIFT_COLORS[key];
  }
  localStorage.setItem(STORAGE_SHIFT_COLORS, JSON.stringify(next));
}

const STORAGE_HOURLY_RATES = "shift-calendar-hourly-rates";

/**
 * 경찰 순경 초임(1호봉) 근사 시급 기본값 (2026)
 * - 주간: 통상시급 ≈ 기본급 2,133,000 ÷ 209
 * - 야간: 통상 + 야간수당(약 3,725)
 * - 심야: 통상에 야간·심야 가산을 반영한 추정치
 */
export const DEFAULT_HOURLY_RATES = {
  day: 10200,
  night: 13900,
  overnight: 15500,
} as const;

export type HourlyRates = {
  day: number;
  night: number;
  overnight: number;
};

export function getHourlyRates(): HourlyRates {
  if (typeof window === "undefined") return { ...DEFAULT_HOURLY_RATES };
  try {
    const raw = localStorage.getItem(STORAGE_HOURLY_RATES);
    if (!raw) return { ...DEFAULT_HOURLY_RATES };
    const parsed = JSON.parse(raw) as Partial<HourlyRates>;
    const clamp = (n: unknown, fallback: number) => {
      const v = typeof n === "number" ? n : Number(n);
      if (!Number.isFinite(v) || v < 0) return fallback;
      return Math.round(v);
    };
    return {
      day: clamp(parsed.day, DEFAULT_HOURLY_RATES.day),
      night: clamp(parsed.night, DEFAULT_HOURLY_RATES.night),
      overnight: clamp(parsed.overnight, DEFAULT_HOURLY_RATES.overnight),
    };
  } catch {
    return { ...DEFAULT_HOURLY_RATES };
  }
}

export function storeHourlyRates(rates: HourlyRates) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_HOURLY_RATES,
    JSON.stringify({
      day: Math.round(rates.day),
      night: Math.round(rates.night),
      overnight: Math.round(rates.overnight),
    }),
  );
}

/** 근무유형 → 시급 카테고리 (자원은 주간/야간에 합산) */
export function getRateCategory(
  type: ShiftType,
): keyof HourlyRates | null {
  if (type === "day" || type === "day_support") return "day";
  if (type === "night" || type === "night_support") return "night";
  if (type === "overnight") return "overnight";
  return null;
}

export function formatWon(amount: number): string {
  const n = Math.round(amount);
  return `${n.toLocaleString("ko-KR")}원`;
}

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
