"use client";

import { CharacterBust } from "@/components/CharacterBust";
import { useAgencyTheme } from "@/components/AgencyThemeProvider";
import type { CalendarMessage } from "@/lib/types";

interface MessageDeliveryOverlayProps {
  open: boolean;
  message: CalendarMessage;
  onDismiss: () => void;
}

/** 상대 메시지 수신 시 캐릭터 + 말풍선 (닫으면 로컬에서만 사라짐) */
export function MessageDeliveryOverlay({
  open,
  message,
  onDismiss,
}: MessageDeliveryOverlayProps) {
  const { agency } = useAgencyTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm animate-sheet-up">
        <div className="relative mb-3 rounded-3xl bg-white px-4 py-4 shadow-2xl dark:bg-[#161B22]">
          <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#161B22]" />
          <p className="mb-1 text-[11px] font-semibold text-accent">
            {message.updated_by || "상대"}님의 메시지
          </p>
          {message.body ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-100">
              {message.body}
            </p>
          ) : null}
          {message.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.photo}
              alt={`${message.updated_by || "상대"}님이 보낸 사진`}
              className={`${message.body ? "mt-3" : ""} max-h-56 w-full rounded-2xl object-cover`}
            />
          ) : null}
        </div>

        <div className="flex flex-col items-center">
          <CharacterBust agency={agency} />
          <button
            type="button"
            onClick={onDismiss}
            className="mt-4 h-11 w-full max-w-xs rounded-2xl bg-white text-sm font-semibold text-gray-900 shadow-lg transition active:scale-[0.98] dark:bg-[#161B22] dark:text-gray-100"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
