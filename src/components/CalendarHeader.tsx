"use client";

import { ChevronDown, Settings } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface CalendarHeaderProps {
  currentMonth: Date;
  onToday: () => void;
  onOpenMonthPicker: () => void;
  onOpenSettings?: () => void;
  calendarName?: string;
}

export function CalendarHeader({
  currentMonth,
  onToday,
  onOpenMonthPicker,
  onOpenSettings,
  calendarName,
}: CalendarHeaderProps) {
  const title =
    (calendarName ?? "멋진여자 박네모가 만든 넴쿵 교대근무표").replace(
      /\n/g,
      " ",
    );

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#F2F2F7]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5 safe-top sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Image
            src="/images/couple-sticker.png"
            alt="우리"
            width={56}
            height={56}
            className="h-11 w-11 shrink-0 object-contain drop-shadow-sm sm:h-12 sm:w-12"
            priority
          />
          <div className="min-w-0 flex-1">
            <p className="truncate whitespace-nowrap text-[10px] font-medium leading-tight text-gray-400 sm:text-xs">
              {title}
            </p>
            <button
              type="button"
              onClick={onOpenMonthPicker}
              className="mt-0.5 inline-flex max-w-full items-center gap-0.5 rounded-lg text-left transition active:scale-[0.98]"
            >
              <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {format(currentMonth, "yyyy년 M월", { locale: ko })}
              </h1>
              <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onOpenSettings ? (
            <button
              type="button"
              aria-label="설정"
              onClick={onOpenSettings}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition active:scale-95"
            >
              <Settings className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToday}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#007AFF] shadow-sm transition active:scale-95"
          >
            오늘
          </button>
        </div>
      </div>
    </header>
  );
}
