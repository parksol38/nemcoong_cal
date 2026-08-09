import { format } from "date-fns";
import { getSupabase } from "./supabase";
import {
  detectDeviceLabel,
  generateShareCode,
  getOrCreateDeviceId,
  SHIFT_LABELS,
  type Calendar,
  type CalendarDevice,
  type CalendarMessage,
  type Shift,
  type ShiftChangeLog,
  type ShiftType,
} from "./types";

export async function createCalendar(name: string): Promise<Calendar> {
  const supabase = getSupabase();
  const share_code = generateShareCode();

  const { data, error } = await supabase
    .from("calendars")
    .insert({ name, share_code })
    .select()
    .single();

  if (error) throw error;
  return data as Calendar;
}

export async function findCalendarByShareCode(
  shareCode: string,
): Promise<Calendar | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("calendars")
    .select("*")
    .eq("share_code", shareCode.toUpperCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data as Calendar | null;
}

export async function fetchShifts(
  calendarId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<Shift[]> {
  const supabase = getSupabase();
  const from = format(monthStart, "yyyy-MM-dd");
  const to = format(monthEnd, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("calendar_id", calendarId)
    .gte("date", from)
    .lte("date", to)
    .order("date");

  if (error) throw error;
  return (data ?? []) as Shift[];
}

export async function upsertShift(input: {
  calendarId: string;
  date: string;
  shiftType: ShiftType;
  note: string;
  updatedBy: string;
  existingId?: string;
}): Promise<Shift> {
  const supabase = getSupabase();

  const payload = {
    calendar_id: input.calendarId,
    date: input.date,
    shift_type: input.shiftType,
    note: input.note.trim(),
    updated_by: input.updatedBy.trim(),
  };

  if (input.existingId) {
    const { data, error } = await supabase
      .from("shifts")
      .update(payload)
      .eq("id", input.existingId)
      .select()
      .single();
    if (error) throw error;
    return data as Shift;
  }

  const { data, error } = await supabase
    .from("shifts")
    .upsert(payload, { onConflict: "calendar_id,date" })
    .select()
    .single();

  if (error) throw error;
  return data as Shift;
}

export async function deleteShift(shiftId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
  if (error) throw error;
}

/** 패턴 일괄 저장 */
export async function upsertShiftsBulk(input: {
  calendarId: string;
  updatedBy: string;
  items: { date: string; shiftType: ShiftType; note?: string }[];
}): Promise<Shift[]> {
  const supabase = getSupabase();
  const chunkSize = 100;
  const saved: Shift[] = [];

  for (let i = 0; i < input.items.length; i += chunkSize) {
    const chunk = input.items.slice(i, i + chunkSize);
    const payload = chunk.map((item) => ({
      calendar_id: input.calendarId,
      date: item.date,
      shift_type: item.shiftType,
      note: (item.note ?? "").trim(),
      updated_by: input.updatedBy.trim(),
    }));

    const { data, error } = await supabase
      .from("shifts")
      .upsert(payload, { onConflict: "calendar_id,date" })
      .select();

    if (error) throw error;
    if (data) saved.push(...(data as Shift[]));
  }

  return saved;
}

export async function fetchChangeLogs(
  calendarId: string,
  from: Date,
  to: Date,
): Promise<ShiftChangeLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("shift_change_logs")
    .select("*")
    .eq("calendar_id", calendarId)
    .gte("date", format(from, "yyyy-MM-dd"))
    .lte("date", format(to, "yyyy-MM-dd"))
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ShiftChangeLog[];
}

export async function fetchRecentChangeLogs(
  calendarId: string,
  limit = 4,
): Promise<ShiftChangeLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("shift_change_logs")
    .select("*")
    .eq("calendar_id", calendarId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ShiftChangeLog[];
}

export async function createChangeLog(input: {
  calendarId: string;
  date: string;
  kind: "single" | "pattern";
  fromType?: ShiftType | null;
  toType?: ShiftType | null;
  note?: string;
  patternDays?: number | null;
  updatedBy: string;
  summary: string;
}): Promise<ShiftChangeLog> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("shift_change_logs")
    .insert({
      calendar_id: input.calendarId,
      date: input.date,
      kind: input.kind,
      from_type: input.fromType ?? null,
      to_type: input.toType ?? null,
      note: input.note ?? "",
      pattern_days: input.patternDays ?? null,
      updated_by: input.updatedBy,
      summary: input.summary,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ShiftChangeLog;
}

export function buildSingleChangeSummary(input: {
  updatedBy: string;
  fromType?: ShiftType | null;
  toType: ShiftType;
  note?: string;
}): string {
  const who = input.updatedBy || "누군가";
  const toLabel = SHIFT_LABELS[input.toType];
  if (input.fromType && input.fromType !== input.toType) {
    const fromLabel = SHIFT_LABELS[input.fromType];
    const base = `${who}님이 ${fromLabel} → ${toLabel}(으)로 변경`;
    return input.note ? `${base} · ${input.note}` : base;
  }
  const base = `${who}님이 ${toLabel}(으)로 등록`;
  return input.note ? `${base} · ${input.note}` : base;
}

export function buildPatternChangeSummary(input: {
  updatedBy: string;
  startType: ShiftType;
  patternDays: number;
}): string {
  const who = input.updatedBy || "누군가";
  const daysLabel =
    input.patternDays === 365
      ? "1년"
      : input.patternDays === 180
        ? "6개월"
        : input.patternDays === 90
          ? "3개월"
          : `${input.patternDays}일`;
  return `${who}님이 ${daysLabel} 패턴으로 다시 입력 (시작: ${SHIFT_LABELS[input.startType]})`;
}

/** 이 기기를 달력에 등록(또는 최근 접속 갱신) */
export async function registerCalendarDevice(input: {
  calendarId: string;
  displayName: string;
}): Promise<CalendarDevice | null> {
  const supabase = getSupabase();
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return null;

  const now = new Date().toISOString();
  const payload = {
    calendar_id: input.calendarId,
    device_id: deviceId,
    display_name: input.displayName.trim(),
    device_label: detectDeviceLabel(),
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : "",
    last_seen_at: now,
  };

  const { data, error } = await supabase
    .from("calendar_devices")
    .upsert(payload, { onConflict: "calendar_id,device_id" })
    .select()
    .single();

  if (error) throw error;
  return data as CalendarDevice;
}

/** 달력에 등록된 기기 목록 (가입 순) */
export async function fetchCalendarDevices(
  calendarId: string,
): Promise<CalendarDevice[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("calendar_devices")
    .select("*")
    .eq("calendar_id", calendarId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarDevice[];
}

/** 가장 최근 공유 메시지 (calendars 컬럼 기반) */
export async function fetchLatestMessage(
  calendarId: string,
): Promise<CalendarMessage | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("calendars")
    .select(
      "id, shared_message, shared_message_by, shared_message_at, created_at",
    )
    .eq("id", calendarId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    id: string;
    shared_message?: string | null;
    shared_message_by?: string | null;
    shared_message_at?: string | null;
    created_at: string;
  };

  const body = (row.shared_message ?? "").trim();
  if (!body) return null;

  return {
    id: `current-${row.id}`,
    calendar_id: row.id,
    body,
    updated_by: row.shared_message_by ?? "",
    created_at: row.shared_message_at ?? row.created_at,
  };
}

/** 공유 메시지 이력 (최신순) */
export async function fetchMessageHistory(
  calendarId: string,
  limit = 50,
): Promise<CalendarMessage[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("calendars")
    .select("id, shared_message_history")
    .eq("id", calendarId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return [];

  const raw = (data as { shared_message_history?: unknown })
    .shared_message_history;
  const list = Array.isArray(raw) ? raw : [];

  return list
    .map((item) => {
      const row = item as Partial<CalendarMessage>;
      return {
        id: String(row.id ?? `${calendarId}-${row.created_at ?? Math.random()}`),
        calendar_id: calendarId,
        body: String(row.body ?? ""),
        updated_by: String(row.updated_by ?? ""),
        created_at: String(row.created_at ?? new Date().toISOString()),
      };
    })
    .filter((m) => m.body.trim())
    .slice(0, limit);
}

/** 새 공유 메시지 남기기 (이력 jsonb에 쌓임) */
export async function createCalendarMessage(input: {
  calendarId: string;
  body: string;
  updatedBy: string;
}): Promise<CalendarMessage> {
  const supabase = getSupabase();
  const body = input.body.trim();
  const updatedBy = input.updatedBy.trim();
  const createdAt = new Date().toISOString();
  const entry: CalendarMessage = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `msg-${Date.now()}`,
    calendar_id: input.calendarId,
    body,
    updated_by: updatedBy,
    created_at: createdAt,
  };

  // 기존 이력 읽기
  const { data: current, error: readError } = await supabase
    .from("calendars")
    .select("shared_message_history")
    .eq("id", input.calendarId)
    .maybeSingle();

  if (readError) throw readError;

  const prevRaw = (current as { shared_message_history?: unknown } | null)
    ?.shared_message_history;
  const prev = Array.isArray(prevRaw) ? prevRaw : [];
  const nextHistory = [entry, ...prev].slice(0, 100);

  const { error: writeError } = await supabase
    .from("calendars")
    .update({
      shared_message: body,
      shared_message_by: updatedBy,
      shared_message_at: createdAt,
      shared_message_history: nextHistory,
    })
    .eq("id", input.calendarId);

  if (writeError) throw writeError;
  return entry;
}
