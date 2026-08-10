"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeClass,
  getThemePreference,
  getThemeSchedule,
  resolveAppTheme,
  storeThemePreference,
  storeThemeSchedule,
  type AppTheme,
  type ResolvedTheme,
  type ThemeSchedule,
} from "@/lib/types";

interface ThemeContextValue {
  /** 사용자 설정 (밝음 / 어두움 / 시간대) */
  theme: AppTheme;
  /** 실제로 화면에 적용 중인 테마 */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: AppTheme) => void;
  schedule: ThemeSchedule;
  setSchedule: (schedule: ThemeSchedule) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [schedule, setScheduleState] = useState<ThemeSchedule>({
    lightStart: "07:00",
    lightEnd: "19:00",
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const refreshResolved = useCallback(
    (preference: AppTheme, nextSchedule: ThemeSchedule) => {
      const resolved = resolveAppTheme(preference, nextSchedule);
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    },
    [],
  );

  useEffect(() => {
    const preference = getThemePreference();
    const nextSchedule = getThemeSchedule();
    setThemeState(preference);
    setScheduleState(nextSchedule);
    refreshResolved(preference, nextSchedule);
  }, [refreshResolved]);

  // 시간대 모드일 때 1분마다·탭 복귀 시 재계산
  useEffect(() => {
    if (theme !== "schedule") return;

    const tick = () => refreshResolved(theme, schedule);
    tick();

    const id = window.setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [theme, schedule, refreshResolved]);

  const setTheme = useCallback(
    (next: AppTheme) => {
      storeThemePreference(next);
      setThemeState(next);
      refreshResolved(next, schedule);
    },
    [refreshResolved, schedule],
  );

  const setSchedule = useCallback(
    (next: ThemeSchedule) => {
      storeThemeSchedule(next);
      setScheduleState(next);
      refreshResolved(theme, next);
    },
    [refreshResolved, theme],
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, schedule, setSchedule }),
    [theme, resolvedTheme, setTheme, schedule, setSchedule],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme는 ThemeProvider 안에서만 사용할 수 있어요.");
  }
  return ctx;
}
