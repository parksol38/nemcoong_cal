"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCalendarMessage,
  fetchLatestMessage,
} from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import type { CalendarMessage } from "@/lib/types";

function readErrorText(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object") {
    const obj = e as { message?: string; code?: string; details?: string };
    return [obj.message, obj.code, obj.details].filter(Boolean).join(" ");
  }
  return String(e);
}

function isMissingColumnError(text: string): boolean {
  return /shared_message|PGRST204|PGRST205|column|schema cache|Could not find/i.test(
    text,
  );
}

export function useSharedMessage(calendarId: string) {
  const [message, setMessage] = useState<CalendarMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupHint, setSetupHint] = useState<string | null>(null);

  const applyCalendarRow = useCallback(
    (row: {
      id?: string;
      shared_message?: string | null;
      shared_message_by?: string | null;
      shared_message_at?: string | null;
      shared_message_photo?: string | null;
    }) => {
      const body = (row.shared_message ?? "").trim();
      const photo = (row.shared_message_photo ?? "").trim() || null;
      if (!body && !photo) {
        setMessage(null);
        return;
      }
      setMessage({
        id: `current-${row.id ?? calendarId}`,
        calendar_id: row.id ?? calendarId,
        body,
        photo,
        updated_by: row.shared_message_by ?? "",
        created_at: row.shared_message_at ?? new Date().toISOString(),
      });
    },
    [calendarId],
  );

  const reload = useCallback(async () => {
    try {
      const latest = await fetchLatestMessage(calendarId);
      setMessage(latest);
      setSetupHint(null);
    } catch (e) {
      const msg = readErrorText(e);
      console.error("[messages] reload failed:", msg, e);
      setMessage(null);
      if (isMissingColumnError(msg)) {
        setSetupHint(
          "메시지 준비가 필요해요. Supabase에서 migrate-calendar-messages.sql 전체를 Run 해 주세요. (성공하면 shared_message 컬럼이 보입니다)",
        );
      } else {
        setSetupHint(`메시지를 불러오지 못했어요. (${msg || "알 수 없는 오류"})`);
      }
    } finally {
      setLoading(false);
    }
  }, [calendarId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // calendars 행 업데이트로 실시간 동기화
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`calendar-message:${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calendars",
          filter: `id=eq.${calendarId}`,
        },
        (payload) => {
          applyCalendarRow(
            payload.new as {
              id?: string;
              shared_message?: string | null;
              shared_message_by?: string | null;
              shared_message_at?: string | null;
              shared_message_photo?: string | null;
            },
          );
          setSetupHint(null);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [calendarId, applyCalendarRow]);

  const postMessage = useCallback(
    async (body: string, updatedBy: string, photo?: string | null) => {
      const trimmed = body.trim();
      const photoData = (photo ?? "").trim() || null;
      if (!trimmed && !photoData) throw new Error("메시지 또는 사진을 추가해 주세요.");
      setSaving(true);
      try {
        const saved = await createCalendarMessage({
          calendarId,
          body: trimmed,
          updatedBy,
          photo: photoData,
        });
        setMessage(saved);
        setSetupHint(null);
        return saved;
      } catch (e) {
        const msg = readErrorText(e);
        console.error("[messages] insert failed:", msg, e);
        if (isMissingColumnError(msg)) {
          setSetupHint(
            "저장하려면 migrate-calendar-messages.sql을 Supabase에서 실행해 주세요.",
          );
        } else {
          setSetupHint(`메시지를 저장하지 못했어요. (${msg || "알 수 없는 오류"})`);
        }
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [calendarId],
  );

  return {
    message,
    loading,
    saving,
    error: setupHint,
    postMessage,
    reload,
  };
}
