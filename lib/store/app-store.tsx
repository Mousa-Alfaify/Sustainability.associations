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
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { rowToOrgProfile, orgProfileToRowPatch } from "@/lib/supabase/types";
import type { OrganizationRow } from "@/lib/supabase/types";
import * as repo from "@/lib/supabase/org-repository";
import type { MemberWithProfile } from "@/lib/supabase/org-repository";

/**
 * طبقة الحالة المركزية — لها مساران:
 *
 * 1) وضع سحابي (mode === "cloud"): يُفعَّل تلقائيًا عند وجود متغيرات بيئة
 *    Supabase. مصادقة حقيقية + بيانات الجمعية مشتركة بين كل أعضاء
 *    الفريق ومتزامنة لحظيًا عبر Realtime. المصدر الوحيد للحقيقة هو صف
 *    organizations في قاعدة البيانات.
 *
 * 2) وضع محلي (mode === "local"): عندما لا توجد إعدادات Supabase.
 *    نفس السلوك القديم بالكامل — بيانات تجريبية محفوظة في هذا المتصفح
 *    فقط عبر localStorage، بلا حسابات حقيقية. يبقى التطبيق قابلًا
 *    للاستخدام والعرض حتى بدون إعداد قاعدة بيانات.
 *
 * حالة الاستكشاف (السيناريو، نسبة الادخار، أعلام «تم التحليل») تبقى
 * محلية في كلا الوضعين عمدًا — إنها منطقة تجربة شخصية («ماذا لو؟»)
 * وليست جزءًا من بيانات الجمعية الرسمية التي يجب أن تتشارك بين الفريق.
 */

const LOCAL_UI_KEY = "sustainability-engine:ui:v1";
const LOCAL_DEMO_KEY = "sustainability-engine:v1";

// ------------------------------------------------------------------
// حالة الاستكشاف المحلية (مشتركة بين الوضعين)
// ------------------------------------------------------------------

interface LocalUiState {
  scenario: ScenarioInputs;
  savingsRate: number;
  reserveTargetMonths: number;
  analyzed: boolean;
  portfolioBuilt: boolean;
}

const DEFAULT_UI_STATE: LocalUiState = {
  scenario: EMPTY_SCENARIO,
  savingsRate: 0.1,
  reserveTargetMonths: 6,
  analyzed: false,
  portfolioBuilt: false,
};

// ------------------------------------------------------------------
// حالة الوضع المحلي بالكامل (بدون Supabase)
// ------------------------------------------------------------------

interface LocalDemoState {
  profile: OrgProfile;
  authenticated: boolean;
  userName: string;
}

const DEFAULT_DEMO_STATE: LocalDemoState = {
  profile: DEMO_ORG,
  authenticated: false,
  userName: "",
};

// ------------------------------------------------------------------
// حالة الوضع السحابي
// ------------------------------------------------------------------

type AuthStatus = "checking" | "signed-out" | "signed-in";
type OrgStatus = "checking" | "none" | "ready" | "error";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface CloudUser {
  id: string;
  email: string;
  displayName: string;
}

// ------------------------------------------------------------------
// واجهة المتجر الموحّدة المستخدمة في كل الصفحات
// ------------------------------------------------------------------

interface AppStoreValue {
  mode: "cloud" | "local";
  hydrated: boolean;

  // مصادقة
  authStatus: AuthStatus;
  authenticated: boolean;
  user: CloudUser | null;
  userName: string;
  authError: string | null;
  authBusy: boolean;
  login: (name: string) => void; // الوضع المحلي فقط
  logout: () => void;
  /** يُرجع true إذا تم تسجيل الدخول فورًا، و false إذا تطلب الأمر تأكيد البريد الإلكتروني أولًا */
  signUpCloud: (email: string, password: string, displayName: string) => Promise<boolean>;
  signInCloud: (email: string, password: string) => Promise<void>;
  clearAuthError: () => void;

  // الجمعية / العضوية (الوضع السحابي)
  orgStatus: OrgStatus;
  orgId: string | null;
  joinCode: string | null;
  members: MemberWithProfile[];
  membersLoading: boolean;
  createOrg: (name: string, role: string) => Promise<void>;
  joinOrg: (code: string, role: string) => Promise<void>;
  leaveOrg: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  onboardingError: string | null;
  onboardingBusy: boolean;
  clearOnboardingError: () => void;

  // البيانات المالية المشتقة (فعلية دائمًا مهما كان الوضع)
  profile: OrgProfile;
  metrics: FinancialMetrics;
  score: IndependenceScore;
  portfolio: PortfolioResult;
  opportunities: EfficiencyOpportunity[];
  plan: PlanQuarter[];
  comparison: ScenarioComparison;

