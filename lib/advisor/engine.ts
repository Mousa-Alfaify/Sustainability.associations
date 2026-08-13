import type {
  EfficiencyOpportunity,
  FinancialMetrics,
  IndependenceScore,
  OrgProfile,
  PlanQuarter,
} from "@/lib/types";
import type { PortfolioResult } from "@/lib/finance/portfolio-engine";
import {
  analyzeOrg,
  planReserve,
  removeIncomeStream,
} from "@/lib/finance/calculations";
import { computeIndependenceScore } from "@/lib/finance/independence-score";
import {
  formatCurrency,
  formatDecimal,
  formatMonths,
  formatMonthsCount,
  formatPercent,
} from "@/lib/format";

/**
 * "مستشار الاستدامة" — محرك إجابات قائم على قواعد يستخدم بيانات الجمعية الفعلية.
 * الواجهة مصممة ليُستبدل `answerQuestion` لاحقًا باستدعاء نموذج لغوي دون تغيير المكونات.
 */

export interface AdvisorContext {
  profile: OrgProfile;
  metrics: FinancialMetrics;
  score: IndependenceScore;
  portfolio: PortfolioResult;
  opportunities: EfficiencyOpportunity[];
  plan: PlanQuarter[];
}

export interface AdvisorMetricChip {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "success" | "neutral";
}

export interface AdvisorAnswer {
  headline: string;
  paragraphs: string[];
  bullets: string[];
  chips: AdvisorMetricChip[];
  followUps: string[];
}

export const SUGGESTED_QUESTIONS = [
  "كيف أرفع الاستقلال المالي؟",
  "ما أفضل مصدر دخل لجمعيتي؟",
  "كيف أقلل المصروفات؟",
  "ما أول خطوة يجب أن أبدأ بها؟",
  "ماذا يحدث لو فقدنا أكبر متبرع؟",
  "كيف أصل إلى احتياطي 6 أشهر؟",
  "ما حجم الفجوة التشغيلية ولماذا؟",
  "كيف أقلل الاعتماد على التبرعات الموسمية؟",
];

