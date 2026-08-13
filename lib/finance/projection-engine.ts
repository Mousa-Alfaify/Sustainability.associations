import type { FinancialMetrics } from "@/lib/types";
import type { PortfolioResult } from "@/lib/finance/portfolio-engine";

/**
 * إسقاط 12 شهرًا لمسار الاستدامة.
 * كل مصدر دخل يبدأ بعد مدة وصوله للإيراد ثم يتصاعد خلال 3 أشهر حتى قيمته الكاملة،
 * والتوفير التشغيلي يتحقق تدريجيًا خلال أول 3 أشهر.
 */
export interface ProjectionPoint {
  month: number;
  label: string;
  /** الإيراد المتكرر بدون تنفيذ الخطة */
  baselineRecurring: number;
  /** الإيراد المتكرر مع تنفيذ الخطة */
  planRecurring: number;
  /** المصروف التشغيلي مع تنفيذ الخطة */
  planOperatingCost: number;
  /** المصروف التشغيلي الحالي (خط ثابت للمقارنة) */
  baselineOperatingCost: number;
  /** الفجوة التشغيلية المتوقعة مع الخطة */
  planGap: number;
}

const RAMP_MONTHS = 3;

function rampFactor(month: number, startMonth: number): number {
  if (month < startMonth) return 0;
  const progressed = month - startMonth;
  if (progressed >= RAMP_MONTHS) return 1;
  return (progressed + 1) / (RAMP_MONTHS + 1);
}

export function buildProjection(
  metrics: FinancialMetrics,
  portfolio: PortfolioResult,
  months = 12,
): ProjectionPoint[] {
  return Array.from({ length: months + 1 }, (_, month) => {
    const added = portfolio.sources.reduce(
      (sum, source) =>
        sum +
        source.expectedMonthlyRevenue *
          rampFactor(month, source.timeToRevenueMonths),
      0,
    );

    const savingsFactor = Math.min(1, month / RAMP_MONTHS);
    const planOperatingCost =
      metrics.monthlyOperatingCost - portfolio.targetedSavings * savingsFactor;
    const planRecurring = metrics.monthlyRecurringIncome + added;

    return {
      month,
      label: month === 0 ? "الآن" : `ش ${month}`,
      baselineRecurring: metrics.monthlyRecurringIncome,
      planRecurring,
      planOperatingCost,
      baselineOperatingCost: metrics.monthlyOperatingCost,
      planGap: planRecurring - planOperatingCost,
    };
  });
}

/** الشهر الذي تُغلق فيه الفجوة التشغيلية (أو null إذا لم تُغلق خلال المدة) */
export function breakEvenMonth(points: ProjectionPoint[]): number | null {
  const found = points.find((p) => p.planGap >= 0);
  return found ? found.month : null;
}
