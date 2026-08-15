"use client";

import { ChevronDown, Send, Settings } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { APP_NAME } from "@/lib/legal";
import { AGENCY_LABELS } from "@/lib/agencyTheme";
import { useAgencyTheme } from "@/components/AgencyThemeProvider";

interface CalendarHeaderProps {
  currentMonth: Date;
  onOpenMonthPicker: () => void;
  onOpenSettings?: () => void;
  onSendMessage?: () => void;
  calendarName?: string;
}

export function CalendarHeader({
  currentMonth,
  onOpenMonthPicker,
  onOpenSettings,
  onSendMessage,
  calendarName,
}: CalendarHeaderProps) {
  const { agency } = useAgencyTheme();
  const title = (calendarName ?? APP_NAME).replace(/\n/g, " ");

  return (
    <header
      className="sticky top-0 z-20 border-b border-black/5 backdrop-blur-xl dark:border-white/10"
      style={{ backgroundColor: "var(--header-surface)" }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5 safe-top sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Image
            src="/images/app-icon.png"
            alt={APP_NAME}
            width={56}
            height={56}
            className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-md sm:h-12 sm:w-12"
            priority
          />
          <div className="min-w-0 flex-1">
            <p className="truncate whitespace-nowrap text-[10px] font-semibold leading-tight text-accent sm:text-xs">
              {AGENCY_LABELS[agency]} · {title}
            </p>
            <button
              type="button"
              onClick={onOpenMonthPicker}
              className="mt-0.5 inline-flex max-w-full items-center gap-0.5 rounded-lg text-left transition active:scale-[0.98]"
            >
              <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
                {format(currentMonth, "yyyy년 M월", { locale: ko })}
              </h1>
              <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onSendMessage ? (
            <button
              type="button"
              aria-label="메시지 전하기"
              onClick={onSendMessage}
              className="flex h-9 items-center gap-1 rounded-full bg-accent/10 px-2.5 text-accent shadow-sm transition active:scale-95 sm:px-3"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden text-[11px] font-semibold sm:inline">
                메시지
              </span>
            </button>
          ) : null}
          {onOpenSettings ? (
            <button
              type="button"
              aria-label="설정"
              onClick={onOpenSettings}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition active:scale-95 dark:bg-[#161B22] dark:text-gray-300 dark:shadow-black/30"
            >
              <Settings className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
