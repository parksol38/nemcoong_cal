"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { LockScreen } from "@/components/LockScreen";
import { MonthCalendar } from "@/components/MonthCalendar";
import { NicknameSetup } from "@/components/NicknameSetup";
import { Onboarding } from "@/components/Onboarding";
import { SplashScreen } from "@/components/SplashScreen";
import { AgencyThemeProvider } from "@/components/AgencyThemeProvider";
import {
  inferAgencyFromPattern,
  isAgencyTheme,
  storeAgencyTheme,
  type AgencyTheme,
} from "@/lib/agencyTheme";
import { APP_NAME } from "@/lib/legal";
import {
  ensureCalendarOwner,
  fetchCalendarById,
  fetchCalendarLockInfo,
  isCalendarDeviceMember,
  registerCalendarDevice,
} from "@/lib/api";
import { DEFAULT_SHIFT_PATTERN } from "@/lib/shiftPatterns";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  clearCalendarSession,
  getOrCreateDeviceId,
  getStoredCalendarId,
  getStoredDisplayName,
  getStoredShareCode,
  isDeviceUnlocked,
  markCalendarJoined,
  wasCalendarJoined,
} from "@/lib/types";

/** 예전에 env로 고정했던 달력 (코드로 다시 참여 가능) */
const LEGACY_CALENDAR = {
  id: process.env.NEXT_PUBLIC_CALENDAR_ID ?? "4f249c62-27c1-46e0-b632-e978905f204e",
  shareCode: process.env.NEXT_PUBLIC_CALENDAR_SHARE_CODE ?? "M3CA64",
  name: APP_NAME,
};

