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

/** SVG 도넛 차트 (근무시간 섹션용 · 소형) */
function DonutChart({ buckets }: { buckets: HoursBucket[] }) {
  const size = 88;
  const stroke = 12;
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
    <div className="relative h-[88px] w-[88px] shrink-0">
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
        <p className="text-base font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100">
          {formatHoursLabel(total) || "0"}
        </p>
        <p className="mt-0.5 text-[9px] font-semibold text-gray-400">시간</p>
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

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {showPay ? (
            <>
              {/* 1. 결과: 예상 수령액 */}
              <div className="rounded-2xl bg-accent/10 px-4 py-3.5 dark:bg-accent/15">
                <p className="text-[11px] font-medium text-accent/80">
                  이번 달 예상 수령액
                  {profileLabel ? ` · ${profileLabel}` : ""}
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-accent">
                  {formatWon(monthlyTakeHome)}
                </p>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  공제·기타수당 전 · 참고용
                </p>
              </div>

              {/* 2. 구성: 기본급 + 수당 = 수령액 */}
              <section>
                <p className="mb-1.5 text-[11px] font-semibold text-gray-500">
                  수령액 구성
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="text-[13px] text-gray-700 dark:text-gray-200">
                      ① 기본급
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {tableBase != null ? formatWon(tableBase) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2.5 dark:border-white/10">
                    <span className="text-[13px] text-gray-700 dark:text-gray-200">
                      ② 수당 합계
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {allowancePay ? formatWon(allowancePay.total) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-dashed border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-white/15 dark:bg-white/5">
                    <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                      ① + ② 예상 수령액
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-accent">
                      {formatWon(monthlyTakeHome)}
                    </span>
                  </div>
                </div>
                {!salaryProfile ? (
                  <p className="mt-1.5 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                    설정 → 내 계급·호봉을 지정하면 기본급·수당이 계산돼요.
                  </p>
                ) : null}
              </section>
            </>
          ) : null}

          {/* 3. 근무시간 (수당 집계의 근거) */}
          <section>
            <p className="mb-1.5 text-[11px] font-semibold text-gray-500">
              근무시간
              <span className="ml-1 font-normal text-gray-400">
                · 야간·휴일 수당 집계 근거
              </span>
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-white/10">
              <DonutChart buckets={buckets} />
              <div className="min-w-0 flex-1 space-y-1">
                {pay.rows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center gap-2 text-[12px]"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-300">
                      {row.label}
                    </span>
                    <span className="shrink-0 tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                      {formatHoursLabel(row.hours) || "0"}h
                    </span>
                  </div>
                ))}
                <p className="pt-0.5 text-[10px] text-gray-400">
                  합계 {formatHoursLabel(totalHours) || "0"}시간
                </p>
              </div>
            </div>
          </section>

          {/* 4. 수당 상세 */}
          {showPay ? (
            unitRates && allowancePay ? (
              <section>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-gray-500">
                    수당 상세
                    <span className="ml-1 font-normal text-gray-400">
                      · 2026 단가
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={resetAllowanceFromShifts}
                    className="shrink-0 text-[10px] font-semibold text-accent"
                  >
                    근무표로 다시 채우기
                  </button>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-white/10">
                  <p className="border-b border-gray-100 px-3 py-2 text-[10px] leading-relaxed text-gray-400 dark:border-white/10">
                    집계: 시간외 {formatHoursLabel(shiftOt) || "0"}h · 야간(22~06){" "}
                    {formatHoursLabel(shiftNight) || "0"}h · 휴일 {shiftHoliday}일
                    · 아래에서 수정 가능
                  </p>

                  <div className="grid grid-cols-3 gap-2 px-3 py-2.5">
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-center text-[10px] font-semibold text-gray-500">
                        시간외(h)
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={otDraft}
                        onChange={(e) => setOtDraft(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1.5 text-center text-[12px] tabular-nums text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                      />
                      <p className="mt-0.5 text-center text-[9px] text-gray-400">
                        × {formatWon(unitRates.overtime)}
                      </p>
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-center text-[10px] font-semibold text-gray-500">
                        야간(h)
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={nightDraft}
                        onChange={(e) => setNightDraft(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1.5 text-center text-[12px] tabular-nums text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                      />
                      <p className="mt-0.5 text-center text-[9px] text-gray-400">
                        × {formatWon(unitRates.night)}
                      </p>
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-center text-[10px] font-semibold text-gray-500">
                        휴일(일)
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={holidayDraft}
                        onChange={(e) => setHolidayDraft(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1.5 text-center text-[12px] tabular-nums text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                      />
                      <p className="mt-0.5 text-center text-[9px] text-gray-400">
                        × {formatWon(unitRates.holiday)}
                      </p>
                    </label>
                  </div>

                  <div className="space-y-1 border-t border-gray-100 px-3 py-2.5 dark:border-white/10">
                    <div className="flex justify-between text-[12px] text-gray-600 dark:text-gray-300">
                      <span>시간외수당</span>
                      <span className="tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                        {formatWon(allowancePay.overtimePay)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px] text-gray-600 dark:text-gray-300">
                      <span>야간수당</span>
                      <span className="tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                        {formatWon(allowancePay.nightPay)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px] text-gray-600 dark:text-gray-300">
                      <span>휴일수당</span>
                      <span className="tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                        {formatWon(allowancePay.holidayPay)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-gray-200 pt-1.5 text-[13px] font-bold text-gray-900 dark:border-white/15 dark:text-gray-100">
                      <span>② 수당 합계</span>
                      <span className="tabular-nums text-accent">
                        {formatWon(allowancePay.total)}
                      </span>
                    </div>
                  </div>

                  <p className="border-t border-gray-100 px-3 py-2 text-[10px] leading-relaxed text-gray-400 dark:border-white/10">
                    시간외=추가시간 합 · 야간=본근무+추가(시작전/종료후)의
                    22~06 겹침 · 휴일=공휴일·일요일 근무 일수
                  </p>
                </div>
              </section>
            ) : salaryProfile ? (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900/80 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200/80">
                현재 계급({profileLabel})은 2026 시간외 단가표(경정~순경)에
                없어요. 설정 → 내 계급·호봉에서 경정~순경(또는 소방
                대응계급)으로 바꿔 주세요.
              </div>
            ) : null
          ) : null}

          {showPay ? (
            <details className="rounded-xl border border-gray-100 px-3 py-2 dark:border-white/10">
              <summary className="cursor-pointer text-[11px] font-semibold text-gray-400">
                참고 · 통상시급 × 근무시간 ({formatWon(pay.estimated)})
              </summary>
              <p className="mt-1.5 text-[10px] leading-relaxed text-gray-400">
                총 {formatHoursLabel(totalHours) || "0"}시간 × 설정 시급
                환산값이에요. 위 예상 수령액(기본급+수당)과는 다른 참고용
                지표입니다.
              </p>
            </details>
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
