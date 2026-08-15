"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyAgencyTheme,
  getAgencyVisual,
  getStoredAgencyTheme,
  inferAgencyFromPattern,
  isAgencyTheme,
  storeAgencyTheme,
  type AgencyTheme,
} from "@/lib/agencyTheme";

interface AgencyThemeContextValue {
  agency: AgencyTheme;
  setAgency: (agency: AgencyTheme) => void;
}

const AgencyThemeContext = createContext<AgencyThemeContextValue | null>(null);

export function AgencyThemeProvider({
  agency: agencyProp,
  shiftPattern,
  children,
}: {
  agency?: AgencyTheme | null;
  shiftPattern?: string | null;
  children: ReactNode;
}) {
  const [agency, setAgencyState] = useState<AgencyTheme>(() => {
    if (isAgencyTheme(agencyProp)) return agencyProp;
    return inferAgencyFromPattern(shiftPattern);
  });

  useEffect(() => {
    if (isAgencyTheme(agencyProp)) {
      setAgencyState(agencyProp);
      storeAgencyTheme(agencyProp);
      return;
    }
    const stored = getStoredAgencyTheme();
    if (stored) {
      setAgencyState(stored);
      applyAgencyTheme(stored);
      return;
    }
    const inferred = inferAgencyFromPattern(shiftPattern);
    setAgencyState(inferred);
    applyAgencyTheme(inferred);
  }, [agencyProp, shiftPattern]);

  const setAgency = (next: AgencyTheme) => {
    setAgencyState(next);
    storeAgencyTheme(next);
  };

  const value = useMemo(() => ({ agency, setAgency }), [agency]);

  return (
    <AgencyThemeContext.Provider value={value}>
      {children}
    </AgencyThemeContext.Provider>
  );
}

export function useAgencyTheme() {
  const ctx = useContext(AgencyThemeContext);
  if (!ctx) {
    throw new Error("useAgencyTheme는 AgencyThemeProvider 안에서만 사용할 수 있어요.");
  }
  return ctx;
}

/** Provider 없이도 배지·그radient 등 읽기 */
export function useAgencyVisual(agency?: AgencyTheme) {
  const ctx = useContext(AgencyThemeContext);
  const resolved = agency ?? ctx?.agency ?? "police";
  return getAgencyVisual(resolved);
}
