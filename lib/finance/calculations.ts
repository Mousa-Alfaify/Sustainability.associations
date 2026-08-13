import type {
  FinancialMetrics,
  IncomeStream,
  OperatingExpenses,
  OrgProfile,
} from "@/lib/types";

export const EXPENSE_LABELS: Record<keyof OperatingExpenses, string> = {
  salaries: "الرواتب والأجور",
  rent: "الإيجارات",
  technology: "التقنية والأنظمة",
  admin: "الخدمات الإدارية",
  marketing: "التسويق",
  other: "مصاريف تشغيلية أخرى",
};

/** المصروف التشغيلي الشهري = مجموع بنود التشغيل */
export function monthlyOperatingCost(expenses: OperatingExpenses): number {
  return (
    expenses.salaries +
    expenses.rent +
    expenses.technology +
    expenses.admin +
    expenses.marketing +
    expenses.other
  );
}

/**
 * تطبيع كل مصادر الدخل إلى تدفقات شهرية موحّدة،
 * مع تصنيف كل مصدر: متكرر / موسمي / مقيّد بالمشاريع.
 */
export function buildIncomeStreams(profile: OrgProfile): IncomeStream[] {
  const i = profile.income;
  const raw: Omit<IncomeStream, "annual">[] = [
    {
      key: "seasonalDonations",
      label: "تبرعات موسمية",
      monthly: i.seasonalDonationsAnnual / 12,
      recurring: false,
      seasonal: true,
      restricted: false,
    },
    {
      key: "recurringDonations",
      label: "تبرعات متكررة",
      monthly: i.recurringDonationsAnnual / 12,
      recurring: true,
      seasonal: false,
      restricted: false,
    },
    {
      key: "grants",
      label: "منح مشاريع",
      monthly: i.grantsAnnual / 12,
      recurring: false,
      seasonal: false,
      restricted: true,
    },
    {
      key: "serviceContracts",
      label: "عقود خدمات",
      monthly: i.serviceContractsMonthly,
      recurring: true,
      seasonal: false,
      restricted: false,
    },
    {
      key: "endowment",
      label: "عوائد أوقاف واستثمار",
      monthly: i.endowmentMonthly,
      recurring: true,
      seasonal: false,
      restricted: false,
    },
    {
      key: "commercial",
      label: "إيرادات تجارية",
      monthly: i.commercialMonthly,
      recurring: true,
      seasonal: false,
      restricted: false,
    },
    {
      key: "subscriptions",
      label: "اشتراكات عضوية",
      monthly: i.subscriptionsMonthly,
      recurring: true,
      seasonal: false,
      restricted: false,
    },
    {
      key: "other",
      label: "مصادر دخل أخرى",
      monthly: i.otherMonthly,
      recurring: true,
      seasonal: false,
      restricted: false,
    },
  ];

  return raw.map((s) => ({ ...s, annual: s.monthly * 12 }));
}

/** مؤشر هيرفندال للتركّز — يُستخدم لقياس تنوع مصادر الدخل */
export function herfindahlIndex(amounts: number[]): number {
  const total = amounts.reduce((a, b) => a + b, 0);
  if (total <= 0) return 1;
  return amounts.reduce((acc, amount) => {
    const share = amount / total;
    return acc + share * share;
  }, 0);
}

/**
 * التحليل المالي الكامل للجمعية.
 * كل الأرقام مشتقة من ملف الجمعية — لا توجد قيم مخزّنة مسبقًا.
 */
