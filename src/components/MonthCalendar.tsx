"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Clock3 } from "lucide-react";
import {
  buildPatternChangeSummary,
  buildSingleChangeSummary,
  registerCalendarDevice,
} from "@/lib/api";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { useSharedMessage } from "@/hooks/useSharedMessage";
import { useShifts } from "@/hooks/useShifts";
import {
  formatHoursLabel,
  getHourlyRates,
  getRateCategory,
  getSalaryProfile,
  getShiftColors,
  getShiftDisplayHours,
  getShiftVisual,
  getShowHoursPreference,
  getShowPayPreference,
  resolveShiftColorKey,
  SHIFT_CELL_LABELS,
  WEEKDAY_LABELS,
  type HourlyRates,
  type SalaryProfile,
  type Shift,
  type ShiftChangeLog,
  type ShiftColors,
  type ShiftType,
} from "@/lib/types";
import { legendShiftTypes } from "@/lib/pattern";
import { summarizeAllowanceInput } from "@/lib/allowanceRates";
import { CalendarDay } from "./CalendarDay";
import { CalendarHeader } from "./CalendarHeader";
import { ChangeNoticeModal } from "./ChangeNoticeModal";
import { MonthHoursModal, type HoursBucket } from "./MonthHoursModal";
import { MonthPicker } from "./MonthPicker";
import { RecentChanges } from "./RecentChanges";
import { SettingsModal } from "./SettingsModal";
import { SharedMessageBoard } from "./SharedMessageBoard";
import { ShiftModal } from "./ShiftModal";

interface MonthCalendarProps {
  calendarId: string;
  calendarName: string;
  shareCode: string;
  displayName: string;
  shiftPattern: string;
  ownerDeviceId: string | null;
  appPassword: string;
  passwordVersion: number;
  onPasswordChanged: (next: {
    app_password: string;
    password_version: number;
  }) => void;
  onSessionInvalid: () => void;
  onShiftPatternChange?: (patternId: string) => void;
}

const SWIPE_THRESHOLD = 56;
const SLIDE_MS = 260;

