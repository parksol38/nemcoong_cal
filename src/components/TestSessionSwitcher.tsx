"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Save, UserRound } from "lucide-react";
import { registerCalendarDevice } from "@/lib/api";
import type { AgencyTheme } from "@/lib/agencyTheme";
import {
  applyTestSessionSlot,
  loadTestSessionSlot,
  saveTestSessionSlot,
  slotLabel,
  type TestSessionSlotId,
  type TestSessionSnapshot,
} from "@/lib/testSessions";

interface TestSessionSwitcherProps {
  displayName: string;
  calendarId: string;
  shareCode: string;
  calendarName: string;
  shiftPattern: string;
  agency: AgencyTheme;
  ownerDeviceId: string | null;
  passwordVersion: number;
  onSwitched: () => void;
}

/** 테스트용 A/B 계정 저장·전환 */
export function TestSessionSwitcher({
  displayName,
  calendarId,
  shareCode,
  calendarName,
  shiftPattern,
  agency,
  ownerDeviceId,
  passwordVersion,
  onSwitched,
}: TestSessionSwitcherProps) {
  const [slotA, setSlotA] = useState<TestSessionSnapshot | null>(null);
  const [slotB, setSlotB] = useState<TestSessionSnapshot | null>(null);
  const [draftNameA, setDraftNameA] = useState("");
  const [draftNameB, setDraftNameB] = useState("");
  const [busy, setBusy] = useState<TestSessionSlotId | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    setSlotA(loadTestSessionSlot("a"));
    setSlotB(loadTestSessionSlot("b"));
  };

  useEffect(() => {
    refresh();
    setDraftNameA((prev) => prev || displayName.trim());
  }, [displayName, calendarId]);

  const buildSnapshot = (
    slot: TestSessionSlotId,
    name: string,
  ): TestSessionSnapshot => ({
    slot,
    label: slotLabel(slot),
    displayName: name.trim(),
    calendarId,
    shareCode,
    calendarName,
    shiftPattern,
    agency,
    ownerDeviceId,
    passwordVersion,
    savedAt: new Date().toISOString(),
  });

  const handleSave = (slot: TestSessionSlotId, nameOverride?: string) => {
    const name = (nameOverride ?? displayName).trim();
    if (!name) {
      setMsg("이름을 입력해 주세요.");
      return;
    }
    saveTestSessionSlot(buildSnapshot(slot, name));
    refresh();
    setMsg(`${slotLabel(slot)}에 「${name}」 저장했어요.`);
  };

  const handleLoad = async (slot: TestSessionSlotId) => {
    const saved = loadTestSessionSlot(slot);
    if (!saved) {
      setMsg(`${slotLabel(slot)} 슬롯이 비어 있어요. 먼저 저장해 주세요.`);
      return;
    }
    setBusy(slot);
    setMsg(null);
    try {
      applyTestSessionSlot(slot);
      await registerCalendarDevice({
        calendarId: saved.calendarId,
        displayName: saved.displayName,
      });
      onSwitched();
    } catch {
      setMsg("전환에 실패했어요. 다시 시도해 주세요.");
      setBusy(null);
    }
  };

  const renderSlot = (
    slot: TestSessionSlotId,
    saved: TestSessionSnapshot | null,
    draftName: string,
    onDraftChange: (value: string) => void,
  ) => (
    <div
      key={slot}
      className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-3 py-2.5 dark:border-white/10 dark:bg-[#0B0F14]/80"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">
            계정 {slotLabel(slot)}
          </p>
          <input
            value={draftName}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={slot === "a" ? "예: 김출동" : "예: 박근무"}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 dark:border-white/10 dark:bg-[#0B0F14] dark:text-gray-100"
          />
          {saved ? (
            <p className="mt-1 text-[10px] text-gray-400">
              저장됨 · {saved.displayName}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => handleSave(slot, draftName)}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700 transition active:scale-95 disabled:opacity-50 dark:bg-white/10 dark:text-gray-200"
          >
            <Save className="h-3 w-3" />
            저장
          </button>
          <button
            type="button"
            disabled={busy !== null || !saved}
            onClick={() => void handleLoad(slot)}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent transition active:scale-95 disabled:opacity-50"
          >
            <ArrowLeftRight className="h-3 w-3" />
            {busy === slot ? "전환…" : "전환"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-3 dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="mb-2 flex items-center gap-2">
        <UserRound className="h-4 w-4 text-amber-600 dark:text-amber-300" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            테스트용 계정 전환
          </p>
          <p className="text-[10px] leading-snug text-gray-500 dark:text-gray-400">
            같은 브라우저에서 A/B 두 사용자로 왔다 갔다 할 때 쓰세요.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {renderSlot("a", slotA, draftNameA, setDraftNameA)}
        {renderSlot("b", slotB, draftNameB, setDraftNameB)}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
        1) A에 김출동 저장 → 2) B 이름에 박근무 입력 후 저장 → 3) A/B
        전환 버튼으로 왔다 갔다
      </p>

      {msg ? (
        <p className="mt-2 rounded-lg bg-white/80 px-2.5 py-2 text-[11px] text-gray-600 dark:bg-black/20 dark:text-gray-300">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
