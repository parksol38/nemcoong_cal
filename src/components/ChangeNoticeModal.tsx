"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { X } from "lucide-react";
import type { ShiftChangeLog } from "@/lib/types";

interface ChangeNoticeModalProps {
  open: boolean;
  date: Date | null;
  logs: ShiftChangeLog[];
  onClose: () => void;
}

export function ChangeNoticeModal({
  open,
  date,
  logs,
  onClose,
}: ChangeNoticeModalProps) {
  if (!open || !date) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-sheet-up rounded-t-3xl bg-white shadow-2xl dark:bg-[#161B22] dark:shadow-black/40 sm:mx-4 sm:animate-scale-in sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-xs font-medium text-rose-500">변경 알림</p>
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

        <div className="max-h-[50vh] space-y-2 overflow-y-auto px-5 py-4">
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              확인할 변경이 없어요.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-rose-100 bg-rose-50/60 px-3.5 py-3 dark:border-rose-500/20 dark:bg-rose-500/10"
              >
                <p className="text-sm font-medium leading-relaxed text-gray-800 dark:text-gray-100">
                  {log.summary}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {format(new Date(log.created_at), "M월 d일 HH:mm", {
                    locale: ko,
                  })}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-2xl bg-accent text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            확인했어요
          </button>
        </div>
      </div>
    </div>
  );
}
