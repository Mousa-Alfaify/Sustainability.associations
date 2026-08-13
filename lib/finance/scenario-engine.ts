import type {
  FinancialMetrics,
  IndependenceScore,
  OperatingExpenses,
  OrgProfile,
  ScenarioInputs,
} from "@/lib/types";
import { analyzeOrg } from "@/lib/finance/calculations";
import { computeIndependenceScore } from "@/lib/finance/independence-score";

export const EMPTY_SCENARIO: ScenarioInputs = {
  addServiceContracts: 0,
  addEndowment: 0,
  addPaidPrograms: 0,
  addPartnerships: 0,
  expenseReduction: 0,
  reserveAddition: 0,
};

export function isScenarioEmpty(scenario: ScenarioInputs): boolean {
  return Object.values(scenario).every((value) => value === 0);
}

/**
 * توزيع خفض المصروفات على البنود القابلة للترشيد (كل شيء عدا الرواتب)
 * بشكل تناسبي، مع ضمان عدم نزول أي بند تحت الصفر.
 */
function reduceExpenses(
  expenses: OperatingExpenses,
  reduction: number,
): OperatingExpenses {
  const reducible: (keyof OperatingExpenses)[] = [
    "rent",
    "technology",
    "admin",
    "marketing",
    "other",
  ];
  const pool = reducible.reduce((sum, key) => sum + expenses[key], 0);
  const applied = Math.min(reduction, pool);
  if (applied <= 0 || pool <= 0) return { ...expenses };

  const next: OperatingExpenses = { ...expenses };
  for (const key of reducible) {
    next[key] = Math.max(0, expenses[key] - (applied * expenses[key]) / pool);
  }
  return next;
}

/** تطبيق مدخلات السيناريو على ملف الجمعية وإنتاج ملف جديد (بدون تعديل الأصل) */
export function applyScenario(
  profile: OrgProfile,
  scenario: ScenarioInputs,
): OrgProfile {
  return {
    ...profile,
    expenses: reduceExpenses(profile.expenses, scenario.expenseReduction),
    income: {
      ...profile.income,
      serviceContractsMonthly:
        profile.income.serviceContractsMonthly + scenario.addServiceContracts,
      endowmentMonthly: profile.income.endowmentMonthly + scenario.addEndowment,
      commercialMonthly: profile.income.commercialMonthly + scenario.addPaidPrograms,
      otherMonthly: profile.income.otherMonthly + scenario.addPartnerships,
    },
    reserve: profile.reserve + scenario.reserveAddition,
  };
}

export interface ScenarioComparison {
  baseProfile: OrgProfile;
  baseMetrics: FinancialMetrics;
  baseScore: IndependenceScore;
  nextProfile: OrgProfile;
  nextMetrics: FinancialMetrics;
  nextScore: IndependenceScore;
  delta: {
    score: number;
    gap: number;
    coverage: number;
    runwayMonths: number;
    seasonalDependency: number;
    recurringIncome: number;
    operatingCost: number;
    effectiveSources: number;
  };
  /** هل أصبحت الجمعية قادرة على تغطية تشغيلها بالكامل */
  reachedBreakEven: boolean;
}

export function compareScenario(
  profile: OrgProfile,
  scenario: ScenarioInputs,
): ScenarioComparison {
  const baseMetrics = analyzeOrg(profile);
  const baseScore = computeIndependenceScore(baseMetrics);

  const nextProfile = applyScenario(profile, scenario);
  const nextMetrics = analyzeOrg(nextProfile);
  const nextScore = computeIndependenceScore(nextMetrics);

  return {
    baseProfile: profile,
    baseMetrics,
    baseScore,
    nextProfile,
    nextMetrics,
    nextScore,
    delta: {
      score: nextScore.total - baseScore.total,
      gap: nextMetrics.operatingGap - baseMetrics.operatingGap,
      coverage: nextMetrics.coverageRatio - baseMetrics.coverageRatio,
      runwayMonths: nextMetrics.runwayMonths - baseMetrics.runwayMonths,
      seasonalDependency:
        nextMetrics.seasonalDependency - baseMetrics.seasonalDependency,
      recurringIncome:
        nextMetrics.monthlyRecurringIncome - baseMetrics.monthlyRecurringIncome,
      operatingCost:
        nextMetrics.monthlyOperatingCost - baseMetrics.monthlyOperatingCost,
      effectiveSources:
        nextMetrics.effectiveSourcesCount - baseMetrics.effectiveSourcesCount,
    },
    reachedBreakEven: nextMetrics.operatingGap >= 0,
  };
}

/** روافع السيناريو المعروضة في الواجهة */
export interface ScenarioLeverConfig {
  key: keyof ScenarioInputs;
  label: string;
  hint: string;
  max: number;
  step: number;
  unit: "شهريًا" | "مرة واحدة";
}

export function buildLeverConfigs(metrics: FinancialMetrics): ScenarioLeverConfig[] {
  const opex = metrics.monthlyOperatingCost || 60_000;
  const round = (v: number) => Math.max(5_000, Math.round(v / 5_000) * 5_000);
  return [
    {
      key: "addServiceContracts",
      label: "زيادة دخل عقود الخدمات",
      hint: "دخل شهري إضافي من التعاقد مع شركات وجهات حكومية",
      max: round(opex * 0.6),
      step: 500,
      unit: "شهريًا",
    },
    {
      key: "addEndowment",
      label: "إنشاء وقف أو استثمار اجتماعي",
      hint: "العائد الشهري المتوقع من الوقف بعد تشغيله",
      max: round(opex * 0.5),
      step: 500,
      unit: "شهريًا",
    },
    {
      key: "addPaidPrograms",
      label: "برامج وخدمات مدفوعة",
      hint: "تدريب واستشارات ومنتجات معرفية مسعّرة",
      max: round(opex * 0.5),
      step: 500,
      unit: "شهريًا",
    },
    {
      key: "addPartnerships",
      label: "إضافة شريك مؤسسي جديد",
      hint: "دفعات شهرية من شراكات مسؤولية اجتماعية طويلة المدى",
      max: round(opex * 0.5),
      step: 500,
      unit: "شهريًا",
    },
    {
      key: "expenseReduction",
      label: "تقليل المصاريف التشغيلية",
      hint: "توفير شهري من فرص تحسين الكفاءة",
      max: round(opex * 0.25),
      step: 250,
      unit: "شهريًا",
    },
    {
      key: "reserveAddition",
      label: "زيادة الاحتياطي التشغيلي",
      hint: "مبلغ يُضاف إلى الاحتياطي خلال ١٢ شهرًا",
      max: round(opex * 6),
      step: 5_000,
      unit: "مرة واحدة",
    },
  ];
}
