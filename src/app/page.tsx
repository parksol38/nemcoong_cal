"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { LockScreen } from "@/components/LockScreen";
import { MonthCalendar } from "@/components/MonthCalendar";
import { NicknameSetup } from "@/components/NicknameSetup";
import { SplashScreen } from "@/components/SplashScreen";
import { fetchCalendarLockInfo } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getStoredDisplayName, isDeviceUnlocked } from "@/lib/types";

/** 우리 둘만 쓰는 고정 달력 */
const FIXED_CALENDAR = {
  id: process.env.NEXT_PUBLIC_CALENDAR_ID ?? "4f249c62-27c1-46e0-b632-e978905f204e",
  shareCode: process.env.NEXT_PUBLIC_CALENDAR_SHARE_CODE ?? "M3CA64",
  name: "멋진여자 박네모가 만든 넴쿵 교대근무표",
};

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showSplash, setShowSplash] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [lockPassword, setLockPassword] = useState<string | null>(null);
  const [passwordVersion, setPasswordVersion] = useState(1);
  const [loadingLock, setLoadingLock] = useState(true);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
    const name = getStoredDisplayName().trim();
    setDisplayName(name);

    let cancelled = false;

    (async () => {
      let version = 1;
      let password: string | null = null;

      if (isSupabaseConfigured()) {
        try {
          const info = await fetchCalendarLockInfo(FIXED_CALENDAR.id);
          if (info) {
            version = info.password_version;
            password = info.app_password;
          }
        } catch (e) {
          console.warn("[lock] fetchCalendarLockInfo failed", e);
        }
      }

      if (cancelled) return;

      const ok = isDeviceUnlocked(version);
      setLockPassword(password);
      setPasswordVersion(version);
      setUnlocked(ok);
      setShowSplash(ok && Boolean(name));
      setLoadingLock(false);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const finishSplash = useCallback(() => setShowSplash(false), []);

  const handleUnlocked = useCallback(() => {
    setUnlocked(true);
    const name = getStoredDisplayName().trim();
    if (name) {
      setDisplayName(name);
      setShowSplash(true);
    }
  }, []);

  const handleNicknameDone = useCallback((name: string) => {
    setDisplayName(name);
    setShowSplash(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F2F2F7]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[#007AFF]/30" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <LockScreen
        onUnlocked={handleUnlocked}
        expectedPassword={lockPassword}
        passwordVersion={passwordVersion}
        loadingLock={loadingLock}
      />
    );
  }

  if (!displayName) {
    return <NicknameSetup onDone={handleNicknameDone} />;
  }

  if (showSplash) {
    return <SplashScreen onDone={finishSplash} />;
  }

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F2F2F7] px-6">
        <div className="max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-bold text-gray-900">환경변수 설정 필요</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">.env.local</code>에
            Supabase URL과 Anon Key를 넣은 뒤 개발 서버를 다시 시작해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MonthCalendar
      calendarId={FIXED_CALENDAR.id}
      calendarName={FIXED_CALENDAR.name}
      shareCode={FIXED_CALENDAR.shareCode}
      displayName={displayName}
    />
  );
}
