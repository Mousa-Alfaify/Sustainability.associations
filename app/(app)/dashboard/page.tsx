"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarClock,
  Gauge,
  Layers,
  Loader2,
  PiggyBank,
  Repeat,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { ScoreGauge } from "@/components/shared/score-gauge";
import {
  buildDiagnosis,
  DiagnosisPanel,
} from "@/components/dashboard/diagnosis-panel";
import {
  axisProps,
  CHART_COLORS,
  CHART_TOKENS,
  ChartFrame,
  ChartTooltip,
  currencyTick,
} from "@/components/charts/chart-kit";
import { useAppStore } from "@/lib/store/app-store";
import { sustainabilityProgress } from "@/lib/finance/calculations";
import { buildProjection, breakEvenMonth } from "@/lib/finance/projection-engine";
import { BAND_BG_CLASS } from "@/lib/finance/independence-score";
import {
  formatCurrency,
  formatDecimal,
  formatMonths,
  formatPercent,
  formatSignedCurrency,
  formatSourcesCount,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { profile, metrics, score, portfolio, analyzed, markAnalyzed } =
    useAppStore();
  const [analyzing, setAnalyzing] = React.useState(false);

  const diagnosis = React.useMemo(
    () => buildDiagnosis(metrics, score),
    [metrics, score],
  );
  const projection = React.useMemo(
    () => buildProjection(metrics, portfolio),
    [metrics, portfolio],
  );
  const breakEven = React.useMemo(() => breakEvenMonth(projection), [projection]);
  const progress = sustainabilityProgress(metrics);

  const inDeficit = metrics.operatingGap < 0;

  function runAnalysis() {
    setAnalyzing(true);
    window.setTimeout(() => {
      markAnalyzed();
      setAnalyzing(false);
      document
        .getElementById("diagnosis")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 700);
  }

  const coverageData = [
    {
      name: "المصروف التشغيلي",
      value: metrics.monthlyOperatingCost,
      fill: CHART_TOKENS.danger,
    },
    {
      name: "إيراد متكرر",
      value: metrics.monthlyRecurringIncome,
      fill: CHART_TOKENS.primary,
    },
    {
      name: "دخل موسمي (معدل شهري)",
      value: metrics.monthlySeasonalIncome,
      fill: CHART_TOKENS.warning,
    },
    {
      name: "منح مقيّدة (معدل شهري)",
      value: metrics.monthlyRestrictedIncome,
      fill: CHART_TOKENS.neutral,
    },
  ];

  const incomeMix = metrics.streams
    .filter((s) => s.monthly > 0)
    .map((s) => ({ name: s.label, value: Math.round(s.annual) }));

  const expenseData = metrics.expenseBreakdown.map((e) => ({
    name: e.label,
    value: e.amount,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* شريط الحالة والإجراءات */}
      <Card
        className={cn(
          "overflow-hidden border-2",
          inDeficit ? "border-destructive/30" : "border-success/30",
        )}
      >
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                inDeficit
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success/10 text-success",
              )}
            >
              {inDeficit ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <Target className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{profile.name}</h2>
                <Badge className={cn("border", BAND_BG_CLASS[score.band.tone])}>
                  {score.band.label}
                </Badge>
                <Badge variant="outline">{profile.sector}</Badge>
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                {inDeficit ? (
                  <>
                    تعاني الجمعية من فجوة تشغيلية شهرية قدرها{" "}
                    <span className="font-semibold text-destructive">
                      {formatCurrency(Math.abs(metrics.operatingGap))}
                    </span>{" "}
                    — الإيرادات المتكررة تغطي {formatPercent(metrics.coverageRatio)} فقط
                    من مصاريف التشغيل، والباقي يعتمد على تبرعات موسمية ومنح مقيّدة.
                  </>
                ) : (
                  <>
                    الإيرادات المتكررة تغطي {formatPercent(metrics.coverageRatio)} من
                    مصاريف التشغيل بفائض شهري{" "}
                    <span className="font-semibold text-success">
                      {formatCurrency(metrics.operatingGap)}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button onClick={runAnalysis} disabled={analyzing} size="lg">
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              حلّل جمعيتي
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/portfolio">
                <Sparkles className="h-4 w-4" />
                ابنِ محفظة الاستدامة
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* مؤشرات الأداء الرئيسية */}
      <section className="kpi-grid">
        <KpiCard
          label="المصاريف التشغيلية الشهرية"
          value={formatCurrency(metrics.monthlyOperatingCost)}
          hint={`${formatCurrency(metrics.monthlyOperatingCost * 12)} سنويًا`}
          icon={Wallet}
          tone="neutral"
        />
        <KpiCard
          label="الإيرادات الشهرية المتكررة"
          value={formatCurrency(metrics.monthlyRecurringIncome)}
          hint={`تغطي ${formatPercent(metrics.coverageRatio)} من التشغيل`}
          icon={Repeat}
          tone="primary"
          progress={metrics.coverageRatio * 100}
        />
        <KpiCard
          label="الفجوة التمويلية الشهرية"
          value={formatSignedCurrency(metrics.operatingGap)}
          hint={
            inDeficit
              ? "المبلغ الذي يجب تغطيته شهريًا من مصادر متكررة"
              : "فائض شهري يمكن توجيهه للاحتياطي"
          }
          icon={Banknote}
          tone={inDeficit ? "danger" : "success"}
        />
        <KpiCard
          label="الاحتياطي التشغيلي الحالي"
          value={formatCurrency(metrics.reserve)}
          hint={`الهدف: ${formatCurrency(metrics.monthlyOperatingCost * 6)} (6 أشهر)`}
          icon={PiggyBank}
          tone={metrics.runwayMonths < 3 ? "warning" : "success"}
          progress={(metrics.runwayMonths / 6) * 100}
        />
        <KpiCard
          label="فترة الأمان المالي"
          value={formatMonths(metrics.runwayMonths)}
          hint="عدد الأشهر التي يمكن الاستمرار بها بدون أي تمويل جديد"
          icon={CalendarClock}
          tone={metrics.runwayMonths < 3 ? "danger" : "success"}
        />
        <KpiCard
          label="الاعتماد على التبرعات الموسمية"
          value={formatPercent(metrics.seasonalDependency)}
          hint={`${formatCurrency(metrics.monthlySeasonalIncome * 12)} سنويًا من إجمالي ${formatCurrency(metrics.totalAnnualIncome)}`}
          icon={AlertTriangle}
          tone={metrics.seasonalDependency > 0.4 ? "warning" : "success"}
          progress={metrics.seasonalDependency * 100}
        />
        <KpiCard
          label="عدد مصادر الدخل"
          value={formatSourcesCount(metrics.activeSourcesCount)}
          hint={`العدد الفعّال بعد ترجيح الحجم: ${formatDecimal(metrics.effectiveSourcesCount)}`}
          icon={Layers}
          tone={metrics.effectiveSourcesCount < 3 ? "warning" : "success"}
        />
        <KpiCard
          label="التقدم نحو الاستدامة"
          value={formatPercent(progress)}
          hint="مركّب من تغطية التشغيل (60%) وحجم الاحتياطي (40%)"
          icon={Target}
          tone={progress < 0.4 ? "warning" : "success"}
          progress={progress * 100}
        />
      </section>

      {/* المؤشر + مسار الاستدامة */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              مؤشر الاستقلال المالي
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={score.total} />
            <Badge className={cn("mt-2 border", BAND_BG_CLASS[score.band.tone])}>
              {score.band.label}
            </Badge>
            <div className="mt-5 w-full space-y-3">
              {score.components.map((c) => (
                <div key={c.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="tnum font-semibold">
                      {formatDecimal(c.points)} / {c.weight}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${c.ratio * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
              <Link href="/independence">
                تفاصيل احتساب المؤشر
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <ChartFrame
            title="مسار الاستدامة خلال 12 شهرًا"
            description={
              breakEven !== null
                ? `عند تنفيذ محفظة الاستدامة المقترحة، تُغلق الفجوة التشغيلية في الشهر ${breakEven}.`
                : "مقارنة بين الإيراد المتكرر الحالي والإيراد المتوقع بعد تنفيذ محفظة الاستدامة."
            }
            height={330}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={projection}
                margin={{ top: 10, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke={CHART_TOKENS.grid} vertical={false} />
                <XAxis dataKey="label" {...axisProps} reversed />
                <YAxis
                  {...axisProps}
                  orientation="right"
                  tickFormatter={currencyTick}
                  width={64}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (
                    <span style={{ color: CHART_TOKENS.axis }}>{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="baselineOperatingCost"
                  name="المصروف التشغيلي الحالي"
                  stroke={CHART_TOKENS.danger}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="planOperatingCost"
                  name="المصروف بعد تحسين الكفاءة"
                  stroke={CHART_TOKENS.warning}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="baselineRecurring"
                  name="الإيراد المتكرر الحالي"
                  stroke={CHART_TOKENS.neutral}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="planRecurring"
                  name="الإيراد المتكرر بعد الخطة"
                  stroke={CHART_TOKENS.primary}
                  strokeWidth={3}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>
      </section>

      {/* الرسوم التفصيلية */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ChartFrame
          title="تغطية التشغيل"
          description="مقارنة المصروف التشغيلي بمصادر الدخل حسب طبيعتها"
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={coverageData}
              margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_TOKENS.grid} vertical={false} />
              <XAxis
                dataKey="name"
                {...axisProps}
                reversed
                interval={0}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 10 }}
              />
              <YAxis
                {...axisProps}
                orientation="right"
                tickFormatter={currencyTick}
                width={60}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" name="القيمة الشهرية" radius={[6, 6, 0, 0]}>
                {coverageData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="توزيع الدخل السنوي"
          description={`إجمالي الدخل السنوي ${formatCurrency(metrics.totalAnnualIncome)}`}
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={incomeMix}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {incomeMix.map((_, index) => (
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
          title="هيكل المصروفات التشغيلية"
          description="الرواتب عادةً أكبر بند — وخفضها ليس الحل الأول"
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={expenseData}
              layout="vertical"
              margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_TOKENS.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={currencyTick} />
              <YAxis
                type="category"
                dataKey="name"
                {...axisProps}
                orientation="right"
                width={110}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar
                dataKey="value"
                name="المصروف الشهري"
                fill={CHART_TOKENS.primary}
                radius={[0, 6, 6, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </section>

      {/* التشخيص */}
      <section id="diagnosis" className="scroll-mt-24">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>تشخيص الوضع المالي</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {analyzed
                  ? "نتيجة تحليل بيانات جمعيتك — كل ملاحظة مدعومة برقم من ملفك المالي."
                  : "اضغط «حلّل جمعيتي» لعرض التشخيص التفصيلي المبني على أرقامك."}
              </p>
            </div>
            {analyzed && (
              <Button asChild variant="outline" size="sm">
                <Link href="/analysis">
                  التحليل المالي الكامل
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {analyzed ? (
              <>
                <DiagnosisPanel items={diagnosis} />
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-accent p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-accent-foreground">
                    الخطوة التالية: بناء محفظة استدامة من{" "}
                    {portfolio.sources.length} مصادر دخل متكررة تضيف{" "}
                    <span className="font-semibold">
                      {formatCurrency(portfolio.newMonthlyRevenue)}
                    </span>{" "}
                    شهريًا وتغلق الفجوة بالكامل.
                  </p>
                  <Button asChild className="shrink-0">
                    <Link href="/portfolio">
                      <Sparkles className="h-4 w-4" />
                      ابنِ محفظة الاستدامة
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
                <Activity className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  لم يتم تشغيل التحليل بعد
                </p>
                <Button onClick={runAnalysis} disabled={analyzing}>
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}
                  حلّل جمعيتي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