export function MonthCalendar({
  calendarId,
  calendarName,
  shareCode,
  displayName,
  shiftPattern,
  ownerDeviceId,
  appPassword,
  passwordVersion,
  onPasswordChanged,
  onSessionInvalid,
  onShiftPatternChange,
}: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noticeDate, setNoticeDate] = useState<Date | null>(null);
  const [noticeLogs, setNoticeLogs] = useState<ShiftChangeLog[]>([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [showHours, setShowHours] = useState(true);
  const [showPay, setShowPay] = useState(true);
  const [hourlyRates, setHourlyRates] = useState<HourlyRates>(() => ({
    day: 10200,
    night: 13900,
    overnight: 15500,
  }));
  const [salaryProfile, setSalaryProfile] = useState<SalaryProfile | null>(null);
  const [shiftColors, setShiftColors] = useState<ShiftColors>(() => ({
    day: "#F97316",
    night: "#1B3A5F",
    overnight: "#0F2744",
    rest: "#9CA3AF",
    off: "#CBD5E1",
  }));

  useEffect(() => {
    setShowHours(getShowHoursPreference());
    setShowPay(getShowPayPreference());
    setHourlyRates(getHourlyRates());
    setSalaryProfile(getSalaryProfile());
    setShiftColors(getShiftColors());
  }, []);

  // 설정에서 시급·계급이 바뀌면 봉급 프로필도 다시 읽음
  useEffect(() => {
    setSalaryProfile(getSalaryProfile());
  }, [hourlyRates]);

  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const dragXRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const axisLock = useRef<"x" | "y" | null>(null);
  const didSwipe = useRef(false);
  const animLock = useRef(false);
  const modalOpenRef = useRef(modalOpen);

  modalOpenRef.current = modalOpen;

  const { loading, error, saveShift, saveShiftsBulk, removeShift, shifts, reload } =
    useShifts({
      calendarId,
      currentMonth,
    });

  const {
    unseenByDate,
    recentLogs,
    setupError,
    markSeen,
    recordSingleChange,
    recordPatternChange,
  } = useChangeLogs({
    calendarId,
    currentMonth,
  });

  const {
    message: sharedMessage,
    loading: messageLoading,
    saving: messageSaving,
    error: messageError,
    postMessage,
  } = useSharedMessage(calendarId);

  // 이 기기를 접속 이력에 등록·갱신
  useEffect(() => {
    if (!displayName.trim()) return;
    registerCalendarDevice({
      calendarId,
      displayName,
    }).catch(() => {
      // 테이블 미생성 등이어도 달력 사용은 계속
    });
  }, [calendarId, displayName]);

  // date → shift 맵 (매 셀 find 대신 O(1) 조회)
  const shiftMap = useMemo(() => {
    const map = new Map<string, Shift>();
    for (const s of shifts) map.set(s.date, s);
    return map;
  }, [shifts]);

  /** 현재 달 근무시간 합계 (비번·휴무 0시간 제외) */
  const monthHoursSummary = useMemo(() => {
    const prefix = format(currentMonth, "yyyy-MM");
    let total = 0;
    const byType = new Map<ShiftType, number>();
    const byBucket = { day: 0, night: 0, overnight: 0 };

    for (const s of shifts) {
      if (!s.date.startsWith(prefix)) continue;
      const h = getShiftDisplayHours(s);
      if (h <= 0) continue;
      total += h;
      byType.set(s.shift_type, (byType.get(s.shift_type) ?? 0) + h);
      const cat = getRateCategory(s.shift_type);
      if (cat) byBucket[cat] += h;
    }

    total = Math.round(total * 10) / 10;
    byBucket.day = Math.round(byBucket.day * 10) / 10;
    byBucket.night = Math.round(byBucket.night * 10) / 10;
    byBucket.overnight = Math.round(byBucket.overnight * 10) / 10;

    const order: ShiftType[] = [
      "day",
      "night",
      "overnight",
      "day_support",
      "night_support",
    ];
    const parts = order
      .filter((t) => (byType.get(t) ?? 0) > 0)
      .map((t) => {
        const h = byType.get(t) ?? 0;
        const rounded = Math.round(h * 10) / 10;
        return {
          type: t,
          label: SHIFT_CELL_LABELS[t],
          hours: formatHoursLabel(rounded),
        };
      });

    const buckets: HoursBucket[] = [
      {
        key: "day",
        label: "주간",
        hours: byBucket.day,
        color: shiftColors.day,
      },
      {
        key: "night",
        label: "야간",
        hours: byBucket.night,
        color: shiftColors.night,
      },
      {
        key: "overnight",
        label: "심야",
        hours: byBucket.overnight,
        color: shiftColors.overnight,
      },
    ];

    return { total, parts, buckets };
  }, [shifts, currentMonth, shiftColors]);

  /** 시간외·야간·휴일 수당 집계용 (달력 입력 기준) */
  const allowanceFromShifts = useMemo(() => {
    return summarizeAllowanceInput(
      shifts,
      format(currentMonth, "yyyy-MM"),
    );
  }, [shifts, currentMonth]);

  const changeCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const [date, list] of unseenByDate) {
      map.set(date, list.length);
    }
    return map;
  }, [unseenByDate]);

  const prevMonth = useMemo(() => subMonths(currentMonth, 1), [currentMonth]);
  const nextMonth = useMemo(() => addMonths(currentMonth, 1), [currentMonth]);

  const daysFor = useCallback((month: Date) => {
    // 항상 6주(42칸)로 고정 → 월 전환 시 높이 출렁임 방지
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = addDays(start, 41);
    return eachDayOfInterval({ start, end });
  }, []);

  const prevDays = useMemo(() => daysFor(prevMonth), [daysFor, prevMonth]);
  const currentDays = useMemo(() => daysFor(currentMonth), [daysFor, currentMonth]);
  const nextDays = useMemo(() => daysFor(nextMonth), [daysFor, nextMonth]);

  const selectedShift = selectedDate
    ? shiftMap.get(format(selectedDate, "yyyy-MM-dd"))
    : undefined;

  const setStripX = useCallback((x: number, withTransition: boolean) => {
    const strip = stripRef.current;
    if (!strip) return;
    dragXRef.current = x;
    strip.style.transition = withTransition
      ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : "none";
    strip.style.transform = `translate3d(calc(-33.333333% + ${x}px), 0, 0)`;
  }, []);

  useLayoutEffect(() => {
    setStripX(0, false);
  }, [currentMonth, setStripX]);

  const openDay = useCallback((date: Date) => {
    if (didSwipe.current || animLock.current) return;
    setSelectedDate(date);
    setModalOpen(true);
  }, []);

  const openChangeNotice = useCallback(
    (date: Date) => {
      if (didSwipe.current || animLock.current) return;
      const key = format(date, "yyyy-MM-dd");
      const list = unseenByDate.get(key) ?? [];
      setNoticeDate(date);
      setNoticeLogs(list);
      setNoticeOpen(true);
      if (list.length > 0) {
        markSeen(list.map((l) => l.id));
      }
    },
    [unseenByDate, markSeen],
  );

  const handleSave = async (data: {
    shiftType: ShiftType;
    note: string;
    existingId?: string;
    startTime?: string | null;
    endTime?: string | null;
    extraHours?: number | null;
  }) => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      const prevType = selectedShift?.shift_type ?? null;
      await saveShift({
        date: dateKey,
        shiftType: data.shiftType,
        note: data.note,
        updatedBy: displayName,
        existingId: data.existingId,
        startTime: data.startTime,
        endTime: data.endTime,
        extraHours: data.extraHours,
      });
      await recordSingleChange({
        date: dateKey,
        fromType: prevType,
        toType: data.shiftType,
        note: data.note,
        updatedBy: displayName,
        summary: buildSingleChangeSummary({
          updatedBy: displayName,
          fromType: prevType,
          toType: data.shiftType,
          note: data.note,
        }),
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePattern = async (data: {
    items: { date: string; shiftType: ShiftType }[];
  }) => {
    setSaving(true);
    try {
      await saveShiftsBulk({
        updatedBy: displayName,
        items: data.items,
      });
      const first = data.items[0];
      if (first) {
        await recordPatternChange({
          date: first.date,
          toType: first.shiftType,
          patternDays: data.items.length,
          updatedBy: displayName,
          summary: buildPatternChangeSummary({
            updatedBy: displayName,
            startType: first.shiftType,
            patternDays: data.items.length,
          }),
        });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shiftId: string) => {
    await removeShift(shiftId);
    setModalOpen(false);
  };

  const getWidth = () => trackRef.current?.offsetWidth ?? window.innerWidth;

  /** direction: 1 = 다음달, -1 = 이전달 */
  const commitSlide = useCallback(
    (direction: 1 | -1) => {
      if (animLock.current) return;
      animLock.current = true;

      const width = getWidth();
      const strip = stripRef.current;
      if (!strip) {
        animLock.current = false;
        return;
      }

      const targetX = -direction * width;
      setStripX(targetX, true);

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        strip.removeEventListener("transitionend", onEnd);
        window.clearTimeout(fallbackTimer);

        // 이미 목표 월이 보이는 상태.
        // 중앙 리셋보다 먼저 달력 내용을 바꾸고, 페인트 전에 transform을 스냅해야
        // 이전 달이 한 프레임 비치는 깜빡임이 사라짐.
        strip.style.transition = "none";

        flushSync(() => {
          setCurrentMonth((m) =>
            direction === 1 ? addMonths(m, 1) : subMonths(m, 1),
          );
        });

        dragXRef.current = 0;
        strip.style.transform = "translate3d(-33.333333%, 0, 0)";
        // transition:none 확정 (다음 스와이프에서 애니메이션이 먹히도록)
        void strip.offsetHeight;

        animLock.current = false;
      };

      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== "transform") return;
        finish();
      };

      strip.addEventListener("transitionend", onEnd);
      // transitionend 누락 대비
      const fallbackTimer = window.setTimeout(finish, SLIDE_MS + 80);
    },
    [setStripX],
  );

  const goToday = () => {
    if (modalOpen || animLock.current) return;
    setStripX(0, false);
    setCurrentMonth(startOfMonth(new Date()));
  };

  const jumpToMonth = (month: Date) => {
    if (modalOpen || animLock.current) return;
    setStripX(0, false);
    setCurrentMonth(startOfMonth(month));
  };

  // 네이티브 터치로 드래그 → React 리렌더 없이 transform만 갱신
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onStart = (e: TouchEvent) => {
      if (modalOpenRef.current || animLock.current) return;
      const t = e.touches[0];
      startXRef.current = t.clientX;
      startYRef.current = t.clientY;
      axisLock.current = null;
      didSwipe.current = false;
      setStripX(dragXRef.current, false);
    };

    const onMove = (e: TouchEvent) => {
      if (modalOpenRef.current || animLock.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startXRef.current;
      const dy = t.clientY - startYRef.current;

      if (!axisLock.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axisLock.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (axisLock.current === "x" && track) {
          track.style.touchAction = "none";
        }
      }

      if (axisLock.current !== "x") return;

      e.preventDefault();
      didSwipe.current = Math.abs(dx) > 8;
      setStripX(dx * 0.95, false);
    };

    const unlockTouch = () => {
      if (track) track.style.touchAction = "";
    };

    const onEnd = () => {
      unlockTouch();
      if (modalOpenRef.current) return;
      if (axisLock.current !== "x" || animLock.current) {
        axisLock.current = null;
        setStripX(0, true);
        return;
      }

      const dx = dragXRef.current;
      axisLock.current = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD) {
        setStripX(0, true);
        window.setTimeout(() => {
          didSwipe.current = false;
        }, SLIDE_MS);
        return;
      }

      commitSlide(dx < 0 ? 1 : -1);
      window.setTimeout(() => {
        didSwipe.current = false;
      }, SLIDE_MS + 40);
    };

    track.addEventListener("touchstart", onStart, { passive: true });
    track.addEventListener("touchmove", onMove, { passive: false });
    track.addEventListener("touchend", onEnd);
    track.addEventListener("touchcancel", onEnd);

    return () => {
      track.removeEventListener("touchstart", onStart);
      track.removeEventListener("touchmove", onMove);
      track.removeEventListener("touchend", onEnd);
      track.removeEventListener("touchcancel", onEnd);
    };
  }, [commitSlide, setStripX]);

  return (
    <div className="min-h-dvh bg-[#F2F2F7] dark:bg-[#0B0F14]">
      <CalendarHeader
        currentMonth={currentMonth}
        calendarName={calendarName}
        onToday={goToday}
        onOpenMonthPicker={() => setMonthPickerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-3xl px-3 pb-28 pt-3 sm:px-4">
        <button
          type="button"
          onClick={() => {
            setHoursModalOpen(true);
            void reload();
          }}
          className="mb-3 w-full rounded-2xl bg-white/80 px-3.5 py-3 text-left shadow-sm transition active:scale-[0.99] dark:bg-[#161B22]/90 dark:shadow-black/20"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF]">
              <Clock3 className="h-4 w-4" />
            </div>
            <div className="min-w-0 shrink-0">
              <p className="text-[11px] font-medium text-gray-400">
                {format(currentMonth, "M월")} 총 근무시간
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight text-gray-900 dark:text-gray-100">
                {formatHoursLabel(monthHoursSummary.total) || "0"}
                <span className="ml-0.5 text-sm font-semibold text-gray-500">
                  시간
                </span>
              </p>
            </div>

            <div className="ml-auto min-w-0 flex-1">
              {monthHoursSummary.parts.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
                  {monthHoursSummary.parts.map((part) => {
                    const visual = getShiftVisual(part.type, shiftColors);
                    return (
                      <span
                        key={part.type}
                        className="text-[11px] font-semibold tabular-nums leading-none sm:text-xs"
                        style={{ color: visual.text }}
                      >
                        {part.label} {part.hours}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-right text-[11px] text-gray-400">
                  등록된 근무시간이 없어요
                </p>
              )}
            </div>
          </div>
          <p className="mt-2 text-right text-[10px] text-gray-400">
            {showPay
              ? "탭해서 그래프 · 예상 월급 보기"
              : "탭해서 근무시간 그래프 보기"}
          </p>
        </button>

        <div className="mb-2 grid grid-cols-7 gap-1 px-0.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`py-1 text-center text-[11px] font-semibold ${
                i === 0 ? "text-rose-400" : i === 6 ? "text-sky-500" : "text-gray-400"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          ref={trackRef}
          className="overflow-hidden overscroll-x-none overscroll-y-contain"
          style={{ touchAction: "pan-y" }}
        >
          <div
            ref={stripRef}
            className="flex w-[300%] will-change-transform"
            style={{
              transform: "translate3d(-33.333333%, 0, 0)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* key로 패널 DOM을 재사용해 스와이프 후 스냅 시 깜빡임 감소 */}
            <MonthGrid
              key={format(prevMonth, "yyyy-MM")}
              days={prevDays}
              month={prevMonth}
              shiftMap={shiftMap}
              changeCountByDate={changeCountByDate}
              showHours={showHours}
              shiftColors={shiftColors}
              onClick={openDay}
              onChangeBadgeClick={openChangeNotice}
            />
            <MonthGrid
              key={format(currentMonth, "yyyy-MM")}
              days={currentDays}
              month={currentMonth}
              shiftMap={shiftMap}
              changeCountByDate={changeCountByDate}
              showHours={showHours}
              shiftColors={shiftColors}
              onClick={openDay}
              onChangeBadgeClick={openChangeNotice}
            />
            <MonthGrid
              key={format(nextMonth, "yyyy-MM")}
              days={nextDays}
              month={nextMonth}
              shiftMap={shiftMap}
              changeCountByDate={changeCountByDate}
              showHours={showHours}
              shiftColors={shiftColors}
              onClick={openDay}
              onChangeBadgeClick={openChangeNotice}
            />
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-center text-xs text-gray-400">불러오는 중…</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-gray-400">
          {legendShiftTypes(shiftPattern).map(({ type, short }) => (
            <LegendDot
              key={type}
              color={shiftColors[resolveShiftColorKey(type)]}
              label={short}
            />
          ))}
        </div>

        <SharedMessageBoard
          message={sharedMessage}
          loading={messageLoading}
          saving={messageSaving}
          error={messageError}
          displayName={displayName}
          onPost={(body) => postMessage(body, displayName)}
        />

        <RecentChanges
          logs={recentLogs}
          setupError={setupError}
          onSelect={(log) => {
            const d = parseISO(log.date);
            setNoticeDate(d);
            setNoticeLogs([log]);
            setNoticeOpen(true);
            markSeen([log.id]);
          }}
        />
      </main>

      <ShiftModal
        open={modalOpen}
        date={selectedDate}
        shift={selectedShift}
        saving={saving}
        shiftColors={shiftColors}
        calendarId={calendarId}
        patternId={shiftPattern}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onSavePattern={handleSavePattern}
        onDelete={handleDelete}
        onShiftPatternChange={onShiftPatternChange}
      />

      <ChangeNoticeModal
        open={noticeOpen}
        date={noticeDate}
        logs={noticeLogs}
        onClose={() => setNoticeOpen(false)}
      />

      <SettingsModal
        open={settingsOpen}
        calendarId={calendarId}
        shareCode={shareCode}
        calendarName={calendarName}
        shiftPattern={shiftPattern}
        ownerDeviceId={ownerDeviceId}
        appPassword={appPassword}
        passwordVersion={passwordVersion}
        onPasswordChanged={onPasswordChanged}
        onSessionInvalid={onSessionInvalid}
        showHours={showHours}
        onShowHoursChange={setShowHours}
        showPay={showPay}
        onShowPayChange={setShowPay}
        hourlyRates={hourlyRates}
        onHourlyRatesChange={setHourlyRates}
        shiftColors={shiftColors}
        onShiftColorsChange={setShiftColors}
        onClose={() => setSettingsOpen(false)}
      />

      <MonthHoursModal
        open={hoursModalOpen}
        month={currentMonth}
        totalHours={monthHoursSummary.total}
        buckets={monthHoursSummary.buckets}
        rates={hourlyRates}
        showPay={showPay}
        salaryProfile={salaryProfile ?? undefined}
        allowanceFromShifts={allowanceFromShifts}
        onClose={() => setHoursModalOpen(false)}
      />

      <MonthPicker
        open={monthPickerOpen}
        value={currentMonth}
        onClose={() => setMonthPickerOpen(false)}
        onConfirm={jumpToMonth}
      />
    </div>
  );
}

const MonthGrid = function MonthGrid({
  days,
  month,
  shiftMap,
  changeCountByDate,
  showHours,
  shiftColors,
  onClick,
  onChangeBadgeClick,
}: {
  days: Date[];
  month: Date;
  shiftMap: Map<string, Shift>;
  changeCountByDate: Map<string, number>;
  showHours: boolean;
  shiftColors: ShiftColors;
  onClick: (date: Date) => void;
  onChangeBadgeClick: (date: Date) => void;
}) {
  return (
    <div
      className="grid h-[calc(6*68px+5*0.25rem)] w-1/3 shrink-0 grid-cols-7 grid-rows-6 gap-1 sm:h-[calc(6*88px+5*0.375rem)] sm:gap-1.5"
    >
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        return (
          <CalendarDay
            key={key}
            date={day}
            currentMonth={month}
            shift={shiftMap.get(key)}
            changeCount={changeCountByDate.get(key) ?? 0}
            showHours={showHours}
            shiftColors={shiftColors}
            onClick={onClick}
            onChangeBadgeClick={onChangeBadgeClick}
          />
        );
      })}
    </div>
  );
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full border border-black/5 dark:border-white/10"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
