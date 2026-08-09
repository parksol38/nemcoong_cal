"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  History,
  MessageCircleHeart,
  MonitorSmartphone,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { fetchCalendarDevices, fetchMessageHistory } from "@/lib/api";
import {
  getOrCreateDeviceId,
  type CalendarDevice,
  type CalendarMessage,
} from "@/lib/types";

interface SettingsModalProps {
  open: boolean;
  calendarId: string;
  onClose: () => void;
}

type Tab = "devices" | "messages";

function isPhoneLike(label: string) {
  return /iPhone|Android 폰|iPad|태블릿/i.test(label);
}

export function SettingsModal({ open, calendarId, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("devices");
  const [devices, setDevices] = useState<CalendarDevice[]>([]);
  const [messages, setMessages] = useState<CalendarMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const myDeviceId = typeof window !== "undefined" ? getOrCreateDeviceId() : "";

  useEffect(() => {
    if (!open) return;
    setTab("devices");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load =
      tab === "devices"
        ? fetchCalendarDevices(calendarId).then((list) => {
            if (!cancelled) {
              setDevices(list);
              setMessages([]);
            }
          })
        : fetchMessageHistory(calendarId, 40).then((list) => {
            if (!cancelled) {
              setMessages(list);
              setDevices([]);
            }
          });

    load
      .catch(() => {
        if (!cancelled) {
          setError(
            tab === "devices"
              ? "접속 이력을 불러오지 못했어요. migrate-calendar-devices.sql 실행이 필요할 수 있어요."
              : "메시지 이력을 불러오지 못했어요. migrate-calendar-messages.sql 실행이 필요할 수 있어요.",
          );
          setDevices([]);
          setMessages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, calendarId, tab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-sheet-up rounded-t-3xl bg-white shadow-2xl sm:mx-4 sm:animate-scale-in sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs font-medium text-gray-400">설정</p>
            <h2 className="text-lg font-bold text-gray-900">앱 정보</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-100 px-4 pt-2">
          <TabButton
            active={tab === "devices"}
            onClick={() => setTab("devices")}
            icon={<Users className="h-3.5 w-3.5" />}
            label="접속한 사람"
          />
          <TabButton
            active={tab === "messages"}
            onClick={() => setTab("messages")}
            icon={<MessageCircleHeart className="h-3.5 w-3.5" />}
            label="메시지 이력"
          />
        </div>

        <div className="max-h-[55vh] space-y-2.5 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>
          ) : error ? (
            <p className="rounded-2xl bg-rose-50 px-3.5 py-3 text-center text-sm leading-relaxed text-rose-600">
              {error}
            </p>
          ) : tab === "devices" ? (
            devices.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                아직 등록된 기기가 없어요.
              </p>
            ) : (
              devices.map((device) => {
                const isMe = device.device_id === myDeviceId;
                const Icon = isPhoneLike(device.device_label)
                  ? Smartphone
                  : MonitorSmartphone;
                return (
                  <div
                    key={device.id}
                    className={`rounded-2xl border px-3.5 py-3 ${
                      isMe
                        ? "border-[#007AFF]/25 bg-[#007AFF]/5"
                        : "border-gray-100 bg-gray-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isMe
                            ? "bg-[#007AFF]/15 text-[#007AFF]"
                            : "bg-white text-gray-500 shadow-sm"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {device.display_name || "이름 없음"}
                          </p>
                          {isMe ? (
                            <span className="shrink-0 rounded-full bg-[#007AFF]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#007AFF]">
                              나
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {device.device_label}
                        </p>
                        <div className="mt-2 space-y-0.5 text-[11px] text-gray-400">
                          <p>
                            가입{" "}
                            {format(new Date(device.created_at), "yyyy.M.d HH:mm", {
                              locale: ko,
                            })}
                          </p>
                          <p>
                            최근 접속{" "}
                            {format(
                              new Date(device.last_seen_at),
                              "yyyy.M.d HH:mm",
                              { locale: ko },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 남긴 메시지가 없어요.
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <History className="h-3 w-3 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-700">
                      {msg.updated_by || "누군가"}
                    </p>
                    {i === 0 ? (
                      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">
                        현재
                      </span>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-[10px] text-gray-400">
                    {format(new Date(msg.created_at), "yyyy.M.d HH:mm", {
                      locale: ko,
                    })}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {msg.body}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-2xl bg-gray-900 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-[-1px] flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-semibold transition ${
        active
          ? "border-[#007AFF] text-[#007AFF]"
          : "border-transparent text-gray-400"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
