import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const supabase = getAdminSupabase();

    const { data: calendars, error: calError } = await supabase
      .from("calendars")
      .select(
        "id, name, share_code, created_at, app_password, password_version, shared_message, shared_message_by, shared_message_at",
      )
      .order("created_at", { ascending: true });

    if (calError) throw calError;

    const { data: devices, error: deviceError } = await supabase
      .from("calendar_devices")
      .select("*")
      .order("created_at", { ascending: true });

    if (deviceError) throw deviceError;

    const { data: logs, error: logError } = await supabase
      .from("shift_change_logs")
      .select("id, calendar_id, date, summary, updated_by, created_at, kind")
      .order("created_at", { ascending: false })
      .limit(80);

    // 변경 로그 테이블이 없어도 대시보드는 동작
    const changeLogs = logError ? [] : (logs ?? []);

    const devicesByCal = new Map<string, typeof devices>();
    for (const d of devices ?? []) {
      const list = devicesByCal.get(d.calendar_id) ?? [];
      list.push(d);
      devicesByCal.set(d.calendar_id, list);
    }

    const logsByCal = new Map<string, typeof changeLogs>();
    for (const log of changeLogs) {
      const list = logsByCal.get(log.calendar_id) ?? [];
      if (list.length < 5) list.push(log);
      logsByCal.set(log.calendar_id, list);
    }

    const items = (calendars ?? []).map((cal) => {
      const calDevices = devicesByCal.get(cal.id) ?? [];
      const lastSeen = calDevices.reduce<string | null>((acc, d) => {
        if (!d.last_seen_at) return acc;
        if (!acc || d.last_seen_at > acc) return d.last_seen_at;
        return acc;
      }, null);

      return {
        id: cal.id,
        name: cal.name,
        share_code: cal.share_code,
        created_at: cal.created_at,
        app_password: cal.app_password ?? "",
        password_version: cal.password_version ?? 1,
        device_count: calDevices.length,
        last_seen_at: lastSeen,
        shared_message: cal.shared_message ?? "",
        shared_message_by: cal.shared_message_by ?? "",
        shared_message_at: cal.shared_message_at ?? null,
        devices: calDevices.map((d) => ({
          id: d.id,
          display_name: d.display_name,
          device_label: d.device_label,
          created_at: d.created_at,
          last_seen_at: d.last_seen_at,
        })),
        recent_changes: (logsByCal.get(cal.id) ?? []).map((l) => ({
          id: l.id,
          date: l.date,
          summary: l.summary,
          updated_by: l.updated_by,
          created_at: l.created_at,
          kind: l.kind,
        })),
      };
    });

    return NextResponse.json({
      calendars: items,
      using_service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/overview]", msg);
    return NextResponse.json(
      {
        error:
          msg.includes("app_password") || msg.includes("password_version")
            ? "비밀번호 컬럼이 없어요. migrate-admin-passwords.sql을 실행해 주세요."
            : `목록을 불러오지 못했어요. (${msg})`,
      },
      { status: 500 },
    );
  }
}
