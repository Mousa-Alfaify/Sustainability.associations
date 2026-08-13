import type { FinancialMetrics, PlanQuarter } from "@/lib/types";
import type { PortfolioResult } from "@/lib/finance/portfolio-engine";
import { formatCurrency, formatPercent } from "@/lib/format";

/**
 * خطة الاستدامة التنفيذية (12 شهرًا) — تُبنى من محفظة الاستدامة المقترحة
 * فتتغيّر أهدافها ومهامها بتغيّر ملف الجمعية.
 */
export function buildPlan(
  metrics: FinancialMetrics,
  portfolio: PortfolioResult,
): PlanQuarter[] {
  const opex = metrics.monthlyOperatingCost;
  const sources = portfolio.sources;
  const quick = sources
    .filter((s) => s.timeToRevenueMonths <= 4)
    .sort((a, b) => a.timeToRevenueMonths - b.timeToRevenueMonths);
  const mid = sources.filter(
    (s) => s.timeToRevenueMonths > 4 && s.timeToRevenueMonths <= 7,
  );
  const long = sources.filter((s) => s.timeToRevenueMonths > 7);

  const coverageNow = metrics.coverageRatio;
  const coverageEnd = portfolio.coverageAfter;
  const step = (coverageEnd - coverageNow) / 4;
  const targetAt = (q: number) => coverageNow + step * q;

  const cumulative = (q: number) =>
    Math.round((portfolio.newMonthlyRevenue * q) / 4 / 500) * 500;

  const nameOf = (index: number, fallback: string) =>
    sources[index]?.name ?? fallback;

  return [
    {
      id: "q1",
      label: "الربع الأول",
      months: "الشهر 1 – 3",
      headline: "التأسيس ووقف النزيف التشغيلي",
      targetCoverage: targetAt(1),
      targetScore: 45,
      goals: [
        "اعتماد سياسة الاستدامة المالية وحساب التشغيل المستدام من مجلس الإدارة",
        `تنفيذ فرص تحسين الكفاءة السريعة لتوفير ${formatCurrency(portfolio.targetedSavings)} شهريًا`,
        `إطلاق العمل على أول مصدر دخل متكرر: ${nameOf(0, "عقود الخدمات")}`,
        "فصل الحسابات: حساب تشغيلي مستقل عن حسابات المشاريع",
      ],
      tasks: [
        { title: "تشكيل لجنة الاستدامة المالية برئاسة المدير التنفيذي", owner: "المدير التنفيذي" },
        { title: "اعتماد نسبة ادخار شهرية 10% من الإيرادات المتكررة", owner: "المدير المالي" },
        { title: "إعداد ملف القدرات التجاري وقائمة الأسعار", owner: "مسؤول الاستدامة" },
        { title: "مراجعة عقود الإيجار والتراخيص التقنية وإعادة التفاوض", owner: "المدير الإداري" },
      ],
      kpi: `تغطية التشغيل ${formatPercent(targetAt(1))} + خفض المصروف الشهري إلى ${formatCurrency(portfolio.projectedOperatingCost)}`,
    },
    {
      id: "q2",
      label: "الربع الثاني",
      months: "الشهر 4 – 6",
      headline: "أول عقد خدمات وأول منتج مدفوع",
      targetCoverage: targetAt(2),
      targetScore: 58,
      goals: [
        `توقيع أول عقد خدمات بقيمة لا تقل عن ${formatCurrency(Math.round(opex * 0.1))} شهريًا`,
        quick[1]
          ? `إطلاق ${quick[1].name} بنسخة تجريبية مسعّرة`
          : "إطلاق أول منتج مدفوع بنسخة تجريبية",
        "تحويل أكبر راعٍ موسمي إلى اتفاقية متعددة السنوات",
        `الوصول بالاحتياطي إلى ${formatCurrency(opex * 3)} (3 أشهر تشغيل)`,
      ],
      tasks: [
        { title: "استهداف 12 جهة وبناء خط أنابيب مبيعات موثّق", owner: "مسؤول الاستدامة" },
        { title: "تفعيل بوابة دفع إلكتروني للاشتراكات والبرامج", owner: "مسؤول التقنية" },
        { title: "إصدار أول تقرير أثر ربع سنوي للشركاء", owner: "مدير البرامج" },
        { title: "مراجعة الأسعار والتكلفة الكاملة لكل خدمة", owner: "المدير المالي" },
      ],
      kpi: `إيراد متكرر جديد تراكمي ${formatCurrency(cumulative(2))} شهريًا`,
    },
    {
      id: "q3",
      label: "الربع الثالث",
      months: "الشهر 7 – 9",
      headline: "تعميق المحفظة وتقليل الاعتماد على الموسمية",
      targetCoverage: targetAt(3),
      targetScore: 70,
      goals: [
        mid[0]
          ? `تشغيل ${mid[0].name} بشكل كامل`
          : "تشغيل المصدر الثالث من المحفظة بشكل كامل",
        "خفض نسبة الاعتماد على التبرعات الموسمية إلى أقل من 40%",
        "توقيع عقدي خدمات إضافيين بمدة 12 شهرًا",
        "أتمتة التحصيل الشهري وتقارير الالتزام للشركاء",
      ],
      tasks: [
        { title: "مراجعة نصف سنوية لمؤشر الاستقلال المالي أمام المجلس", owner: "المدير التنفيذي" },
        { title: "تدريب الفريق على البيع المؤسسي وإدارة العقود", owner: "مسؤول الاستدامة" },
        { title: "التوسع في الخدمات المشتركة مع جمعيتين", owner: "المدير الإداري" },
        { title: "تحديث نموذج التسعير بناءً على التكلفة الفعلية", owner: "المدير المالي" },
      ],
      kpi: `إيراد متكرر جديد تراكمي ${formatCurrency(cumulative(3))} شهريًا + مؤشر الاستقلال ≥ 70`,
    },
    {
      id: "q4",
      label: "الربع الرابع",
      months: "الشهر 10 – 12",
      headline: "إغلاق الفجوة ومأسسة الاستدامة",
      targetCoverage: targetAt(4),
      targetScore: 82,
      goals: [
        `الوصول إلى تغطية ${formatPercent(coverageEnd)} من المصروف التشغيلي بمصادر متكررة`,
        long[0]
          ? `تشغيل ${long[0].name} وتخصيص عوائده للتشغيل`
          : "تشغيل المصدر طويل المدى وتخصيص عوائده للتشغيل",
        `بلوغ احتياطي تشغيلي لا يقل عن ${formatCurrency(opex * 3)}`,
        "اعتماد خطة استدامة السنة الثانية بمستهدفات محدثة",
      ],
      tasks: [
        { title: "تدقيق مالي خارجي لمصادر الدخل الجديدة", owner: "المدير المالي" },
        { title: "توثيق نماذج العقود والإجراءات في دليل معتمد", owner: "المدير الإداري" },
        { title: "إطلاق تقرير الاستدامة السنوي للجمهور والشركاء", owner: "المدير التنفيذي" },
        { title: "إعادة معايرة أوزان مؤشر الاستقلال ومستهدفات السنة القادمة", owner: "مسؤول الاستدامة" },
      ],
      kpi: `الفجوة التشغيلية = ${formatCurrency(Math.max(0, portfolio.projectedGap))} أو أفضل`,
    },
  ];
}
