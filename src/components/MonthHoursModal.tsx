"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { X } from "lucide-react";
import {
  calcAllowancePay,
  calcMonthlyTakeHome,
  getAllowanceRates,
  type AllowanceInput,
} from "@/lib/allowanceRates";
import {
  formatHoursLabel,
  formatSalaryProfileLabel,
  formatWon,
  lookupMonthlySalary,
  type HourlyRates,
  type SalaryProfile,
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
  salaryProfile?: SalaryProfile;
  /** 달력 근무에서 집계한 시간외·야간·휴일 */
  allowanceFromShifts?: AllowanceInput;
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

function parseNum(raw: string): number {
  const n = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 10) / 10;
}

export function MonthHoursModal({
  open,
  month,
  totalHours,
  buckets,
  rates,
  showPay = true,
  salaryProfile,
  allowanceFromShifts,
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

  const tableBase =
    salaryProfile != null
      ? lookupMonthlySalary(salaryProfile.rankId, salaryProfile.grade)
      : null;
  const profileLabel =
    salaryProfile != null ? formatSalaryProfileLabel(salaryProfile) : null;

  const unitRates =
    salaryProfile != null ? getAllowanceRates(salaryProfile.rankId) : null;

  const [otDraft, setOtDraft] = useState("0");
  const [nightDraft, setNightDraft] = useState("0");
  const [holidayDraft, setHolidayDraft] = useState("0");

  const shiftOt = allowanceFromShifts?.overtimeHours ?? 0;
  const shiftNight = allowanceFromShifts?.nightHours ?? 0;
  const shiftHoliday = allowanceFromShifts?.holidayDays ?? 0;

  // 모달 열릴 때·근무 집계가 바뀔 때 근무표 기준으로 채움
  useEffect(() => {
    if (!open) return;
    setOtDraft(String(shiftOt));
    setNightDraft(String(shiftNight));
    setHolidayDraft(String(shiftHoliday));
  }, [open, shiftOt, shiftNight, shiftHoliday]);

  const allowanceInput: AllowanceInput = useMemo(
    () => ({
      overtimeHours: parseNum(otDraft),
      nightHours: parseNum(nightDraft),
      holidayDays: Math.round(parseNum(holidayDraft)),
    }),
    [otDraft, nightDraft, holidayDraft],
  );

  const allowancePay = useMemo(() => {
    if (!unitRates) return null;
    return calcAllowancePay(unitRates, allowanceInput);
  }, [unitRates, allowanceInput]);

  const monthlyTakeHome = useMemo(
    () => calcMonthlyTakeHome(tableBase, allowancePay),
    [tableBase, allowancePay],
  );

  const resetAllowanceFromShifts = () => {
    setOtDraft(String(shiftOt));
    setNightDraft(String(shiftNight));
    setHolidayDraft(String(shiftHoliday));
  };

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
            <div className="space-y-2">
              <div className="rounded-2xl bg-[#007AFF]/10 px-4 py-4 dark:bg-[#007AFF]/15">
                <p className="text-[11px] font-medium text-[#007AFF]/80">
                  이번 달 예상 수령액
                  {profileLabel ? ` · ${profileLabel}` : ""}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#007AFF]">
                  {formatWon(monthlyTakeHome)}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  봉급표 기본급
                  {tableBase != null ? ` ${formatWon(tableBase)}` : ""}
                  {allowancePay
                    ? ` + 수당 ${formatWon(allowancePay.total)}`
                    : ""}
                  {allowancePay && allowancePay.overtimePay > 0
                    ? ` (시간외 ${formatWon(allowancePay.overtimePay)})`
                    : ""}
                  . 공제·기타수당 전 참고용이에요.
                </p>
              </div>

              {tableBase != null ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-gray-400">
                      봉급표 기본급
                    </p>
                    <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatWon(tableBase)}
                    </p>
                  </div>
                </div>
              ) : null}

              {unitRates && allowancePay ? (
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        시간외·야간·휴일 수당 (2026 단가)
                      </p>
                      <p className="mt-0.5 text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                        근무표 자동 집계 · 녹색 칸에서 수정 가능
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetAllowanceFromShifts}
                      className="shrink-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      근무표로 다시 채우기
                    </button>
                  </div>

                  <div className="mb-2 rounded-xl bg-white/70 px-2.5 py-2 text-[10px] leading-relaxed text-emerald-900/80 dark:bg-black/20 dark:text-emerald-200/80">
                    이번 달 집계: 시간외 {formatHoursLabel(shiftOt) || "0"}시간 ·
                    야간(22~06) {formatHoursLabel(shiftNight) || "0"}시간 · 휴일{" "}
                    {shiftHoliday}일
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-center text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
                        시간외(시간)
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={otDraft}
                        onChange={(e) => setOtDraft(e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-[#DCFCE7] px-1.5 py-1.5 text-center text-[12px] tabular-nums text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/40 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-gray-100"
                      />
                      <p className="mt-0.5 text-center text-[9px] text-emerald-700/70 dark:text-emerald-400/70">
                        × {formatWon(unitRates.overtime)}
                      </p>
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-center text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
                        야간(시간)
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={nightDraft}
                        onChange={(e) => setNightDraft(e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-[#DCFCE7] px-1.5 py-1.5 text-center text-[12px] tabular-nums text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/40 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-gray-100"
                      />
                      <p className="mt-0.5 text-center text-[9px] text-emerald-700/70 dark:text-emerald-400/70">
                        × {formatWon(unitRates.night)}
                      </p>
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-center text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
                        휴일(일수)
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={holidayDraft}
                        onChange={(e) => setHolidayDraft(e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-[#DCFCE7] px-1.5 py-1.5 text-center text-[12px] tabular-nums text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/40 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-gray-100"
                      />
                      <p className="mt-0.5 text-center text-[9px] text-emerald-700/70 dark:text-emerald-400/70">
                        × {formatWon(unitRates.holiday)}
                      </p>
                    </label>
                  </div>

                  <div className="mt-2.5 space-y-1 border-t border-emerald-200/70 pt-2 dark:border-emerald-500/20">
                    <div className="flex justify-between text-[11px] text-emerald-900/80 dark:text-emerald-200/80">
                      <span>시간외수당</span>
                      <span className="tabular-nums font-semibold">
                        {formatWon(allowancePay.overtimePay)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-900/80 dark:text-emerald-200/80">
                      <span>야간수당</span>
                      <span className="tabular-nums font-semibold">
                        {formatWon(allowancePay.nightPay)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-900/80 dark:text-emerald-200/80">
                      <span>휴일수당</span>
                      <span className="tabular-nums font-semibold">
                        {formatWon(allowancePay.holidayPay)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      <span>수당 합계</span>
                      <span className="tabular-nums">
                        {formatWon(allowancePay.total)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-emerald-800/70 dark:text-emerald-400/70">
                    · 시간외: 추가시간 합 × 단가
                    <br />
                    · 야간: 22:00~06:00 겹침 시간 × 단가 (야간 1회≈8시간)
                    <br />
                    · 휴일: 공휴일·일요일 근무 1일 × 일당
                  </p>
                </div>
              ) : salaryProfile ? (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-[11px] leading-relaxed text-amber-900/80 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200/80">
                  현재 계급({profileLabel})은 2026 시간외 단가표(경정~순경)에
                  없어요. 설정 → 내 계급·호봉에서 경정~순경(또는 소방
                  대응계급)으로 바꿔 주세요.
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-[11px] leading-relaxed text-amber-900/80 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200/80">
                  설정 → 내 계급·호봉을 먼저 지정하면 기본급·수당이 계산돼요.
                </div>
              )}

              <details className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <summary className="cursor-pointer text-[11px] font-semibold text-gray-500">
                  참고 · 통상시급 × 근무시간 ({formatWon(pay.estimated)})
                </summary>
                <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                  총 {formatHoursLabel(totalHours) || "0"}시간 × 설정 시급
                  환산값이에요. 위 &quot;예상 수령액&quot;(기본급+수당)과는 다른
                  참고용 지표입니다.
                </p>
              </details>
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
