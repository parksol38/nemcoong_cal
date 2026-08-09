import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  createAdminSessionToken,
  getAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const adminPassword = getAdminPassword();
  if (!adminPassword) {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD 환경변수가 없습니다. Vercel/.env.local에 설정해 주세요.",
      },
      { status: 500 },
    );
  }

  let body: { password?: string } = {};
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  if ((body.password ?? "").trim() !== adminPassword) {
    return NextResponse.json(
      { error: "관리자 비밀번호가 올바르지 않아요." },
      { status: 401 },
    );
  }

  const token = createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  const cookie = adminCookieOptions(token);
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });
  return res;
}
