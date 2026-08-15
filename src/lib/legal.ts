/** Play Console·개인정보처리방침용 문의 이메일 (Vercel: NEXT_PUBLIC_SUPPORT_EMAIL) */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";

export const APP_NAME = "오늘도 출동";
export const APP_TAGLINE = "경찰·소방 공무원 전용 교대일정";
export const APP_SHORT_NAME = "오늘도출동";
export const APP_ID = "com.nemkung.shiftcalendar";
export const PRODUCTION_URL = "https://shift-calendar-three.vercel.app";
export const PRIVACY_URL = `${PRODUCTION_URL}/privacy`;
export const TERMS_URL = `${PRODUCTION_URL}/terms`;
export const DATA_DELETION_URL = `${PRODUCTION_URL}/data-deletion`;
export const LEGAL_EFFECTIVE_DATE = "2026년 8월 12일";

/** 이메일 mailto 링크 (미설정 시 null) */
export function supportMailto(subject?: string): string | null {
  if (!SUPPORT_EMAIL) return null;
  const params = subject
    ? `?subject=${encodeURIComponent(subject)}`
    : "";
  return `mailto:${SUPPORT_EMAIL}${params}`;
}
