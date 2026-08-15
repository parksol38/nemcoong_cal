"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  History,
  KeyRound,
  LogOut,
  RefreshCw,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";

type DeviceRow = {
  id: string;
  display_name: string;
  device_label: string;
  created_at: string;
  last_seen_at: string;
};

type ChangeRow = {
  id: string;
  date: string;
  summary: string;
  updated_by: string;
  created_at: string;
  kind: string;
};

type CalendarCard = {
  id: string;
  name: string;
  share_code: string;
  created_at: string;
  app_password: string;
  password_version: number;
  device_count: number;
  last_seen_at: string | null;
  shared_message: string;
  shared_message_by: string;
  shared_message_at: string | null;
  devices: DeviceRow[];
  recent_changes: ChangeRow[];
};

function fmt(ts: string | null | undefined) {
  if (!ts) return "-";
  try {
    return format(new Date(ts), "yyyy.M.d HH:mm", { locale: ko });
  } catch {
    return "-";
  }
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [calendars, setCalendars] = useState<CalendarCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [resetDraft, setResetDraft] = useState<Record<string, string>>({});
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = (await res.json()) as {
        calendars?: CalendarCard[];
        error?: string;
      };
      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          return;
        }
        throw new Error(data.error || "불러오기 실패");
      }
      setCalendars(data.calendars ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await res.json()) as { authenticated?: boolean };
        const ok = Boolean(data.authenticated);
        setAuthed(ok);
        if (ok) await loadOverview();
      } catch {
        setAuthed(false);
      } finally {
        setChecking(false);
      }
    })();
  }, [loadOverview]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "로그인 실패");
      setAuthed(true);
      setPassword("");
      await loadOverview();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setCalendars([]);
  };

  const handleReset = async (calendarId: string) => {
    const newPassword = (resetDraft[calendarId] ?? "").trim();
    setResetting(calendarId);
    setResetMsg((m) => ({ ...m, [calendarId]: "" }));
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId, newPassword }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "초기화 실패");
      setResetMsg((m) => ({
        ...m,
        [calendarId]: data.message || "초기화했어요.",
      }));
      setResetDraft((d) => ({ ...d, [calendarId]: "" }));
      await loadOverview();
    } catch (err) {
      setResetMsg((m) => ({
        ...m,
        [calendarId]: err instanceof Error ? err.message : "초기화 실패",
      }));
    } finally {
      setResetting(null);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0B1220] text-white">
        <p className="text-sm text-white/60">확인 중…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0B1220] px-5">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
        >
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-[#6BB3FF]">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-white">관리자</h1>
            <p className="mt-1 text-sm text-white/50">
              나만 들어갈 수 있는 운영 페이지
            </p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-center text-white outline-none placeholder:text-white/30 focus:border-accent"
            autoFocus
          />
          {loginError ? (
            <p className="mt-3 text-center text-sm text-rose-300">{loginError}</p>
          ) : null}
          <button
            type="submit"
            disabled={loggingIn}
            className="mt-4 h-12 w-full rounded-2xl bg-accent text-sm font-semibold text-white disabled:opacity-60"
          >
            {loggingIn ? "확인 중…" : "입장"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0B1220] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0B1220]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[11px] text-white/40">nemcoong_cal</p>
            <h1 className="text-lg font-bold">관리자 대시보드</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadOverview()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80"
              aria-label="새로고침"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/80"
            >
              <LogOut className="h-3.5 w-3.5" />
              나가기
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-4 py-4 pb-16">
        {loadError ? (
          <p className="rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
            {loadError}
          </p>
        ) : null}

        {loading && calendars.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/40">불러오는 중…</p>
        ) : calendars.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/40">
            등록된 달력/코드가 없어요.
          </p>
        ) : (
          calendars.map((cal) => {
            const open = Boolean(expanded[cal.id]);
            const visiblePw = Boolean(showPw[cal.id]);
            return (
              <section
                key={cal.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [cal.id]: !open }))
                  }
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {cal.name || "이름 없음"}
                    </p>
                    <p className="mt-1 font-mono text-lg tracking-[0.2em] text-[#6BB3FF]">
                      {cal.share_code}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        기기 {cal.device_count}
                      </span>
                      <span>최근 접속 {fmt(cal.last_seen_at)}</span>
                      <span>가입 {fmt(cal.created_at)}</span>
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-white/40" />
                  ) : (
                    <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-white/40" />
                  )}
                </button>

                {open ? (
                  <div className="space-y-4 border-t border-white/10 px-4 py-4">
                    <div className="rounded-2xl bg-black/25 px-3.5 py-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
                          <KeyRound className="h-3.5 w-3.5" />
                          잠금 비밀번호
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPw((s) => ({
                              ...s,
                              [cal.id]: !visiblePw,
                            }))
                          }
                          className="text-white/40"
                          aria-label="비밀번호 보기"
                        >
                          {visiblePw ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="font-mono text-base tracking-widest text-white">
                        {visiblePw ? cal.app_password || "(없음)" : "••••••"}
                      </p>
                      <p className="mt-1 text-[11px] text-white/35">
                        version {cal.password_version}
                      </p>

                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={resetDraft[cal.id] ?? ""}
                          onChange={(e) =>
                            setResetDraft((d) => ({
                              ...d,
                              [cal.id]: e.target.value,
                            }))
                          }
                          placeholder="새 비밀번호"
                          maxLength={12}
                          className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30"
                        />
                        <button
                          type="button"
                          disabled={resetting === cal.id}
                          onClick={() => void handleReset(cal.id)}
                          className="h-10 rounded-xl bg-accent px-3 text-xs font-semibold disabled:opacity-60"
                        >
                          {resetting === cal.id ? "처리 중" : "초기화"}
                        </button>
                      </div>
                      {resetMsg[cal.id] ? (
                        <p className="mt-2 text-[11px] text-[#9EC9FF]">
                          {resetMsg[cal.id]}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
                        <Smartphone className="h-3.5 w-3.5" />
                        동일 코드 기기
                      </p>
                      {cal.devices.length === 0 ? (
                        <p className="rounded-2xl bg-black/20 px-3 py-4 text-center text-xs text-white/35">
                          아직 등록된 기기가 없어요.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {cal.devices.map((d) => (
                            <div
                              key={d.id}
                              className="rounded-2xl bg-black/20 px-3.5 py-3"
                            >
                              <p className="text-sm font-semibold">
                                {d.display_name || "이름 없음"}
                              </p>
                              <p className="text-xs text-white/45">
                                {d.device_label}
                              </p>
                              <p className="mt-1 text-[11px] text-white/35">
                                가입 {fmt(d.created_at)} · 최근{" "}
                                {fmt(d.last_seen_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
                        <History className="h-3.5 w-3.5" />
                        최근 변경
                      </p>
                      {cal.recent_changes.length === 0 ? (
                        <p className="rounded-2xl bg-black/20 px-3 py-4 text-center text-xs text-white/35">
                          변경 이력이 없어요.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {cal.recent_changes.map((log) => (
                            <div
                              key={log.id}
                              className="rounded-2xl bg-black/20 px-3.5 py-3"
                            >
                              <p className="text-xs leading-relaxed text-white/85">
                                {log.summary}
                              </p>
                              <p className="mt-1 text-[11px] text-white/35">
                                {fmt(log.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {cal.shared_message ? (
                        <p className="mt-2 rounded-2xl bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100/90">
                          메시지 · {cal.shared_message_by || "누군가"} ·{" "}
                          {fmt(cal.shared_message_at)}
                          <br />
                          <span className="text-white/80">
                            {cal.shared_message}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
