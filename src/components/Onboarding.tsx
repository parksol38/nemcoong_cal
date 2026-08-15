"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, Link2, Plus } from "lucide-react";
import {
  createCalendar,
  findCalendarByShareCode,
  registerCalendarDevice,
} from "@/lib/api";
import {
  DEFAULT_SHIFT_PATTERN,
  SHIFT_PATTERNS,
  type ShiftPatternId,
} from "@/lib/shiftPatterns";
import {
  AGENCY_LABELS,
  inferAgencyFromPattern,
  isAgencyTheme,
  storeAgencyTheme,
  type AgencyTheme,
} from "@/lib/agencyTheme";
import { APP_NAME, APP_TAGLINE } from "@/lib/legal";
import {
  getOrCreateDeviceId,
  getStoredDisplayName,
  isDeviceUnlocked,
  storeCalendarSession,
  unlockDevice,
  wasCalendarJoined,
} from "@/lib/types";

/** 예전에 고정으로 쓰던 달력 (이어가기용) */
const LEGACY_SHARE_CODE =
  process.env.NEXT_PUBLIC_CALENDAR_SHARE_CODE?.trim() || "M3CA64";

interface OnboardingProps {
  onJoined: (info: {
    calendarId: string;
    shareCode: string;
    calendarName: string;
    displayName: string;
    shiftPattern: string;
    agency: AgencyTheme;
    ownerDeviceId: string | null;
    appPassword: string;
    passwordVersion: number;
  }) => void;
}

