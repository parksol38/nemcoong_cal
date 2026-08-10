import type { ShiftType } from "./types";
import { SHIFT_SHORT_LABELS } from "./types";

export type ShiftPatternId = string;

export type ShiftPatternDef = {
  id: ShiftPatternId;
  name: string;
  hint: string;
  rotation: ShiftType[];
};

export const DEFAULT_SHIFT_PATTERN: ShiftPatternId = "police_5_3_10";

/** 경찰·소방(공공안전) 전용 교대 패턴 */
export const SHIFT_PATTERNS: ShiftPatternDef[] = [
  {
    id: "police_5_3_10",
    name: "경찰 5조3교대",
    hint: "주야심비휴 · 주야비비휴 (10일)",
    rotation: [
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
    ],
  },
  {
    id: "safety_4team_2shift",
    name: "4조2교대 (소방·경찰)",
    hint: "09~18 / 18~09 · 주-야-비-휴",
    rotation: ["day", "night", "rest", "off"],
  },
  {
    id: "safety_3team_2shift_station",
    name: "3조2교대 (경찰 지구대)",
    hint: "주-야-당직-비-휴 변형",
    rotation: ["day", "night", "overnight", "rest", "off"],
  },
  {
    id: "safety_21day_cycle",
    name: "21주기 교대 (해경 등)",
    hint: "주/야/비/휴 21일 순환 · 출동·비상대기 반영",
    rotation: [
      "day",
      "day",
      "night",
      "rest",
      "off",
      "day",
      "night",
      "night",
      "rest",
      "off",
      "day",
      "day",
      "night",
      "rest",
      "off",
      "overnight",
      "rest",
      "off",
      "day",
      "night",
      "off",
    ],
  },
  {
    id: "alternate_duty",
    name: "격일제",
    hint: "근무(주간) → 비번",
    rotation: ["day", "rest"],
  },
  {
    id: "manual",
    name: "직접 입력",
    hint: "패턴 자동채우기 없음 · 하루씩 등록",
    rotation: [],
  },
];

export function resolveShiftPatternId(
  value: string | null | undefined,
): ShiftPatternId {
  const found = SHIFT_PATTERNS.find((p) => p.id === value);
  return found?.id ?? DEFAULT_SHIFT_PATTERN;
}

export function getShiftPattern(
  id: string | null | undefined,
): ShiftPatternDef {
  const resolved = resolveShiftPatternId(id);
  return (
    SHIFT_PATTERNS.find((p) => p.id === resolved) ??
    SHIFT_PATTERNS[0]!
  );
}

export function patternSupportsFill(id: string | null | undefined): boolean {
  return getShiftPattern(id).rotation.length > 0;
}

export function patternShortLabels(id: string | null | undefined): string[] {
  return getShiftPattern(id).rotation.map((t) => SHIFT_SHORT_LABELS[t]);
}

/** 선택 UI에 보여줄 근무 유형 순서 */
const SHIFT_TYPE_ORDER: ShiftType[] = [
  "day",
  "night",
  "overnight",
  "day_support",
  "night_support",
  "rest",
  "off",
];

/**
 * 해당 교대 패턴에 나오는 유형만 반환.
 * 직접입력(manual)은 전체. 주간/야간자원은 공통으로 포함.
 */
export function selectableShiftTypes(
  patternId: string | null | undefined,
): ShiftType[] {
  const rotation = getShiftPattern(patternId).rotation;
  if (rotation.length === 0) return [...SHIFT_TYPE_ORDER];

  const allowed = new Set<ShiftType>(rotation);
  allowed.add("day_support");
  allowed.add("night_support");
  return SHIFT_TYPE_ORDER.filter((t) => allowed.has(t));
}

/** 범례용 짧은 라벨 (자원 제외) */
export function legendShiftTypes(
  patternId: string | null | undefined,
): { type: ShiftType; short: string }[] {
  const rotation = getShiftPattern(patternId).rotation;
  const types =
    rotation.length === 0
      ? (["day", "night", "overnight", "rest", "off"] as ShiftType[])
      : SHIFT_TYPE_ORDER.filter(
          (t) =>
            rotation.includes(t) &&
            t !== "day_support" &&
            t !== "night_support",
        );
  return types.map((type) => ({ type, short: SHIFT_SHORT_LABELS[type] }));
}