type SessionInfo = {
  calendarId: string;
  shareCode: string;
  calendarName: string;
  shiftPattern: string;
  agency: AgencyTheme;
  ownerDeviceId: string | null;
};

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showSplash, setShowSplash] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [lockPassword, setLockPassword] = useState<string | null>(null);
  const [passwordVersion, setPasswordVersion] = useState(1);
  const [loadingLock, setLoadingLock] = useState(true);

  const bootWithCalendar = useCallback(
    async (calendarId: string, shareCode: string) => {
      const deviceId = getOrCreateDeviceId();
      const name = getStoredDisplayName().trim();

      let calendar = await fetchCalendarById(calendarId);
      if (!calendar) {
        clearCalendarSession();
        setNeedsOnboarding(true);
        setSession(null);
        setLoadingLock(false);
        return;
      }

      if (deviceId) {
        try {
          calendar =
            (await ensureCalendarOwner(calendarId, deviceId)) ?? calendar;
        } catch (e) {
          console.warn("[owner] ensure failed", e);
        }

        try {
          const member = await isCalendarDeviceMember(calendarId, deviceId);
          const isOwner = calendar.owner_device_id === deviceId;
          if (!member && !isOwner) {
            // 강퇴되었거나 미등록 — 코드로 다시 참여
            clearCalendarSession();
            setNeedsOnboarding(true);
            setSession(null);
            setLoadingLock(false);
            return;
          }
          if (!member && isOwner && name) {
            await registerCalendarDevice({
              calendarId,
              displayName: name,
            });
          }
        } catch (e) {
          console.warn("[member] check failed", e);
        }
      }

      const lock = await fetchCalendarLockInfo(calendarId);
      const version = lock?.password_version ?? 1;
      const password = lock?.app_password ?? null;
      const ok = isDeviceUnlocked(version);

      const agency: AgencyTheme = isAgencyTheme(calendar.agency)
        ? calendar.agency
        : inferAgencyFromPattern(calendar.shift_pattern);
      storeAgencyTheme(agency);

      setSession({
        calendarId: calendar.id,
        shareCode: calendar.share_code || shareCode,
        calendarName: calendar.name || LEGACY_CALENDAR.name,
        shiftPattern: calendar.shift_pattern ?? DEFAULT_SHIFT_PATTERN,
        agency,
        ownerDeviceId: calendar.owner_device_id ?? null,
      });
      setLockPassword(password);
      setPasswordVersion(version);
      setUnlocked(ok);
      setDisplayName(name);
      setShowSplash(ok && Boolean(name));
      setNeedsOnboarding(false);
      setLoadingLock(false);
    },
    [],
  );

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
    let cancelled = false;

    (async () => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setLoadingLock(false);
          setReady(true);
        }
        return;
      }

      try {
        let calendarId = getStoredCalendarId();
        let shareCode = getStoredShareCode();

        // 자동 이관된 레거시 세션은 온보딩으로 되돌림 (생성/코드 참여를 먼저 고르게)
        if (
          calendarId === LEGACY_CALENDAR.id &&
          !wasCalendarJoined()
        ) {
          clearCalendarSession();
          calendarId = null;
          shareCode = null;
        }

        if (!calendarId) {
          if (!cancelled) {
            setNeedsOnboarding(true);
            setLoadingLock(false);
            setReady(true);
          }
          return;
        }

        if (!cancelled) await bootWithCalendar(calendarId, shareCode ?? "");
      } catch (e) {
        console.warn("[boot] failed", e);
        if (!cancelled) {
          setNeedsOnboarding(true);
          setLoadingLock(false);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootWithCalendar]);

  const finishSplash = useCallback(() => setShowSplash(false), []);

  const handleUnlocked = useCallback(() => {
    setUnlocked(true);
    const name = getStoredDisplayName().trim();
    if (name) {
      setDisplayName(name);
      setShowSplash(true);
    }
  }, []);

  const handleNicknameDone = useCallback(
    (name: string) => {
      setDisplayName(name);
      if (session) {
        void registerCalendarDevice({
          calendarId: session.calendarId,
          displayName: name,
        }).catch((e) => console.warn(e));
      }
      setShowSplash(true);
    },
    [session],
  );

  const handleOnboarded = useCallback(
    (info: {
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
      markCalendarJoined();
      storeAgencyTheme(info.agency);
      setSession({
        calendarId: info.calendarId,
        shareCode: info.shareCode,
        calendarName: info.calendarName,
        shiftPattern: info.shiftPattern,
        agency: info.agency,
        ownerDeviceId: info.ownerDeviceId,
      });
      setDisplayName(info.displayName);
      setLockPassword(info.appPassword || null);
      setPasswordVersion(info.passwordVersion);
      setUnlocked(true);
      setNeedsOnboarding(false);
      setShowSplash(true);
      setLoadingLock(false);
    },
    [],
  );

  const handlePasswordChanged = useCallback(
    (next: { app_password: string; password_version: number }) => {
      setLockPassword(next.app_password);
      setPasswordVersion(next.password_version);
    },
    [],
  );

  const handleKickedToOnboarding = useCallback(() => {
    clearCalendarSession();
    setSession(null);
    setUnlocked(false);
    setNeedsOnboarding(true);
    setShowSplash(false);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-accent/30" />
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F2F2F7] px-6 dark:bg-[#0B0F14]">
        <div className="max-w-md rounded-3xl bg-white p-6 text-center shadow-xl dark:bg-[#161B22]">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            환경변수 설정 필요
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-white/10">
              .env.local
            </code>
            에 Supabase URL과 Anon Key를 넣은 뒤 개발 서버를 다시 시작해 주세요.
          </p>
        </div>
      </div>
    );
  }

  const sessionAgency = session?.agency;

  if (needsOnboarding || !session) {
    return (
      <AgencyThemeProvider shiftPattern={session?.shiftPattern}>
        <Onboarding onJoined={handleOnboarded} />
      </AgencyThemeProvider>
    );
  }

  if (!unlocked) {
    return (
      <AgencyThemeProvider agency={sessionAgency} shiftPattern={session.shiftPattern}>
        <LockScreen
          onUnlocked={handleUnlocked}
          expectedPassword={lockPassword}
          passwordVersion={passwordVersion}
          loadingLock={loadingLock}
        />
      </AgencyThemeProvider>
    );
  }

  if (!displayName) {
    return (
      <AgencyThemeProvider agency={sessionAgency} shiftPattern={session.shiftPattern}>
        <NicknameSetup onDone={handleNicknameDone} />
      </AgencyThemeProvider>
    );
  }

  if (showSplash) {
    return (
      <AgencyThemeProvider agency={sessionAgency} shiftPattern={session.shiftPattern}>
        <SplashScreen agency={sessionAgency} onDone={finishSplash} />
      </AgencyThemeProvider>
    );
  }

  return (
    <AgencyThemeProvider agency={sessionAgency} shiftPattern={session.shiftPattern}>
      <MonthCalendar
      calendarId={session.calendarId}
      calendarName={session.calendarName}
      shareCode={session.shareCode}
      displayName={displayName}
      shiftPattern={session.shiftPattern}
      ownerDeviceId={session.ownerDeviceId}
      appPassword={lockPassword ?? ""}
      passwordVersion={passwordVersion}
      onPasswordChanged={handlePasswordChanged}
      onSessionInvalid={handleKickedToOnboarding}
      onShiftPatternChange={(next) =>
        setSession((prev) =>
          prev ? { ...prev, shiftPattern: next } : prev,
        )
      }
    />
    </AgencyThemeProvider>
  );
}
