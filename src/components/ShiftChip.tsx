"use client";

import { BedDouble, Coffee, Moon, Sun, Sunset } from "lucide-react";
import {
  SHIFT_LABELS,
  SHIFT_SHORT_LABELS,
  SHIFT_STYLES,
  type ShiftType,
} from "@/lib/types";

interface ShiftChipProps {
  type: ShiftType;
  size?: "sm" | "md";
  showIcon?: boolean;
  compact?: boolean;
}

const ICONS = {
  day: Sun,
  night: Sunset,
  overnight: Moon,
  rest: BedDouble,
  off: Coffee,
} as const;

export function ShiftChip({
  type,
  size = "sm",
  showIcon = true,
  compact = false,
}: ShiftChipProps) {
  const style = SHIFT_STYLES[type];
  const Icon = ICONS[type];
  const label = compact ? SHIFT_SHORT_LABELS[type] : SHIFT_LABELS[type];
  const useIcon = showIcon && !compact;

  return (
    <span
      className={[
        "inline-flex max-w-full items-center justify-center gap-0.5 rounded-full font-semibold whitespace-nowrap",
        style.chip,
        size === "sm"
          ? compact
            ? "px-1 py-0.5 text-[10px] leading-none tracking-tight"
            : "px-1.5 py-0.5 text-[10px] leading-none"
          : "px-3 py-1.5 text-sm",
      ].join(" ")}
    >
      {useIcon && Icon ? (
        <Icon className={size === "sm" ? "h-2.5 w-2.5 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
