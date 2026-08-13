import type { OrgProfile } from "@/lib/types";

/** المستخدم الافتراضي للعرض التجريبي — مصدر واحد للاسم في كل الصفحات */
export const DEMO_USER_NAME = "م. موسى الفيفي";
export const DEMO_USER_ROLE = "مسؤول الاستدامة المالية";
export const DEMO_USER_EMAIL = "mousa@namaa.org.sa";

/** أسماء سابقة محفوظة في المتصفح — تُستبدل تلقائيًا عند التحميل */
export const LEGACY_USER_NAMES = ["م. عبدالله الشمري"];

/**
 * الجمعية الافتراضية للعرض التجريبي.
 * الأرقام مترابطة: إجمالي التشغيل الشهري = 60,000 ر.س
 * والإيراد المتكرر الشهري = 15,000 ر.س (عقود 10,000 + وقف 5,000)
 * أي فجوة تشغيلية شهرية = 45,000 ر.س
 */
export const DEMO_ORG: OrgProfile = {
  name: "جمعية نماء للتنمية",
  sector: "التنمية الاجتماعية وتمكين الأسر",
  city: "الرياض",
  employees: 14,
  beneficiaries: 2400,
  annualBudget: 830_000,
  expenses: {
    salaries: 40_000,
    rent: 8_000,
    technology: 4_000,
    admin: 5_000,
    marketing: 0,
    other: 3_000,
  },
  income: {
    seasonalDonationsAnnual: 450_000,
    recurringDonationsAnnual: 0,
    grantsAnnual: 200_000,
    serviceContractsMonthly: 10_000,
    endowmentMonthly: 5_000,
    commercialMonthly: 0,
    subscriptionsMonthly: 0,
    otherMonthly: 0,
  },
  reserve: 120_000,
  assets: [
    "مقر إداري مستأجر يضم قاعتي تدريب (سعة 40 مقعدًا)",
    "منصة تدريب إلكترونية ومحتوى مسجّل",
    "قاعدة بيانات 2,400 مستفيد + 180 متطوعًا مدربًا",
    "علامة تجارية معروفة محليًا في تمكين الأسر",
  ],
  expertise: [
    "بناء وتنفيذ برامج تمكين اقتصادي للأسر",
    "قياس الأثر الاجتماعي وإعداد تقارير الأثر",
    "التدريب على المهارات المالية والمهنية",
    "إدارة المتطوعين وبناء برامج التطوع المؤسسي",
  ],
  partnerships: [
    "بنك محلي — رعاية موسمية سنوية",
    "غرفة تجارية — تعاون غير مالي",
    "جمعيتان في نفس المنطقة — تنسيق برامج",
  ],
};

/** ملف فارغ لإنشاء جمعية جديدة */
export const EMPTY_ORG: OrgProfile = {
  name: "",
  sector: "",
  city: "",
  employees: 0,
  beneficiaries: 0,
  annualBudget: 0,
  expenses: {
    salaries: 0,
    rent: 0,
    technology: 0,
    admin: 0,
    marketing: 0,
    other: 0,
  },
  income: {
    seasonalDonationsAnnual: 0,
    recurringDonationsAnnual: 0,
    grantsAnnual: 0,
    serviceContractsMonthly: 0,
    endowmentMonthly: 0,
    commercialMonthly: 0,
    subscriptionsMonthly: 0,
    otherMonthly: 0,
  },
  reserve: 0,
  assets: [],
  expertise: [],
  partnerships: [],
};

export const SECTOR_OPTIONS = [
  "التنمية الاجتماعية وتمكين الأسر",
  "الرعاية الصحية",
  "التعليم وتنمية القدرات",
  "الأيتام والرعاية الاجتماعية",
  "ذوو الإعاقة",
  "الإسكان التنموي",
  "البيئة والاستدامة",
  "الثقافة والفنون",
  "التنمية الاقتصادية وريادة الأعمال",
];
