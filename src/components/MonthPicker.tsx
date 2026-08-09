"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

interface MonthPickerProps {
  open: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (month: Date) => void;
}

function buildYears(center: number) {
  const years: number[] = [];
  for (let y = center - 8; y <= center + 8; y++) years.push(y);
  return years;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function WheelColumn({
  items,
  selectedIndex,
  onChange,
  formatLabel,
}: {
  items: number[];
  selectedIndex: number;
  onChange: (index: number) => void;
  formatLabel: (value: number) => string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // 열릴 때 / 값 변경 시 해당 위치로 스크롤
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    lockRef.current = true;
    el.scrollTop = selectedIndex * ITEM_H;
    const t = window.setTimeout(() => {
      lockRef.current = false;
    }, 80);
    return () => window.clearTimeout(t);
  }, [selectedIndex, items.length]);

  const snapToNearest = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    onChange(clamped);
  }, [items.length, onChange]);

  const handleScroll = () => {
    if (lockRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== selectedIndex) onChange(clamped);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(snapToNearest, 90);
  };

  return (
    <div className="relative h-[220px] flex-1 overflow-hidden">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ height: PAD }} aria-hidden />
        {items.map((value, i) => {
          const active = i === selectedIndex;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                const el = scrollerRef.current;
                if (!el) return;
                el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                onChange(i);
              }}
              className={`flex w-full snap-center items-center justify-center text-[17px] transition-colors ${
                active
                  ? "font-bold text-gray-900"
                  : "font-medium text-gray-300"
              }`}
              style={{ height: ITEM_H }}
            >
              {formatLabel(value)}
            </button>
          );
        })}
        <div style={{ height: PAD }} aria-hidden />
      </div>
    </div>
  );
}

export function MonthPicker({ open, value, onClose, onConfirm }: MonthPickerProps) {
  const nowYear = new Date().getFullYear();
  const [years, setYears] = useState(() => buildYears(nowYear));
  const [yearIdx, setYearIdx] = useState(0);
  const [monthIdx, setMonthIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const y = value.getFullYear();
    const list = buildYears(Math.max(nowYear, y));
    setYears(list);
    const yi = list.indexOf(y);
    setYearIdx(yi >= 0 ? yi : list.indexOf(nowYear));
    setMonthIdx(value.getMonth());
  }, [open, value, nowYear]);

  if (!open) return null;

  const handleConfirm = () => {
    const year = years[yearIdx] ?? nowYear;
    const month = MONTHS[monthIdx] ?? 1;
    onConfirm(new Date(year, month - 1, 1));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-sheet-up rounded-t-3xl bg-white shadow-2xl sm:mx-4 sm:animate-scale-in sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs font-medium text-gray-400">이동</p>
            <h2 className="text-lg font-bold text-gray-900">년 / 월 선택</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative px-4 py-2">
          {/* 중앙 선택 하이라이트 */}
          <div
            className="pointer-events-none absolute inset-x-4 top-1/2 z-10 -translate-y-1/2 rounded-2xl bg-[#007AFF]/08 ring-1 ring-[#007AFF]/15"
            style={{ height: ITEM_H }}
          />
          {/* 위·아래 페이드 */}
          <div className="pointer-events-none absolute inset-x-4 top-2 z-20 h-12 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-4 bottom-2 z-20 h-12 bg-gradient-to-t from-white to-transparent" />

          <div className="relative z-0 flex gap-2">
            <WheelColumn
              items={years}
              selectedIndex={yearIdx}
              onChange={setYearIdx}
              formatLabel={(y) => `${y}년`}
            />
            <WheelColumn
              items={MONTHS}
              selectedIndex={monthIdx}
              onChange={setMonthIdx}
              formatLabel={(m) => `${m}월`}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleConfirm}
            className="h-12 w-full rounded-2xl bg-[#007AFF] text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            이 달로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
