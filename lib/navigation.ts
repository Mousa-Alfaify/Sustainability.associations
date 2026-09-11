import {
  Bot,
  Building2,
  CalendarRange,
  Gauge,
  LayoutDashboard,
  PiggyBank,
  Scissors,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  group: "الرئيسية" | "التحليل" | "الحلول" | "التنفيذ";
  /** يظهر فقط في الوضع السحابي (يتطلب حساب وفريقًا حقيقيَين) */
  cloudOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "لوحة التحكم",
    description: "نظرة شاملة على الوضع المالي والتشغيلي",
    icon: LayoutDashboard,
    group: "الرئيسية",
  },
  {
    href: "/profile",
    label: "ملف الجمعية",
    description: "بيانات الجمعية ومصروفاتها ومصادر دخلها",
    icon: Building2,
    group: "الرئيسية",
  },
  {
    href: "/analysis",
    label: "التحليل المالي",
    description: "المصروف التشغيلي والإيراد المتكرر والفجوة",
    icon: TrendingUp,
    group: "التحليل",
  },
  {
    href: "/independence",
    label: "مؤشر الاستقلال المالي",
    description: "درجة من 100 ومكوناتها الأربعة",
    icon: Gauge,
    group: "التحليل",
  },
  {
    href: "/portfolio",
    label: "محفظة الاستدامة",
    description: "مصادر الدخل المقترحة لجمعيتك",
    icon: Sparkles,
    group: "الحلول",
  },
  {
    href: "/scenarios",
    label: "سيناريوهات الاستدامة",
    description: "قارن الوضع الحالي بالوضع بعد الخطة",
    icon: SlidersHorizontal,
    group: "الحلول",
  },
  {
    href: "/reserve",
    label: "حساب التشغيل المستدام",
    description: "بناء احتياطي يغطي 3 إلى 6 أشهر",
    icon: PiggyBank,
    group: "الحلول",
  },
  {
    href: "/efficiency",
    label: "فرص تحسين الكفاءة",
    description: "خفض المصروفات دون المساس بالبرامج",
    icon: Scissors,
    group: "الحلول",
  },
  {
    href: "/plan",
    label: "خطة 12 شهرًا",
    description: "خطة تنفيذية بأهداف ومهام ومؤشرات",
    icon: CalendarRange,
    group: "التنفيذ",
  },
  {
    href: "/advisor",
    label: "مستشار الاستدامة",
    description: "إجابات مبنية على أرقام جمعيتك",
    icon: Bot,
    group: "التنفيذ",
  },
  {
    href: "/team",
    label: "الفريق",
    description: "أعضاء الجمعية ورمز الدعوة للانضمام",
    icon: Users,
    group: "التنفيذ",
    cloudOnly: true,
  },
];

export const NAV_GROUPS: NavItem["group"][] = [
  "الرئيسية",
  "التحليل",
  "الحلول",
  "التنفيذ",
];
