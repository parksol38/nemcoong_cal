"use client";

import { format, isSameMonth, isToday } from "date-fns";
import { SHIFT_STYLES, type Shift } from "@/lib/types";
import { ShiftChip } from "./ShiftChip";

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  shift?: Shift;
  /** 미확인 변경 개수 */
  changeCount?: number;
  onClick: (date: Date) => void;
  onChangeBadgeClick?: (date: Date) => void;
}

export function CalendarDay({
  date,
  currentMonth,
  shift,
  changeCount = 0,
  onClick,
  onChangeBadgeClick,
}: CalendarDayProps) {
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const style = shift ? SHIFT_STYLES[shift.shift_type] : null;
  const showBadge = changeCount > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(date)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(date);
        }
      }}
      className={[
        "relative flex h-full min-h-0 cursor-pointer flex-col gap-0.5 overflow-hidden rounded-2xl border p-1 text-left",
        "sm:gap-1 sm:p-2",
        inMonth ? "opacity-100" : "opacity-35",
        style
          ? `${style.bg} ${style.border}`
          : "border-transparent bg-white/70",
        today ? "ring-2 ring-[#007AFF] ring-offset-1 ring-offset-[#F2F2F7]" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-0.5">
        <span
          className={[
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
            today ? "bg-[#007AFF] text-white" : "",
            !today && weekend && inMonth ? "text-rose-400" : "",
            !today && !weekend ? "text-gray-800" : "",
            !inMonth ? "text-gray-400" : "",
          ].join(" ")}
        >
          {format(date, "d")}
        </span>

        {showBadge ? (
          <button
            type="button"
            aria-label="변경 알림 보기"
            onClick={(e) => {
              e.stopPropagation();
              onChangeBadgeClick?.(date);
            }}
            className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm"
          >
            {changeCount > 9 ? "9+" : changeCount}
          </button>
        ) : null}
      </div>

      {shift ? (
        <div className="mt-auto flex w-full min-w-0 flex-col gap-0.5 overflow-hidden">
          <ShiftChip type={shift.shift_type} compact />
          {shift.note ? (
            <p className="truncate text-[9px] leading-tight text-gray-500 sm:text-[10px]">
              {shift.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
