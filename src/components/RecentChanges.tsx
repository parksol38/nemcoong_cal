"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { History } from "lucide-react";
import type { ShiftChangeLog } from "@/lib/types";

interface RecentChangesProps {
  logs: ShiftChangeLog[];
  setupError?: string | null;
  onSelect?: (log: ShiftChangeLog) => void;
}

export function RecentChanges({ logs, setupError, onSelect }: RecentChangesProps) {
  const items = logs.slice(0, 4);

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center gap-1.5 px-0.5">
        <History className="h-3.5 w-3.5 text-gray-400" />
        <h2 className="text-xs font-semibold text-gray-500">최근 변경</h2>
      </div>

      {setupError ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-4 text-center text-xs leading-relaxed text-amber-700">
          {setupError}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-white/70 px-4 py-5 text-center text-xs text-gray-400">
          아직 변경 이력이 없어요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((log) => {
            const dayLabel = format(parseISO(log.date), "M/d", { locale: ko });
            const timeLabel = format(new Date(log.created_at), "M/d HH:mm", {
              locale: ko,
            });
            return (
              <button
                key={log.id}
                type="button"
                onClick={() => onSelect?.(log)}
                className="rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">
                    {dayLabel}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {timeLabel}
                  </span>
                </div>
                <p className="line-clamp-2 text-[11px] leading-snug text-gray-700">
                  {log.summary}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
