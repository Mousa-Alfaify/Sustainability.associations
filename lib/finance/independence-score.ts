import type {
  FinancialMetrics,
  IndependenceScore,
  ScoreBand,
  ScoreComponent,
} from "@/lib/types";
import {
  formatDecimal,
  formatMonths,
  formatPercent,
  formatSourcesCount,
} from "@/lib/format";

/**
 * أوزان مؤشر الاستقلال المالي — قابلة للتعديل من مكان واحد.
 * المجموع يجب أن يساوي 100.
 */
export const SCORE_WEIGHTS = {
  coverage: 30,
  diversity: 25,
  reserve: 25,
  seasonalIndependence: 20,
} as const;

/** المعايير المرجعية المستخدمة في التطبيع (Benchmarks) */
export const SCORE_TARGETS = {
  /** تغطية 100% من التشغيل بالإيرادات المتكررة = الدرجة الكاملة */
  coverageTarget: 1,
  /** 5 مصادر دخل فعّالة = الدرجة الكاملة */
  effectiveSourcesTarget: 5,
  /** احتياطي يغطي 6 أشهر = الدرجة الكاملة */
  reserveTargetMonths: 6,
  /** اعتماد موسمي ≤ 20% = الدرجة الكاملة، و≥ 70% = صفر */
  seasonalFloor: 0.2,
  seasonalCeiling: 0.7,
} as const;

export const SCORE_BANDS: ScoreBand[] = [
  {
    key: "risk",
    label: "خطر مالي مرتفع",
    min: 0,
    max: 30,
    tone: "danger",
    description:
      "الجمعية معرّضة لتوقف التشغيل خلال أشهر قليلة. الأولوية القصوى: بناء أول مصدر دخل متكرر واحتياطي طارئ.",
  },
  {
    key: "weak",
    label: "استقرار ضعيف",
    min: 31,
    max: 50,
    tone: "warning",
    description:
      "هناك بوادر دخل متكرر لكنها لا تغطي التشغيل. تحتاج الجمعية إلى تنويع سريع وخفض اعتمادها على الموسمية.",
  },
  {
    key: "medium",
    label: "استقرار متوسط",
    min: 51,
    max: 70,
    tone: "neutral",
    description:
      "الجمعية تغطي جزءًا معتبرًا من تشغيلها من مصادر متكررة، وتحتاج إلى تعميق الاحتياطي وتوسيع المحفظة.",
  },
  {
    key: "good",
    label: "استقرار جيد",
    min: 71,
    max: 85,
    tone: "success",
    description:
      "وضع مالي صحي: تغطية تشغيلية عالية واحتياطي مقبول. التركيز الآن على المأسسة والنمو طويل المدى.",
  },
  {
    key: "strong",
    label: "استدامة مالية قوية",
    min: 86,
    max: 100,
    tone: "strong",
    description:
      "الجمعية مستقلة ماليًا: تشغيلها مغطّى بمصادر متنوعة واحتياطي كافٍ، وقادرة على التخطيط طويل المدى.",
  },
];

export function bandForScore(score: number): ScoreBand {
  const clamped = clamp(score, 0, 100);
  return (
    SCORE_BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? SCORE_BANDS[0]
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * حساب مؤشر الاستقلال المالي (0 - 100).
 * كل مكوّن يُطبَّع إلى نسبة 0..1 ثم يُضرب في وزنه.
 */
export function computeIndependenceScore(
  metrics: FinancialMetrics,
  weights: typeof SCORE_WEIGHTS = SCORE_WEIGHTS,
): IndependenceScore {
  // 1) تغطية التشغيل من الإيرادات المتكررة
  const coverageRatio = clamp(
    metrics.coverageRatio / SCORE_TARGETS.coverageTarget,
    0,
    1,
  );

  // 2) تنوع مصادر الدخل — العدد الفعّال للمصادر مقابل الهدف
  const diversityRatio = clamp(
    metrics.effectiveSourcesCount / SCORE_TARGETS.effectiveSourcesTarget,
    0,
    1,
  );

  // 3) حجم الاحتياطي التشغيلي مقابل هدف 6 أشهر
  const reserveRatio = clamp(
    metrics.runwayMonths / SCORE_TARGETS.reserveTargetMonths,
    0,
    1,
  );

  // 4) انخفاض الاعتماد على التبرعات الموسمية
  const { seasonalFloor, seasonalCeiling } = SCORE_TARGETS;
  const seasonalRatio = clamp(
    (seasonalCeiling - metrics.seasonalDependency) /
      (seasonalCeiling - seasonalFloor),
    0,
    1,
  );

  const components: ScoreComponent[] = [
    {
      key: "coverage",
      label: "تغطية التشغيل من الإيرادات المتكررة",
      weight: weights.coverage,
      ratio: coverageRatio,
      points: coverageRatio * weights.coverage,
      detail: `الإيرادات المتكررة تغطي ${formatPercent(metrics.coverageRatio)} من المصروف التشغيلي (الهدف 100%).`,
    },
    {
      key: "diversity",
      label: "تنوع مصادر الدخل",
      weight: weights.diversity,
      ratio: diversityRatio,
      points: diversityRatio * weights.diversity,
      detail: `العدد الفعّال للمصادر ${formatDecimal(metrics.effectiveSourcesCount)} من أصل ${formatSourcesCount(metrics.activeSourcesCount)} نشطة (الهدف 5 مصادر متوازنة).`,
    },
    {
      key: "reserve",
      label: "حجم الاحتياطي التشغيلي",
      weight: weights.reserve,
      ratio: reserveRatio,
      points: reserveRatio * weights.reserve,
      detail: `الاحتياطي يغطي ${formatMonths(metrics.runwayMonths)} من التشغيل (الهدف 6 أشهر).`,
    },
    {
      key: "seasonalIndependence",
      label: "انخفاض الاعتماد على التبرعات الموسمية",
      weight: weights.seasonalIndependence,
      ratio: seasonalRatio,
      points: seasonalRatio * weights.seasonalIndependence,
      detail: `الاعتماد على الموسمية ${formatPercent(metrics.seasonalDependency)} (الدرجة الكاملة عند 20% أو أقل).`,
    },
  ];

  const total = clamp(
    components.reduce((sum, c) => sum + c.points, 0),
    0,
    100,
  );

  return {
    total: Math.round(total * 10) / 10,
    band: bandForScore(total),
    components,
  };
}

export const BAND_TONE_CLASS: Record<ScoreBand["tone"], string> = {
  danger: "text-destructive",
  warning: "text-warning",
  neutral: "text-primary",
  success: "text-success",
  strong: "text-success",
};

export const BAND_BG_CLASS: Record<ScoreBand["tone"], string> = {
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  neutral: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  strong: "bg-success/15 text-success border-success/30",
};

export const BAND_HEX: Record<ScoreBand["tone"], string> = {
  danger: "#b91c1c",
  warning: "#c2740f",
  neutral: "#0f5f56",
  success: "#1c7a53",
  strong: "#1c7a53",
};