/** تطبيع النص العربي لتسهيل مطابقة الكلمات المفتاحية */
function normalize(text: string): string {
  return text
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي0-9a-zA-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Topic {
  id: string;
  keywords: string[];
  build: (ctx: AdvisorContext) => AdvisorAnswer;
}

const TOPICS: Topic[] = [
  {
    id: "independence",
    keywords: ["استقلال", "المؤشر", "مؤشر", "الدرجه", "ارفع", "رفع", "تحسين الوضع"],
    build: (ctx) => {
      const weakest = [...ctx.score.components].sort(
        (a, b) => a.ratio * a.weight - b.ratio * b.weight,
      );
      const gapPoints = weakest.map(
        (c) =>
          `${c.label}: محقق ${formatDecimal(c.points)} من ${c.weight} نقطة — ${c.detail}`,
      );
      return {
        headline: `مؤشرك الحالي ${formatDecimal(ctx.score.total)} من 100 (${ctx.score.band.label})`,
        paragraphs: [
          `أكبر خسارة في المؤشر تأتي من "${weakest[0].label}"، وهي تكلّفك ${formatDecimal(weakest[0].weight - weakest[0].points)} نقطة. معالجة هذا المكوّن وحده هي أسرع طريق لرفع الدرجة.`,
          `تطبيق محفظة الاستدامة المقترحة بالكامل يرفع تغطية التشغيل من ${formatPercent(ctx.metrics.coverageRatio)} إلى ${formatPercent(ctx.portfolio.coverageAfter)}، وهو ما ينعكس مباشرة على 30 نقطة من المؤشر.`,
        ],
        bullets: gapPoints,
        chips: [
          { label: "المؤشر الحالي", value: formatDecimal(ctx.score.total), tone: "warning" },
          { label: "التصنيف", value: ctx.score.band.label },
          {
            label: "أعلى فرصة نقاط",
            value: weakest[0].label,
            tone: "neutral",
          },
        ],
        followUps: ["ما أفضل مصدر دخل لجمعيتي؟", "كيف أصل إلى احتياطي 6 أشهر؟"],
      };
    },
  },
  {
    id: "best-source",
    keywords: ["مصدر", "مصادر", "دخل", "ايراد", "ايرادات", "محفظه", "افضل"],
    build: (ctx) => {
      const top = ctx.portfolio.sources[0];
      return {
        headline: `الأنسب لجمعيتك الآن: ${top.name}`,
        paragraphs: [
          `درجة الملاءمة ${top.fitScore}/100. السبب: ${top.fitReason}.`,
          `الدخل الشهري الإضافي المتوقع ${formatCurrency(top.expectedMonthlyRevenue)}، ويصل هذا الخط إلى ${formatCurrency(top.targetLineTotal)} شهريًا بعد التنفيذ، بزمن وصول للإيراد ${formatMonthsCount(top.timeToRevenueMonths)} وتكلفة تأسيس ${formatCurrency(top.setupCost)}.`,
          `لا تعتمد على مصدر واحد: المحفظة المقترحة توزّع ${formatCurrency(ctx.portfolio.newMonthlyRevenue)} على ${ctx.portfolio.sources.length} مصادر حتى لا يتجاوز أي مصدر 20% من مصروفك التشغيلي.`,
        ],
        bullets: ctx.portfolio.sources.map(
          (s) =>
            `${s.name} — ${formatCurrency(s.expectedMonthlyRevenue)} شهريًا · صعوبة ${s.difficulty} · ${formatMonthsCount(s.timeToRevenueMonths)} · أولوية ${s.priority}`,
        ),
        chips: [
          { label: "عدد المصادر", value: `${ctx.portfolio.sources.length}` },
          {
            label: "إيراد جديد",
            value: formatCurrency(ctx.portfolio.newMonthlyRevenue),
            tone: "success",
          },
          { label: "أعلى ملاءمة", value: `${top.fitScore}/100` },
        ],
        followUps: ["ما أول خطوة يجب أن أبدأ بها؟", "كيف أقلل المصروفات؟"],
      };
    },
  },
  {
    id: "expenses",
    keywords: ["مصروف", "مصروفات", "مصاريف", "تكاليف", "اقلل", "خفض", "توفير", "كفاءه"],
    build: (ctx) => {
      const recommended = ctx.opportunities.filter((o) => o.recommended);
      const totalAll = ctx.opportunities.reduce((s, o) => s + o.monthlySaving, 0);
      const biggest = ctx.metrics.expenseBreakdown[0];
      return {
        headline: `يمكنك توفير ${formatCurrency(ctx.portfolio.targetedSavings)} شهريًا دون المساس بالبرامج`,
        paragraphs: [
          `أكبر بند لديك هو ${biggest.label} بنسبة ${formatPercent(biggest.share)} من التشغيل (${formatCurrency(biggest.amount)} شهريًا). لا ننصح بخفض الرواتب لأن فقدان الكفاءات هو أعلى تكلفة على المدى الطويل.`,
          `إجمالي الفرص المتاحة ${formatCurrency(totalAll)} شهريًا، منها ${formatCurrency(ctx.portfolio.targetedSavings)} فرص موصى بها لسهولة تطبيقها وأثرها المباشر — أي ما يعادل ${formatPercent(ctx.portfolio.targetedSavings / ctx.metrics.monthlyOperatingCost)} من المصروف التشغيلي.`,
        ],
        bullets: recommended.map(
          (o) =>
            `${o.name} — توفير ${formatCurrency(o.monthlySaving)} شهريًا · سهولة ${o.ease} · أثر ${o.impact}`,
        ),
        chips: [
          {
            label: "توفير موصى به",
            value: formatCurrency(ctx.portfolio.targetedSavings),
            tone: "success",
          },
          { label: "إجمالي الفرص", value: formatCurrency(totalAll) },
          {
            label: "التشغيل بعد التوفير",
            value: formatCurrency(ctx.portfolio.projectedOperatingCost),
          },
        ],
        followUps: ["ما حجم الفجوة التشغيلية ولماذا؟", "ما أفضل مصدر دخل لجمعيتي؟"],
      };
    },
  },
  {
    id: "first-step",
    keywords: ["اول", "ابدا", "خطوه", "خطوات", "البدايه", "من اين"],
    build: (ctx) => {
      const q1 = ctx.plan[0];
      const fastest = [...ctx.portfolio.sources].sort(
        (a, b) => a.timeToRevenueMonths - b.timeToRevenueMonths,
      )[0];
      return {
        headline: "ابدأ بالربع الأول: كفاءة سريعة + أول مصدر متكرر",
        paragraphs: [
          `أول 90 يومًا لا تُبنى فيها المصادر الكبيرة، بل يُوقف فيها النزيف: تنفيذ فرص الكفاءة يوفّر ${formatCurrency(ctx.portfolio.targetedSavings)} شهريًا خلال أسابيع، وهو مبلغ لا يحتاج موافقات خارجية.`,
          `بالتوازي، ابدأ بـ"${fastest.name}" لأنها أسرع مصدر يصل للإيراد (${formatMonthsCount(fastest.timeToRevenueMonths)}) بتكلفة تأسيس ${formatCurrency(fastest.setupCost)}.`,
          `المستهدف بنهاية الربع الأول: ${q1.kpi}.`,
        ],
        bullets: q1.tasks.map((t) => `${t.title} — المسؤول: ${t.owner}`),
        chips: [
          { label: "المدة", value: "90 يومًا" },
          {
            label: "أثر فوري",
            value: formatCurrency(ctx.portfolio.targetedSavings),
            tone: "success",
          },
          { label: "أسرع مصدر", value: formatMonthsCount(fastest.timeToRevenueMonths) },
        ],
        followUps: ["كيف أرفع الاستقلال المالي؟", "كيف أقلل المصروفات؟"],
      };
    },
  },
  {
    id: "stress-test",
    keywords: ["فقدنا", "فقد", "متبرع", "لو", "توقف", "خسرنا", "ماذا يحدث", "اكبر"],
    build: (ctx) => {
      // اختبار ضغط: إسقاط أكبر مصدر دخل بالكامل
      const largest = [...ctx.metrics.streams]
        .filter((s) => s.monthly > 0)
        .sort((a, b) => b.annual - a.annual)[0];

      const stressed = analyzeOrg(
        removeIncomeStream(ctx.profile, largest.key),
      );
      const share = largest.annual / (ctx.metrics.totalAnnualIncome || 1);

      // بعد تنفيذ المحفظة: هل يصمد التشغيل لو تكررت الصدمة؟
      const survivesAfterPlan =
        ctx.portfolio.projectedRecurringIncome -
          (largest.recurring ? largest.monthly : 0) >=
        ctx.portfolio.projectedOperatingCost;

      const impactParagraph = largest.recurring
        ? `هذا مصدر متكرر، أي أنه يدخل مباشرة في تغطية التشغيل: فقدانه يوسّع الفجوة من ${formatCurrency(Math.abs(ctx.metrics.operatingGap))} إلى ${formatCurrency(Math.abs(stressed.operatingGap))} شهريًا، وتنخفض التغطية إلى ${formatPercent(stressed.coverageRatio)}.`
        : `لأن هذا المصدر غير متكرر فهو لا يدخل أصلًا في تغطية التشغيل — تبقى الفجوة ${formatCurrency(Math.abs(ctx.metrics.operatingGap))} شهريًا كما هي — لكن فقدانه يوقف تمويل البرامج ويحوّل الاحتياطي البالغ ${formatCurrency(ctx.metrics.reserve)} إلى خط الدفاع الأخير، وهو يصمد ${formatMonths(ctx.metrics.runwayMonths)} فقط.`;

      return {
        headline: `اختبار ضغط: فقدان أكبر مصدر دخل (${largest.label})`,
        paragraphs: [
          `${largest.label} يمثّل ${formatPercent(share)} من إجمالي دخلك: ${formatCurrency(largest.annual)} سنويًا، أي ${formatCurrency(largest.monthly)} شهريًا كمعدل.`,
          impactParagraph,
          `الحماية الحقيقية ليست جمع تبرعات أكثر، بل رفع قاعدة الإيراد المتكرر: بعد تنفيذ المحفظة يصبح دخلك المتكرر ${formatCurrency(ctx.portfolio.projectedRecurringIncome)} شهريًا موزعًا على ${ctx.portfolio.sources.length + 2} مصادر، ${survivesAfterPlan ? "فيبقى التشغيل مغطى حتى لو تكررت الصدمة نفسها" : "فتصبح الصدمة قابلة للامتصاص بدلًا من أن تكون مهدِّدة للرواتب"}.`,
          `ملاحظة منهجية: مؤشر الاستقلال المالي قد يرتفع شكليًا عند توقف التبرعات الموسمية (${formatDecimal(ctx.score.total)} ← ${formatDecimal(computeIndependenceScore(stressed).total)}) لأنه يقيس هيكل الاعتماد لا حجم التمويل. لذلك لا يُقرأ المؤشر منفردًا، بل مع حجم الدخل وفترة الأمان المالي.`,
        ],
        bullets: [
          `الدخل السنوي المفقود: ${formatCurrency(largest.annual)}`,
          `الدخل السنوي المتبقي: ${formatCurrency(ctx.metrics.totalAnnualIncome - largest.annual)}`,
          `الفجوة التشغيلية بعد الصدمة: ${formatCurrency(Math.abs(stressed.operatingGap))} شهريًا`,
          `فترة الأمان المالي: ${formatMonths(ctx.metrics.runwayMonths)} — الهدف 6 أشهر`,
          `الإجراء الوقائي الأول: تحويل أكبر داعم موسمي إلى عقد شراكة متعدد السنوات بدفعات شهرية`,
        ],
        chips: [
          {
            label: "الدخل المفقود سنويًا",
            value: formatCurrency(largest.annual),
            tone: "danger",
          },
          { label: "نسبته من الدخل", value: formatPercent(share), tone: "danger" },
          {
            label: "فترة الأمان",
            value: formatMonths(ctx.metrics.runwayMonths),
            tone: ctx.metrics.runwayMonths < 3 ? "danger" : "warning",
          },
        ],
        followUps: ["كيف أصل إلى احتياطي 6 أشهر؟", "كيف أرفع الاستقلال المالي؟"],
      };
    },
  },
  {
    id: "reserve",
    keywords: ["احتياطي", "اشهر", "6", "ثلاثه", "سته", "امان", "ادخار", "حساب التشغيل"],
    build: (ctx) => {
      const p10 = planReserve(ctx.metrics, 0.1, 6);
      const p20 = planReserve(ctx.metrics, 0.2, 6);
      const afterPlan = planReserve(
        {
          ...ctx.metrics,
          monthlyRecurringIncome: ctx.portfolio.projectedRecurringIncome,
          monthlyOperatingCost: ctx.portfolio.projectedOperatingCost,
        },
        0.1,
        6,
      );
      const fmt = (m: number) =>
        Number.isFinite(m) ? `${m} شهرًا` : "غير ممكن بالمعطيات الحالية";
      return {
        headline: `احتياطي 6 أشهر يعني ${formatCurrency(ctx.metrics.monthlyOperatingCost * 6)}`,
        paragraphs: [
          `احتياطيك الحالي ${formatCurrency(ctx.metrics.reserve)} يغطي ${formatMonths(ctx.metrics.runwayMonths)}. الفارق حتى هدف الستة أشهر هو ${formatCurrency(Math.max(0, ctx.metrics.monthlyOperatingCost * 6 - ctx.metrics.reserve))}.`,
          `بادخار 10% من إيرادك المتكرر الحالي (${formatCurrency(p10.monthlyContribution)} شهريًا) تحتاج ${fmt(p10.monthsToTarget)}. برفع النسبة إلى 20% (${formatCurrency(p20.monthlyContribution)} شهريًا) تحتاج ${fmt(p20.monthsToTarget)}.`,
          `المشكلة ليست نسبة الادخار بل قاعدة الإيراد المتكرر: بعد تنفيذ المحفظة تصبح 10% تعادل ${formatCurrency(afterPlan.monthlyContribution)} شهريًا، فتصل إلى الهدف خلال ${fmt(afterPlan.monthsToTarget)}.`,
        ],
        bullets: [
          `هدف 3 أشهر = ${formatCurrency(ctx.metrics.monthlyOperatingCost * 3)}`,
          `هدف 6 أشهر = ${formatCurrency(ctx.metrics.monthlyOperatingCost * 6)}`,
          "افتح حسابًا بنكيًا منفصلًا للاحتياطي واربط التحويل تلقائيًا في أول كل شهر",
          "اعتمد سياسة سحب من الاحتياطي بموافقة مجلس الإدارة فقط",
        ],
        chips: [
          { label: "الاحتياطي الحالي", value: formatCurrency(ctx.metrics.reserve) },
          { label: "يغطي", value: formatMonths(ctx.metrics.runwayMonths), tone: "danger" },
          { label: "هدف 6 أشهر", value: formatCurrency(ctx.metrics.monthlyOperatingCost * 6) },
        ],
        followUps: ["ماذا يحدث لو فقدنا أكبر متبرع؟", "كيف أقلل المصروفات؟"],
      };
    },
  },
  {
    id: "gap",
    keywords: ["فجوه", "عجز", "تغطيه", "تشغيل", "لماذا"],
    build: (ctx) => ({
      headline: `فجوتك التشغيلية ${formatCurrency(Math.abs(ctx.metrics.operatingGap))} شهريًا`,
      paragraphs: [
        `مصروفك التشغيلي ${formatCurrency(ctx.metrics.monthlyOperatingCost)} شهريًا، بينما إيرادك المتكرر ${formatCurrency(ctx.metrics.monthlyRecurringIncome)} فقط — أي تغطية ${formatPercent(ctx.metrics.coverageRatio)}.`,
        `الفارق يُغطى اليوم من التبرعات الموسمية والمنح، وهي مصادر لا يمكن التخطيط عليها: المنح مقيدة بالمشاريع (${formatCurrency(ctx.metrics.monthlyRestrictedIncome)} شهريًا كمعدل) ولا تغطي الرواتب والإيجار غالبًا.`,
        `إغلاق الفجوة يتم بمعادلة من طرفين: ${formatCurrency(ctx.portfolio.newMonthlyRevenue)} إيراد متكرر جديد + ${formatCurrency(ctx.portfolio.targetedSavings)} توفير من الكفاءة = تغطية ${formatPercent(ctx.portfolio.coverageAfter)}.`,
      ],
      bullets: ctx.metrics.expenseBreakdown.map(
        (e) => `${e.label}: ${formatCurrency(e.amount)} (${formatPercent(e.share)})`,
      ),
      chips: [
        {
          label: "الفجوة",
          value: formatCurrency(Math.abs(ctx.metrics.operatingGap)),
          tone: "danger",
        },
        { label: "التغطية", value: formatPercent(ctx.metrics.coverageRatio), tone: "warning" },
        {
          label: "بعد الخطة",
          value: formatPercent(ctx.portfolio.coverageAfter),
          tone: "success",
        },
      ],
      followUps: ["ما أفضل مصدر دخل لجمعيتي؟", "كيف أقلل المصروفات؟"],
    }),
  },
  {
    id: "seasonal",
    keywords: ["موسمي", "موسميه", "تبرعات", "رمضان", "حملات"],
    build: (ctx) => ({
      headline: `اعتمادك على التبرعات الموسمية ${formatPercent(ctx.metrics.seasonalDependency)}`,
      paragraphs: [
        `التبرعات الموسمية ليست مشكلة بذاتها — المشكلة أن تكون هي مصدر تغطية الرواتب. حاليًا تمثل ${formatCurrency(ctx.metrics.monthlySeasonalIncome)} شهريًا كمعدل من إجمالي دخل ${formatCurrency(ctx.metrics.totalMonthlyIncome)}.`,
        `الطريق العملي هو التحويل لا الإلغاء: حوّل المتبرع الموسمي إلى مشترك شهري، والراعي الموسمي إلى شريك بعقد متعدد السنوات. هذا يبقي المبلغ ويغيّر انتظامه.`,
        `تنفيذ المحفظة يرفع قاعدة الدخل المتكرر إلى ${formatCurrency(ctx.portfolio.projectedRecurringIncome)} شهريًا، فتنخفض نسبة الموسمية تلقائيًا دون خفض قيمتها المطلقة.`,
      ],
      bullets: [
        "أطلق برنامج التبرع الشهري التلقائي واستهدف تحويل 15% من قاعدة المتبرعين",
        "حوّل أكبر ثلاثة رعاة موسميين إلى اتفاقيات 24 شهرًا بدفعات شهرية",
        "اربط كل شراكة بتقرير أثر ربع سنوي لرفع نسبة التجديد",
        "خصّص جزءًا من حملة رمضان لتأسيس الوقف بدل الصرف التشغيلي المباشر",
      ],
      chips: [
        {
          label: "الاعتماد الحالي",
          value: formatPercent(ctx.metrics.seasonalDependency),
          tone: "warning",
        },
        { label: "الهدف", value: "أقل من 40%", tone: "success" },
        {
          label: "مصادر فعّالة",
          value: formatDecimal(ctx.metrics.effectiveSourcesCount),
        },
      ],
      followUps: ["ما أفضل مصدر دخل لجمعيتي؟", "كيف أرفع الاستقلال المالي؟"],
    }),
  },
];

function fallbackAnswer(ctx: AdvisorContext): AdvisorAnswer {
  return {
    headline: `ملخص وضع ${ctx.profile.name}`,
    paragraphs: [
      `مصروفك التشغيلي ${formatCurrency(ctx.metrics.monthlyOperatingCost)} شهريًا مقابل إيراد متكرر ${formatCurrency(ctx.metrics.monthlyRecurringIncome)}، أي فجوة ${formatCurrency(Math.abs(ctx.metrics.operatingGap))} ومؤشر استقلال ${formatDecimal(ctx.score.total)} من 100.`,
      `يمكنك سؤالي عن مصادر الدخل المناسبة، خفض المصروفات، بناء الاحتياطي، أو أثر فقدان أكبر متبرع — وسأجيب من واقع أرقام جمعيتك.`,
    ],
    bullets: SUGGESTED_QUESTIONS.slice(0, 5),
    chips: [
      {
        label: "الفجوة",
        value: formatCurrency(Math.abs(ctx.metrics.operatingGap)),
        tone: ctx.metrics.operatingGap < 0 ? "danger" : "success",
      },
      { label: "المؤشر", value: formatDecimal(ctx.score.total) },
      { label: "أشهر الأمان", value: formatMonths(ctx.metrics.runwayMonths) },
    ],
    followUps: SUGGESTED_QUESTIONS.slice(0, 3),
  };
}

/**
 * نقطة الدخول الوحيدة للمستشار.
 * لاحقًا: استبدال المطابقة بقاعدة معرفة + استدعاء نموذج لغوي مع نفس الـ context.
 */
export function answerQuestion(
  question: string,
  ctx: AdvisorContext,
): AdvisorAnswer {
  const normalized = normalize(question);
  if (!normalized) return fallbackAnswer(ctx);

  let best: { topic: Topic; hits: number } | null = null;
  for (const topic of TOPICS) {
    const hits = topic.keywords.filter((k) => normalized.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { topic, hits };
  }

  return best ? best.topic.build(ctx) : fallbackAnswer(ctx);
}
