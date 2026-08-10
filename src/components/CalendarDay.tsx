"use client";

import { format, isSameMonth, isToday } from "date-fns";
import { getHolidayName, isPublicHoliday } from "@/lib/holidays";
import {
  formatShiftHoursDisplay,
  getShiftVisual,
  SHIFT_CELL_LABELS,
  type Shift,
  type ShiftColors,
} from "@/lib/types";

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  shift?: Shift;
  /** 미확인 변경 개수 */
  changeCount?: number;
  /** 설정에서 켠 경우에만 근무시간 숫자 표시 */
  showHours?: boolean;
  shiftColors: ShiftColors;
  onClick: (date: Date) => void;
  onChangeBadgeClick?: (date: Date) => void;
}

export function CalendarDay({
  date,
  currentMonth,
  shift,
  changeCount = 0,
  showHours = false,
  shiftColors,
  onClick,
  onChangeBadgeClick,
}: CalendarDayProps) {
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const sunday = date.getDay() === 0;
  const saturday = date.getDay() === 6;
  const holidayName = getHolidayName(date);
  const holiday = isPublicHoliday(date);
  // 일요일·공휴일 = 빨간날 / 토요일 = 파란날 (요일 헤더와 맞춤)
  const redDay = sunday || holiday;
  const visual = shift ? getShiftVisual(shift.shift_type, shiftColors) : null;
  const showBadge = changeCount > 0;
  const hoursLabel = shift ? formatShiftHoursDisplay(shift) : "";
  const showHoursText = showHours && !!hoursLabel;
  const typeLabel = shift ? SHIFT_CELL_LABELS[shift.shift_type] : "";

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
        "relative flex h-full min-h-0 cursor-pointer flex-col overflow-hidden rounded-2xl border p-1 text-left",
        "sm:p-1.5",
        inMonth ? "opacity-100" : "opacity-35",
        visual ? "" : "border-transparent bg-white/70 dark:bg-white/5",
        today ? "ring-2 ring-[#007AFF] ring-offset-1 ring-offset-[#F2F2F7] dark:ring-offset-[#0B0F14]" : "",
      ].join(" ")}
      style={
        visual
          ? {
              backgroundColor: visual.bg,
              borderColor: visual.border,
            }
          : undefined
      }
    >
      <div className="flex shrink-0 items-start justify-between gap-0.5">
        <div className="flex min-w-0 flex-1 items-center gap-0.5">
          <span
            className={[
              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:h-6 sm:w-6 sm:text-xs",
              today ? "bg-[#007AFF] text-white" : "",
              !today && redDay && inMonth ? "text-rose-500" : "",
              !today && saturday && !holiday && inMonth ? "text-sky-500" : "",
              !today && !redDay && !saturday ? "text-gray-800 dark:text-gray-100" : "",
              !inMonth ? "text-gray-400" : "",
            ].join(" ")}
          >
            {format(date, "d")}
          </span>
          {holidayName && inMonth ? (
            <span className="min-w-0 truncate text-[8px] font-semibold leading-tight text-rose-500 sm:text-[9px]">
              {holidayName}
            </span>
          ) : null}
        </div>

        {showBadge ? (
          <button
            type="button"
            aria-label="변경 알림 보기"
            onClick={(e) => {
              e.stopPropagation();
              onChangeBadgeClick?.(date);
            }}
            className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm"
          >
            {changeCount > 9 ? "9+" : changeCount}
          </button>
        ) : null}
      </div>

      {typeLabel ? (
        <div className="mt-0.5 flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 pb-0.5">
          <span
            className="max-w-full truncate text-center text-[13px] font-bold leading-none tracking-tight sm:text-[15px]"
            style={{ color: visual?.text }}
          >
            {typeLabel}
          </span>
          {showHoursText ? (
            <span
              className="text-[12px] font-semibold tabular-nums leading-none tracking-tight opacity-80 sm:text-[13px]"
              style={{ color: visual?.text }}
            >
              {hoursLabel}
            </span>
          ) : null}
          {shift?.note ? (
            <p className="mt-0.5 w-full truncate text-center text-[8px] leading-tight text-gray-500 sm:text-[9px]">
              {shift.note}
            </p>
          ) : null}
        </div>
      ) : shift?.note ? (
        <p className="mt-auto truncate text-[9px] leading-tight text-gray-500">
          {shift.note}
        </p>
      ) : null}
    </div>
  );
}
