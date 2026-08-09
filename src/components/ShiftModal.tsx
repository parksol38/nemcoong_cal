"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BedDouble,
  Coffee,
  Moon,
  Sparkles,
  Sun,
  Sunset,
  Trash2,
  X,
} from "lucide-react";
import {
  buildPatternShifts,
  findPatternIndex,
  getRotationDayLabel,
  ROTATION_10,
  ROTATION_SHORT_LABELS,
} from "@/lib/pattern";
import {
  SHIFT_LABELS,
  SHIFT_STYLES,
  type Shift,
  type ShiftType,
} from "@/lib/types";

interface ShiftModalProps {
  open: boolean;
  date: Date | null;
  shift?: Shift;
  displayName: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (data: {
    shiftType: ShiftType;
    note: string;
    existingId?: string;
  }) => Promise<void>;
  onSavePattern: (data: {
    items: { date: string; shiftType: ShiftType }[];
  }) => Promise<void>;
  onDelete: (shiftId: string) => Promise<void>;
}

const SHIFT_OPTIONS: {
  type: ShiftType;
  icon: typeof Sun;
  hint: string;
}[] = [
  { type: "day", icon: Sun, hint: "주간 근무" },
  { type: "night", icon: Sunset, hint: "야간 근무" },
  { type: "overnight", icon: Moon, hint: "심야 근무" },
  { type: "rest", icon: BedDouble, hint: "비번" },
  { type: "off", icon: Coffee, hint: "휴무" },
];

const FILL_OPTIONS = [
  { days: 90, label: "3개월" },
  { days: 180, label: "6개월" },
  { days: 365, label: "1년" },
] as const;

export function ShiftModal({
  open,
  date,
  shift,
  displayName,
  saving = false,
  onClose,
  onSave,
  onSavePattern,
  onDelete,
}: ShiftModalProps) {
  const [shiftType, setShiftType] = useState<ShiftType>("day");
  const [note, setNote] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [fillPattern, setFillPattern] = useState(false);
  const [patternIndex, setPatternIndex] = useState(0);
  const [fillDays, setFillDays] = useState(365);

  useEffect(() => {
    if (!open) return;
    const type = shift?.shift_type ?? "day";
    setShiftType(type);
    setNote(shift?.note ?? "");
    setDeleting(false);
    // 기본은 하루만 수정 / 패턴 채우기는 필요할 때만 체크
    setFillPattern(false);
    setPatternIndex(findPatternIndex(type));
    setFillDays(365);
  }, [open, shift]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const previewLine = useMemo(() => {
    if (!fillPattern) return "";
    const parts: string[] = [];
    for (let i = 0; i < 10; i++) {
      parts.push(ROTATION_SHORT_LABELS[(patternIndex + i) % 10]);
    }
    return parts.join(" → ");
  }, [fillPattern, patternIndex]);

  if (!open || !date) return null;

  const handleSave = async () => {
    if (fillPattern) {
      const items = buildPatternShifts({
        startDate: date,
        patternIndex,
        dayCount: fillDays,
      });
      await onSavePattern({ items });
      return;
    }

    await onSave({
      shiftType,
      note,
      existingId: shift?.id,
    });
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

      <div className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto animate-sheet-up rounded-t-3xl bg-white shadow-2xl sm:mx-4 sm:animate-scale-in sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium text-gray-400">근무 등록</p>
            <h2 className="text-lg font-bold text-gray-900">
              {format(date, "M월 d일 (EEE)", { locale: ko })}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">
              이 날 근무 형태
            </p>
            <p className="mb-2 text-[11px] text-gray-400">
              원하는 근무를 고른 뒤 저장하면 이 날짜만 바뀝니다.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SHIFT_OPTIONS.map(({ type, icon: Icon, hint }) => {
                const selected = shiftType === type;
                const style = SHIFT_STYLES[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setShiftType(type);
                      if (fillPattern) setPatternIndex(findPatternIndex(type));
                    }}
                    className={[
                      "flex items-center gap-2 rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-[0.98]",
                      selected
                        ? `${style.solid} shadow-sm`
                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    <div>
                      <p className="text-sm font-bold">{SHIFT_LABELS[type]}</p>
                      <p
                        className={`text-[10px] ${selected ? "text-white/70" : "text-gray-400"}`}
                      >
                        {hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {!fillPattern ? (
            <div>
              <label
                htmlFor="shift-note"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                메모 / 지원근무
              </label>
              <input
                id="shift-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='예: "강남지점 지원근무"'
                maxLength={80}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20"
              />
              {displayName ? (
                <p className="mt-1.5 text-[11px] text-gray-400">
                  저장자: {displayName}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={fillPattern}
                onChange={(e) => setFillPattern(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#007AFF]"
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-3.5 w-3.5 text-[#007AFF]" />
                  (선택) 이후 일정까지 패턴으로 채우기
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                  하루만 바꿀 때는 체크하지 마세요.
                  <br />
                  주→야→심→비→휴 10일 주기로 길게 채울 때만 켭니다.
                </p>
              </div>
            </label>

            {fillPattern ? (
              <div className="mt-3 space-y-3 border-t border-[#007AFF]/10 pt-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    이 날짜는 패턴의 며칠째?
                  </label>
                  <select
                    value={patternIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setPatternIndex(idx);
                      setShiftType(ROTATION_10[idx]);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={i}>
                        {getRotationDayLabel(i)}
                      </option>
                    ))}
                  </select>
                </div>

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
                            : "bg-white text-gray-600 ring-1 ring-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="rounded-xl bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-gray-600">
                  미리보기: {previewLine}
                  <span className="mt-1 block text-gray-500">
                    {format(date, "M월 d일", { locale: ko })} ~{" "}
                    {format(addDays(date, fillDays - 1), "M월 d일", {
                      locale: ko,
                    })}{" "}
                    ({fillDays}일)만 갱신
                  </span>
                  <span className="mt-0.5 block text-gray-400">
                    {format(date, "M월 d일", { locale: ko })} 이전 근무표는
                    유지됩니다.
                  </span>
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-gray-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {shift?.id && !fillPattern ? (
            <button
              type="button"
              disabled={deleting || saving}
              onClick={() => void handleDelete()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition active:scale-95 disabled:opacity-50"
              aria-label="삭제"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition active:scale-[0.98]"
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
  );
}
