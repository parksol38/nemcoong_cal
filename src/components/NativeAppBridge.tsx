"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Capacitor(Android/iOS) WebView 전용 브리지.
 * 웹 브라우저에서는 아무 것도 하지 않습니다.
 */
export function NativeAppBridge() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeBack: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { App } = await import("@capacitor/app");
      if (cancelled) return;

      // Android 뒤로가기: 히스토리가 있으면 뒤로, 없으면 앱 종료
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack || window.history.length > 1) {
          window.history.back();
        } else {
          void App.exitApp();
        }
      });

      removeBack = () => {
        void handle.remove();
      };

      try {
        const { StatusBar } = await import("@capacitor/status-bar");
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {
        // 일부 환경에서 미지원일 수 있음
      }
    })();

    return () => {
      cancelled = true;
      removeBack?.();
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const dark = resolvedTheme === "dark";
        await StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark });
        await StatusBar.setBackgroundColor({
          color: dark ? "#0B0F14" : "#F2F2F7",
        });
      } catch {
        // 웹/미지원 무시
      }
    })();
  }, [resolvedTheme]);

  return null;
}
