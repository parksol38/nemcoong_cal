"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Clock3,
  Copy,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  MonitorSmartphone,
  Moon,
  Settings2,
  Smartphone,
  Sun,
  UserMinus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  fetchCalendarDevices,
  removeCalendarDevice,
  updateCalendarPassword,
} from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import {
  formatDesignVersionLabel,
  formatReleaseVersionLabel,
} from "@/lib/appVersion";
import { storeAgencyTheme } from "@/lib/agencyTheme";
import { useAgencyTheme } from "@/components/AgencyThemeProvider";
import { TestSessionSwitcher } from "@/components/TestSessionSwitcher";
import { getShiftPattern } from "@/lib/shiftPatterns";
import {
  applySalaryProfileRates,
  availableGrades,
  DEFAULT_HOURLY_RATES,
  DEFAULT_SALARY_PROFILE,
  DEFAULT_SHIFT_COLORS,
  formatSalaryProfileLabel,
  formatWon,
  getOrCreateDeviceId,
  getSalaryProfile,
  lookupMonthlySalary,
  MONTHLY_STATUTORY_HOURS,
  rankLabel,
  SALARY_RANKS,
  SHIFT_CELL_LABELS,
  SHIFT_COLOR_KEYS,
  SHIFT_COLOR_PALETTE,
  storeHourlyRates,
  storeShiftColors,
  storeShowHoursPreference,
  storeShowPayPreference,
  unlockDevice,
  type AppTheme,
  type CalendarDevice,
  type HourlyRates,
  type SalaryAgency,
  type SalaryProfile,
  type SalaryRankId,
  type ShiftColorKey,
  type ShiftColors,
} from "@/lib/types";

interface SettingsModalProps {
  open: boolean;
  calendarId: string;
  shareCode: string;
  calendarName: string;
  shiftPattern: string;
  displayName: string;
  ownerDeviceId: string | null;
  appPassword: string;
  passwordVersion: number;
  onPasswordChanged: (next: {
    app_password: string;
    password_version: number;
  }) => void;
  onSessionInvalid: () => void;
  onTestSessionSwitch: () => void;
  onClose: () => void;
  showHours: boolean;
  onShowHoursChange: (show: boolean) => void;
  showPay: boolean;
  onShowPayChange: (show: boolean) => void;
  hourlyRates: HourlyRates;
  onHourlyRatesChange: (rates: HourlyRates) => void;
  shiftColors: ShiftColors;
  onShiftColorsChange: (colors: ShiftColors) => void;
}

type Tab = "prefs" | "devices";

/** 시급 입력 표시용 천 단위 콤마 (예: 1,000) */
function formatRateInput(value: number | string): string {
  const digits =
    typeof value === "number"
      ? String(Math.max(0, Math.round(value)))
      : value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
}

function isPhoneLike(label: string) {
  return /iPhone|Android 폰|iPad|태블릿/i.test(label);
}

