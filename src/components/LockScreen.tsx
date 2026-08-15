"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/legal";
import { getStoredAgencyTheme } from "@/lib/agencyTheme";
import { unlockDevice } from "@/lib/types";

const FALLBACK_PASSWORD =
  process.env.NEXT_PUBLIC_APP_PASSWORD ?? "930308";

interface LockScreenProps {
  onUnlocked: (passwordVersion: number) => void;
  expectedPassword?: string | null;
  passwordVersion?: number;
  loadingLock?: boolean;
}

export function LockScreen({
  onUnlocked,
  expectedPassword,
  passwordVersion = 1,
  loadingLock,
}: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const agency = getStoredAgencyTheme() ?? "police";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loadingLock) return;

    const expected = (expectedPassword ?? "").trim() || FALLBACK_PASSWORD;
    if (password.trim() === expected) {
      unlockDevice(passwordVersion);
      onUnlocked(passwordVersion);
      return;
    }

    setError("비밀번호가 올바르지 않아요.");
    setShaking(true);
    setPassword("");
    window.setTimeout(() => setShaking(false), 420);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] px-5 py-10">
      <div
        className={`w-full max-w-sm rounded-3xl bg-white/90 p-6 shadow-xl shadow-black/10 backdrop-blur dark:bg-[#161B22]/95 dark:shadow-black/40 ${
          shaking ? "animate-shake" : "animate-scale-in"
        }`}
      >
        <div className="mb-5 text-center">
          <Image
            src="/images/app-icon.png"
            alt={APP_NAME}
            width={160}
            height={160}
            priority
            className="mx-auto mb-3 h-auto w-[120px] rounded-3xl shadow-lg"
          />
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Lock className="h-4 w-4" />
          </div>
          <h1 className="text-center text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-gray-100">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-xs font-medium text-accent">
            {agency === "fire" ? "소방" : "경찰"} 근무표
          </p>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {APP_TAGLINE} · 잠금 해제
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="비밀번호"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
          />
          {error ? (
            <p className="text-center text-sm text-rose-600">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loadingLock}
            className="h-12 w-full rounded-2xl bg-accent text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {loadingLock ? "확인 중…" : "잠금 해제"}
          </button>
        </form>
      </div>
    </div>
  );
}
