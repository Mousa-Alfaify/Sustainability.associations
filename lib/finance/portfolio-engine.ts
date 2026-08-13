import type {
  FinancialMetrics,
  OrgProfile,
  Priority,
  RevenueSource,
  ScenarioInputs,
} from "@/lib/types";
import { recommendedMonthlySavings } from "@/lib/finance/efficiency-engine";

/**
 * مُحرك محفظة الاستدامة
 * ------------------------------------------------------------
 * 1) يقيّم كل مصدر دخل محتمل بدرجة ملاءمة (fitScore) بناءً على ملف الجمعية.
 * 2) يحدد عدد المصادر المطلوبة (3 إلى 5) وفق قاعدة التنويع:
 *    لا يتجاوز أي مصدر جديد 20% من المصروف التشغيلي الشهري.
 * 3) يوزّع الفجوة التمويلية على المصادر المختارة حسب سعتها النسبية.
 */

/** مفاتيح روافع السيناريو التي يرتبط بها كل مصدر دخل */
export type ScenarioLever =
  | "addServiceContracts"
  | "addEndowment"
  | "addPaidPrograms"
  | "addPartnerships";

interface CandidateSource {
  id: string;
  name: string;
  category: string;
  description: string;
  /** السعة النسبية للمصدر عند توزيع الفجوة */
  capacityWeight: number;
  difficulty: RevenueSource["difficulty"];
  timeToRevenueMonths: number;
  risk: RevenueSource["risk"];
  setupCost: number;
  steps: string[];
  lever: ScenarioLever;
  /** الخط الحالي في ملف الجمعية (لحساب الإجمالي المستهدف) */
  currentLine: (p: OrgProfile) => number;
  /** درجة الملاءمة + سبب الترشيح */
  evaluate: (p: OrgProfile, m: FinancialMetrics) => { score: number; reason: string };
}

const has = (list: string[], ...keywords: string[]) =>
  list.some((item) => keywords.some((k) => item.includes(k)));