export function Onboarding({ onJoined }: OnboardingProps) {
  const [mode, setMode] = useState<"welcome" | "create" | "join" | "created">(
    "welcome",
  );
  const [displayName, setDisplayName] = useState("");
  const [calendarName, setCalendarName] = useState(APP_NAME);
  const [agency, setAgency] = useState<AgencyTheme>("police");
  const [shareCode, setShareCode] = useState("");
  const [password, setPassword] = useState("");
  const [patternId, setPatternId] = useState<ShiftPatternId>(
    DEFAULT_SHIFT_PATTERN,
  );
  /** 예전에 이 앱을 쓰던 흔적이 있는 기기만 이어가기 버튼 표시 */
  const [showLegacyContinue] = useState(() => {
    if (typeof window === "undefined") return false;
    if (wasCalendarJoined()) return false;
    return (
      Boolean(getStoredDisplayName().trim()) || isDeviceUnlocked(1)
    );
  });
  const [created, setCreated] = useState<{
    calendarId: string;
    shareCode: string;
    calendarName: string;
    displayName: string;
    shiftPattern: string;
    agency: AgencyTheme;
    ownerDeviceId: string | null;
    appPassword: string;
    passwordVersion: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToLegal, setAgreedToLegal] = useState(false);

  const finishJoin = async (info: {
    calendarId: string;
    shareCode: string;
    calendarName: string;
    displayName: string;
    shiftPattern: string;
    agency: AgencyTheme;
    ownerDeviceId: string | null;
    appPassword: string;
    passwordVersion: number;
  }) => {
    storeCalendarSession(info.calendarId, info.shareCode, info.displayName);
    storeAgencyTheme(info.agency);
    unlockDevice(info.passwordVersion);
    try {
      await registerCalendarDevice({
        calendarId: info.calendarId,
        displayName: info.displayName,
      });
    } catch (e) {
      console.warn("[onboarding] register device failed", e);
    }
    onJoined(info);
  };

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (password.trim().length < 4) {
      setError("잠금 비밀번호는 4자 이상으로 해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const deviceId = getOrCreateDeviceId();
      const calendar = await createCalendar(
        calendarName.trim() || APP_NAME,
        {
          shiftPattern: patternId,
          agency,
          appPassword: password.trim(),
          ownerDeviceId: deviceId,
        },
      );
      const info = {
        calendarId: calendar.id,
        shareCode: calendar.share_code,
        calendarName: calendar.name,
        displayName: displayName.trim(),
        shiftPattern: calendar.shift_pattern ?? patternId,
        agency: isAgencyTheme(calendar.agency)
          ? calendar.agency
          : agency,
        ownerDeviceId: calendar.owner_device_id ?? deviceId,
        appPassword: calendar.app_password ?? password.trim(),
        passwordVersion: calendar.password_version ?? 1,
      };
      setCreated(info);
      setMode("created");
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "달력 생성에 실패했습니다.";
      if (/shift_pattern|owner_device_id|agency/i.test(msg)) {
        setError(
          "DB에 필요한 컬럼이 없습니다. Supabase에서 migrate-add-shift-pattern-owner.sql, migrate-add-agency.sql 을 실행해 주세요.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!shareCode.trim()) {
      setError("공유 코드를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const calendar = await findCalendarByShareCode(shareCode);
      if (!calendar) {
        setError("공유 코드를 찾을 수 없습니다.");
        return;
      }
      const resolvedAgency: AgencyTheme = isAgencyTheme(calendar.agency)
        ? calendar.agency
        : inferAgencyFromPattern(calendar.shift_pattern);
      await finishJoin({
        calendarId: calendar.id,
        shareCode: calendar.share_code,
        calendarName: calendar.name,
        displayName: displayName.trim(),
        shiftPattern: calendar.shift_pattern ?? DEFAULT_SHIFT_PATTERN,
        agency: resolvedAgency,
        ownerDeviceId: calendar.owner_device_id ?? null,
        appPassword: calendar.app_password ?? "",
        passwordVersion: calendar.password_version ?? 1,
      });
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "참여에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!created?.shareCode) return;
    try {
      await navigator.clipboard.writeText(created.shareCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("복사에 실패했습니다. 코드를 길게 눌러 복사해 주세요.");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] px-5 py-10">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="mb-6 text-center">
          <Image
            src="/images/app-icon.png"
            alt={APP_NAME}
            width={200}
            height={200}
            priority
            className="mx-auto mb-3 h-auto w-[132px] rounded-[24px] shadow-2xl shadow-black/25 sm:w-[148px]"
          />
          <h1 className="text-center text-2xl font-bold leading-snug tracking-tight text-white">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            {APP_TAGLINE}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-black/5 dark:bg-[#161B22] dark:shadow-black/40">
          {mode === "welcome" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(["police", "fire"] as const).map((id) => {
                  const selected = agency === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setAgency(id);
                        storeAgencyTheme(id);
                      }}
                      className={`rounded-2xl px-3 py-3 text-left transition active:scale-[0.98] ${
                        selected
                          ? "bg-accent text-white ring-2 ring-white/60"
                          : "bg-white/90 text-gray-800 dark:bg-white/10 dark:text-gray-100"
                      }`}
                    >
                      <p className="text-sm font-bold">{AGENCY_LABELS[id]}</p>
                      <p
                        className={`mt-0.5 text-[10px] ${selected ? "text-white/80" : "text-gray-500"}`}
                      >
                        {id === "police" ? "경찰 테마" : "소방 테마"}
                      </p>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("create");
                  setError(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-accent px-4 py-4 text-left text-white transition active:scale-[0.98]"
              >
                <Plus className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">새 근무표 만들기</p>
                  <p className="text-xs text-white/70">
                    경찰·소방 교대 유형 · 공유 코드 발급
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("join");
                  setError(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4 text-left text-gray-800 transition active:scale-[0.98] dark:bg-white/10 dark:text-gray-100"
              >
                <Link2 className="h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold">공유 코드로 참여</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    상대 코드만 있으면 같은 달력
                  </p>
                </div>
              </button>
              {showLegacyContinue ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("join");
                    setShareCode(LEGACY_SHARE_CODE);
                    const prev = getStoredDisplayName().trim();
                    if (prev) setDisplayName(prev);
                    setError(null);
                  }}
                  className="w-full rounded-2xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3 text-left transition active:scale-[0.98]"
                >
                  <p className="text-sm font-semibold text-accent">
                    예전에 이 기기에서 쓰던 달력 이어가기
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    근무 데이터는 서버에 그대로 있어요
                  </p>
                </button>
              ) : null}
              <p className="text-center text-[11px] leading-relaxed text-gray-400">
                계속하면{" "}
                <a href="/terms" className="font-semibold text-accent">
                  이용약관
                </a>
                {" · "}
                <a href="/privacy" className="font-semibold text-accent">
                  개인정보처리방침
                </a>
                에 동의한 것으로 봅니다.
              </p>
            </div>
          ) : mode === "created" && created ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-accent/10 px-4 py-4 text-center">
                <p className="text-xs font-semibold text-accent">
                  공유 코드가 발급됐어요
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-[0.25em] text-gray-900 dark:text-gray-100">
                  {created.shareCode}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                  다른 폰에서는 이 코드만 입력하면 같은 근무표를 볼 수 있어요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-800 transition active:scale-[0.98] dark:bg-white/10 dark:text-gray-100"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "복사됨" : "코드 복사"}
              </button>
              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                disabled={loading}
                onClick={() => void finishJoin(created)}
                className="h-12 w-full rounded-2xl bg-accent text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                근무표 시작하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setMode("welcome");
                  setError(null);
                }}
                className="text-sm font-medium text-accent"
              >
                ← 뒤로
              </button>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  내 이름
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 김출동"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                />
              </div>

              {mode === "create" ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      직군
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["police", "fire"] as const).map((id) => {
                        const selected = agency === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setAgency(id);
                              storeAgencyTheme(id);
                            }}
                            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-[0.99] ${
                              selected
                                ? "bg-accent/10 text-accent ring-2 ring-accent"
                                : "bg-gray-50 text-gray-700 dark:bg-white/5 dark:text-gray-200"
                            }`}
                          >
                            {AGENCY_LABELS[id]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      달력 이름
                    </label>
                    <input
                      value={calendarName}
                      onChange={(e) => setCalendarName(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      교대 유형
                    </label>
                    <p className="mb-1.5 text-[10px] text-gray-400">
                      경찰·소방 공무원 교대 주기 · 맞는 유형을 고르세요
                    </p>
                    <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-2xl border border-gray-200 p-2 dark:border-white/10">
                      {SHIFT_PATTERNS.map((p) => {
                        const selected = patternId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPatternId(p.id)}
                            className={`w-full rounded-xl px-3 py-2.5 text-left transition active:scale-[0.99] ${
                              selected
                                ? "bg-accent/10 ring-2 ring-accent"
                                : "hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                          >
                            <p
                              className={`text-sm font-semibold ${selected ? "text-accent" : "text-gray-800 dark:text-gray-100"}`}
                            >
                              {p.name}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {p.hint}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      잠금 비밀번호
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="4자 이상"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                    />
                    <p className="mt-1 text-[10px] text-gray-400">
                      나중에 설정에서 조회·수정할 수 있어요.
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    공유 코드
                  </label>
                  <input
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                    placeholder="예: AB12CD"
                    maxLength={6}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
                  />
                </div>
              )}

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                  {error}
                </p>
              ) : null}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                <input
                  type="checkbox"
                  checked={agreedToLegal}
                  onChange={(e) => setAgreedToLegal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
                  <a href="/terms" className="font-semibold text-accent">
                    이용약관
                  </a>
                  {" 및 "}
                  <a href="/privacy" className="font-semibold text-accent">
                    개인정보처리방침
                  </a>
                  에 동의합니다.
                </span>
              </label>

              <button
                type="button"
                disabled={loading || !agreedToLegal}
                onClick={() =>
                  void (mode === "create" ? handleCreate() : handleJoin())
                }
                className="h-12 w-full rounded-2xl bg-accent text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {loading
                  ? "처리 중…"
                  : mode === "create"
                    ? "달력 만들기"
                    : "참여하기"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
