import type { SalaryAgency } from "./salaryTable";

/** UI 테마 직군 (경찰 / 소방) */
export type AgencyTheme = SalaryAgency;

export const AGENCY_LABELS: Record<AgencyTheme, string> = {
  police: "경찰",
  fire: "소방",
};

export const AGENCY_TAGLINES: Record<AgencyTheme, string> = {
  police: "경찰 교대 일정 · 전문 근무표",
  fire: "소방 교대 일정 · 전문 근무표",
};

export type AgencyVisual = {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  heroFrom: string;
  heroVia: string;
  heroTo: string;
  headerLight: string;
  headerDark: string;
  badgeImage: string;
  splashImage: string;
  statusBarLight: string;
  statusBarDark: string;
};

export const AGENCY_VISUALS: Record<AgencyTheme, AgencyVisual> = {
  police: {
    accent: "#2563eb",
    accentStrong: "#1d4ed8",
    accentSoft: "#dbeafe",
    heroFrom: "#0c1f3d",
    heroVia: "#1e3a8a",
    heroTo: "#172554",
    headerLight: "rgba(239, 246, 255, 0.92)",
    headerDark: "rgba(11, 18, 32, 0.92)",
    badgeImage: "/images/app-icon.png",
    splashImage: "/images/app-icon.png",
    statusBarLight: "#eff6ff",
    statusBarDark: "#0b1220",
  },
  fire: {
    accent: "#dc2626",
    accentStrong: "#b91c1c",
    accentSoft: "#fee2e2",
    heroFrom: "#450a0a",
    heroVia: "#991b1b",
    heroTo: "#7f1d1d",
    headerLight: "rgba(255, 241, 242, 0.92)",
    headerDark: "rgba(24, 10, 10, 0.92)",
    badgeImage: "/images/app-icon.png",
    splashImage: "/images/app-icon.png",
    statusBarLight: "#fff1f2",
    statusBarDark: "#180a0a",
  },
};

const STORAGE_AGENCY = "shift-calendar-agency";

export function isAgencyTheme(value: unknown): value is AgencyTheme {
  return value === "police" || value === "fire";
}

/** 교대 패턴 ID로 직군 추정 (레거시 달력용) */
export function inferAgencyFromPattern(patternId?: string | null): AgencyTheme {
  const id = (patternId ?? "").trim().toLowerCase();
  if (id.startsWith("fire_") || id.includes("소방")) return "fire";
  if (id.startsWith("police_") || id.includes("경찰")) return "police";
  return "police";
}

/** DB/세션 값 정규화 */
export function resolveAgencyTheme(input?: string | null): AgencyTheme {
  return isAgencyTheme(input) ? input : inferAgencyFromPattern(input);
}

export function getStoredAgencyTheme(): AgencyTheme | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_AGENCY);
  return isAgencyTheme(raw) ? raw : null;
}

export function storeAgencyTheme(agency: AgencyTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_AGENCY, agency);
  applyAgencyTheme(agency);
}

export function clearStoredAgencyTheme() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_AGENCY);
}

/** html[data-agency] + CSS 변수 적용 */
export function applyAgencyTheme(agency: AgencyTheme) {
  if (typeof document === "undefined") return;
  const visual = AGENCY_VISUALS[agency];
  const root = document.documentElement;
  root.dataset.agency = agency;
  root.style.setProperty("--accent", visual.accent);
  root.style.setProperty("--accent-strong", visual.accentStrong);
  root.style.setProperty("--accent-soft", visual.accentSoft);
  root.style.setProperty("--hero-from", visual.heroFrom);
  root.style.setProperty("--hero-via", visual.heroVia);
  root.style.setProperty("--hero-to", visual.heroTo);
  root.style.setProperty("--header-surface", visual.headerLight);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      root.classList.contains("dark")
        ? visual.statusBarDark
        : visual.statusBarLight,
    );
  }
}

export function getAgencyVisual(agency: AgencyTheme): AgencyVisual {
  return AGENCY_VISUALS[agency];
}
