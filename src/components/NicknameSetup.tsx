"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { storeDisplayName } from "@/lib/types";

interface NicknameSetupProps {
  onDone: (name: string) => void;
}

export function NicknameSetup({ onDone }: NicknameSetupProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("별명을 입력해 주세요.");
      return;
    }
    if (trimmed.length > 12) {
      setError("별명은 12자 이내로 적어 주세요.");
      return;
    }
    storeDisplayName(trimmed);
    onDone(trimmed);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FFF5F7] via-[#F2F2F7] to-[#E8F1FF] px-5 py-10">
      <div className="w-full max-w-sm animate-scale-in rounded-3xl bg-white/90 p-6 shadow-xl shadow-black/5 backdrop-blur">
        <div className="mb-5 text-center">
          <Image
            src="/images/couple-sticker.png"
            alt="우리 둘"
            width={140}
            height={140}
            priority
            className="mx-auto mb-3 h-auto w-[120px] drop-shadow-md"
          />
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF]">
            <UserRound className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            이 기기의 별명
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            누가 수정했는지 알 수 있게
            <br />
            간단한 별명을 남겨 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="예: 네모 / 쿵이"
            maxLength={12}
            autoFocus
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-center text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20"
          />

          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-600">
              {error}
            </p>
          ) : (
            <p className="text-center text-[11px] text-gray-400">
              한 번 저장하면 이 기기에서 계속 사용해요.
            </p>
          )}

          <div className="flex gap-2">
            {["네모", "쿵이"].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => {
                  setName(quick);
                  setError(null);
                }}
                className="h-10 flex-1 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 transition active:scale-95"
              >
                {quick}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-2xl bg-[#007AFF] text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
          >
            시작하기
          </button>
        </form>
      </div>
    </div>
  );
}
