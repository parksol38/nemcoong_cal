import { addDays, format } from "date-fns";
import type { ShiftType } from "./types";
import { SHIFT_LABELS } from "./types";
import {
  DEFAULT_SHIFT_PATTERN,
  getShiftPattern,
  patternShortLabels,
  type ShiftPatternId,
} from "./shiftPatterns";

export {
  DEFAULT_SHIFT_PATTERN,
  getShiftPattern,
  legendShiftTypes,
  patternShortLabels,
  patternSupportsFill,
  resolveShiftPatternId,
  selectableShiftTypes,
  SHIFT_PATTERNS,
  type ShiftPatternId,
} from "./shiftPatterns";

export function getRotationDayLabel(
  index: number,
  patternId: string = DEFAULT_SHIFT_PATTERN,
): string {
  const rotation = getShiftPattern(patternId).rotation;
  if (rotation.length === 0) return "직접 입력";
  const i = ((index % rotation.length) + rotation.length) % rotation.length;
  const short = patternShortLabels(patternId)[i] ?? "";
  return `${i + 1}일차 · ${short}(${SHIFT_LABELS[rotation[i]!]})`;
}

/** 선택한 근무 유형이 패턴에서 처음 나오는 위치 */
export function findPatternIndex(
  shiftType: ShiftType,
  patternId: string = DEFAULT_SHIFT_PATTERN,
): number {
  const rotation = getShiftPattern(patternId).rotation;
  if (rotation.length === 0) return 0;
  const idx = rotation.indexOf(shiftType);
  return idx >= 0 ? idx : 0;
}

export function buildPatternShifts(input: {
  startDate: Date;
  patternIndex: number;
  dayCount: number;
  patternId?: string | ShiftPatternId;
}): { date: string; shiftType: ShiftType }[] {
  const rotation = getShiftPattern(input.patternId).rotation;
  if (rotation.length === 0) return [];

  const result: { date: string; shiftType: ShiftType }[] = [];
  for (let i = 0; i < input.dayCount; i++) {
    const type = rotation[(input.patternIndex + i) % rotation.length]!;
    result.push({
      date: format(addDays(input.startDate, i), "yyyy-MM-dd"),
      shiftType: type,
    });
  }
  return result;
}
