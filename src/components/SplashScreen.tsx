"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onDone: () => void;
  /** 최소 노출 시간 (ms) */
  durationMs?: number;
}

export function SplashScreen({ onDone, durationMs = 1600 }: SplashScreenProps) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setHiding(true), durationMs);
    const doneTimer = window.setTimeout(() => onDone(), durationMs + 380);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, [durationMs, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF5F7] via-[#F2F2F7] to-[#E8F1FF] transition-opacity duration-300 ${
        hiding ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-float px-6">
        <Image
          src="/images/couple-sticker.png"
          alt="우리 둘"
          width={280}
          height={280}
          priority
          className="h-auto w-[220px] drop-shadow-xl sm:w-[260px]"
        />
      </div>
      <p className="mt-5 animate-fade-in px-4 text-center text-base font-bold leading-snug tracking-tight text-gray-800">
        멋진여자 박네모가 만든 넴쿵 교대근무표
      </p>
      <p className="mt-1 text-xs text-gray-400">함께 보는 하루</p>
    </div>
  );
}
