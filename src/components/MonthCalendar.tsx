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
import { Wifi } from "lucide-react";
import {
  buildPatternChangeSummary,
  buildSingleChangeSummary,
  registerCalendarDevice,
} from "@/lib/api";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { useSharedMessage } from "@/hooks/useSharedMessage";
import { useShifts } from "@/hooks/useShifts";
import {
  WEEKDAY_LABELS,
  type Shift,
  type ShiftChangeLog,
  type ShiftType,
} from "@/lib/types";
import { CalendarDay } from "./CalendarDay";
import { CalendarHeader } from "./CalendarHeader";
import { ChangeNoticeModal } from "./ChangeNoticeModal";
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
}

const SWIPE_THRESHOLD = 56;
const SLIDE_MS = 260;

export function MonthCalendar({
  calendarId,
  calendarName,
  displayName,
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

  const { loading, error, saveShift, saveShiftsBulk, removeShift, shifts } =
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
    <div className="min-h-dvh bg-[#F2F2F7]">
      <CalendarHeader
        currentMonth={currentMonth}
        calendarName={calendarName}
        onToday={goToday}
        onOpenMonthPicker={() => setMonthPickerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-3xl px-3 pb-28 pt-3 sm:px-4">
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2.5 shadow-sm">
          <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <p className="text-xs text-gray-500">실시간으로 함께 보는 중</p>
        </div>

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
              onClick={openDay}
              onChangeBadgeClick={openChangeNotice}
            />
            <MonthGrid
              key={format(currentMonth, "yyyy-MM")}
              days={currentDays}
              month={currentMonth}
              shiftMap={shiftMap}
              changeCountByDate={changeCountByDate}
              onClick={openDay}
              onChangeBadgeClick={openChangeNotice}
            />
            <MonthGrid
              key={format(nextMonth, "yyyy-MM")}
              days={nextDays}
              month={nextMonth}
              shiftMap={shiftMap}
              changeCountByDate={changeCountByDate}
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
          <LegendDot className="bg-orange-500" label="주" />
          <LegendDot className="bg-[#1B3A5F]" label="야" />
          <LegendDot className="bg-[#0F2744]" label="심" />
          <LegendDot className="border border-gray-300 bg-white" label="비" />
          <LegendDot className="border border-gray-300 bg-white" label="휴" />
          <LegendDot className="bg-rose-500" label="변경" />
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
        displayName={displayName}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onSavePattern={handleSavePattern}
        onDelete={handleDelete}
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
        onClose={() => setSettingsOpen(false)}
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
  onClick,
  onChangeBadgeClick,
}: {
  days: Date[];
  month: Date;
  shiftMap: Map<string, Shift>;
  changeCountByDate: Map<string, number>;
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
            onClick={onClick}
            onChangeBadgeClick={onChangeBadgeClick}
          />
        );
      })}
    </div>
  );
};

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
