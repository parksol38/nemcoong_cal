import Image from "next/image";
import type { AgencyTheme } from "@/lib/agencyTheme";

interface CharacterBustProps {
  agency: AgencyTheme;
  className?: string;
}

const MASCOT_DELIVERY: Record<
  AgencyTheme,
  { src: string; width: number; height: number; label: string }
> = {
  fire: {
    src: "/images/mascots/fire-delivery.png",
    width: 469,
    height: 584,
    label: "소방 마스코트",
  },
  police: {
    src: "/images/mascots/police-delivery.png",
    width: 448,
    height: 607,
    label: "경찰 마스코트",
  },
};

/** 직군별 메시지 전달 마스코트 */
export function CharacterBust({ agency, className = "" }: CharacterBustProps) {
  const mascot = MASCOT_DELIVERY[agency];

  return (
    <Image
      src={mascot.src}
      alt={mascot.label}
      width={mascot.width}
      height={mascot.height}
      className={`h-auto w-auto max-h-52 max-w-[13.5rem] object-contain object-bottom drop-shadow-lg ${className}`}
      priority
    />
  );
}
