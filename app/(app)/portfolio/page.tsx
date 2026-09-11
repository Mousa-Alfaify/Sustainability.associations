"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CircleDollarSign,
  Clock,
  Play,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  axisProps,
  CHART_COLORS,
  CHART_TOKENS,
  ChartFrame,
  ChartTooltip,
  currencyTick,
} from "@/components/charts/chart-kit";
import { useAppStore } from "@/lib/store/app-store";
import { MAX_SHARE_PER_SOURCE } from "@/lib/finance/portfolio-engine";
import type { Difficulty, Priority, RiskLevel } from "@/lib/types";
import { formatCurrency, formatMonthsCount, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const DIFFICULTY_VARIANT: Record<Difficulty, "success" | "warning" | "danger"> = {
  منخفضة: "success",
  متوسطة: "warning",
  مرتفعة: "danger",
};

const RISK_VARIANT: Record<RiskLevel, "success" | "warning" | "danger"> = {
  منخفض: "success",
  متوسط: "warning",
  مرتفع: "danger",
};

const PRIORITY_VARIANT: Record<Priority, "default" | "secondary" | "outline"> = {
  عالية: "default",
  متوسطة: "secondary",
  منخفضة: "outline",
};

export default function PortfolioPage() {
  const router = useRouter();
  const {
    profile,
    metrics,
    portfolio,
    portfolioBuilt,
    markPortfolioBuilt,
    applyRecommendedScenario,
  } = useAppStore();
  // المحفظة محسوبة سلفًا من بيانات حقيقية (useAppStore أعلاه) — لا يوجد
  // استدعاء شبكي ينتظره هذا الزر، لذا يكشف النتيجة فورًا.
  function build() {
    markPortfolioBuilt();
  }

  function applyAndGo() {
    applyRecommendedScenario();
    router.push("/scenarios");
  }

  const mixData = [
    ...portfolio.sources.map((s) => ({
      name: s.name,
      value: s.expectedMonthlyRevenue,
    })),
    { name: "توفير من تحسين الكفاءة", value: portfolio.targetedSavings },
  ];

  const coverageData = [
    {
      name: "الوضع الحالي",
      متكرر: metrics.monthlyRecurringIncome,
      فجوة: Math.max(0, -metrics.operatingGap),
    },
    {
      name: "بعد المحفظة",
      متكرر: portfolio.projectedRecurringIncome,
      فجوة: Math.max(0, -portfolio.projectedGap),
    },
  ];

  if (!portfolioBuilt) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">محفظة الاستدامة المقترحة</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
                سيحلل المُحرك أصول {profile.name} وخبراتها وشراكاتها وحجم فجوتها
                التشغيلية ({formatCurrency(Math.abs(metrics.operatingGap))} شهريًا)، ثم
                يقترح مزيجًا من 3 إلى 5 مصادر دخل متكررة بحيث لا يتجاوز أي مصدر{" "}
                {formatPercent(MAX_SHARE_PER_SOURCE)} من مصروفك التشغيلي.
              </p>
            </div>
            <Button size="lg" onClick={build}>
              <Sparkles className="h-4 w-4" />
              ابنِ محفظة الاستدامة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* الملخص */}
      <Card className="border-2 border-primary/20">
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">محفظة الاستدامة المقترحة</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {portfolio.sources.length} مصادر دخل متكررة تضيف{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(portfolio.newMonthlyRevenue)}
              </span>{" "}
              شهريًا، بالإضافة إلى{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(portfolio.targetedSavings)}
              </span>{" "}
              توفير من تحسين الكفاءة — لتنتقل التغطية من{" "}
              {formatPercent(metrics.coverageRatio)} إلى{" "}
              <span className="font-semibold text-success">
                {formatPercent(portfolio.coverageAfter)}
              </span>
              .
            </p>
          </div>
          <Button size="lg" onClick={applyAndGo} className="shrink-0">
            <Play className="h-4 w-4" />
            طبّق السيناريو المقترح
          </Button>
        </CardContent>
      </Card>

      {/* أرقام المحفظة */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "الفجوة قبل المحفظة",
            value: formatCurrency(Math.abs(portfolio.gapBefore)),
            icon: ShieldAlert,
            tone: "text-destructive",
          },
          {
            label: "إيراد متكرر جديد",
            value: formatCurrency(portfolio.newMonthlyRevenue),
            icon: TrendingUp,
            tone: "text-primary",
          },
          {
            label: "توفير من الكفاءة",
            value: formatCurrency(portfolio.targetedSavings),
            icon: CircleDollarSign,
            tone: "text-primary",
          },
          {
            label: "الفجوة بعد التنفيذ",
            value: formatCurrency(portfolio.projectedGap),
            icon: Target,
            tone: portfolio.projectedGap >= 0 ? "text-success" : "text-warning",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <Icon className={cn("h-5 w-5", item.tone)} />
              </div>
              <p className={cn("tnum mt-2 text-2xl font-bold", item.tone)}>
                {item.value}
              </p>
            </Card>
          );
        })}
      </section>

      {/* الرسوم */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="توزيع محفظة الاستدامة"
          description="مساهمة كل مصدر في إغلاق الفجوة التشغيلية"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mixData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {mixData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => (
                  <span style={{ color: CHART_TOKENS.axis }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="تغطية التشغيل قبل وبعد"
          description={`المصروف التشغيلي بعد التوفير: ${formatCurrency(portfolio.projectedOperatingCost)}`}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={coverageData}
              margin={{ top: 10, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_TOKENS.grid} vertical={false} />
              <XAxis dataKey="name" {...axisProps} reversed />
              <YAxis
                {...axisProps}
                orientation="right"
                tickFormatter={currencyTick}
                width={64}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: CHART_TOKENS.axis }}>{value}</span>
                )}
              />
              <Bar
                dataKey="متكرر"
                name="إيراد متكرر"
                stackId="a"
                fill={CHART_TOKENS.primary}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="فجوة"
                name="فجوة غير مغطاة"
                stackId="a"
                fill={CHART_TOKENS.danger}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </section>

      {/* بطاقات المصادر */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">مصادر الدخل المقترحة</h2>
          <Badge variant="outline">
            مرتبة حسب الأولوية ودرجة الملاءمة
          </Badge>
        </div>

        {portfolio.sources.map((source, index) => (
          <Card
            key={source.id}
            className="animate-fade-up overflow-hidden"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex flex-col gap-0 lg:flex-row">
              <div className="flex-1 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-bold">{source.name}</h3>
                  <Badge variant={PRIORITY_VARIANT[source.priority]}>
                    أولوية {source.priority}
                  </Badge>
                  <Badge variant="outline">{source.category}</Badge>
                  <Badge variant="secondary">
                    <BadgeCheck className="h-3 w-3" />
                    ملاءمة {source.fitScore}/100
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {source.description}
                </p>

                <div className="mt-3 rounded-lg border border-primary/15 bg-accent p-3">
                  <p className="text-xs font-semibold text-accent-foreground">
                    لماذا يناسب جمعيتك؟
                  </p>
                  <p className="mt-1 text-xs leading-6 text-accent-foreground/90">
                    {source.fitReason}
                  </p>
                </div>

                <Separator className="my-4" />

                <p className="mb-2 text-xs font-semibold">الخطوات المطلوبة</p>
                <ol className="flex flex-col gap-2">
                  {source.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-2.5 text-xs leading-6">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                        {stepIndex + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="w-full shrink-0 border-t border-border bg-muted/50 p-5 lg:w-72 lg:border-s lg:border-t-0">
                <p className="text-xs text-muted-foreground">
                  الدخل الشهري الإضافي المتوقع
                </p>
                <p className="tnum mt-1 text-2xl font-bold text-primary">
                  {formatCurrency(source.expectedMonthlyRevenue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ليصل إجمالي هذا الخط إلى{" "}
                  <span className="tnum font-semibold text-foreground">
                    {formatCurrency(source.targetLineTotal)}
                  </span>{" "}
                  شهريًا
                </p>

                <dl className="mt-4 flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">صعوبة التنفيذ</dt>
                    <dd>
                      <Badge variant={DIFFICULTY_VARIANT[source.difficulty]}>
                        {source.difficulty}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">مستوى المخاطر</dt>
                    <dd>
                      <Badge variant={RISK_VARIANT[source.risk]}>{source.risk}</Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      مدة الوصول للإيراد
                    </dt>
                    <dd className="tnum font-semibold">
                      {formatMonthsCount(source.timeToRevenueMonths)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">التكلفة الأولية</dt>
                    <dd className="tnum font-semibold">
                      {formatCurrency(source.setupCost)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <dt className="text-muted-foreground">نسبة من التشغيل</dt>
                    <dd className="tnum font-semibold">
                      {formatPercent(
                        source.expectedMonthlyRevenue / metrics.monthlyOperatingCost,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* دعوة للتطبيق */}
      <Card className="border-2 border-success/25 bg-success/5">
        <CardHeader>
          <CardTitle>جاهز لتطبيق المحفظة؟</CardTitle>
          <CardDescription>
            سيتم تحميل قيم هذه المحفظة في أداة السيناريوهات لترى الأثر على مؤشر
            الاستقلال المالي والفجوة التشغيلية مباشرة.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={applyAndGo}>
            <Play className="h-4 w-4" />
            طبّق السيناريو المقترح
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/plan">
              خطة التنفيذ خلال 12 شهرًا
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
