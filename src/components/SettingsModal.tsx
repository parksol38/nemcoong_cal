"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Clock3,
  History,
  MessageCircleHeart,
  MonitorSmartphone,
  Moon,
  Settings2,
  Smartphone,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { fetchCalendarDevices, fetchMessageHistory } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import {
  DEFAULT_HOURLY_RATES,
  DEFAULT_SHIFT_COLORS,
  getOrCreateDeviceId,
  SHIFT_CELL_LABELS,
  SHIFT_COLOR_KEYS,
  SHIFT_COLOR_PALETTE,
  storeHourlyRates,
  storeShiftColors,
  storeShowHoursPreference,
  storeShowPayPreference,
  type AppTheme,
  type CalendarDevice,
  type CalendarMessage,
  type HourlyRates,
  type ShiftColorKey,
  type ShiftColors,
} from "@/lib/types";

interface SettingsModalProps {
  open: boolean;
  calendarId: string;
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

type Tab = "prefs" | "devices" | "messages";

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
  const [messages, setMessages] = useState<CalendarMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateDraft, setRateDraft] = useState({
    day: formatRateInput(hourlyRates.day),
    night: formatRateInput(hourlyRates.night),
    overnight: formatRateInput(hourlyRates.overnight),
  });
  const myDeviceId = typeof window !== "undefined" ? getOrCreateDeviceId() : "";
  const { theme, resolvedTheme, setTheme, schedule, setSchedule } = useTheme();
  const [editingColorKey, setEditingColorKey] = useState<ShiftColorKey | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    setTab("prefs");
    setEditingColorKey(null);
    setRateDraft({
      day: formatRateInput(hourlyRates.day),
      night: formatRateInput(hourlyRates.night),
      overnight: formatRateInput(hourlyRates.overnight),
    });
  }, [open, hourlyRates]);

  useEffect(() => {
    if (!open || tab === "prefs") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load =
      tab === "devices"
        ? fetchCalendarDevices(calendarId).then((list) => {
            if (!cancelled) {
              setDevices(list);
              setMessages([]);
            }
          })
        : fetchMessageHistory(calendarId, 40).then((list) => {
            if (!cancelled) {
              setMessages(list);
              setDevices([]);
            }
          });

    load
      .catch(() => {
        if (!cancelled) {
          setError(
            tab === "devices"
              ? "접속 이력을 불러오지 못했어요. migrate-calendar-devices.sql 실행이 필요할 수 있어요."
              : "메시지 이력을 불러오지 못했어요. migrate-calendar-messages.sql 실행이 필요할 수 있어요.",
          );
          setDevices([]);
          setMessages([]);
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

  const resetRates = () => {
    const next = { ...DEFAULT_HOURLY_RATES };
    storeHourlyRates(next);
    onHourlyRatesChange(next);
    setRateDraft({
      day: formatRateInput(next.day),
      night: formatRateInput(next.night),
      overnight: formatRateInput(next.overnight),
    });
  };

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
          <TabButton
            active={tab === "messages"}
            onClick={() => setTab("messages")}
            icon={<MessageCircleHeart className="h-3.5 w-3.5" />}
            label="메시지 이력"
          />
        </div>

        <div className="max-h-[55vh] space-y-2.5 overflow-y-auto px-5 py-4">
          {tab === "prefs" ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3.5 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/15 text-[#007AFF]">
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
                            ? "border-[#007AFF] bg-[#007AFF]/10 dark:bg-[#007AFF]/15"
                            : "border-gray-200 bg-white dark:border-white/10 dark:bg-[#0B0F14]"
                        }`}
                      >
                        <Icon
                          className={`mb-1.5 h-4 w-4 ${selected ? "text-[#007AFF]" : "text-gray-400"}`}
                        />
                        <p
                          className={`text-sm font-bold ${selected ? "text-[#007AFF]" : "text-gray-800 dark:text-gray-200"}`}
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
                    <div className="flex items-center gap-2">
                      <label className="min-w-0 flex-1">
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
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                        />
                      </label>
                      <span className="mt-4 shrink-0 text-xs text-gray-400">
                        ~
                      </span>
                      <label className="min-w-0 flex-1">
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
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
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
                    className="text-[10px] font-semibold text-[#007AFF] transition active:opacity-70"
                  >
                    기본색
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
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
                            ? "bg-[#007AFF]/10 ring-2 ring-[#007AFF]"
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
                                ? "border-[#007AFF] ring-2 ring-[#007AFF] ring-offset-1 dark:ring-offset-[#0B0F14]"
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/15 text-[#007AFF]">
                    <Wallet className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      예상 월급 보기
                    </p>
                    <p className="text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                      근무시간 그래프에서 월급 추정치를 봅니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showPay}
                    aria-label="예상 월급 보기"
                    onClick={() => handleTogglePay(!showPay)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      showPay ? "bg-[#007AFF]" : "bg-gray-300 dark:bg-white/20"
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
                  <div className="mt-2.5 border-t border-gray-200/80 pt-2.5 dark:border-white/10">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold text-gray-500">
                        시급 (원)
                      </p>
                      <button
                        type="button"
                        onClick={resetRates}
                        className="text-[10px] font-semibold text-[#007AFF] transition active:opacity-70"
                      >
                        초임 기본값
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
                            className="w-full rounded-lg border border-gray-200 bg-white px-1.5 py-1.5 text-center text-[12px] tabular-nums outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/15 text-[#007AFF]">
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
                          showHours ? "bg-[#007AFF]" : "bg-gray-300 dark:bg-white/20"
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
              <p className="px-1 text-[11px] leading-relaxed text-gray-400">
                설정은 이 기기에만 저장됩니다. 위쪽 월 총 근무시간은 항상
                표시됩니다.
              </p>
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
                const Icon = isPhoneLike(device.device_label)
                  ? Smartphone
                  : MonitorSmartphone;
                return (
                  <div
                    key={device.id}
                    className={`rounded-2xl border px-3.5 py-3 ${
                      isMe
                        ? "border-[#007AFF]/25 bg-[#007AFF]/5"
                        : "border-gray-100 bg-gray-50/80 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isMe
                            ? "bg-[#007AFF]/15 text-[#007AFF]"
                            : "bg-white text-gray-500 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:shadow-none"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {device.display_name || "이름 없음"}
                          </p>
                          {isMe ? (
                            <span className="shrink-0 rounded-full bg-[#007AFF]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#007AFF]">
                              나
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
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 남긴 메시지가 없어요.
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <History className="h-3 w-3 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {msg.updated_by || "누군가"}
                    </p>
                    {i === 0 ? (
                      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">
                        현재
                      </span>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-[10px] text-gray-400">
                    {format(new Date(msg.created_at), "yyyy.M.d HH:mm", {
                      locale: ko,
                    })}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                  {msg.body}
                </p>
              </div>
            ))
          )}
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
          ? "border-[#007AFF] text-[#007AFF]"
          : "border-transparent text-gray-400"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
