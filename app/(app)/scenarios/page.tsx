"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  PartyPopper,
  Play,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { Slider } from "@/components/ui/slider";
import { ScoreGauge } from "@/components/shared/score-gauge";
import {
  axisProps,
  CHART_TOKENS,
  ChartFrame,
  ChartTooltip,
  currencyTick,
} from "@/components/charts/chart-kit";
import { useAppStore } from "@/lib/store/app-store";
import { buildLeverConfigs } from "@/lib/finance/scenario-engine";
import { BAND_BG_CLASS } from "@/lib/finance/independence-score";
import {
  formatCurrency,
  formatDecimal,
  formatMonths,
  formatPercent,
  formatSignedCurrency,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface CompareRowProps {
  label: string;
  before: string;
  after: string;
  improved: boolean;
  delta?: string;
}

function CompareRow({ label, before, after, improved, delta }: CompareRowProps) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-b border-border py-3 last:border-0">
      <span className="text-xs text-muted-foreground sm:text-sm">{label}</span>
      <span className="tnum text-sm font-medium text-muted-foreground">{before}</span>
      <span
        className={cn(
          "tnum flex items-center gap-1.5 text-sm font-bold",
          improved ? "text-success" : "text-foreground",
        )}
      >
        {after}
        {delta && improved && (
          <span className="hidden text-[11px] font-medium sm:inline">{delta}</span>
        )}
      </span>
    </div>
  );
}

