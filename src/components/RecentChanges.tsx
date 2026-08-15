"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronDown, History } from "lucide-react";
import type { ShiftChangeLog } from "@/lib/types";

interface RecentChangesProps {
  logs: ShiftChangeLog[];
  setupError?: string | null;
  onSelect?: (log: ShiftChangeLog) => void;
}

export function RecentChanges({ logs, setupError, onSelect }: RecentChangesProps) {
  const [open, setOpen] = useState(false);
  const items = logs.slice(0, 4);
  const count = items.length;

  return (
    <section className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white/80 px-3.5 py-3 text-left shadow-sm transition active:scale-[0.99] dark:bg-[#161B22]/90 dark:shadow-black/20"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2">
          <History className="h-4 w-4 shrink-0 text-gray-400" />
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              최근 변경
            </h2>
            {!open && count > 0 ? (
              <p className="mt-0.5 truncate text-[10px] text-gray-400">
                {items[0]?.summary}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {count > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-300">
              {count}
            </span>
          ) : null}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open ? (
        <div className="mt-2 animate-fade-in">
          {setupError ? (
            <p className="rounded-2xl bg-amber-50 px-4 py-4 text-center text-xs leading-relaxed text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
              {setupError}
            </p>
          ) : items.length === 0 ? (
            <p className="rounded-2xl bg-white/70 px-4 py-5 text-center text-xs text-gray-400 dark:bg-[#161B22]/70">
              아직 변경 이력이 없어요.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map((log) => {
                const dayLabel = format(parseISO(log.date), "M/d", {
                  locale: ko,
                });
                const timeLabel = format(new Date(log.created_at), "M/d HH:mm", {
                  locale: ko,
                });
                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => onSelect?.(log)}
                    className="rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm transition active:scale-[0.98] dark:bg-[#161B22] dark:shadow-black/20"
                  >
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500 dark:bg-rose-500/15 dark:text-rose-300">
                        {dayLabel}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {timeLabel}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[11px] leading-snug text-gray-700 dark:text-gray-300">
                      {log.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