export const SOURCE_CATALOG: CandidateSource[] = [
  {
    id: "service-contracts",
    name: "عقود خدمات مع الشركات والجهات الحكومية",
    category: "عقود وخدمات",
    description:
      "تحويل قدرات الجمعية التنفيذية إلى عقود سنوية لتنفيذ برامج نيابةً عن شركات وجهات حكومية، بدلًا من انتظار المنح.",
    capacityWeight: 1,
    difficulty: "متوسطة",
    timeToRevenueMonths: 3,
    risk: "منخفض",
    setupCost: 15_000,
    steps: [
      "حصر القدرات التنفيذية القابلة للتعاقد وتسعيرها بتكلفة كاملة تشمل النفقات غير المباشرة",
      "إعداد ملف تعريفي تجاري (Capability Statement) وعروض أسعار جاهزة",
      "التسجيل في منصات التعاقد الحكومية وقوائم موردي الشركات",
      "استهداف 12 جهة وبناء خط أنابيب مبيعات ربع سنوي",
      "توقيع أول عقدين بمدة 12 شهرًا مع دفعات شهرية",
    ],
    lever: "addServiceContracts",
    currentLine: (p) => p.income.serviceContractsMonthly,
    evaluate: (p, m) => {
      let score = 70;
      const reasons: string[] = [];
      if (p.income.serviceContractsMonthly > 0) {
        score += 15;
        reasons.push("لدى الجمعية عقود خدمات قائمة يمكن توسيعها بدل البناء من الصفر");
      }
      if (p.expertise.length >= 3) {
        score += 8;
        reasons.push("خبرات تشغيلية متعددة قابلة للتحويل إلى نطاق عمل تعاقدي");
      }
      if (p.employees >= 10) {
        score += 5;
        reasons.push("حجم الفريق يسمح بتنفيذ التزامات تعاقدية دون إرباك البرامج");
      }
      if (m.coverageRatio < 0.5) {
        reasons.push("أسرع مصدر متكرر يمكن أن يغطي جزءًا كبيرًا من الفجوة خلال سنة");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "digital-waqf",
    name: "وقف رقمي واستثمار اجتماعي",
    category: "أوقاف واستثمار",
    description:
      "إطلاق وقف استثماري رقمي تُوجَّه عوائده حصريًا لتغطية المصاريف التشغيلية، مع صفحة تبرع وقفي ولوحة شفافية للعوائد.",
    capacityWeight: 1,
    difficulty: "مرتفعة",
    timeToRevenueMonths: 9,
    risk: "منخفض",
    setupCost: 40_000,
    steps: [
      "استصدار موافقة مجلس الإدارة ولائحة الوقف وربطها بالمركز الوطني لتنمية القطاع غير الربحي",
      "تحديد الأصل الوقفي (نقدي/عقاري) وسياسة استثمارية متحفظة",
      "بناء صفحة الوقف الرقمي وربطها بوسائل الدفع",
      "استقطاب 20 واقفًا مؤسِّسًا برعاية مجلس الإدارة",
      "تخصيص العوائد للتشغيل عبر قرار مجلس موثّق",
    ],
    lever: "addEndowment",
    currentLine: (p) => p.income.endowmentMonthly,
    evaluate: (p, m) => {
      let score = 65;
      const reasons: string[] = [];
      if (p.income.endowmentMonthly > 0) {
        score += 15;
        reasons.push("يوجد وقف عامل بالفعل — التوسعة أسهل وأقل مخاطرة من التأسيس");
      }
      if (p.beneficiaries >= 1000) {
        score += 8;
        reasons.push("قاعدة مستفيدين واسعة تدعم حملة استقطاب واقفين");
      }
      if (p.partnerships.length >= 2) {
        score += 5;
        reasons.push("شراكات قائمة يمكن تحويلها إلى واقفين مؤسِّسين");
      }
      if (m.runwayMonths < 3) {
        reasons.push("عوائد الوقف دخل دائم يحمي التشغيل من تقلّب التبرعات");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "paid-programs",
    name: "برامج تدريب ومنتجات معرفية مدفوعة",
    category: "منتجات وخدمات",
    description:
      "تسعير البرامج التدريبية والمحتوى الذي تنتجه الجمعية وبيعه للأفراد والشركات وجمعيات أخرى عبر دفعات ربع سنوية.",
    capacityWeight: 1,
    difficulty: "متوسطة",
    timeToRevenueMonths: 4,
    risk: "متوسط",
    setupCost: 20_000,
    steps: [
      "اختيار 3 برامج تدريبية جاهزة وتحويلها إلى منتجات مسعّرة",
      "اعتماد المدربين وإصدار شهادات حضور معتمدة",
      "بناء صفحة تسجيل وبوابة دفع إلكتروني",
      "إطلاق دفعتين تجريبيتين بسعر مخفض لبناء الشواهد",
      "توقيع اتفاقيات تدريب مؤسسي مع جهتين",
    ],
    lever: "addPaidPrograms",
    currentLine: (p) => p.income.commercialMonthly,
    evaluate: (p) => {
      let score = 68;
      const reasons: string[] = [];
      if (has(p.assets, "تدريب", "قاعة", "منصة", "محتوى")) {
        score += 12;
        reasons.push("تمتلك الجمعية قاعات ومنصة ومحتوى تدريبيًا جاهزًا للتسييل");
      }
      if (p.expertise.length >= 3) {
        score += 10;
        reasons.push("خبرات متخصصة تُمكّن من تسعير البرامج بثقة");
      }
      if (p.beneficiaries >= 1000) {
        score += 5;
        reasons.push("قاعدة مستفيدين ومتطوعين تشكّل سوقًا أوليًا للبرامج");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "corporate-partnerships",
    name: "شراكات مسؤولية اجتماعية طويلة المدى",
    category: "شراكات",
    description:
      "تحويل الرعايات الموسمية إلى اتفاقيات شراكة مؤسسية لمدة ٢٤–٣٦ شهرًا بدفعات شهرية مرتبطة بمؤشرات أثر.",
    capacityWeight: 1,
    difficulty: "متوسطة",
    timeToRevenueMonths: 5,
    risk: "متوسط",
    setupCost: 12_000,
    steps: [
      "بناء حزم شراكة بثلاث مستويات مع مقابل واضح لكل مستوى",
      "إعداد تقرير أثر سنوي بمعايير قياس معتمدة",
      "تحويل الرعاة الموسميين الحاليين إلى عقود متعددة السنوات",
      "استهداف شركات تتقاطع أعمالها مع رسالة الجمعية",
      "تفعيل تقارير ربع سنوية للشركاء لضمان التجديد",
    ],
    lever: "addPartnerships",
    currentLine: (p) => p.income.otherMonthly,
    evaluate: (p, m) => {
      let score = 66;
      const reasons: string[] = [];
      if (p.partnerships.length >= 2) {
        score += 12;
        reasons.push("شراكات حالية موسمية يمكن تحويلها إلى التزامات متعددة السنوات");
      }
      if (p.beneficiaries >= 1000) {
        score += 8;
        reasons.push("أثر قابل للقياس يجذب برامج المسؤولية الاجتماعية للشركات");
      }
      if (m.seasonalDependency > 0.4) {
        score += 6;
        reasons.push("يحوّل جزءًا من التبرعات الموسمية إلى دخل تعاقدي منتظم");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "consulting",
    name: "استشارات متخصصة للقطاع غير الربحي",
    category: "منتجات وخدمات",
    description:
      "بيع ساعات استشارية في مجالات تميّز الجمعية (قياس الأثر، الحوكمة، بناء البرامج) لجمعيات وشركات.",
    capacityWeight: 0.8,
    difficulty: "متوسطة",
    timeToRevenueMonths: 4,
    risk: "متوسط",
    setupCost: 8_000,
    steps: [
      "تحديد باقتين استشاريتين بسعر ثابت ونطاق عمل واضح",
      "توثيق منهجية العمل ونماذج التسليم",
      "بناء قائمة مرجعية من العملاء الأوائل",
      "التسويق عبر الشبكات المهنية والملتقيات القطاعية",
    ],
    lever: "addPaidPrograms",
    currentLine: (p) => p.income.commercialMonthly,
    evaluate: (p) => {
      let score = 58;
      const reasons: string[] = [];
      if (p.expertise.length >= 4) {
        score += 10;
        reasons.push("عمق الخبرات يسمح ببيع استشارات بأسعار مجزية");
      }
      if (has(p.expertise, "قياس", "أثر", "حوكمة")) {
        score += 6;
        reasons.push("تخصص في قياس الأثر — طلب مرتفع في القطاع");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "shared-services",
    name: "تقديم خدمات مشتركة لجمعيات أخرى",
    category: "منتجات وخدمات",
    description:
      "تشغيل مركز خدمات مشتركة (محاسبة، موارد بشرية، تقنية) لجمعيات أصغر مقابل اشتراك شهري.",
    capacityWeight: 0.6,
    difficulty: "متوسطة",
    timeToRevenueMonths: 6,
    risk: "متوسط",
    setupCost: 18_000,
    steps: [
      "توحيد الإجراءات الداخلية وتوثيقها كخدمة قابلة للبيع",
      "تسعير باقات اشتراك شهرية حسب حجم الجمعية",
      "استقطاب 5 جمعيات في نفس المنطقة",
      "توقيع اتفاقيات مستوى خدمة (SLA)",
    ],
    lever: "addPaidPrograms",
    currentLine: (p) => p.income.commercialMonthly,
    evaluate: (p) => {
      let score = 52;
      const reasons: string[] = [];
      if (p.employees >= 12) {
        score += 8;
        reasons.push("فريق إداري ناضج يمكنه خدمة جمعيات أخرى بتكلفة حدية منخفضة");
      }
      if (has(p.partnerships, "جمعي")) {
        score += 8;
        reasons.push("علاقات قائمة مع جمعيات في نفس النطاق الجغرافي");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "membership",
    name: "اشتراكات عضوية وداعمين شهريين",
    category: "اشتراكات",
    description:
      "برنامج عضوية شهري (أفراد وشركات صغيرة) بمزايا واضحة، يحوّل المتبرع الموسمي إلى داعم متكرر.",
    capacityWeight: 0.5,
    difficulty: "منخفضة",
    timeToRevenueMonths: 2,
    risk: "منخفض",
    setupCost: 6_000,
    steps: [
      "تصميم ثلاث فئات عضوية بمزايا ملموسة",
      "ربط بوابة دفع تدعم التحصيل التلقائي المتكرر",
      "حملة تحويل قاعدة المتبرعين الحاليين إلى اشتراك شهري",
      "تقرير شهري قصير للأعضاء لرفع نسبة الاستبقاء",
    ],
    lever: "addPartnerships",
    currentLine: (p) => p.income.subscriptionsMonthly,
    evaluate: (p) => {
      let score = 55;
      const reasons: string[] = [];
      if (p.beneficiaries >= 2000) {
        score += 8;
        reasons.push("قاعدة جماهيرية كبيرة تُسهّل تحويل المتبرعين إلى مشتركين");
      }
      reasons.push("أسرع مصدر متكرر من حيث زمن التنفيذ وأقلها تكلفة");
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "asset-rental",
    name: "تأجير أصول الجمعية",
    category: "استثمار الأصول",
    description:
      "تأجير القاعات والمرافق والمعدات في أوقات عدم الاستخدام لجهات تدريبية وشركات ومناسبات.",
    capacityWeight: 0.6,
    difficulty: "منخفضة",
    timeToRevenueMonths: 2,
    risk: "منخفض",
    setupCost: 5_000,
    steps: [
      "جرد الأصول ونسب استخدامها الفعلية",
      "تسعير ساعات/أيام التأجير وإعداد عقد نموذجي",
      "إدراج القاعات على منصات الحجز المحلية",
      "تخصيص موظف مسؤول عن الجدولة والصيانة",
    ],
    lever: "addPaidPrograms",
    currentLine: (p) => p.income.commercialMonthly,
    evaluate: (p) => {
      let score = 50;
      const reasons: string[] = [];
      if (has(p.assets, "قاعة", "مقر", "مرفق", "معدات")) {
        score += 14;
        reasons.push("توجد قاعات ومرافق غير مستغلة طوال أيام الأسبوع");
      }
      if (p.expenses.rent > 0) {
        score += 5;
        reasons.push("يخفّض العبء الصافي للإيجار الحالي");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "content-licensing",
    name: "ترخيص محتوى وبرامج تدريبية",
    category: "ملكية فكرية",
    description:
      "ترخيص المناهج والأدلة والبرامج المعتمدة لجهات أخرى مقابل رسوم سنوية أو نسبة من الإيراد.",
    capacityWeight: 0.5,
    difficulty: "مرتفعة",
    timeToRevenueMonths: 8,
    risk: "متوسط",
    setupCost: 15_000,
    steps: [
      "توثيق المناهج وحماية الملكية الفكرية",
      "بناء نموذج ترخيص وتسعير سنوي",
      "تأهيل شركاء تنفيذ في مناطق أخرى",
      "بناء نظام متابعة الجودة للمرخّص لهم",
    ],
    lever: "addPaidPrograms",
    currentLine: (p) => p.income.commercialMonthly,
    evaluate: (p) => {
      let score = 45;
      const reasons: string[] = [];
      if (has(p.assets, "محتوى", "منصة")) {
        score += 10;
        reasons.push("محتوى مسجّل جاهز للترخيص دون تكلفة إنتاج إضافية");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "mission-shop",
    name: "متجر ومنتجات مرتبطة برسالة الجمعية",
    category: "إيرادات تجارية",
    description:
      "متجر إلكتروني لمنتجات ينتجها المستفيدون أو منتجات تحمل هوية الجمعية، بهامش يعود للتشغيل.",
    capacityWeight: 0.4,
    difficulty: "متوسطة",
    timeToRevenueMonths: 6,
    risk: "مرتفع",
    setupCost: 25_000,
    steps: [
      "اختيار خط منتجات محدود قابل للتوسع",
      "بناء المتجر الإلكتروني وسلسلة التوريد",
      "ربط المنتج بقصة أثر واضحة",
      "قياس الهامش الصافي قبل التوسع",
    ],
    lever: "addPaidPrograms",
    currentLine: (p) => p.income.commercialMonthly,
    evaluate: (p) => {
      let score = 40;
      const reasons: string[] = [];
      if (has(p.expertise, "تمكين", "أسر", "حرف", "إنتاج")) {
        score += 10;
        reasons.push("برامج التمكين تنتج سلعًا قابلة للبيع فعليًا");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
  {
    id: "blended-finance",
    name: "تمويل مختلط وصندوق استدامة",
    category: "تمويل مبتكر",
    description:
      "هيكلة تمويل يجمع منحة تأسيسية مع استثمار اجتماعي لبناء أصل مدرّ للدخل يغطي التشغيل.",
    capacityWeight: 0.7,
    difficulty: "مرتفعة",
    timeToRevenueMonths: 10,
    risk: "مرتفع",
    setupCost: 35_000,
    steps: [
      "إعداد دراسة جدوى مالية للأصل المستهدف",
      "استقطاب ممول مؤسس يغطي رأس المال الأولي",
      "هيكلة الحوكمة وسياسة توزيع العوائد",
      "التشغيل التجريبي وقياس العائد قبل التوسع",
    ],
    lever: "addEndowment",
    currentLine: (p) => p.income.endowmentMonthly,
    evaluate: (p, m) => {
      let score = 48;
      const reasons: string[] = [];
      if (p.annualBudget >= 1_000_000) {
        score += 10;
        reasons.push("حجم الميزانية يسمح بهيكلة تمويل مركّبة");
      }
      if (m.runwayMonths >= 3) {
        score += 5;
        reasons.push("وجود احتياطي يتيح تحمّل مدة التأسيس الطويلة");
      }
      return { score, reason: reasons.join("، ") };
    },
  },
];

/**
 * أولوية البند: الترتيب الأول دائمًا أولوية عالية،
 * وما عداه يُرتَّب حسب سرعة الوصول للإيراد لأن التسلسل الزمني هو ما يحدد التنفيذ.
 */
function priorityFor(rank: number, timeToRevenue: number): Priority {
  if (rank === 0 || timeToRevenue <= 4) return "عالية";
  if (timeToRevenue <= 6) return "متوسطة";
  return "منخفضة";
}

export interface PortfolioResult {
  sources: RevenueSource[];
  /** الفجوة التشغيلية قبل المحفظة */
  gapBefore: number;
  /** التوفير المستهدف من تحسين الكفاءة */
  targetedSavings: number;
  /** إجمالي الإيراد الشهري الجديد المقترح */
  newMonthlyRevenue: number;
  /** الإيراد المتكرر بعد التنفيذ */
  projectedRecurringIncome: number;
  /** المصروف التشغيلي بعد التوفير */
  projectedOperatingCost: number;
  /** الفجوة بعد التنفيذ */
  projectedGap: number;
  coverageAfter: number;
}

/** قاعدة التنويع: لا يتجاوز أي مصدر جديد هذه النسبة من المصروف التشغيلي */
export const MAX_SHARE_PER_SOURCE = 0.2;

export function buildPortfolio(
  profile: OrgProfile,
  metrics: FinancialMetrics,
): PortfolioResult {
  const opex = metrics.monthlyOperatingCost;
  const targetedSavings = recommendedMonthlySavings(profile);

  // المبلغ المطلوب تغطيته من مصادر دخل جديدة
  const deficit = Math.max(0, -metrics.operatingGap - targetedSavings);
  // في حال عدم وجود عجز، نستهدف نموًا بنسبة 20% من التشغيل لبناء فائض واحتياطي
  const target = deficit > 0 ? deficit : opex * 0.2;

  const ranked = SOURCE_CATALOG.map((candidate) => {
    const { score, reason } = candidate.evaluate(profile, metrics);
    return { candidate, score, reason };
  }).sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));

  // عدد المصادر: بين 3 و5، بحيث لا يتجاوز أي مصدر 20% من التشغيل
  const perSourceCap = Math.max(opex * MAX_SHARE_PER_SOURCE, 1);
  const needed = Math.ceil(target / perSourceCap);
  const count = Math.min(5, Math.max(3, needed));

  const selected = ranked.slice(0, count);
  const weightSum = selected.reduce((s, r) => s + r.candidate.capacityWeight, 0);

  // توزيع الفجوة حسب السعة النسبية، مع التقريب لأقرب 500 ريال
  const rawAllocations = selected.map(
    (r) => (target * r.candidate.capacityWeight) / weightSum,
  );
  const allocations = rawAllocations.map((v) => Math.round(v / 500) * 500);
  // ضبط فرق التقريب على أكبر بند حتى يبقى المجموع مطابقًا للهدف
  const drift = Math.round(target) - allocations.reduce((a, b) => a + b, 0);
  if (allocations.length > 0 && drift !== 0) {
    const maxIndex = allocations.indexOf(Math.max(...allocations));
    allocations[maxIndex] += drift;
  }

  const sources: RevenueSource[] = selected.map((r, index) => {
    const c = r.candidate;
    const amount = Math.max(0, allocations[index]);
    return {
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      fitReason: r.reason || "يتوافق مع طبيعة نشاط الجمعية وقدراتها الحالية",
      expectedMonthlyRevenue: amount,
      targetLineTotal: c.currentLine(profile) + amount,
      difficulty: c.difficulty,
      timeToRevenueMonths: c.timeToRevenueMonths,
      risk: c.risk,
      steps: c.steps,
      setupCost: c.setupCost,
      priority: priorityFor(index, c.timeToRevenueMonths),
      fitScore: Math.min(100, Math.round(r.score)),
    };
  });

  const newMonthlyRevenue = sources.reduce(
    (s, x) => s + x.expectedMonthlyRevenue,
    0,
  );
  const projectedRecurringIncome = metrics.monthlyRecurringIncome + newMonthlyRevenue;
  const projectedOperatingCost = Math.max(0, opex - targetedSavings);
  const projectedGap = projectedRecurringIncome - projectedOperatingCost;

  return {
    sources,
    gapBefore: metrics.operatingGap,
    targetedSavings,
    newMonthlyRevenue,
    projectedRecurringIncome,
    projectedOperatingCost,
    projectedGap,
    coverageAfter:
      projectedOperatingCost > 0
        ? projectedRecurringIncome / projectedOperatingCost
        : 1,
  };
}

/** تحويل المحفظة المقترحة إلى مدخلات سيناريو جاهزة للتطبيق */
export function portfolioToScenario(
  portfolio: PortfolioResult,
  metrics: FinancialMetrics,
  savingsRate = 0.1,
): ScenarioInputs {
  const scenario: ScenarioInputs = {
    addServiceContracts: 0,
    addEndowment: 0,
    addPaidPrograms: 0,
    addPartnerships: 0,
    expenseReduction: portfolio.targetedSavings,
    reserveAddition: 0,
  };

  for (const source of portfolio.sources) {
    const catalogItem = SOURCE_CATALOG.find((c) => c.id === source.id);
    if (!catalogItem) continue;
    scenario[catalogItem.lever] += source.expectedMonthlyRevenue;
  }

  // بناء الاحتياطي: نسبة ادخار شهرية من الإيراد المتكرر المتوقع خلال 12 شهرًا
  scenario.reserveAddition =
    Math.round((portfolio.projectedRecurringIncome * savingsRate * 12) / 1000) * 1000;

  void metrics;
  return scenario;
}
