"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, Send, X } from "lucide-react";
import { MessageCameraSheet } from "@/components/MessageCameraSheet";

interface MessageSendModalProps {
  open: boolean;
  saving?: boolean;
  error?: string | null;
  displayName: string;
  onClose: () => void;
  onSend: (body: string, photo?: string | null) => Promise<unknown>;
}

/** 메시지 전하기 작성 모달 */
export function MessageSendModal({
  open,
  saving,
  error,
  displayName,
  onClose,
  onSend,
}: MessageSendModalProps) {
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft("");
    setPhoto(null);
    setCameraOpen(false);
    setLocalError(null);
    setSent(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed && !photo) {
      setLocalError("메시지 또는 사진을 추가해 주세요.");
      return;
    }
    if (trimmed.length > 200) {
      setLocalError("200자 이내로 적어 주세요.");
      return;
    }
    try {
      await onSend(trimmed, photo);
      setSent(true);
      window.setTimeout(() => onClose(), 700);
    } catch {
      // hook error 표시
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
        <div className="w-full max-w-md animate-sheet-up rounded-3xl bg-white shadow-2xl dark:bg-[#161B22]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                메시지 전하기
              </p>
              <p className="text-[11px] text-gray-400">
                같이 보는 사람에게 한 번만 전달돼요
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-4">
            {error ? (
              <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                {error}
              </p>
            ) : null}

            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (localError) setLocalError(null);
              }}
              rows={4}
              maxLength={200}
              autoFocus
              placeholder="오늘 힘내! / 늦게 들어갈게~"
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:focus:bg-[#0B0F14]"
            />

            {photo ? (
              <div className="relative mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt="첨부한 사진"
                  className="max-h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white"
                  aria-label="사진 제거"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                disabled={!!photo || saving || sent}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition active:scale-95 disabled:opacity-50 dark:border-white/10 dark:text-gray-200"
              >
                <Camera className="h-3.5 w-3.5" />
                사진 찍기
              </button>
              <p className="text-[10px] text-gray-400">
                {draft.trim().length}/200 · {displayName || "나"}
              </p>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving || sent}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {sent ? "전송됨!" : saving ? "전송 중…" : "전송"}
              </button>
            </div>

            {localError ? (
              <p className="mt-2 text-center text-xs text-rose-500">
                {localError}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <MessageCameraSheet
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={setPhoto}
      />
    </>
  );
}
