"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { APP_NAME, APP_TAGLINE } from "@/lib/legal";
import {
  getAgencyVisual,
  type AgencyTheme,
} from "@/lib/agencyTheme";

interface SplashScreenProps {
  onDone: () => void;
  agency?: AgencyTheme;
  /** 최소 노출 시간 (ms) */
  durationMs?: number;
}

export function SplashScreen({
  onDone,
  agency = "police",
  durationMs = 1600,
}: SplashScreenProps) {
  const [hiding, setHiding] = useState(false);
  const visual = getAgencyVisual(agency);

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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-300 ${
        hiding ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        background: `linear-gradient(180deg, ${visual.heroFrom} 0%, ${visual.heroVia} 45%, ${visual.heroTo} 100%)`,
      }}
    >
      <div className="animate-float px-6">
        <Image
          src={visual.splashImage}
          alt={APP_NAME}
          width={280}
          height={280}
          priority
          className="mx-auto h-auto w-[180px] rounded-[28px] shadow-2xl shadow-black/30 sm:w-[210px]"
        />
      </div>
      <p className="mt-6 animate-fade-in px-4 text-center text-2xl font-bold tracking-tight text-white">
        {APP_NAME}
      </p>
      <p className="mt-2 text-sm font-medium text-white/80">{APP_TAGLINE}</p>
      <p
        className="mt-1 text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: visual.accentSoft }}
      >
        {agency === "fire" ? "FIRE RESCUE" : "POLICE DUTY"}
      </p>
    </div>
  );
}
