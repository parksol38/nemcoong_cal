import type { SalaryRankId } from "./salaryTable";
import { getShiftBaseHours, getShiftExtraHours, type Shift } from "./types";
import { isPublicHoliday } from "./holidays";
import { parseISO } from "date-fns";

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

export type AllowanceInput = {
  /** 시간외근무 (시간) — 추가시간(extra_hours) 합 */
  overtimeHours: number;
  /** 야간근무 (시간) — 야간·심야·야간자원 기본근무 */
  nightHours: number;
  /** 휴일근무 (일수) — 공휴일에 근무한 날 */
  holidayDays: number;
};

const WORK_TYPES = new Set([
  "day",
  "night",
  "overnight",
  "day_support",
  "night_support",
]);

const NIGHT_TYPES = new Set(["night", "overnight", "night_support"]);

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

    overtimeHours += getShiftExtraHours(s);

    if (NIGHT_TYPES.has(s.shift_type)) {
      nightHours += getShiftBaseHours(s);
    }

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
