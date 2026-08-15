import { storeAgencyTheme, type AgencyTheme } from "./agencyTheme";
import {
  markCalendarJoined,
  storeCalendarSession,
  unlockDevice,
} from "./types";

export type TestSessionSlotId = "a" | "b";

export interface TestSessionSnapshot {
  slot: TestSessionSlotId;
  label: string;
  displayName: string;
  calendarId: string;
  shareCode: string;
  calendarName: string;
  shiftPattern: string;
  agency: AgencyTheme;
  ownerDeviceId: string | null;
  passwordVersion: number;
  savedAt: string;
}

const STORAGE_PREFIX = "shift-calendar-test-slot-";

function storageKey(slot: TestSessionSlotId): string {
  return `${STORAGE_PREFIX}${slot}`;
}

export function loadTestSessionSlot(
  slot: TestSessionSlotId,
): TestSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(slot));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TestSessionSnapshot;
    if (!parsed.displayName?.trim() || !parsed.calendarId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTestSessionSlot(snapshot: TestSessionSnapshot): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(snapshot.slot), JSON.stringify(snapshot));
}

export function clearTestSessionSlot(slot: TestSessionSlotId): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(slot));
}

/** 저장된 스냅샷을 현재 세션(localStorage)에 적용 */
export function applyTestSessionSlot(
  slot: TestSessionSlotId,
): TestSessionSnapshot | null {
  const snapshot = loadTestSessionSlot(slot);
  if (!snapshot) return null;

  storeCalendarSession(
    snapshot.calendarId,
    snapshot.shareCode,
    snapshot.displayName,
  );
  storeAgencyTheme(snapshot.agency);
  unlockDevice(snapshot.passwordVersion);
  markCalendarJoined();
  return snapshot;
}

export function slotLabel(slot: TestSessionSlotId): string {
  return slot === "a" ? "A" : "B";
}
