"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { X } from "lucide-react";
import {
  formatHoursLabel,
  formatWon,
  type HourlyRates,
} from "@/lib/types";

export type HoursBucket = {
  key: keyof HourlyRates;
  label: string;
  hours: number;
  color: string;
};

interface MonthHoursModalProps {
  open: boolean;
  month: Date;
  totalHours: number;
  buckets: HoursBucket[];
  rates: HourlyRates;
  /** 예상 월급·시급 금액 표시 */
  showPay?: boolean;
  onClose: () => void;
}

/** SVG 도넛 차트 */
function DonutChart({ buckets }: { buckets: HoursBucket[] }) {
  const size = 168;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = buckets.reduce((s, b) => s + b.hours, 0);

  let offset = 0;
  const arcs =
    total <= 0
      ? null
      : buckets
          .filter((b) => b.hours > 0)
          .map((b) => {
            const len = (b.hours / total) * circumference;
            const dashoffset = -offset;
            offset += len;
            return { ...b, len, dashoffset };
          });

  return (
    <div className="relative mx-auto h-[168px] w-[168px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-100 dark:text-white/10"
        />
        {arcs?.map((arc) => (
          <circle
            key={arc.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={`${arc.len} ${circumference - arc.len}`}
            strokeDashoffset={arc.dashoffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[11px] font-medium text-gray-400">합계</p>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
          {formatHoursLabel(total) || "0"}
        </p>
        <p className="text-[11px] font-semibold text-gray-500">시간</p>
      </div>
    </div>
  );
}

export function MonthHoursModal({
  open,
  month,
  totalHours,
  buckets,
  rates,
  showPay = true,
  onClose,
}: MonthHoursModalProps) {
  const pay = useMemo(() => {
    const rows = buckets.map((b) => {
      const amount = b.hours * rates[b.key];
      return { ...b, rate: rates[b.key], amount };
    });
    const estimated = rows.reduce((s, r) => s + r.amount, 0);
    return { rows, estimated: Math.round(estimated) };
  }, [buckets, rates]);

  if (!open) return null;

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
            <p className="text-xs font-medium text-gray-400">근무 분석</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {format(month, "yyyy년 M월", { locale: ko })}
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

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
          <DonutChart buckets={buckets} />

          <div className="space-y-2">
            {pay.rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {row.label}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {formatHoursLabel(row.hours) || "0"}시간
                      {showPay ? ` · 시급 ${formatWon(row.rate)}` : ""}
                    </p>
                  </div>
                </div>
                {showPay ? (
                  <p className="shrink-0 text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">
                    {formatWon(row.amount)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {showPay ? (
            <div className="rounded-2xl bg-[#007AFF]/10 px-4 py-4 dark:bg-[#007AFF]/15">
              <p className="text-[11px] font-medium text-[#007AFF]/80">
                이번 달 예상 월급
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#007AFF]">
                {formatWon(pay.estimated)}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                총 {formatHoursLabel(totalHours) || "0"}시간 × 설정 시급 기준
                추정치예요. 기본값은 경찰 순경 초임(1년차) 근사치이며, 설정에서
                바꿀 수 있어요.
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-2xl bg-gray-900 text-sm font-semibold text-white transition active:scale-[0.98] dark:bg-white dark:text-gray-900"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
