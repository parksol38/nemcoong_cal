"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BedDouble,
  Coffee,
  HandHelping,
  Minus,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Trash2,
  X,
} from "lucide-react";
import { updateCalendarShiftPattern } from "@/lib/api";
import {
  buildPatternShifts,
  findPatternIndex,
  getRotationDayLabel,
  getShiftPattern,
  patternShortLabels,
  patternSupportsFill,
  selectableShiftTypes,
  SHIFT_PATTERNS,
} from "@/lib/pattern";
import {
  calcWorkHours,
  formatHoursLabel,
  getShiftVisual,
  isSupportShift,
  SHIFT_DEFAULT_TIMES,
  SHIFT_HOURS,
  SHIFT_LABELS,
  type Shift,
  type ShiftColors,
  type ShiftType,
} from "@/lib/types";

/** 자동 채우기가 가능한 교대유형만 */
const FILLABLE_PATTERNS = SHIFT_PATTERNS.filter((p) => p.rotation.length > 0);

interface ShiftModalProps {
  open: boolean;
  date: Date | null;
  shift?: Shift;
  saving?: boolean;
  shiftColors: ShiftColors;
  calendarId: string;
  patternId?: string;
  onClose: () => void;
  onSave: (data: {
    shiftType: ShiftType;
    note: string;
    existingId?: string;
    startTime?: string | null;
    endTime?: string | null;
    extraHours?: number | null;
  }) => Promise<void>;
  onSavePattern: (data: {
    items: { date: string; shiftType: ShiftType }[];
  }) => Promise<void>;
  onDelete: (shiftId: string) => Promise<void>;
  onShiftPatternChange?: (patternId: string) => void;
}

const SHIFT_OPTIONS: {
  type: ShiftType;
  icon: typeof Sun;
  hint: string;
}[] = [
  { type: "day", icon: Sun, hint: "08:00~18:00" },
  { type: "night", icon: Sunset, hint: "18:00~08:00" },
  { type: "overnight", icon: Moon, hint: "22:00~04:00" },
  { type: "day_support", icon: HandHelping, hint: "시간 조정 가능" },
  { type: "night_support", icon: HandHelping, hint: "시간 조정 가능" },
  { type: "rest", icon: BedDouble, hint: "비번" },
  { type: "off", icon: Coffee, hint: "휴무" },
];

const FILL_OPTIONS = [
  { days: 90, label: "3개월" },
  { days: 180, label: "6개월" },
  { days: 365, label: "1년" },
] as const;

function defaultTimesFor(type: ShiftType): { start: string; end: string } {
  return SHIFT_DEFAULT_TIMES[type] ?? { start: "08:00", end: "18:00" };
}

