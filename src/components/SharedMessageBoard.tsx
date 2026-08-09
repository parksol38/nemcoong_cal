"use client";

import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { MessageCircleHeart, Pencil } from "lucide-react";
import type { CalendarMessage } from "@/lib/types";

interface SharedMessageBoardProps {
  message: CalendarMessage | null;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  displayName: string;
  onPost: (body: string) => Promise<unknown>;
}

export function SharedMessageBoard({
  message,
  loading,
  saving,
  error,
  displayName,
  onPost,
}: SharedMessageBoardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(message?.body ?? "");
  }, [message, editing]);

  const startEdit = () => {
    setDraft(message?.body ?? "");
    setLocalError(null);
    setEditing(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setLocalError("메시지를 입력해 주세요.");
      return;
    }
    if (trimmed.length > 200) {
      setLocalError("200자 이내로 적어 주세요.");
      return;
    }
    try {
      await onPost(trimmed);
      setEditing(false);
      setLocalError(null);
    } catch {
      // 안내 문구는 hook의 error로 표시
    }
  };

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <MessageCircleHeart className="h-3.5 w-3.5 text-rose-400" />
          <h2 className="text-xs font-semibold text-gray-500">우리 메시지</h2>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#007AFF] shadow-sm transition active:scale-95"
          >
            <Pencil className="h-3 w-3" />
            {message ? "수정" : "남기기"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-2 rounded-2xl bg-amber-50 px-3.5 py-2.5 text-center text-[11px] leading-relaxed text-amber-700">
          {error}
        </p>
      ) : null}

      {editing ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white px-3.5 py-3 shadow-sm"
        >
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (localError) setLocalError(null);
            }}
            rows={3}
            maxLength={200}
            autoFocus
            placeholder="상대에게 남길 말을 적어 주세요"
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-400">
              {draft.trim().length}/200 · {displayName || "나"}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setLocalError(null);
                }}
                className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition active:scale-95"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#007AFF] px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-60"
              >
                {saving ? "저장 중…" : "남기기"}
              </button>
            </div>
          </div>
          {localError ? (
            <p className="mt-2 text-center text-xs text-rose-500">{localError}</p>
          ) : null}
        </form>
      ) : loading ? (
        <p className="rounded-2xl bg-white/70 px-4 py-5 text-center text-xs text-gray-400">
          불러오는 중…
        </p>
      ) : message ? (
        <div className="rounded-2xl bg-white px-4 py-3.5 shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {message.body}
          </p>
          <p className="mt-2 text-[11px] text-gray-400">
            {message.updated_by || "누군가"} ·{" "}
            {format(new Date(message.created_at), "M월 d일 HH:mm", {
              locale: ko,
            })}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="w-full rounded-2xl bg-white/70 px-4 py-5 text-center text-xs text-gray-400 transition active:scale-[0.99]"
        >
          아직 메시지가 없어요. 눌러서 남겨 보세요.
        </button>
      )}
    </section>
  );
}
