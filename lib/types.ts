/**
 * أنواع البيانات الأساسية لمُحرك الاستدامة للجمعيات.
 * جميع المبالغ بالريال السعودي (SAR).
 * الحقول المنتهية بـ Monthly شهرية، والمنتهية بـ Annual سنوية.
 */

export type Difficulty = "منخفضة" | "متوسطة" | "مرتفعة";
export type RiskLevel = "منخفض" | "متوسط" | "مرتفع";
export type Priority = "عالية" | "متوسطة" | "منخفضة";

/** مصاريف التشغيل الشهرية */
export interface OperatingExpenses {
  salaries: number;
  rent: number;
  technology: number;
  admin: number;
  marketing: number;
  other: number;
}

/** مصادر الدخل الحالية */
export interface IncomeInputs {
  /** تبرعات موسمية (رمضان/الحملات) — سنويًا */
  seasonalDonationsAnnual: number;
  /** تبرعات متكررة (تبرع شهري/مشتركين) — سنويًا */
  recurringDonationsAnnual: number;
  /** منح مشاريع — سنويًا (مقيدة بالمشاريع غالبًا) */
  grantsAnnual: number;
  /** عقود خدمات — شهريًا */
  serviceContractsMonthly: number;
  /** عوائد أوقاف — شهريًا */
  endowmentMonthly: number;
  /** إيرادات تجارية — شهريًا */
  commercialMonthly: number;
  /** اشتراكات عضوية — شهريًا */
  subscriptionsMonthly: number;
  /** مصادر دخل أخرى متكررة — شهريًا */
  otherMonthly: number;
}

export interface OrgProfile {
  name: string;
  sector: string;
  city: string;
  employees: number;
  beneficiaries: number;
  annualBudget: number;
  expenses: OperatingExpenses;
  income: IncomeInputs;
  /** الاحتياطي النقدي التشغيلي الحالي */
  reserve: number;
  /** الأصول التي تمتلكها الجمعية */
  assets: string[];
  /** الخبرات القابلة للتحويل إلى خدمات مدفوعة */
  expertise: string[];
  /** الشراكات الحالية */
  partnerships: string[];
}

/** تدفق دخل موحّد (بعد تطبيع كل المدخلات إلى قيمة شهرية) */
export interface IncomeStream {
  key: string;
  label: string;
  monthly: number;
  annual: number;
  /** متكرر ويمكن الاعتماد عليه لتغطية التشغيل */
  recurring: boolean;
  /** موسمي/حملات */
  seasonal: boolean;
  /** مقيّد بالمشاريع ولا يغطي التشغيل عادةً */
  restricted: boolean;
}

/** نتيجة التحليل المالي الكامل */
export interface FinancialMetrics {
  monthlyOperatingCost: number;
  expenseBreakdown: { key: string; label: string; amount: number; share: number }[];
  monthlyRecurringIncome: number;
  monthlySeasonalIncome: number;
  monthlyRestrictedIncome: number;
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  /** الفجوة التشغيلية = المصاريف - الإيرادات المتكررة (سالب = عجز) */
  operatingGap: number;
  /** نسبة تغطية التشغيل من الإيرادات المتكررة (0..1+) */
  coverageRatio: number;
  reserve: number;
  /** فترة الأمان المالي بالأشهر */
  runwayMonths: number;
  /** نسبة الاعتماد على التبرعات الموسمية (0..1) */
  seasonalDependency: number;
  /** عدد مصادر الدخل الفعّالة (>0) */
  activeSourcesCount: number;
  /** العدد الفعّال للمصادر بعد ترجيح الحجم (1/HHI) */
  effectiveSourcesCount: number;
  streams: IncomeStream[];
}

export interface ScoreComponent {
  key: string;
  label: string;
  weight: number;
  /** 0..1 */
  ratio: number;
  /** النقاط المحققة من الوزن */
  points: number;
  detail: string;
}

export type ScoreBandKey = "risk" | "weak" | "medium" | "good" | "strong";

export interface ScoreBand {
  key: ScoreBandKey;
  label: string;
  min: number;
  max: number;
  tone: "danger" | "warning" | "neutral" | "success" | "strong";
  description: string;
}

export interface IndependenceScore {
  total: number;
  band: ScoreBand;
  components: ScoreComponent[];
}

/** بند في محفظة الاستدامة المقترحة */
export interface RevenueSource {
  id: string;
  name: string;
  category: string;
  description: string;
  fitReason: string;
  /** الدخل الشهري الإضافي المتوقع */
  expectedMonthlyRevenue: number;
  /** الإجمالي المستهدف لهذا الخط بعد التنفيذ */
  targetLineTotal: number;
  difficulty: Difficulty;
  /** مدة الوصول لأول إيراد بالأشهر */
  timeToRevenueMonths: number;
  risk: RiskLevel;
  steps: string[];
  setupCost: number;
  priority: Priority;
  /** درجة الملاءمة 0..100 */
  fitScore: number;
}

export interface EfficiencyOpportunity {
  id: string;
  name: string;
  description: string;
  monthlySaving: number;
  ease: Difficulty;
  impact: "عالي" | "متوسط" | "منخفض";
  priority: Priority;
  targetExpense: keyof OperatingExpenses;
  recommended: boolean;
}

/** مدخلات محاكاة السيناريو */
export interface ScenarioInputs {
  addServiceContracts: number;
  addEndowment: number;
  addPaidPrograms: number;
  addPartnerships: number;
  expenseReduction: number;
  reserveAddition: number;
}

export interface PlanTask {
  title: string;
  owner: string;
  done?: boolean;
}

export interface PlanQuarter {
  id: string;
  label: string;
  months: string;
  headline: string;
  targetCoverage: number;
  targetScore: number;
  goals: string[];
  tasks: PlanTask[];
  kpi: string;
}
