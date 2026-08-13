"use client";

import * as React from "react";
import type {
  EfficiencyOpportunity,
  FinancialMetrics,
  IndependenceScore,
  OrgProfile,
  PlanQuarter,
  ScenarioInputs,
} from "@/lib/types";
import { DEMO_ORG, DEMO_USER_NAME, LEGACY_USER_NAMES } from "@/lib/data/demo-org";
import { analyzeOrg } from "@/lib/finance/calculations";
import { computeIndependenceScore } from "@/lib/finance/independence-score";
import {
  buildPortfolio,
  portfolioToScenario,
  type PortfolioResult,
} from "@/lib/finance/portfolio-engine";
import { buildEfficiencyOpportunities } from "@/lib/finance/efficiency-engine";
import { buildPlan } from "@/lib/finance/plan-engine";
import {
  compareScenario,
  EMPTY_SCENARIO,
  isScenarioEmpty,
  type ScenarioComparison,
} from "@/lib/finance/scenario-engine";

/**
 * طبقة الحالة المركزية.
 * المصدر الوحيد للحقيقة هو `profile`؛ وكل المؤشرات مشتقة منه عبر مُحركات lib/finance.
 * الاستبدال لاحقًا بـ Supabase يتم داخل هذا الملف فقط (تحميل/حفظ الملف الشخصي).
 */

const STORAGE_KEY = "sustainability-engine:v1";

interface PersistedState {
  profile: OrgProfile;
  scenario: ScenarioInputs;
  savingsRate: number;
  reserveTargetMonths: number;
  analyzed: boolean;
  portfolioBuilt: boolean;
  authenticated: boolean;
  userName: string;
}

interface AppStoreValue extends PersistedState {
  hydrated: boolean;
  metrics: FinancialMetrics;
  score: IndependenceScore;
  portfolio: PortfolioResult;
  opportunities: EfficiencyOpportunity[];
  plan: PlanQuarter[];
  comparison: ScenarioComparison;
  scenarioActive: boolean;
  recommendedScenario: ScenarioInputs;
  setProfile: (updater: OrgProfile | ((prev: OrgProfile) => OrgProfile)) => void;
  setScenario: (updater: ScenarioInputs | ((prev: ScenarioInputs) => ScenarioInputs)) => void;
  applyRecommendedScenario: () => void;
  resetScenario: () => void;
  setSavingsRate: (rate: number) => void;
  setReserveTargetMonths: (months: number) => void;
  markAnalyzed: () => void;
  markPortfolioBuilt: () => void;
  login: (name: string) => void;
  logout: () => void;
  resetToDemo: () => void;
}

const DEFAULT_STATE: PersistedState = {
  profile: DEMO_ORG,
  scenario: EMPTY_SCENARIO,
  savingsRate: 0.1,
  reserveTargetMonths: 6,
  analyzed: false,
  portfolioBuilt: false,
  authenticated: false,
  userName: "",
};

const AppStoreContext = React.createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PersistedState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = React.useState(false);

  // استرجاع الحالة المحفوظة بعد التركيب لتجنّب اختلاف الخادم/المتصفح
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        const storedName = parsed.userName ?? "";
        setState((prev) => ({
          ...prev,
          ...parsed,
          profile: { ...DEMO_ORG, ...(parsed.profile ?? {}) },
          scenario: { ...EMPTY_SCENARIO, ...(parsed.scenario ?? {}) },
          // ترقية الجلسات المحفوظة سابقًا باسم مستخدم قديم
          userName: LEGACY_USER_NAMES.includes(storedName)
            ? DEMO_USER_NAME
            : storedName,
        }));
      }
    } catch {
      // تجاهل أي بيانات تالفة والعودة للحالة الافتراضية
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // التخزين غير متاح — التطبيق يعمل بدون حفظ
    }
  }, [state, hydrated]);

  const metrics = React.useMemo(() => analyzeOrg(state.profile), [state.profile]);
  const score = React.useMemo(() => computeIndependenceScore(metrics), [metrics]);
  const portfolio = React.useMemo(
    () => buildPortfolio(state.profile, metrics),
    [state.profile, metrics],
  );
  const opportunities = React.useMemo(
    () => buildEfficiencyOpportunities(state.profile),
    [state.profile],
  );
  const plan = React.useMemo(() => buildPlan(metrics, portfolio), [metrics, portfolio]);
  const comparison = React.useMemo(
    () => compareScenario(state.profile, state.scenario),
    [state.profile, state.scenario],
  );
  const recommendedScenario = React.useMemo(
    () => portfolioToScenario(portfolio, metrics, state.savingsRate),
    [portfolio, metrics, state.savingsRate],
  );

  const value = React.useMemo<AppStoreValue>(
    () => ({
      ...state,
      hydrated,
      metrics,
      score,
      portfolio,
      opportunities,
      plan,
      comparison,
      scenarioActive: !isScenarioEmpty(state.scenario),
      recommendedScenario,
      setProfile: (updater) =>
        setState((prev) => ({
          ...prev,
          profile:
            typeof updater === "function"
              ? (updater as (p: OrgProfile) => OrgProfile)(prev.profile)
              : updater,
        })),
      setScenario: (updater) =>
        setState((prev) => ({
          ...prev,
          scenario:
            typeof updater === "function"
              ? (updater as (s: ScenarioInputs) => ScenarioInputs)(prev.scenario)
              : updater,
        })),
      applyRecommendedScenario: () =>
        setState((prev) => ({
          ...prev,
          scenario: recommendedScenario,
          analyzed: true,
          portfolioBuilt: true,
        })),
      resetScenario: () => setState((prev) => ({ ...prev, scenario: EMPTY_SCENARIO })),
      setSavingsRate: (rate) => setState((prev) => ({ ...prev, savingsRate: rate })),
      setReserveTargetMonths: (months) =>
        setState((prev) => ({ ...prev, reserveTargetMonths: months })),
      markAnalyzed: () => setState((prev) => ({ ...prev, analyzed: true })),
      markPortfolioBuilt: () =>
        setState((prev) => ({ ...prev, analyzed: true, portfolioBuilt: true })),
      login: (name) =>
        setState((prev) => ({ ...prev, authenticated: true, userName: name })),
      logout: () => setState((prev) => ({ ...prev, authenticated: false })),
      resetToDemo: () => setState({ ...DEFAULT_STATE, authenticated: state.authenticated, userName: state.userName }),
    }),
    [
      state,
      hydrated,
      metrics,
      score,
      portfolio,
      opportunities,
      plan,
      comparison,
      recommendedScenario,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const ctx = React.useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore يجب أن يُستخدم داخل AppStoreProvider");
  return ctx;
}