export function ShiftModal({
  open,
  date,
  shift,
  saving = false,
  shiftColors,
  calendarId,
  patternId = "police_5_3_10",
  onClose,
  onSave,
  onSavePattern,
  onDelete,
  onShiftPatternChange,
}: ShiftModalProps) {
  const canFillPattern = patternSupportsFill(patternId);
  const visibleOptions = useMemo(() => {
    const allowed = new Set(selectableShiftTypes(patternId));
    return SHIFT_OPTIONS.filter((o) => allowed.has(o.type));
  }, [patternId]);
  const [shiftType, setShiftType] = useState<ShiftType>("day");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [deleting, setDeleting] = useState(false);
  const [fillPattern, setFillPattern] = useState(false);
  /** 채우기에 쓸 교대유형 (경찰 5조3교대 등) */
  const [fillPatternId, setFillPatternId] = useState(patternId);
  const [patternIndex, setPatternIndex] = useState(0);
  const [fillDays, setFillDays] = useState(365);
  const [extraHours, setExtraHours] = useState(0);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraDraft, setExtraDraft] = useState("0");
  const [saveError, setSaveError] = useState<string | null>(null);

  const activePatternId = fillPattern ? fillPatternId : patternId;
  const pattern = getShiftPattern(activePatternId);
  const rotation = pattern.rotation;
  const shortLabels = patternShortLabels(activePatternId);

  useEffect(() => {
    if (!open) return;
    const allowed = selectableShiftTypes(patternId);
    const raw = shift?.shift_type ?? allowed[0] ?? "day";
    const type = allowed.includes(raw) ? raw : (allowed[0] ?? "day");
    setShiftType(type);
    setDeleting(false);
    setFillPattern(false);
    setFillPatternId(patternId);
    setPatternIndex(findPatternIndex(type, patternId));
    setFillDays(365);
    const extra = Number(shift?.extra_hours);
    const hasExtra = Number.isFinite(extra) && extra > 0;
    const nextExtra = hasExtra ? Math.round(extra * 10) / 10 : 0;
    setExtraHours(nextExtra);
    setExtraDraft(String(nextExtra));
    setExtraOpen(hasExtra);
    setSaveError(null);

    const defaults = defaultTimesFor(type);
    if (isSupportShift(type) && shift?.start_time && shift?.end_time) {
      setStartTime(shift.start_time.slice(0, 5));
      setEndTime(shift.end_time.slice(0, 5));
    } else {
      setStartTime(defaults?.start ?? "08:00");
      setEndTime(defaults?.end ?? "18:00");
    }
  }, [open, shift, patternId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const supportSelected = isSupportShift(shiftType);
  const supportHours = useMemo(
    () => calcWorkHours(startTime, endTime),
    [startTime, endTime],
  );
  const baseHoursPreview = useMemo(() => {
    if (supportSelected) return supportHours;
    return SHIFT_HOURS[shiftType] ?? 0;
  }, [supportSelected, supportHours, shiftType]);
  const extraPreviewLabel = useMemo(() => {
    const base = formatHoursLabel(baseHoursPreview);
    const extra = formatHoursLabel(extraHours);
    if (extraHours > 0 && baseHoursPreview > 0) return `${base}+${extra}`;
    if (extraHours > 0) return `+${extra}`;
    return base || "0";
  }, [baseHoursPreview, extraHours]);

  const previewLine = useMemo(() => {
    if (!fillPattern || rotation.length === 0) return "";
    const parts: string[] = [];
    const n = Math.min(10, rotation.length * 2);
    for (let i = 0; i < n; i++) {
      parts.push(shortLabels[(patternIndex + i) % rotation.length] ?? "");
    }
    return parts.join(" → ");
  }, [fillPattern, patternIndex, rotation.length, shortLabels]);

  if (!open || !date) return null;

  const selectFillPatternId = (nextId: string) => {
    setFillPatternId(nextId);
    const rot = getShiftPattern(nextId).rotation;
    if (rot.length === 0) {
      setPatternIndex(0);
      return;
    }
    const idx = findPatternIndex(shiftType, nextId);
    setPatternIndex(idx);
    const nextType = rot[idx];
    if (nextType) setShiftType(nextType);
  };

  const selectShiftType = (type: ShiftType) => {
    setShiftType(type);
    if (isSupportShift(type)) {
      // 자원 근무는 패턴 채우기 대상이 아님
      setFillPattern(false);
      const defaults = defaultTimesFor(type);
      // 같은 자원 유형을 다시 고르면 저장된 시간 유지, 유형 전환 시 기본 시간
      if (type === shift?.shift_type && shift.start_time && shift.end_time) {
        setStartTime(shift.start_time.slice(0, 5));
        setEndTime(shift.end_time.slice(0, 5));
      } else {
        setStartTime(defaults.start);
        setEndTime(defaults.end);
      }
      return;
    }
    if (fillPattern) setPatternIndex(findPatternIndex(type, fillPatternId));
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      if (fillPattern && !supportSelected && patternSupportsFill(fillPatternId)) {
        const items = buildPatternShifts({
          startDate: date,
          patternIndex,
          dayCount: fillDays,
          patternId: fillPatternId,
        });
        // 교대유형을 바꿨다면 달력 설정에도 반영
        if (fillPatternId !== patternId) {
          const saved = await updateCalendarShiftPattern({
            calendarId,
            shiftPattern: fillPatternId,
          });
          onShiftPatternChange?.(saved);
        }
        await onSavePattern({ items });
        return;
      }

      await onSave({
        shiftType,
        note: "",
        existingId: shift?.id,
        startTime: supportSelected ? startTime : null,
        endTime: supportSelected ? endTime : null,
        extraHours: extraHours > 0 ? extraHours : 0,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/extra_hours/i.test(msg)) {
        setSaveError(
          "추가시간 저장용 DB 컬럼이 아직 없습니다. Supabase에서 migrate-add-extra-hours.sql 을 실행해 주세요.",
        );
      } else if (/start_time|end_time/i.test(msg)) {
        setSaveError(
          "자원 근무 시간 컬럼이 없습니다. Supabase에서 migrate-add-support-shifts.sql 을 실행해 주세요.",
        );
      } else if (/shift_pattern/i.test(msg)) {
        setSaveError(
          "교대유형 컬럼이 없습니다. Supabase에서 migrate-add-shift-pattern-owner.sql 을 실행해 주세요.",
        );
      } else {
        setSaveError(msg || "저장에 실패했습니다.");
      }
    }
  };

  const handleDelete = async () => {
    if (!shift?.id) return;
    setDeleting(true);
    try {
      await onDelete(shift.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto animate-sheet-up rounded-t-3xl bg-white shadow-2xl dark:bg-[#161B22] dark:shadow-black/40 sm:mx-4 sm:animate-scale-in sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#161B22]">
          <div>
            <p className="text-xs font-medium text-gray-400">근무 등록</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {format(date, "M월 d일 (EEE)", { locale: ko })}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95 dark:bg-white/10 dark:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              이 날 근무 형태
            </p>
            <p className="mb-2 text-[11px] text-gray-400">
              원하는 근무를 고른 뒤 저장하면 이 날짜만 바뀝니다.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {visibleOptions.map(({ type, icon: Icon, hint }) => {
                const selected = shiftType === type;
                const visual = getShiftVisual(type, shiftColors);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectShiftType(type)}
                    className={[
                      "flex items-center gap-2 rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-[0.98]",
                      selected
                        ? "shadow-sm"
                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-white/20",
                    ].join(" ")}
                    style={
                      selected
                        ? {
                            backgroundColor: visual.solidBg,
                            borderColor: visual.solidBorder,
                            color: visual.solidText,
                          }
                        : undefined
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    <div>
                      <p className="text-sm font-bold">{SHIFT_LABELS[type]}</p>
                      <p
                        className="text-[10px]"
                        style={
                          selected
                            ? { color: visual.solidText, opacity: 0.75 }
                            : undefined
                        }
                      >
                        <span className={selected ? "" : "text-gray-400"}>
                          {hint}
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setExtraOpen(true);
                  if (extraHours <= 0) {
                    setExtraHours(1);
                    setExtraDraft("1");
                  }
                }}
                className={[
                  "flex items-center gap-2 rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-[0.98]",
                  extraOpen || extraHours > 0
                    ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] shadow-sm"
                    : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-white/20",
                ].join(" ")}
              >
                <Plus className="h-4 w-4 shrink-0 opacity-90" />
                <div>
                  <p className="text-sm font-bold">시간추가</p>
                  <p
                    className={`text-[10px] ${extraOpen || extraHours > 0 ? "text-[#007AFF]/70" : "text-gray-400"}`}
                  >
                    교육 등 +α
                  </p>
                </div>
              </button>
            </div>
          </div>

          {(extraOpen || extraHours > 0) && !fillPattern ? (
            <div className="rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-3.5 dark:bg-[#007AFF]/10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  추가 시간
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setExtraHours(0);
                    setExtraDraft("0");
                    setExtraOpen(false);
                  }}
                  className="text-[11px] font-semibold text-gray-400 transition active:opacity-70"
                >
                  지우기
                </button>
              </div>
              <p className="mb-3 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                근무 형태는 그대로 두고, 교육 등 시간만 더합니다. 달력에는{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {SHIFT_LABELS[shiftType]} {extraPreviewLabel}
                </span>
                처럼 보여요.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  aria-label="1시간 감소"
                  onClick={() => {
                    setExtraHours((h) => {
                      const next = Math.max(0, Math.round((h - 1) * 10) / 10);
                      setExtraDraft(String(next));
                      return next;
                    });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 transition active:scale-95 dark:bg-[#0B0F14] dark:text-gray-200 dark:ring-white/10"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="min-w-[5.5rem] text-center">
                  <label className="inline-flex items-baseline justify-center gap-0.5">
                    <span className="text-2xl font-bold text-[#007AFF]">+</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={extraDraft}
                      aria-label="추가 시간 입력"
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        // 소수점 하나만 허용
                        const parts = raw.split(".");
                        const cleaned =
                          parts.length <= 1
                            ? raw
                            : `${parts[0]}.${parts.slice(1).join("")}`;
                        setExtraDraft(cleaned);
                        if (cleaned === "" || cleaned === ".") return;
                        const n = Number(cleaned);
                        if (!Number.isFinite(n)) return;
                        setExtraHours(
                          Math.min(24, Math.max(0, Math.round(n * 10) / 10)),
                        );
                      }}
                      onBlur={() => {
                        const n = Number(extraDraft);
                        const next = Number.isFinite(n)
                          ? Math.min(24, Math.max(0, Math.round(n * 10) / 10))
                          : 0;
                        setExtraHours(next);
                        setExtraDraft(String(next));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-[3.25rem] border-b-2 border-[#007AFF]/40 bg-transparent pb-0.5 text-center text-2xl font-bold tabular-nums text-[#007AFF] outline-none focus:border-[#007AFF]"
                    />
                  </label>
                  <p className="mt-0.5 text-[10px] text-gray-400">시간</p>
                </div>
                <button
                  type="button"
                  aria-label="1시간 증가"
                  onClick={() => {
                    setExtraHours((h) => {
                      const next = Math.min(24, Math.round((h + 1) * 10) / 10);
                      setExtraDraft(String(next));
                      return next;
                    });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 transition active:scale-95 dark:bg-[#0B0F14] dark:text-gray-200 dark:ring-white/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {supportSelected && !fillPattern ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-white/10 dark:bg-white/5">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                근무 시간
              </p>
              <p className="mb-3 text-[11px] text-gray-500">
                기본값은 {SHIFT_LABELS[shiftType === "day_support" ? "day" : "night"]}과
                같고, 아래에서 직접 조정할 수 있어요.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    시작
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                    종료
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                  />
                </label>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                근무시간{" "}
                <span className="font-semibold text-gray-700">
                  {formatHoursLabel(supportHours) || "0"}시간
                </span>
                {endTime <= startTime ? (
                  <span className="text-gray-400"> (자정 넘김)</span>
                ) : null}
              </p>
            </div>
          ) : null}

          {!supportSelected && canFillPattern ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-white/10 dark:bg-white/5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={fillPattern}
                  onChange={(e) => setFillPattern(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#007AFF]"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <Sparkles className="h-3.5 w-3.5 text-[#007AFF]" />
                    (선택) 이후 일정까지 패턴으로 채우기
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                    하루만 바꿀 때는 체크하지 마세요.
                  </p>
                </div>
              </label>

              {fillPattern ? (
                <div className="mt-3 space-y-3 border-t border-[#007AFF]/10 pt-3">
                  {/* 설정한 교대유형 + 패턴 일차를 한 줄에 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        교대유형
                      </label>
                      <select
                        value={fillPatternId}
                        onChange={(e) => selectFillPatternId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2.5 text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                      >
                        {FILLABLE_PATTERNS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        패턴 며칠째
                      </label>
                      <select
                        value={patternIndex}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          setPatternIndex(idx);
                          const nextType = rotation[idx];
                          if (nextType) setShiftType(nextType);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2.5 text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                      >
                        {rotation.map((_, i) => (
                          <option key={i} value={i}>
                            {getRotationDayLabel(i, fillPatternId)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-500">
                    {pattern.hint}
                  </p>

                  {/* 교대유형을 바꿔도 선택일 이전 근무는 그대로 유지 */}
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                    <span className="font-semibold">
                      {format(date, "M월 d일", { locale: ko })} 이전 데이터는
                      변경되지 않습니다.
                    </span>
                    <span className="mt-0.5 block text-[11px] text-amber-800/80 dark:text-amber-200/80">
                      교대유형을 바꿔도 선택일부터 앞으로만 다시 채워지고, 그 전
                      근무표는 그대로 둡니다.
                    </span>
                  </p>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-gray-600">
                      앞으로 몇 일 채울까요?
                    </p>
                    <div className="flex gap-2">
                      {FILL_OPTIONS.map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => setFillDays(opt.days)}
                          className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition active:scale-95 ${
                            fillDays === opt.days
                              ? "bg-[#007AFF] text-white"
                              : "bg-white text-gray-600 ring-1 ring-gray-200 dark:bg-[#0B0F14] dark:text-gray-300 dark:ring-white/15"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="rounded-xl bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    미리보기: {previewLine}
                    <span className="mt-1 block text-gray-500">
                      {format(date, "M월 d일", { locale: ko })} ~{" "}
                      {format(addDays(date, fillDays - 1), "M월 d일", {
                        locale: ko,
                      })}{" "}
                      ({fillDays}일)만 갱신
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
          ) : !supportSelected ? (
            <p className="text-[11px] leading-relaxed text-gray-400">
              이 달력은 &quot;{pattern.name}&quot; · 하루씩 직접 등록합니다.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-gray-400">
              주간자원·야간자원은 하루씩 등록하며, 패턴 자동 채우기에는 포함되지
              않습니다.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#161B22]">
          {saveError ? (
            <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              {saveError}
            </p>
          ) : null}
          <div className="flex gap-2">
          {shift?.id && !fillPattern ? (
            <button
              type="button"
              disabled={deleting || saving}
              onClick={() => void handleDelete()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition active:scale-95 disabled:opacity-50 dark:bg-rose-500/15"
              aria-label="삭제"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition active:scale-[0.98] dark:bg-white/10 dark:text-gray-200"
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="h-12 flex-[1.6] rounded-2xl bg-[#007AFF] text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving
              ? "저장 중…"
              : fillPattern
                ? fillDays === 365
                  ? "1년 자동 입력"
                  : `${fillDays}일 자동 입력`
                : "이 날짜 저장"}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
