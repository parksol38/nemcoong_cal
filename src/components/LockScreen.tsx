"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { unlockDevice } from "@/lib/types";

const FALLBACK_PASSWORD =
  process.env.NEXT_PUBLIC_APP_PASSWORD ?? "930308";

interface LockScreenProps {
  onUnlocked: (passwordVersion: number) => void;
  /** DB에서 가져온 달력 비밀번호 (없으면 env 폴백) */
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FFF5F7] via-[#F2F2F7] to-[#E8F1FF] px-5 py-10">
      <div
        className={`w-full max-w-sm rounded-3xl bg-white/90 p-6 shadow-xl shadow-black/5 backdrop-blur ${
          shaking ? "animate-shake" : "animate-scale-in"
        }`}
      >
        <div className="mb-5 text-center">
          <Image
            src="/images/couple-sticker.png"
            alt="우리 둘"
            width={160}
            height={160}
            priority
            className="mx-auto mb-3 h-auto w-[132px] drop-shadow-md"
          />
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF]">
            <Lock className="h-4 w-4" />
          </div>
          <h1 className="text-center text-xl font-bold leading-snug tracking-tight text-gray-900">
            멋진여자 박네모가 만든 넴쿵 교대근무표
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            둘만 볼 수 있게 비밀번호를 입력해 주세요.
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
              if (error) setError(null);
            }}
            placeholder="비밀번호"
            maxLength={12}
            disabled={loadingLock}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-center text-lg tracking-[0.35em] text-gray-900 outline-none transition placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 disabled:opacity-60"
            autoFocus
          />

          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-600">
              {error}
            </p>
          ) : (
            <p className="text-center text-[11px] text-gray-400">
              {loadingLock
                ? "잠금 정보를 확인하는 중…"
                : "한 번 입력하면 이 기기에서는 다시 묻지 않아요."}
            </p>
          )}

          <button
            type="submit"
            disabled={loadingLock}
            className="h-12 w-full rounded-2xl bg-[#007AFF] text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            들어가기
          </button>
        </form>
      </div>
    </div>
  );
}
