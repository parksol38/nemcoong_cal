"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { deleteShift, fetchShifts, upsertShift, upsertShiftsBulk } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { getShiftExtraHours, type Shift, type ShiftType } from "@/lib/types";

interface UseShiftsOptions {
  calendarId: string | null;
  currentMonth: Date;
}

function normalizeShift(row: Shift): Shift {
  return {
    ...row,
    extra_hours: getShiftExtraHours(row),
  };
}

function monthRange(month: Date, pad: number) {
  const rangeStart = startOfWeek(startOfMonth(subMonths(month, pad)), {
    weekStartsOn: 0,
  });
  const rangeEnd = endOfWeek(endOfMonth(addMonths(month, pad)), {
    weekStartsOn: 0,
  });
  return { rangeStart, rangeEnd };
}

export function useShifts({ calendarId, currentMonth }: UseShiftsOptions) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchSeq = useRef(0);
  const bootedRef = useRef(false);

  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  const mergeShifts = useCallback((incoming: Shift[]) => {
    startTransition(() => {
      setShifts((prev) => {
        const map = new Map(prev.map((s) => [s.date, s]));
        for (const row of incoming) {
          map.set(row.date, normalizeShift(row));
        }
        return Array.from(map.values());
      });
    });
  }, []);

  const reload = useCallback(async () => {
    if (!calendarId) {
      setShifts([]);
      setBooting(false);
      return;
    }

    const { rangeStart, rangeEnd } = monthRange(currentMonth, 2);
    const seq = ++fetchSeq.current;

    try {
      const data = await fetchShifts(calendarId, rangeStart, rangeEnd);
      if (seq !== fetchSeq.current) return;
      mergeShifts(data);
      bootedRef.current = true;
      setBooting(false);
      setError(null);
    } catch (e) {
      if (seq !== fetchSeq.current) return;
      setError(
        e instanceof Error ? e.message : "근무 데이터를 불러오지 못했습니다.",
      );
      setBooting(false);
    }
    // currentMonth는 monthKey로 추적
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, monthKey, mergeShifts]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!calendarId) return;

    const supabase = getSupabase();
    const channel = supabase
      .channel(`shifts:${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shifts",
          filter: `calendar_id=eq.${calendarId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (oldRow.id) {
              setShifts((prev) => prev.filter((s) => s.id !== oldRow.id));
            }
            return;
          }

          const raw = payload.new as Shift;
          setShifts((prev) => {
            const idx = prev.findIndex(
              (s) => s.id === raw.id || s.date === raw.date,
            );
            const hasExtraField = Object.prototype.hasOwnProperty.call(
              raw,
              "extra_hours",
            );
            const nextExtra = hasExtraField
              ? getShiftExtraHours(raw)
              : idx >= 0
                ? getShiftExtraHours(prev[idx]!)
                : 0;
            const row: Shift = { ...normalizeShift(raw), extra_hours: nextExtra };
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = row;
              return next;
            }
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [calendarId]);

  const saveShift = useCallback(
    async (input: {
      date: string;
      shiftType: ShiftType;
      note: string;
      updatedBy: string;
      existingId?: string;
      startTime?: string | null;
      endTime?: string | null;
      extraHours?: number | null;
    }) => {
      if (!calendarId) throw new Error("달력이 없습니다.");
      const saved = normalizeShift(
        await upsertShift({
          calendarId,
          ...input,
        }),
      );
      setShifts((prev) => {
        const idx = prev.findIndex(
          (s) => s.id === saved.id || s.date === saved.date,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      return saved;
    },
    [calendarId],
  );

  const removeShift = useCallback(async (shiftId: string) => {
    await deleteShift(shiftId);
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  }, []);

  const saveShiftsBulk = useCallback(
    async (input: {
      updatedBy: string;
      items: { date: string; shiftType: ShiftType; note?: string }[];
    }) => {
      if (!calendarId) throw new Error("달력이 없습니다.");
      const saved = await upsertShiftsBulk({
        calendarId,
        updatedBy: input.updatedBy,
        items: input.items,
      });
      setShifts((prev) => {
        const map = new Map(prev.map((s) => [s.date, s]));
        for (const row of saved) {
          map.set(row.date, row);
        }
        return Array.from(map.values());
      });
      return saved;
    },
    [calendarId],
  );

  const shiftByDate = useCallback(
    (dateKey: string) => shifts.find((s) => s.date === dateKey),
    [shifts],
  );

  return {
    shifts,
    loading: booting,
    error,
    reload,
    saveShift,
    saveShiftsBulk,
    removeShift,
    shiftByDate,
  };
}
