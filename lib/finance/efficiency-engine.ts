import type { EfficiencyOpportunity, OperatingExpenses, OrgProfile } from "@/lib/types";

/**
 * مُحرك فرص تحسين الكفاءة.
 * كل فرصة مرتبطة ببند مصروف، ونسبة التوفير محسوبة من قيمة البند الفعلية
 * مع سقف واقعي، لذلك تتغيّر النتائج بتغيّر ملف الجمعية.
 */

interface OpportunityRule {
  id: string;
  name: string;
  description: string;
  targetExpense: keyof OperatingExpenses;
  /** نسبة التوفير من بند المصروف */
  savingRate: number;
  /** الحد الأعلى للتوفير الشهري */
  cap: number;
  ease: EfficiencyOpportunity["ease"];
  impact: EfficiencyOpportunity["impact"];
  recommended: boolean;
}

export const EFFICIENCY_RULES: OpportunityRule[] = [
  {
    id: "shared-accountant",
    name: "محاسب مشترك مع جمعيتين",
    description:
      "التعاقد على خدمة محاسبة مشتركة بدوام جزئي بدل وظيفة متفرغة، مع الإبقاء على مراجع خارجي معتمد.",
    targetExpense: "admin",
    savingRate: 0.3,
    cap: 1_500,
    ease: "منخفضة",
    impact: "عالي",
    recommended: true,
  },
  {
    id: "shared-tech",
    name: "مشاركة الأنظمة التقنية",
    description:
      "الانضمام إلى ترخيص جماعي لنظام إدارة المستفيدين والموارد مع جمعيات في نفس المنطقة.",
    targetExpense: "technology",
    savingRate: 0.3,
    cap: 1_200,
    ease: "منخفضة",
    impact: "عالي",
    recommended: true,
  },
  {
    id: "renegotiate-rent",
    name: "إعادة التفاوض على الإيجار أو الانتقال لمساحة مشتركة",
    description:
      "تقليص المساحة غير المستخدمة أو الانتقال إلى مبنى خدمات مشتركة للجمعيات مع الإبقاء على قاعات التدريب.",
    targetExpense: "rent",
    savingRate: 0.19,
    cap: 1_500,
    ease: "متوسطة",
    impact: "عالي",
    recommended: true,
  },
  {
    id: "audit-subscriptions",
    name: "مراجعة الاشتراكات البرمجية غير المستخدمة",
    description:
      "حصر التراخيص المدفوعة وإلغاء غير المستخدم منها، والتحول إلى الباقات المخصصة للقطاع غير الربحي.",
    targetExpense: "technology",
    savingRate: 0.2,
    cap: 800,
    ease: "منخفضة",
    impact: "متوسط",
    recommended: true,
  },
  {
    id: "shared-hr",
    name: "مشاركة خدمات الموارد البشرية",
    description:
      "الاستعانة بمزوّد موارد بشرية مشترك لإدارة الرواتب والتأمينات وملفات الموظفين.",
    targetExpense: "admin",
    savingRate: 0.18,
    cap: 900,
    ease: "متوسطة",
    impact: "متوسط",
    recommended: false,
  },
  {
    id: "go-digital",
    name: "التحول الرقمي للأرشفة والطباعة",
    description:
      "إيقاف الأرشفة الورقية والطباعة الخارجية والتحول إلى التوقيع والأرشفة الإلكترونية.",
    targetExpense: "other",
    savingRate: 0.2,
    cap: 600,
    ease: "منخفضة",
    impact: "متوسط",
    recommended: false,
  },
  {
    id: "trim-nonessential",
    name: "تقليل المصروفات غير الأساسية",
    description:
      "ترشيد الضيافة والسفر والمناسبات الداخلية وربط الصرف بموازنة ربع سنوية معتمدة.",
    targetExpense: "other",
    savingRate: 0.17,
    cap: 500,
    ease: "منخفضة",
    impact: "منخفض",
    recommended: false,
  },
  {
    id: "marketing-inhouse",
    name: "استبدال وكالة التسويق بفريق داخلي ومتطوعين",
    description:
      "إنتاج المحتوى داخليًا بالاعتماد على المتطوعين المدربين وأدوات تصميم منخفضة التكلفة.",
    targetExpense: "marketing",
    savingRate: 0.35,
    cap: 2_000,
    ease: "متوسطة",
    impact: "متوسط",
    recommended: false,
  },
];

function priorityFor(
  saving: number,
  ease: EfficiencyOpportunity["ease"],
  impact: EfficiencyOpportunity["impact"],
): EfficiencyOpportunity["priority"] {
  if (saving >= 1_000 && ease === "منخفضة") return "عالية";
  if (saving >= 1_000 || (impact === "عالي" && saving > 0)) return "متوسطة";
  return "منخفضة";
}

export function buildEfficiencyOpportunities(
  profile: OrgProfile,
): EfficiencyOpportunity[] {
  return EFFICIENCY_RULES.map((rule) => {
    const base = profile.expenses[rule.targetExpense];
    const saving = Math.round(Math.min(base * rule.savingRate, rule.cap) / 50) * 50;
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      monthlySaving: saving,
      ease: rule.ease,
      impact: rule.impact,
      priority: priorityFor(saving, rule.ease, rule.impact),
      targetExpense: rule.targetExpense,
      recommended: rule.recommended && saving > 0,
    };
  })
    .filter((o) => o.monthlySaving > 0)
    .sort((a, b) => b.monthlySaving - a.monthlySaving);
}

/** إجمالي التوفير الممكن من جميع الفرص */
export function totalPotentialSavings(profile: OrgProfile): number {
  return buildEfficiencyOpportunities(profile).reduce(
    (sum, o) => sum + o.monthlySaving,
    0,
  );
}

/** التوفير المعتمد في الخطة المقترحة (الفرص الموصى بها فقط) */
export function recommendedMonthlySavings(profile: OrgProfile): number {
  return buildEfficiencyOpportunities(profile)
    .filter((o) => o.recommended)
    .reduce((sum, o) => sum + o.monthlySaving, 0);
}
