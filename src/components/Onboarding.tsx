"use client";

import { useState } from "react";
import Image from "next/image";
import { Link2, Plus } from "lucide-react";
import { createCalendar, findCalendarByShareCode } from "@/lib/api";
import { storeCalendarSession } from "@/lib/types";

interface OnboardingProps {
  onJoined: (info: {
    calendarId: string;
    shareCode: string;
    calendarName: string;
    displayName: string;
  }) => void;
}

export function Onboarding({ onJoined }: OnboardingProps) {
  const [mode, setMode] = useState<"welcome" | "create" | "join">("welcome");
  const [displayName, setDisplayName] = useState("");
  const [calendarName, setCalendarName] = useState(
    "멋진여자 박네모가 만든 넴쿵 교대근무표",
  );
  const [shareCode, setShareCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const calendar = await createCalendar(
        calendarName.trim() || "넴쿵 교대근무표",
      );
      storeCalendarSession(calendar.id, calendar.share_code, displayName.trim());
      onJoined({
        calendarId: calendar.id,
        shareCode: calendar.share_code,
        calendarName: calendar.name,
        displayName: displayName.trim(),
      });
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "달력 생성에 실패했습니다.";
      setError(msg);
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
      storeCalendarSession(calendar.id, calendar.share_code, displayName.trim());
      onJoined({
        calendarId: calendar.id,
        shareCode: calendar.share_code,
        calendarName: calendar.name,
        displayName: displayName.trim(),
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

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FFF5F7] via-[#F2F2F7] to-[#E8F1FF] px-5 py-10">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="mb-6 text-center">
          <Image
            src="/images/couple-sticker.png"
            alt="우리 둘"
            width={200}
            height={200}
            priority
            className="mx-auto mb-3 h-auto w-[168px] drop-shadow-lg sm:w-[188px]"
          />
          <h1 className="text-center text-xl font-bold leading-snug tracking-tight text-gray-900 sm:text-2xl">
            멋진여자 박네모가 만든 넴쿵 교대근무표
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            두 사람이 함께 보는 공유 달력.
            <br />
            근무를 저장하면 상대방 기기에 바로 반영돼요.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-black/5">
          {mode === "welcome" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMode("create")}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#007AFF] px-4 py-4 text-left text-white transition active:scale-[0.98]"
              >
                <Plus className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">새 달력 만들기</p>
                  <p className="text-xs text-white/70">공유 코드를 만들어 초대해요</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("join")}
                className="flex w-full items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4 text-left text-gray-800 transition active:scale-[0.98]"
              >
                <Link2 className="h-5 w-5 shrink-0 text-[#007AFF]" />
                <div>
                  <p className="font-semibold">공유 코드로 참여</p>
                  <p className="text-xs text-gray-500">상대방이 만든 코드로 들어와요</p>
                </div>
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
                className="text-sm font-medium text-[#007AFF]"
              >
                ← 뒤로
              </button>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  내 이름
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 네모"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20"
                />
              </div>

              {mode === "create" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    달력 이름
                  </label>
                  <input
                    value={calendarName}
                    onChange={(e) => setCalendarName(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    공유 코드
                  </label>
                  <input
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                    placeholder="예: AB12CD"
                    maxLength={6}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] outline-none focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20"
                  />
                </div>
              )}

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void (mode === "create" ? handleCreate() : handleJoin())
                }
                className="h-12 w-full rounded-2xl bg-[#007AFF] text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
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
