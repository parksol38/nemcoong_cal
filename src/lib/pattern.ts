import { addDays, format } from "date-fns";
import type { ShiftType } from "./types";
import { SHIFT_LABELS } from "./types";

/**
 * 5조 3교대 · 10일 주기
 * 주 / 야 / 심 / 비 / 휴 / 주 / 야 / 비 / 비 / 휴
 */
export const ROTATION_10: ShiftType[] = [
  "day",
  "night",
  "overnight",
  "rest",
  "off",
  "day",
  "night",
  "rest",
  "rest",
  "off",
];

export const ROTATION_SHORT_LABELS = [
  "주",
  "야",
  "심",
  "비",
  "휴",
  "주",
  "야",
  "비",
  "비",
  "휴",
] as const;

export function getRotationDayLabel(index: number): string {
  const i = ((index % 10) + 10) % 10;
  return `${i + 1}일차 · ${ROTATION_SHORT_LABELS[i]}(${SHIFT_LABELS[ROTATION_10[i]]})`;
}

/** 선택한 근무 유형이 패턴에서 처음 나오는 위치 (0~9) */
export function findPatternIndex(shiftType: ShiftType): number {
  const idx = ROTATION_10.indexOf(shiftType);
  return idx >= 0 ? idx : 0;
}

export function buildPatternShifts(input: {
  startDate: Date;
  patternIndex: number;
  dayCount: number;
}): { date: string; shiftType: ShiftType }[] {
  const result: { date: string; shiftType: ShiftType }[] = [];
  for (let i = 0; i < input.dayCount; i++) {
    const type = ROTATION_10[(input.patternIndex + i) % ROTATION_10.length];
    result.push({
      date: format(addDays(input.startDate, i), "yyyy-MM-dd"),
      shiftType: type,
    });
  }
  return result;
}
