"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  createChangeLog,
  fetchChangeLogs,
  fetchRecentChangeLogs,
} from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import {
  getSeenChangeIds,
  markChangesSeen,
  type ShiftChangeLog,
  type ShiftType,
} from "@/lib/types";

interface UseChangeLogsOptions {
  calendarId: string | null;
  currentMonth: Date;
}

function prependRecent(prev: ShiftChangeLog[], row: ShiftChangeLog) {
  return [row, ...prev.filter((l) => l.id !== row.id)].slice(0, 4);
}

export function useChangeLogs({ calendarId, currentMonth }: UseChangeLogsOptions) {
  const [logs, setLogs] = useState<ShiftChangeLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<ShiftChangeLog[]>([]);
  const [seenTick, setSeenTick] = useState(0);
  const [setupError, setSetupError] = useState<string | null>(null);

  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  const reload = useCallback(async () => {
    if (!calendarId) {
      setLogs([]);
      setRecentLogs([]);
      return;
    }
    const from = startOfWeek(startOfMonth(subMonths(currentMonth, 2)), {
      weekStartsOn: 0,
    });
    const to = endOfWeek(endOfMonth(addMonths(currentMonth, 2)), {
      weekStartsOn: 0,
    });
    try {
      const [monthLogs, recent] = await Promise.all([
        fetchChangeLogs(calendarId, from, to),
        fetchRecentChangeLogs(calendarId, 4),
      ]);
      setSetupError(null);
      startTransition(() => {
        setLogs(monthLogs);
        setRecentLogs(recent);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[change-logs] reload failed:", msg);
      // 테이블 미생성(404/PGRST205 등)
      if (/does not exist|PGRST|404|relation/i.test(msg) || msg.includes("Could not find")) {
        setSetupError(
          "변경 이력 테이블이 아직 없어요. Supabase에서 migrate-change-logs.sql을 실행해 주세요.",
        );
      } else {
        setSetupError("변경 이력을 불러오지 못했어요.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, monthKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!calendarId) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`change-logs:${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shift_change_logs",
          filter: `calendar_id=eq.${calendarId}`,
        },
        (payload) => {
          const row = payload.new as ShiftChangeLog;
          setLogs((prev) => {
            if (prev.some((l) => l.id === row.id)) return prev;
            return [row, ...prev];
          });
          setRecentLogs((prev) => prependRecent(prev, row));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [calendarId]);

  const seenIds = useMemo(() => {
    void seenTick;
    return getSeenChangeIds();
  }, [seenTick]);

  const unseenByDate = useMemo(() => {
    const map = new Map<string, ShiftChangeLog[]>();
    for (const log of logs) {
      if (seenIds.has(log.id)) continue;
      const list = map.get(log.date) ?? [];
      list.push(log);
      map.set(log.date, list);
    }
    return map;
  }, [logs, seenIds]);

  const markSeen = useCallback((ids: string[]) => {
    markChangesSeen(ids);
    setSeenTick((n) => n + 1);
  }, []);

  const recordSingleChange = useCallback(
    async (input: {
      date: string;
      fromType?: ShiftType | null;
      toType: ShiftType;
      note?: string;
      updatedBy: string;
      summary: string;
    }) => {
      if (!calendarId) return null;
      try {
        const log = await createChangeLog({
          calendarId,
          date: input.date,
          kind: "single",
          fromType: input.fromType,
          toType: input.toType,
          note: input.note,
          updatedBy: input.updatedBy,
          summary: input.summary,
        });
        setSetupError(null);
        // 내가 수정한 기기는 확인 처리 → 빨간 뱃지는 상대 기기에만
        markChangesSeen([log.id]);
        setSeenTick((n) => n + 1);
        setLogs((prev) => [log, ...prev.filter((l) => l.id !== log.id)]);
        setRecentLogs((prev) => prependRecent(prev, log));
        return log;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[change-logs] insert failed:", msg);
        setSetupError(
          "변경 이력 저장 실패. Supabase에서 migrate-change-logs.sql 실행이 필요할 수 있어요.",
        );
        return null;
      }
    },
    [calendarId],
  );

  const recordPatternChange = useCallback(
    async (input: {
      date: string;
      toType: ShiftType;
      patternDays: number;
      updatedBy: string;
      summary: string;
    }) => {
      if (!calendarId) return null;
      try {
        const log = await createChangeLog({
          calendarId,
          date: input.date,
          kind: "pattern",
          toType: input.toType,
          patternDays: input.patternDays,
          updatedBy: input.updatedBy,
          summary: input.summary,
        });
        setSetupError(null);
        markChangesSeen([log.id]);
        setSeenTick((n) => n + 1);
        setLogs((prev) => [log, ...prev.filter((l) => l.id !== log.id)]);
        setRecentLogs((prev) => prependRecent(prev, log));
        return log;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[change-logs] insert failed:", msg);
        setSetupError(
          "변경 이력 저장 실패. Supabase에서 migrate-change-logs.sql 실행이 필요할 수 있어요.",
        );
        return null;
      }
    },
    [calendarId],
  );

  return {
    logs,
    recentLogs,
    unseenByDate,
    setupError,
    markSeen,
    recordSingleChange,
    recordPatternChange,
  };
}
