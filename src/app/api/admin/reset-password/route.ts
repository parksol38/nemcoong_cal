import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  let body: { calendarId?: string; newPassword?: string } = {};
  try {
    body = (await request.json()) as {
      calendarId?: string;
      newPassword?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const calendarId = (body.calendarId ?? "").trim();
  const newPassword = (body.newPassword ?? "").trim();

  if (!calendarId) {
    return NextResponse.json(
      { error: "달력 ID가 필요해요." },
      { status: 400 },
    );
  }
  if (!newPassword || newPassword.length < 4 || newPassword.length > 12) {
    return NextResponse.json(
      { error: "비밀번호는 4~12자로 입력해 주세요." },
      { status: 400 },
    );
  }

  try {
    const supabase = getAdminSupabase();

    const { data: current, error: readError } = await supabase
      .from("calendars")
      .select("password_version")
      .eq("id", calendarId)
      .maybeSingle();

    if (readError) throw readError;
    if (!current) {
      return NextResponse.json(
        { error: "달력을 찾을 수 없어요." },
        { status: 404 },
      );
    }

    const nextVersion =
      (typeof current.password_version === "number"
        ? current.password_version
        : 1) + 1;

    const { data, error } = await supabase
      .from("calendars")
      .update({
        app_password: newPassword,
        password_version: nextVersion,
      })
      .eq("id", calendarId)
      .select("id, share_code, app_password, password_version")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      calendar: data,
      message: "비밀번호를 초기화했어요. 해당 코드 기기는 다시 입력해야 해요.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/reset-password]", msg);
    return NextResponse.json(
      {
        error:
          msg.includes("app_password") || msg.includes("password_version")
            ? "비밀번호 컬럼이 없어요. migrate-admin-passwords.sql을 실행해 주세요."
            : `초기화에 실패했어요. (${msg})`,
      },
      { status: 500 },
    );
  }
}
