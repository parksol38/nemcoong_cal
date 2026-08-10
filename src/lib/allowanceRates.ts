import { parseISO } from "date-fns";
import type { SalaryRankId } from "./salaryTable";
import {
  SHIFT_DEFAULT_TIMES,
  getShiftExtraHours,
  type Shift,
  type ShiftType,
} from "./types";
import { isPublicHoliday } from "./holidays";

/**
 * 2026 시간외·야간·휴일 수당 지급 단가
 * (경찰 경정~순경 / 소방 소방령~소방사 동일 단가)
 */
export type AllowanceUnitRates = {
  /** 시간외수당 (원/시간) */
  overtime: number;
  /** 야간수당 (원/시간) */
  night: number;
  /** 휴일수당 (원/일) */
  holiday: number;
};

/** 단가가 있는 계급만 (표 기준) */
export const ALLOWANCE_RATE_BY_RANK: Partial<
  Record<SalaryRankId, AllowanceUnitRates>
> = {
  gyeong_jeong: { overtime: 16960, night: 5653, holiday: 136331 },
  gyeong_gam: { overtime: 15282, night: 5027, holiday: 121237 },
  gyeong_wi: { overtime: 13779, night: 4593, holiday: 110763 },
  gyeong_sa: { overtime: 12934, night: 4311, holiday: 103969 },
  gyeong_jang: { overtime: 12184, night: 4061, holiday: 97944 },
  sun_gyeong: { overtime: 11175, night: 3725, holiday: 89830 },
};

export function getAllowanceRates(
  rankId: SalaryRankId,
): AllowanceUnitRates | null {
  return ALLOWANCE_RATE_BY_RANK[rankId] ?? null;
}

/**
 * 공무원수당 등에 관한 규정 기준 야간근무 시간대
 * 오후 10시(22:00) ~ 다음 날 오전 6시(06:00)
 */
export const NIGHT_ALLOWANCE_START_MIN = 22 * 60;
export const NIGHT_ALLOWANCE_END_MIN = 6 * 60;
export const NIGHT_ALLOWANCE_WINDOW_HOURS = 8;

export type AllowanceInput = {
  /** 시간외근무 (시간) — 추가로 일한 시간(extra_hours) */
  overtimeHours: number;
  /** 야간근무 (시간) — 22~06 구간에 실제 겹친 시간 */
  nightHours: number;
  /** 휴일근무 (일수) — 공휴일에 근무한 날 수 */
  holidayDays: number;
};

const WORK_TYPES = new Set<ShiftType>([
  "day",
  "night",
  "overnight",
  "day_support",
  "night_support",
]);

function parseHHMMToMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * 근무 구간이 야간수당 시간대(22:00~06:00)와 겹치는 시간(시간).
 * 예: 18:00~08:00 → 8시간 / 22:00~04:00 → 6시간 / 08:00~18:00 → 0
 */
export function calcNightAllowanceHours(
  startHHMM: string,
  endHHMM: string,
): number {
  const start = parseHHMMToMinutes(startHHMM);
  const endRaw = parseHHMMToMinutes(endHHMM);
  if (start == null || endRaw == null) return 0;

  let end = endRaw;
  if (end <= start) end += 24 * 60;

  let overlapMins = 0;
  // 근무가 걸칠 수 있는 야간 창(전날·당일·다음날)
  for (let day = -1; day <= 2; day++) {
    const nStart = day * 24 * 60 + NIGHT_ALLOWANCE_START_MIN;
    const nEnd = day * 24 * 60 + 24 * 60 + NIGHT_ALLOWANCE_END_MIN;
    const a = Math.max(start, nStart);
    const b = Math.min(end, nEnd);
    if (b > a) overlapMins += b - a;
  }

  return Math.round((overlapMins / 60) * 10) / 10;
}

function resolveShiftTimes(shift: Shift): { start: string; end: string } | null {
  if (shift.start_time && shift.end_time) {
    return {
      start: shift.start_time.slice(0, 5),
      end: shift.end_time.slice(0, 5),
    };
  }
  return SHIFT_DEFAULT_TIMES[shift.shift_type];
}

/** 달력에 입력된 근무로 시간외·야간·휴일 수량 집계 */
export function summarizeAllowanceInput(
  shifts: Shift[],
  monthPrefix: string, // yyyy-MM
): AllowanceInput {
  let overtimeHours = 0;
  let nightHours = 0;
  let holidayDays = 0;

  for (const s of shifts) {
    if (!s.date.startsWith(monthPrefix)) continue;
    if (!WORK_TYPES.has(s.shift_type)) continue;

    // 시간외: 사용자가 입력한 추가 근무 시간
    overtimeHours += getShiftExtraHours(s);

    // 야간: 22~06에 겹친 시간만 (정책)
    const times = resolveShiftTimes(s);
    if (times) {
      nightHours += calcNightAllowanceHours(times.start, times.end);
    }

    // 휴일: 공휴일에 근무하면 1일분 (시간 무관)
    try {
      if (isPublicHoliday(parseISO(s.date))) {
        holidayDays += 1;
      }
    } catch {
      // 날짜 파싱 실패 시 무시
    }
  }

  return {
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
    holidayDays,
  };
}

export type AllowanceBreakdown = {
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  total: number;
};

export function calcAllowancePay(
  rates: AllowanceUnitRates,
  input: AllowanceInput,
): AllowanceBreakdown {
  const overtimePay = Math.round(rates.overtime * input.overtimeHours);
  const nightPay = Math.round(rates.night * input.nightHours);
  const holidayPay = Math.round(rates.holiday * input.holidayDays);
  return {
    overtimePay,
    nightPay,
    holidayPay,
    total: overtimePay + nightPay + holidayPay,
  };
}