export function analyzeOrg(profile: OrgProfile): FinancialMetrics {
  const cost = monthlyOperatingCost(profile.expenses);

  const expenseKeys = Object.keys(profile.expenses) as (keyof OperatingExpenses)[];
  const expenseBreakdown = expenseKeys
    .map((key) => ({
      key,
      label: EXPENSE_LABELS[key],
      amount: profile.expenses[key],
      share: cost > 0 ? profile.expenses[key] / cost : 0,
    }))
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const streams = buildIncomeStreams(profile);
  const activeStreams = streams.filter((s) => s.monthly > 0);

  const monthlyRecurringIncome = streams
    .filter((s) => s.recurring)
    .reduce((sum, s) => sum + s.monthly, 0);

  const monthlySeasonalIncome = streams
    .filter((s) => s.seasonal)
    .reduce((sum, s) => sum + s.monthly, 0);

  const monthlyRestrictedIncome = streams
    .filter((s) => s.restricted)
    .reduce((sum, s) => sum + s.monthly, 0);

  const totalMonthlyIncome = streams.reduce((sum, s) => sum + s.monthly, 0);
  const totalAnnualIncome = totalMonthlyIncome * 12;

  // الفجوة التشغيلية: سالبة = عجز، موجبة = فائض
  const operatingGap = monthlyRecurringIncome - cost;
  const coverageRatio = cost > 0 ? monthlyRecurringIncome / cost : 0;
  const runwayMonths = cost > 0 ? profile.reserve / cost : 0;

  const seasonalDependency =
    totalMonthlyIncome > 0 ? monthlySeasonalIncome / totalMonthlyIncome : 0;

  const hhi = herfindahlIndex(activeStreams.map((s) => s.monthly));
  const effectiveSourcesCount = hhi > 0 ? 1 / hhi : 0;

  return {
    monthlyOperatingCost: cost,
    expenseBreakdown,
    monthlyRecurringIncome,
    monthlySeasonalIncome,
    monthlyRestrictedIncome,
    totalMonthlyIncome,
    totalAnnualIncome,
    operatingGap,
    coverageRatio,
    reserve: profile.reserve,
    runwayMonths,
    seasonalDependency,
    activeSourcesCount: activeStreams.length,
    effectiveSourcesCount,
    streams,
  };
}

/** ربط مفتاح التدفق بحقل الدخل المقابل في ملف الجمعية */
const STREAM_TO_INCOME_FIELD: Record<string, keyof OrgProfile["income"]> = {
  seasonalDonations: "seasonalDonationsAnnual",
  recurringDonations: "recurringDonationsAnnual",
  grants: "grantsAnnual",
  serviceContracts: "serviceContractsMonthly",
  endowment: "endowmentMonthly",
  commercial: "commercialMonthly",
  subscriptions: "subscriptionsMonthly",
  other: "otherMonthly",
};

/** اختبار الضغط: إسقاط مصدر دخل بالكامل وإرجاع ملف جديد */
export function removeIncomeStream(
  profile: OrgProfile,
  streamKey: string,
): OrgProfile {
  const field = STREAM_TO_INCOME_FIELD[streamKey];
  if (!field) return profile;
  return { ...profile, income: { ...profile.income, [field]: 0 } };
}

/**
 * نسبة التقدم نحو الاستدامة (0..1).
 * الهدف النهائي مركّب: تغطية 100% من التشغيل بإيراد متكرر (وزن 60%)
 * + احتياطي تشغيلي يغطي 6 أشهر (وزن 40%).
 */
export const SUSTAINABILITY_TARGET_RESERVE_MONTHS = 6;

export function sustainabilityProgress(metrics: FinancialMetrics): number {
  const coverage = Math.min(1, Math.max(0, metrics.coverageRatio));
  const reserve = Math.min(
    1,
    Math.max(0, metrics.runwayMonths / SUSTAINABILITY_TARGET_RESERVE_MONTHS),
  );
  return coverage * 0.6 + reserve * 0.4;
}

/** حساب التشغيل المستدام: كم يلزم من الوقت للوصول إلى احتياطي بعدد أشهر مستهدف */
export interface ReservePlan {
  savingsRate: number;
  monthlyContribution: number;
  targetMonths: number;
  targetAmount: number;
  monthsToTarget: number;
  alreadyReached: boolean;
  projection: { month: number; balance: number; monthsCovered: number }[];
}

export function planReserve(
  metrics: FinancialMetrics,
  savingsRate: number,
  targetMonths: number,
  horizon = 36,
): ReservePlan {
  const monthlyContribution = metrics.monthlyRecurringIncome * savingsRate;
  const targetAmount = metrics.monthlyOperatingCost * targetMonths;
  const remaining = targetAmount - metrics.reserve;

  const monthsToTarget =
    remaining <= 0
      ? 0
      : monthlyContribution > 0
        ? Math.ceil(remaining / monthlyContribution)
        : Infinity;

  const projection = Array.from({ length: horizon + 1 }, (_, month) => {
    const balance = metrics.reserve + monthlyContribution * month;
    return {
      month,
      balance,
      monthsCovered:
        metrics.monthlyOperatingCost > 0
          ? balance / metrics.monthlyOperatingCost
          : 0,
    };
  });

  return {
    savingsRate,
    monthlyContribution,
    targetMonths,
    targetAmount,
    monthsToTarget,
    alreadyReached: remaining <= 0,
    projection,
  };
}
