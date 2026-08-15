import type { CalendarMessage } from "./types";

const STORAGE_PREFIX = "shift-calendar-msg-dismissed:";

/** 수신 확인(닫기) 처리용 키 */
export function getMessageDeliveryKey(
  message: Pick<CalendarMessage, "created_at" | "body" | "photo">,
): string {
  const photoTag = message.photo
    ? `|p:${message.photo.length}:${message.photo.slice(-24)}`
    : "";
  return `${message.created_at}|${message.body.trim()}${photoTag}`;
}

export function isMessageDismissed(calendarId: string, key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${STORAGE_PREFIX}${calendarId}`) === key;
}

export function markMessageDismissed(calendarId: string, key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${calendarId}`, key);
}

/** 내가 보낸 메시지인지 */
export function isMessageFromMe(
  message: CalendarMessage,
  displayName: string,
): boolean {
  return message.updated_by.trim() === displayName.trim();
}

/** 상대에게 보여줄 새 메시지인지 */
export function shouldShowMessageDelivery(input: {
  calendarId: string;
  message: CalendarMessage | null;
  displayName: string;
}): boolean {
  const { calendarId, message, displayName } = input;
  if (!message?.body.trim() && !message?.photo?.trim()) return false;
  if (isMessageFromMe(message, displayName)) return false;
  const key = getMessageDeliveryKey(message);
  return !isMessageDismissed(calendarId, key);
}