export default function ScenariosPage() {
  const {
    metrics,
    score,
    comparison,
    scenario,
    setScenario,
    resetScenario,
    applyRecommendedScenario,
    scenarioActive,
    portfolio,
  } = useAppStore();

  const levers = React.useMemo(() => buildLeverConfigs(metrics), [metrics]);
  const { nextMetrics, nextScore, delta, reachedBreakEven } = comparison;

  const chartData = [
    {
      name: "المصروف التشغيلي",
      الحالي: metrics.monthlyOperatingCost,
      "بعد الخطة": nextMetrics.monthlyOperatingCost,
    },
    {
      name: "الإيراد المتكرر",
      الحالي: metrics.monthlyRecurringIncome,
      "بعد الخطة": nextMetrics.monthlyRecurringIncome,
    },
    {
      name: "الاحتياطي ÷ 10",
      الحالي: metrics.reserve / 10,
      "بعد الخطة": nextMetrics.reserve / 10,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* شريط الإجراءات */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">سيناريوهات الاستدامة</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              حرّك أي رافعة لترى أثرها الفوري على مؤشر الاستقلال المالي والفجوة
              التشغيلية وفترة الأمان ونسبة الاعتماد على التبرعات.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button onClick={applyRecommendedScenario}>
              <Play className="h-4 w-4" />
              طبّق السيناريو المقترح
            </Button>
            <Button variant="outline" onClick={resetScenario} disabled={!scenarioActive}>
              <RotateCcw className="h-4 w-4" />
              إعادة الوضع الحالي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* رسالة النجاح */}
      {reachedBreakEven && scenarioActive && (
        <Card className="animate-fade-up border-2 border-success/40 bg-success/5">
          <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground">
              <PartyPopper className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-success">
                جمعيتك أصبحت قادرة على تغطية مصاريفها التشغيلية من مصادر دخل أكثر
                استدامة.
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                الفجوة التشغيلية تحولت من{" "}
                <span className="font-semibold text-destructive">
                  {formatSignedCurrency(metrics.operatingGap)}
                </span>{" "}
                إلى{" "}
                <span className="font-semibold text-success">
                  {formatSignedCurrency(nextMetrics.operatingGap)}
                </span>{" "}
                شهريًا، وارتفع مؤشر الاستقلال المالي من{" "}
                {formatDecimal(score.total)} إلى {formatDecimal(nextScore.total)} من
                100.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
        {/* الروافع */}
        <Card className="xl:sticky xl:top-24 xl:self-start">
          <CardHeader>
            <CardTitle>روافع السيناريو</CardTitle>
            <CardDescription>
              القيم شهرية ما لم يُذكر غير ذلك. التحديث فوري.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {levers.map((lever) => {
              const value = scenario[lever.key];
              return (
                <div key={lever.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <label className="text-sm font-medium">{lever.label}</label>
                    <span className="tnum text-sm font-bold text-primary">
                      {formatCurrency(value)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{lever.hint}</p>
                  <Slider
                    className="mt-3"
                    value={[value]}
                    max={lever.max}
                    step={lever.step}
                    onValueChange={([next]) =>
                      setScenario((prev) => ({ ...prev, [lever.key]: next }))
                    }
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span className="tnum">0</span>
                    <span className="tnum">{formatCurrency(lever.max)}</span>
                  </div>
                </div>
              );
            })}

            <div className="rounded-lg bg-secondary p-3 text-xs leading-6 text-muted-foreground">
              السيناريو المقترح يعتمد على محفظة الاستدامة:{" "}
              {formatCurrency(portfolio.newMonthlyRevenue)} إيراد جديد +{" "}
              {formatCurrency(portfolio.targetedSavings)} توفير شهري.
            </div>
          </CardContent>
        </Card>

        {/* المقارنة */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>الوضع الحالي مقابل الوضع بعد تطبيق الخطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col items-center rounded-xl border border-border p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    الوضع الحالي
                  </p>
                  <ScoreGauge score={score.total} size={190} />
                  <Badge className={cn("mt-2 border", BAND_BG_CLASS[score.band.tone])}>
                    {score.band.label}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "flex flex-col items-center rounded-xl border-2 p-4 transition-colors",
                    scenarioActive ? "border-success/40 bg-success/5" : "border-border",
                  )}
                >
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    بعد تطبيق الخطة
                  </p>
                  <ScoreGauge score={nextScore.total} size={190} />
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      className={cn("border", BAND_BG_CLASS[nextScore.band.tone])}
                    >
                      {nextScore.band.label}
                    </Badge>
                    {delta.score !== 0 && (
                      <span
                        className={cn(
                          "tnum flex items-center gap-1 text-xs font-bold",
                          delta.score > 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {delta.score > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {delta.score > 0 ? "+" : ""}
                        {formatDecimal(delta.score)} نقطة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
                  <span>المؤشر</span>
                  <span>الوضع الحالي</span>
                  <span>بعد الخطة</span>
                </div>

                <CompareRow
                  label="مؤشر الاستقلال المالي"
                  before={`${formatDecimal(score.total)} / 100`}
                  after={`${formatDecimal(nextScore.total)} / 100`}
                  improved={delta.score > 0}
                  delta={`+${formatDecimal(delta.score)}`}
                />
                <CompareRow
                  label="الفجوة التشغيلية الشهرية"
                  before={formatSignedCurrency(metrics.operatingGap)}
                  after={formatSignedCurrency(nextMetrics.operatingGap)}
                  improved={delta.gap > 0}
                  delta={`+${formatCurrency(delta.gap)}`}
                />
                <CompareRow
                  label="نسبة تغطية التشغيل"
                  before={formatPercent(metrics.coverageRatio)}
                  after={formatPercent(nextMetrics.coverageRatio)}
                  improved={delta.coverage > 0}
                  delta={`+${formatPercent(delta.coverage)}`}
                />
                <CompareRow
                  label="الإيراد الشهري المتكرر"
                  before={formatCurrency(metrics.monthlyRecurringIncome)}
                  after={formatCurrency(nextMetrics.monthlyRecurringIncome)}
                  improved={delta.recurringIncome > 0}
                  delta={`+${formatCurrency(delta.recurringIncome)}`}
                />
                <CompareRow
                  label="المصروف التشغيلي الشهري"
                  before={formatCurrency(metrics.monthlyOperatingCost)}
                  after={formatCurrency(nextMetrics.monthlyOperatingCost)}
                  improved={delta.operatingCost < 0}
                  delta={formatCurrency(delta.operatingCost)}
                />
                <CompareRow
                  label="فترة الأمان المالي"
                  before={formatMonths(metrics.runwayMonths)}
                  after={formatMonths(nextMetrics.runwayMonths)}
                  improved={delta.runwayMonths > 0}
                  delta={`+${formatDecimal(delta.runwayMonths)} شهر`}
                />
                <CompareRow
                  label="الاعتماد على التبرعات الموسمية"
                  before={formatPercent(metrics.seasonalDependency)}
                  after={formatPercent(nextMetrics.seasonalDependency)}
                  improved={delta.seasonalDependency < 0}
                  delta={formatPercent(delta.seasonalDependency)}
                />
                <CompareRow
                  label="العدد الفعّال لمصادر الدخل"
                  before={formatDecimal(metrics.effectiveSourcesCount)}
                  after={formatDecimal(nextMetrics.effectiveSourcesCount)}
                  improved={delta.effectiveSources > 0}
                  delta={`+${formatDecimal(delta.effectiveSources)}`}
                />
              </div>
            </CardContent>
          </Card>

          <ChartFrame
            title="مقارنة الأرقام الأساسية"
            description="الاحتياطي معروض مقسومًا على 10 ليتناسب مع مقياس الرسم"
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                  dataKey="الحالي"
                  fill={CHART_TOKENS.neutral}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="بعد الخطة"
                  fill={CHART_TOKENS.primary}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>

          {scenarioActive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  ماذا تغيّر في مكونات المؤشر؟
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {nextScore.components.map((component, index) => {
                  const before = score.components[index];
                  const gained = component.points - before.points;
                  return (
                    <div key={component.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span>{component.label}</span>
                        <span className="tnum font-semibold">
                          {formatDecimal(before.points)} →{" "}
                          <span className={gained > 0 ? "text-success" : ""}>
                            {formatDecimal(component.points)}
                          </span>{" "}
                          / {component.weight}
                        </span>
                      </div>
                      <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="absolute inset-y-0 end-0 rounded-full bg-primary/25"
                          style={{ width: `${component.ratio * 100}%` }}
                        />
                        <div
                          className="absolute inset-y-0 end-0 rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${before.ratio * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/plan">
                    كيف أنفّذ هذا خلال 12 شهرًا؟
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