export function SettingsModal({
  open,
  calendarId,
  shareCode,
  calendarName,
  shiftPattern,
  displayName,
  ownerDeviceId,
  appPassword,
  passwordVersion,
  onPasswordChanged,
  onSessionInvalid: _onSessionInvalid,
  onTestSessionSwitch,
  onClose,
  showHours,
  onShowHoursChange,
  showPay,
  onShowPayChange,
  hourlyRates,
  onHourlyRatesChange,
  shiftColors,
  onShiftColorsChange,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("prefs");
  const [devices, setDevices] = useState<CalendarDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateDraft, setRateDraft] = useState({
    day: formatRateInput(hourlyRates.day),
    night: formatRateInput(hourlyRates.night),
    overnight: formatRateInput(hourlyRates.overnight),
  });
  const [salaryProfile, setSalaryProfile] = useState<SalaryProfile>(
    DEFAULT_SALARY_PROFILE,
  );
  const myDeviceId = typeof window !== "undefined" ? getOrCreateDeviceId() : "";
  const isOwner =
    Boolean(myDeviceId) &&
    (ownerDeviceId === myDeviceId || !ownerDeviceId);
  const pattern = getShiftPattern(shiftPattern);
  const { agency } = useAgencyTheme();
  const { theme, resolvedTheme, setTheme, schedule, setSchedule } = useTheme();
  const [editingColorKey, setEditingColorKey] = useState<ShiftColorKey | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState(appPassword);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab("prefs");
    setEditingColorKey(null);
    setShowPassword(false);
    setPasswordDraft(appPassword);
    setPasswordMsg(null);
    setSalaryProfile(getSalaryProfile());
    setRateDraft({
      day: formatRateInput(hourlyRates.day),
      night: formatRateInput(hourlyRates.night),
      overnight: formatRateInput(hourlyRates.overnight),
    });
  }, [open, hourlyRates, appPassword]);

  useEffect(() => {
    if (!open || tab !== "devices") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCalendarDevices(calendarId)
      .then((list) => {
        if (!cancelled) setDevices(list);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "접속 이력을 불러오지 못했어요. migrate-calendar-devices.sql 실행이 필요할 수 있어요.",
          );
          setDevices([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, calendarId, tab]);

  const handleToggleHours = (next: boolean) => {
    storeShowHoursPreference(next);
    onShowHoursChange(next);
  };

  const handleTogglePay = (next: boolean) => {
    storeShowPayPreference(next);
    onShowPayChange(next);
  };

  const commitRate = (key: keyof HourlyRates, raw: string) => {
    const parsed = Number(raw.replace(/[^\d]/g, ""));
    const fallback = DEFAULT_HOURLY_RATES[key];
    const value =
      Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
    const next = { ...hourlyRates, [key]: value };
    storeHourlyRates(next);
    onHourlyRatesChange(next);
    setRateDraft((prev) => ({ ...prev, [key]: formatRateInput(value) }));
  };

  const applyProfileRates = (nextProfile: SalaryProfile) => {
    const rates = applySalaryProfileRates(nextProfile);
    setSalaryProfile(nextProfile);
    onHourlyRatesChange(rates);
    setRateDraft({
      day: formatRateInput(rates.day),
      night: formatRateInput(rates.night),
      overnight: formatRateInput(rates.overnight),
    });
  };

  const handleAgencyChange = (agency: SalaryAgency) => {
    applyProfileRates({ ...salaryProfile, agency });
    storeAgencyTheme(agency);
  };

  const handleRankChange = (rankId: SalaryRankId) => {
    const grades = availableGrades(rankId);
    const grade = grades.includes(salaryProfile.grade)
      ? salaryProfile.grade
      : (grades[0] ?? 1);
    applyProfileRates({ ...salaryProfile, rankId, grade });
  };

  const handleGradeChange = (grade: number) => {
    applyProfileRates({ ...salaryProfile, grade });
  };

  const resetRates = () => {
    applyProfileRates(salaryProfile);
  };

  const monthlyBase = lookupMonthlySalary(
    salaryProfile.rankId,
    salaryProfile.grade,
  );
  const gradeOptions = availableGrades(salaryProfile.rankId);

  const setColor = (key: ShiftColorKey, hex: string) => {
    const next = { ...shiftColors, [key]: hex };
    storeShiftColors(next);
    onShiftColorsChange(next);
  };

  const resetColors = () => {
    const next = { ...DEFAULT_SHIFT_COLORS };
    storeShiftColors(next);
    onShiftColorsChange(next);
    setEditingColorKey(null);
  };

  const copyShareCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      setPasswordMsg("코드 복사에 실패했습니다.");
    }
  };

  const savePassword = async () => {
    if (!myDeviceId) return;
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      const next = await updateCalendarPassword({
        calendarId,
        newPassword: passwordDraft,
        actorDeviceId: myDeviceId,
      });
      unlockDevice(next.password_version);
      onPasswordChanged(next);
      setPasswordMsg("비밀번호를 저장했습니다. 다른 기기는 다시 잠금 해제해야 해요.");
    } catch (e) {
      setPasswordMsg(
        e instanceof Error ? e.message : "비밀번호 저장에 실패했습니다.",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const kickDevice = async (device: CalendarDevice) => {
    if (!myDeviceId || !isOwner) return;
    if (device.device_id === myDeviceId) return;
    const ok = window.confirm(
      `${device.display_name || "이름 없음"} 님을 이 근무표에서 내보낼까요?`,
    );
    if (!ok) return;
    setKickingId(device.id);
    setError(null);
    try {
      await removeCalendarDevice({
        calendarId,
        targetDeviceId: device.device_id,
        actorDeviceId: myDeviceId,
      });
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
    } finally {
      setKickingId(null);
    }
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
            <p className="text-xs font-medium text-gray-400">설정</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">앱 정보</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95 dark:bg-white/10 dark:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-100 px-3 pt-2 dark:border-white/10 sm:px-4">
          <TabButton
            active={tab === "prefs"}
            onClick={() => setTab("prefs")}
            icon={<Settings2 className="h-3.5 w-3.5" />}
            label="사용자지정"
          />
          <TabButton
            active={tab === "devices"}
            onClick={() => setTab("devices")}
            icon={<Users className="h-3.5 w-3.5" />}
            label="접속한 사람"
          />
        </div>

        <div className="max-h-[55vh] space-y-2.5 overflow-y-auto px-5 py-4">
          {tab === "prefs" ? (
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-accent/30 bg-accent/5 px-3 py-3 dark:border-accent/40 dark:bg-accent/10">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <IdCard className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      내 계급·호봉
                    </p>
                    <p className="text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                      진급·호봉 승급 시 여기서 바꾸면 기본급·시급이 갱신돼요.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold text-gray-500">
                      직군
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: "police" as const, label: "경찰" },
                          { id: "fire" as const, label: "소방" },
                        ] as const
                      ).map((opt) => {
                        const selected = salaryProfile.agency === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleAgencyChange(opt.id)}
                            className={`rounded-lg border px-2 py-1.5 text-[12px] font-semibold transition active:scale-[0.98] ${
                              selected
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-200"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[10px] font-semibold text-gray-500">
                        계급
                      </span>
                      <select
                        value={salaryProfile.rankId}
                        onChange={(e) =>
                          handleRankChange(e.target.value as SalaryRankId)
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[12px] outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                      >
                        {SALARY_RANKS.map((rank) => (
                          <option key={rank.id} value={rank.id}>
                            {rankLabel(rank, salaryProfile.agency)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[10px] font-semibold text-gray-500">
                        호봉
                      </span>
                      <select
                        value={salaryProfile.grade}
                        onChange={(e) =>
                          handleGradeChange(Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[12px] outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                      >
                        {gradeOptions.map((g) => (
                          <option key={g} value={g}>
                            {g}호봉
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="rounded-xl bg-white px-3 py-2.5 dark:bg-[#0B0F14]">
                    <p className="text-[10px] font-medium text-gray-400">
                      봉급표 기본급 · {formatSalaryProfileLabel(salaryProfile)}
                    </p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">
                      {monthlyBase != null ? formatWon(monthlyBase) : "—"}
                    </p>
                    <p className="mt-1 text-[10px] leading-snug text-gray-400">
                      공무원보수규정(2026) 기준. 통상시급 ≈ 기본급 ÷{" "}
                      {MONTHLY_STATUTORY_HOURS}시간. 실제 수당·공제와는 다를 수
                      있어요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-gray-500">이 근무표</p>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {calendarName}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  교대 유형 · {pattern.name}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 dark:bg-[#0B0F14]">
                    <p className="text-[10px] text-gray-400">공유 코드</p>
                    <p className="font-mono text-lg font-bold tracking-[0.2em] text-accent">
                      {shareCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyShareCode()}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent/10 px-3 text-xs font-semibold text-accent transition active:scale-95"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedCode ? "복사됨" : "복사"}
                  </button>
                </div>
              </div>

              {isOwner ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3.5 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-2 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      잠금 비밀번호
                    </p>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      소유자
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordDraft}
                        onChange={(e) => setPasswordDraft(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400"
                        aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={passwordSaving}
                      onClick={() => void savePassword()}
                      className="shrink-0 rounded-xl bg-accent px-3 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-60"
                    >
                      {passwordSaving ? "저장…" : "변경"}
                    </button>
                  </div>
                  {passwordMsg ? (
                    <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                      {passwordMsg}
                    </p>
                  ) : (
                    <p className="mt-2 text-[10px] text-gray-400">
                      버전 {passwordVersion} · 바꾸면 다른 기기는 다시 잠금 해제
                    </p>
                  )}
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3.5 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    {resolvedTheme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      앱 색상
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                      화면 전체 밝기를 선택하세요. 기본은 밝음입니다.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: "light" as AppTheme,
                        label: "밝음",
                        hint: "기본",
                        icon: Sun,
                      },
                      {
                        id: "dark" as AppTheme,
                        label: "어두움",
                        hint: "야간",
                        icon: Moon,
                      },
                      {
                        id: "schedule" as AppTheme,
                        label: "시간대",
                        hint: "자동",
                        icon: Clock3,
                      },
                    ] as const
                  ).map((opt) => {
                    const selected = theme === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`rounded-2xl border-2 px-2.5 py-3 text-left transition active:scale-[0.98] ${
                          selected
                            ? "border-accent bg-accent/10 dark:bg-accent/15"
                            : "border-gray-200 bg-white dark:border-white/10 dark:bg-[#0B0F14]"
                        }`}
                      >
                        <Icon
                          className={`mb-1.5 h-4 w-4 ${selected ? "text-accent" : "text-gray-400"}`}
                        />
                        <p
                          className={`text-sm font-bold ${selected ? "text-accent" : "text-gray-800 dark:text-gray-200"}`}
                        >
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{opt.hint}</p>
                      </button>
                    );
                  })}
                </div>

                {theme === "schedule" ? (
                  <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#0B0F14]">
                    <p className="mb-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                      밝게 둘 시간
                    </p>
                    {/* time 입력은 가로가 넓어 나란히 두면 잘리므로 세로 배치 */}
                    <div className="flex flex-col gap-2">
                      <label className="block min-w-0">
                        <span className="mb-1 block text-[10px] text-gray-400">
                          시작
                        </span>
                        <input
                          type="time"
                          value={schedule.lightStart}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              lightStart: e.target.value || schedule.lightStart,
                            })
                          }
                          className="box-border w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-[15px] tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 [&::-webkit-datetime-edit]:min-w-0 [&::-webkit-datetime-edit]:p-0"
                        />
                      </label>
                      <label className="block min-w-0">
                        <span className="mb-1 block text-[10px] text-gray-400">
                          끝
                        </span>
                        <input
                          type="time"
                          value={schedule.lightEnd}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              lightEnd: e.target.value || schedule.lightEnd,
                            })
                          }
                          className="box-border w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-[15px] tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 [&::-webkit-datetime-edit]:min-w-0 [&::-webkit-datetime-edit]:p-0"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-[10px] leading-snug text-gray-400">
                      이 시간대는 밝음, 그 외는 어두움으로 바뀝니다. 자정을
                      넘는 설정도 가능합니다.
                    </p>
                  </div>
                ) : null}

              <div className="mt-3 border-t border-gray-200/80 pt-3 dark:border-white/10">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    근무 색상
                  </p>
                  <button
                    type="button"
                    onClick={resetColors}
                    className="text-[10px] font-semibold text-accent transition active:opacity-70"
                  >
                    기본색
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {SHIFT_COLOR_KEYS.map((key) => {
                    const selected = editingColorKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setEditingColorKey((prev) =>
                            prev === key ? null : key,
                          )
                        }
                        className={`flex flex-col items-center gap-1 rounded-xl p-1 transition active:scale-[0.97] ${
                          selected
                            ? "bg-accent/10 ring-2 ring-accent"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                        aria-label={`${SHIFT_CELL_LABELS[key]} 색상 고르기`}
                        aria-pressed={selected}
                      >
                        <span className="text-[10px] font-semibold text-gray-500">
                          {SHIFT_CELL_LABELS[key]}
                        </span>
                        <span
                          className="block h-9 w-full rounded-lg border border-black/10 shadow-sm dark:border-white/15"
                          style={{ backgroundColor: shiftColors[key] }}
                        />
                      </button>
                    );
                  })}
                </div>
                {editingColorKey ? (
                  <div className="mt-2.5 rounded-2xl border border-gray-200 bg-white p-2.5 dark:border-white/10 dark:bg-[#0B0F14]">
                    <p className="mb-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                      {SHIFT_CELL_LABELS[editingColorKey]} 색 선택
                    </p>
                    <div className="grid grid-cols-8 gap-1.5">
                      {SHIFT_COLOR_PALETTE.map((hex) => {
                        const active =
                          shiftColors[editingColorKey].toUpperCase() ===
                          hex.toUpperCase();
                        return (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setColor(editingColorKey, hex)}
                            aria-label={`색상 ${hex}`}
                            aria-pressed={active}
                            className={`aspect-square rounded-lg border transition active:scale-95 ${
                              active
                                ? "border-accent ring-2 ring-accent ring-offset-1 dark:ring-offset-[#0B0F14]"
                                : "border-black/10 dark:border-white/15"
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[10px] leading-snug text-gray-400">
                    주·야·심·비·휴 네모를 누른 뒤 색을 고르세요. 주자·야자는
                    주간·야간 색을 따릅니다.
                  </p>
                )}
              </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Wallet className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      예상 월급 보기
                    </p>
                    <p className="text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                      근무시간 그래프에서 시급·월급 추정치를 봅니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showPay}
                    aria-label="예상 월급 보기"
                    onClick={() => handleTogglePay(!showPay)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      showPay ? "bg-accent" : "bg-gray-300 dark:bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                        showPay ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {showPay ? (
                  <div className="mt-2.5 space-y-2.5 border-t border-gray-200/80 pt-2.5 dark:border-white/10">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold text-gray-500">
                        시급 추정 (원)
                      </p>
                      <button
                        type="button"
                        onClick={resetRates}
                        className="text-[10px] font-semibold text-accent transition active:opacity-70"
                      >
                        봉급표로 다시 맞추기
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { key: "day" as const, label: "주간" },
                          { key: "night" as const, label: "야간" },
                          { key: "overnight" as const, label: "심야" },
                        ] as const
                      ).map((row) => (
                        <label key={row.key} className="block min-w-0">
                          <span className="mb-0.5 block text-center text-[10px] font-semibold text-gray-500">
                            {row.label}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={rateDraft[row.key]}
                            onChange={(e) => {
                              const digits = e.target.value.replace(
                                /[^\d]/g,
                                "",
                              );
                              setRateDraft((prev) => ({
                                ...prev,
                                [row.key]: formatRateInput(digits),
                              }));
                            }}
                            onBlur={() =>
                              commitRate(row.key, rateDraft[row.key])
                            }
                            className="w-full rounded-lg border border-gray-200 bg-white px-1.5 py-1.5 text-center text-[12px] tabular-nums outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          근무시간 보기
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                          켜면 달력 칸에 근무시간 숫자가 함께 표시됩니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showHours}
                        aria-label="근무시간 보기"
                        onClick={() => handleToggleHours(!showHours)}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                          showHours ? "bg-accent" : "bg-gray-300 dark:bg-white/20"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                            showHours ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <TestSessionSwitcher
                displayName={displayName}
                calendarId={calendarId}
                shareCode={shareCode}
                calendarName={calendarName}
                shiftPattern={shiftPattern}
                agency={agency}
                ownerDeviceId={ownerDeviceId}
                passwordVersion={passwordVersion}
                onSwitched={onTestSessionSwitch}
              />

              <p className="px-1 text-[11px] leading-relaxed text-gray-400">
                설정은 이 기기에만 저장됩니다. 위쪽 월 총 근무시간은 항상
                표시됩니다.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pt-1 text-[11px]">
                <a
                  href="/privacy"
                  className="font-semibold text-accent underline-offset-2 hover:underline"
                >
                  개인정보처리방침
                </a>
                <span className="text-gray-300 dark:text-white/20">·</span>
                <a
                  href="/terms"
                  className="font-semibold text-accent underline-offset-2 hover:underline"
                >
                  이용약관
                </a>
                <span className="text-gray-300 dark:text-white/20">·</span>
                <a
                  href="/data-deletion"
                  className="font-semibold text-accent underline-offset-2 hover:underline"
                >
                  데이터 삭제
                </a>
                <span className="text-gray-300 dark:text-white/20">·</span>
                <span className="text-gray-400">
                  {formatDesignVersionLabel()} · {formatReleaseVersionLabel()}
                </span>
              </div>
            </div>
          ) : loading ? (
            <p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>
          ) : error ? (
            <p className="rounded-2xl bg-rose-50 px-3.5 py-3 text-center text-sm leading-relaxed text-rose-600">
              {error}
            </p>
          ) : tab === "devices" ? (
            devices.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                아직 등록된 기기가 없어요.
              </p>
            ) : (
              devices.map((device) => {
                const isMe = device.device_id === myDeviceId;
                const isDeviceOwner = device.device_id === ownerDeviceId;
                const Icon = isPhoneLike(device.device_label)
                  ? Smartphone
                  : MonitorSmartphone;
                return (
                  <div
                    key={device.id}
                    className={`rounded-2xl border px-3.5 py-3 ${
                      isMe
                        ? "border-accent/25 bg-accent/5"
                        : "border-gray-100 bg-gray-50/80 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isMe
                            ? "bg-accent/15 text-accent"
                            : "bg-white text-gray-500 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:shadow-none"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {device.display_name || "이름 없음"}
                          </p>
                          {isMe ? (
                            <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                              나
                            </span>
                          ) : null}
                          {isDeviceOwner ? (
                            <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                              소유자
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {device.device_label}
                        </p>
                        <div className="mt-2 space-y-0.5 text-[11px] text-gray-400">
                          <p>
                            가입{" "}
                            {format(new Date(device.created_at), "yyyy.M.d HH:mm", {
                              locale: ko,
                            })}
                          </p>
                          <p>
                            최근 접속{" "}
                            {format(
                              new Date(device.last_seen_at),
                              "yyyy.M.d HH:mm",
                              { locale: ko },
                            )}
                          </p>
                        </div>
                        {isOwner && !isMe && !isDeviceOwner ? (
                          <button
                            type="button"
                            disabled={kickingId === device.id}
                            onClick={() => void kickDevice(device)}
                            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition active:scale-95 disabled:opacity-60 dark:bg-rose-500/15 dark:text-rose-300"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            {kickingId === device.id ? "내보내는 중…" : "내보내기"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )
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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-[-1px] flex flex-1 items-center justify-center gap-1 border-b-2 px-1 py-2.5 text-[11px] font-semibold transition sm:gap-1.5 sm:px-2 sm:text-xs ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-gray-400"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