  saveStatus: SaveStatus;
  saveError: string | null;
  setProfile: (profile: OrgProfile) => Promise<void>;
  resetToDemo: () => void; // الوضع المحلي فقط

  // حالة الاستكشاف (محلية دائمًا)
  scenario: ScenarioInputs;
  scenarioActive: boolean;
  recommendedScenario: ScenarioInputs;
  savingsRate: number;
  reserveTargetMonths: number;
  analyzed: boolean;
  portfolioBuilt: boolean;
  setScenario: (updater: ScenarioInputs | ((prev: ScenarioInputs) => ScenarioInputs)) => void;
  applyRecommendedScenario: () => void;
  resetScenario: () => void;
  setSavingsRate: (rate: number) => void;
  setReserveTargetMonths: (months: number) => void;
  markAnalyzed: () => void;
  markPortfolioBuilt: () => void;
}

const AppStoreContext = React.createContext<AppStoreValue | null>(null);

// ------------------------------------------------------------------
// أدوات تخزين محلي آمنة (لا تنهار أثناء البناء الثابت أو إن كان التخزين محظورًا)
// ------------------------------------------------------------------

function readLocal<T>(key: string): Partial<T> | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // التخزين غير متاح (وضع خاص، أو حظر من المتصفح) — نكمل بدون حفظ
  }
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const mode: "cloud" | "local" = isSupabaseConfigured ? "cloud" : "local";

  const [hydrated, setHydrated] = React.useState(false);
  const [ui, setUi] = React.useState<LocalUiState>(DEFAULT_UI_STATE);

  // --- الوضع المحلي ---
  const [demo, setDemo] = React.useState<LocalDemoState>(DEFAULT_DEMO_STATE);

  // --- الوضع السحابي ---
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>("checking");
  const [user, setUser] = React.useState<CloudUser | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authBusy, setAuthBusy] = React.useState(false);

  const [orgStatus, setOrgStatus] = React.useState<OrgStatus>("checking");
  const [orgRow, setOrgRow] = React.useState<OrganizationRow | null>(null);
  const [members, setMembers] = React.useState<MemberWithProfile[]>([]);
  const [membersLoading, setMembersLoading] = React.useState(false);
  const [onboardingError, setOnboardingError] = React.useState<string | null>(null);
  const [onboardingBusy, setOnboardingBusy] = React.useState(false);

  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // ------------------------------------------------------------
  // الترطيب: استرجاع حالة الاستكشاف المحلية دائمًا، وحالة العرض
  // التجريبي إن كنا في الوضع المحلي.
  // ------------------------------------------------------------
  React.useEffect(() => {
    const storedUi = readLocal<LocalUiState>(LOCAL_UI_KEY);
    if (storedUi) {
      setUi((prev) => ({
        ...prev,
        ...storedUi,
        scenario: { ...EMPTY_SCENARIO, ...(storedUi.scenario ?? {}) },
      }));
    }

    if (mode === "local") {
      const storedDemo = readLocal<LocalDemoState>(LOCAL_DEMO_KEY);
      if (storedDemo) {
        const storedName = storedDemo.userName ?? "";
        setDemo((prev) => ({
          ...prev,
          ...storedDemo,
          profile: { ...DEMO_ORG, ...(storedDemo.profile ?? {}) },
          userName: LEGACY_USER_NAMES.includes(storedName) ? DEMO_USER_NAME : storedName,
        }));
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    writeLocal(LOCAL_UI_KEY, ui);
  }, [ui, hydrated]);

  React.useEffect(() => {
    if (!hydrated || mode !== "local") return;
    writeLocal(LOCAL_DEMO_KEY, demo);
  }, [demo, hydrated, mode]);

  // ------------------------------------------------------------
  // الوضع السحابي: متابعة جلسة المصادقة
  // ------------------------------------------------------------
  React.useEffect(() => {
    if (mode !== "cloud" || !supabase) return;

    let active = true;

    function applySession(session: import("@supabase/supabase-js").Session | null) {
      if (!active) return;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          displayName:
            (session.user.user_metadata?.display_name as string | undefined) ??
            session.user.email?.split("@")[0] ??
            "",
        });
        setAuthStatus("signed-in");
      } else {
        setUser(null);
        setAuthStatus("signed-out");
        setOrgStatus("checking");
        setOrgRow(null);
        setMembers([]);
      }
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [mode]);

  // ------------------------------------------------------------
  // الوضع السحابي: تحميل جمعية المستخدم بعد تسجيل الدخول + اشتراك لحظي
  // ------------------------------------------------------------
  React.useEffect(() => {
    if (mode !== "cloud" || authStatus !== "signed-in") return;

    let active = true;
    setOrgStatus("checking");

    repo
      .fetchMyOrganization()
      .then((row) => {
        if (!active) return;
        setOrgRow(row);
        setOrgStatus(row ? "ready" : "none");
      })
      .catch((error: Error) => {
        if (!active) return;
        setOrgStatus("error");
        setSaveError(error.message);
      });

    return () => {
      active = false;
    };
  }, [mode, authStatus]);

  React.useEffect(() => {
    if (mode !== "cloud" || !orgRow?.id) return;
    const channel = repo.subscribeOrganization(orgRow.id, (nextRow) => {
      setOrgRow(nextRow);
    });
    return () => {
      channel.unsubscribe();
    };
  }, [mode, orgRow?.id]);

  const refreshMembers = React.useCallback(async () => {
    if (!orgRow?.id) return;
    setMembersLoading(true);
    try {
      const list = await repo.fetchMembers(orgRow.id);
      setMembers(list);
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setMembersLoading(false);
    }
  }, [orgRow?.id]);

  React.useEffect(() => {
    if (mode === "cloud" && orgRow?.id) void refreshMembers();
  }, [mode, orgRow?.id, refreshMembers]);

  // ------------------------------------------------------------
  // المصدر الوحيد للحقيقة لملف الجمعية — بحسب الوضع
  // ------------------------------------------------------------
  const profile: OrgProfile = React.useMemo(() => {
    if (mode === "cloud") return orgRow ? rowToOrgProfile(orgRow) : DEMO_ORG;
    return demo.profile;
  }, [mode, orgRow, demo.profile]);

  const metrics = React.useMemo(() => analyzeOrg(profile), [profile]);
  const score = React.useMemo(() => computeIndependenceScore(metrics), [metrics]);
  const portfolio = React.useMemo(() => buildPortfolio(profile, metrics), [profile, metrics]);
  const opportunities = React.useMemo(() => buildEfficiencyOpportunities(profile), [profile]);
  const plan = React.useMemo(() => buildPlan(metrics, portfolio), [metrics, portfolio]);
  const comparison = React.useMemo(
    () => compareScenario(profile, ui.scenario),
    [profile, ui.scenario],
  );
  const recommendedScenario = React.useMemo(
    () => portfolioToScenario(portfolio, metrics, ui.savingsRate),
    [portfolio, metrics, ui.savingsRate],
  );

  // ------------------------------------------------------------
  // إجراءات المصادقة
  // ------------------------------------------------------------
  const login = React.useCallback((name: string) => {
    setDemo((prev) => ({ ...prev, authenticated: true, userName: name }));
  }, []);

  const logout = React.useCallback(() => {
    if (mode === "cloud") {
      void repo.signOut();
      return;
    }
    setDemo((prev) => ({ ...prev, authenticated: false }));
  }, [mode]);

  const signUpCloud = React.useCallback(
    async (email: string, password: string, displayName: string) => {
      setAuthBusy(true);
      setAuthError(null);
      try {
        const data = await repo.signUp(email, password, displayName);
        return Boolean(data.session);
      } catch (error) {
        setAuthError((error as Error).message);
        throw error;
      } finally {
        setAuthBusy(false);
      }
    },
    [],
  );

  const signInCloud = React.useCallback(async (email: string, password: string) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await repo.signIn(email, password);
    } catch (error) {
      setAuthError((error as Error).message);
      throw error;
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const clearAuthError = React.useCallback(() => setAuthError(null), []);
  const clearOnboardingError = React.useCallback(() => setOnboardingError(null), []);

  // ------------------------------------------------------------
  // إجراءات الجمعية (سحابي)
  // ------------------------------------------------------------
  const createOrg = React.useCallback(async (name: string, role: string) => {
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      const row = await repo.createOrganization(name, role);
      setOrgRow(row);
      setOrgStatus("ready");
    } catch (error) {
      setOnboardingError((error as Error).message);
      throw error;
    } finally {
      setOnboardingBusy(false);
    }
  }, []);

  const joinOrg = React.useCallback(async (code: string, role: string) => {
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      const row = await repo.joinOrganization(code, role);
      setOrgRow(row);
      setOrgStatus("ready");
    } catch (error) {
      setOnboardingError((error as Error).message);
      throw error;
    } finally {
      setOnboardingBusy(false);
    }
  }, []);

  const leaveOrg = React.useCallback(async () => {
    if (!user) return;
    await repo.leaveOrganization(user.id);
    setOrgRow(null);
    setOrgStatus("none");
    setMembers([]);
  }, [user]);

  // ------------------------------------------------------------
  // حفظ ملف الجمعية
  // ------------------------------------------------------------
  const setProfile = React.useCallback(
    async (next: OrgProfile) => {
      if (mode === "local") {
        setDemo((prev) => ({ ...prev, profile: next }));
        setSaveStatus("saved");
        return;
      }

      if (!orgRow?.id) return;
      setSaveStatus("saving");
      setSaveError(null);
      try {
        const updated = await repo.updateOrganization(orgRow.id, orgProfileToRowPatch(next));
        setOrgRow(updated);
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");
        setSaveError((error as Error).message);
        throw error;
      }
    },
    [mode, orgRow?.id],
  );

  const resetToDemo = React.useCallback(() => {
    setDemo((prev) => ({ ...DEFAULT_DEMO_STATE, authenticated: prev.authenticated, userName: prev.userName }));
    setUi(DEFAULT_UI_STATE);
  }, []);

  // ------------------------------------------------------------
  // حالة الاستكشاف (محلية دائمًا)
  // ------------------------------------------------------------
  const setScenario = React.useCallback(
    (updater: ScenarioInputs | ((prev: ScenarioInputs) => ScenarioInputs)) => {
      setUi((prev) => ({
        ...prev,
        scenario: typeof updater === "function" ? updater(prev.scenario) : updater,
      }));
    },
    [],
  );

  const applyRecommendedScenario = React.useCallback(() => {
    setUi((prev) => ({
      ...prev,
      scenario: recommendedScenario,
      analyzed: true,
      portfolioBuilt: true,
    }));
  }, [recommendedScenario]);

  const resetScenario = React.useCallback(() => {
    setUi((prev) => ({ ...prev, scenario: EMPTY_SCENARIO }));
  }, []);

  const setSavingsRate = React.useCallback((rate: number) => {
    setUi((prev) => ({ ...prev, savingsRate: rate }));
  }, []);

  const setReserveTargetMonths = React.useCallback((months: number) => {
    setUi((prev) => ({ ...prev, reserveTargetMonths: months }));
  }, []);

  const markAnalyzed = React.useCallback(() => {
    setUi((prev) => ({ ...prev, analyzed: true }));
  }, []);

  const markPortfolioBuilt = React.useCallback(() => {
    setUi((prev) => ({ ...prev, analyzed: true, portfolioBuilt: true }));
  }, []);

  const authenticated =
    mode === "cloud" ? authStatus === "signed-in" && orgStatus === "ready" : demo.authenticated;
  const userName = mode === "cloud" ? user?.displayName ?? "" : demo.userName;

  const value = React.useMemo<AppStoreValue>(
    () => ({
      mode,
      hydrated,

      authStatus,
      authenticated,
      user,
      userName,
      authError,
      authBusy,
      login,
      logout,
      signUpCloud,
      signInCloud,
      clearAuthError,

      orgStatus,
      orgId: orgRow?.id ?? null,
      joinCode: orgRow?.join_code ?? null,
      members,
      membersLoading,
      createOrg,
      joinOrg,
      leaveOrg,
      refreshMembers,
      onboardingError,
      onboardingBusy,
      clearOnboardingError,

      profile,
      metrics,
      score,
      portfolio,
      opportunities,
      plan,
      comparison,

      saveStatus,
      saveError,
      setProfile,
      resetToDemo,

      scenario: ui.scenario,
      scenarioActive: !isScenarioEmpty(ui.scenario),
      recommendedScenario,
      savingsRate: ui.savingsRate,
      reserveTargetMonths: ui.reserveTargetMonths,
      analyzed: ui.analyzed,
      portfolioBuilt: ui.portfolioBuilt,
      setScenario,
      applyRecommendedScenario,
      resetScenario,
      setSavingsRate,
      setReserveTargetMonths,
      markAnalyzed,
      markPortfolioBuilt,
    }),
    [
      mode,
      hydrated,
      authStatus,
      authenticated,
      user,
      userName,
      authError,
      authBusy,
      login,
      logout,
      signUpCloud,
      signInCloud,
      clearAuthError,
      orgStatus,
      orgRow,
      members,
      membersLoading,
      createOrg,
      joinOrg,
      leaveOrg,
      refreshMembers,
      onboardingError,
      onboardingBusy,
      clearOnboardingError,
      profile,
      metrics,
      score,
      portfolio,
      opportunities,
      plan,
      comparison,
      saveStatus,
      saveError,
      setProfile,
      resetToDemo,
      ui,
      recommendedScenario,
      setScenario,
      applyRecommendedScenario,
      resetScenario,
      setSavingsRate,
      setReserveTargetMonths,
      markAnalyzed,
      markPortfolioBuilt,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const ctx = React.useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore يجب أن يُستخدم داخل AppStoreProvider");
  return ctx;
}
