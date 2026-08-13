"use client";

import * as React from "react";
import { Info, PiggyBank, ShieldCheck, Target, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  axisProps,
  CHART_TOKENS,
  ChartFrame,
  ChartTooltip,
  currencyTick,
} from "@/components/charts/chart-kit";
import { useAppStore } from "@/lib/store/app-store";
import { planReserve } from "@/lib/finance/calculations";
import { formatCurrency, formatMonths, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RATE_OPTIONS = [0.05, 0.1, 0.15, 0.2];

export default function ReservePage() {
  const { metrics, portfolio, savingsRate, setSavingsRate } = useAppStore();

  const plan3 = React.useMemo(
    () => planReserve(metrics, savingsRate, 3),
    [metrics, savingsRate],
  );
  const plan6 = React.useMemo(
    () => planReserve(metrics, savingsRate, 6),
    [metrics, savingsRate],
  );

  // نفس النسبة لكن بعد تنفيذ محفظة الاستدامة
  const afterPlanMetrics = React.useMemo(
    () => ({
      ...metrics,
      monthlyRecurringIncome: portfolio.projectedRecurringIncome,
      monthlyOperatingCost: portfolio.projectedOperatingCost,
    }),
    [metrics, portfolio],
  );
  const afterPlan6 = React.useMemo(
    () => planReserve(afterPlanMetrics, savingsRate, 6),
    [afterPlanMetrics, savingsRate],
  );

  const chartData = plan6.projection.map((point, index) => ({
    month: index,
    label: index === 0 ? "الآن" : `ش ${index}`,
    balance: Math.round(point.balance),
    afterPlan: Math.round(afterPlan6.projection[index]?.balance ?? 0),
  }));

  // نضمن ظهور خطي الهدف (3 و6 أشهر) داخل نطاق الرسم مهما كان مسار الادخار بطيئًا
  const yMax = React.useMemo(() => {
    const maxBalance = Math.max(
      ...chartData.map((point) => Math.max(point.balance, point.afterPlan)),
    );
    return Math.ceil((Math.max(maxBalance, plan6.targetAmount) * 1.1) / 50_000) * 50_000;
  }, [chartData, plan6.targetAmount]);

  const monthsLabel = (months: number) =>
    Number.isFinite(months)
      ? months === 0
        ? "تم بلوغ الهدف"
        : `${months} شهرًا`
      : "غير ممكن بالنسبة الحالية";

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-2 border-primary/20">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">حساب التشغيل المستدام</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-7 text-muted-foreground">
              حساب مستقل تُحوَّل إليه نسبة ثابتة من الإيرادات المتكررة شهريًا لبناء
              احتياطي تشغيلي. القاعدة: لا يُسحب منه إلا بقرار من مجلس الإدارة، وهدفه
              حماية الرواتب والالتزامات الثابتة عند انقطاع أي مصدر تمويل.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* اختيار النسبة */}
      <Card>
        <CardHeader>
          <CardTitle>نسبة الادخار الشهرية</CardTitle>
          <CardDescription>
            تُحتسب من الإيراد الشهري المتكرر البالغ{" "}
            {formatCurrency(metrics.monthlyRecurringIncome)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {RATE_OPTIONS.map((rate) => {
              const active = Math.abs(rate - savingsRate) < 0.001;
              const contribution = metrics.monthlyRecurringIncome * rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSavingsRate(rate)}
                  className={cn(
                    "rounded-xl border p-4 text-start transition-all",
                    active
                      ? "border-2 border-primary bg-accent shadow-sm"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="tnum text-2xl font-bold text-primary">
                      {formatPercent(rate)}
                    </span>
                    {active && <Badge>مختارة</Badge>}
                  </div>
                  <p className="tnum mt-2 text-sm font-semibold">
                    {formatCurrency(contribution)}
                  </p>
                  <p className="text-xs text-muted-foreground">ادخار شهري</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* المؤشرات */}
      <section className="kpi-grid">
        <KpiCard
          label="المبلغ المدخر شهريًا"
          value={formatCurrency(plan6.monthlyContribution)}
          hint={`${formatPercent(savingsRate)} من الإيراد المتكرر`}
          icon={PiggyBank}
          tone="primary"
        />
        <KpiCard
          label="الاحتياطي الحالي"
          value={formatCurrency(metrics.reserve)}
          hint={`يغطي ${formatMonths(metrics.runwayMonths)}`}
          icon={ShieldCheck}
          tone={metrics.runwayMonths < 3 ? "warning" : "success"}
          progress={(metrics.runwayMonths / 6) * 100}
        />
        <KpiCard
          label="الوصول إلى احتياطي 3 أشهر"
          value={monthsLabel(plan3.monthsToTarget)}
          hint={`الهدف ${formatCurrency(plan3.targetAmount)}`}
          icon={Target}
          tone={plan3.alreadyReached ? "success" : "neutral"}
        />
        <KpiCard
          label="الوصول إلى احتياطي 6 أشهر"
          value={monthsLabel(plan6.monthsToTarget)}
          hint={`الهدف ${formatCurrency(plan6.targetAmount)}`}
          icon={Target}
          tone={plan6.alreadyReached ? "success" : "neutral"}
        />
      </section>

      {/* الرسم */}
      <ChartFrame
        title="مسار بناء الاحتياطي"
        description={`المقارنة بين الادخار من الإيراد الحالي والادخار بعد تنفيذ محفظة الاستدامة (بنفس النسبة ${formatPercent(savingsRate)})`}
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="reserveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_TOKENS.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_TOKENS.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_TOKENS.grid} vertical={false} />
            <XAxis dataKey="label" {...axisProps} reversed interval={2} />
            <YAxis
              {...axisProps}
              orientation="right"
              tickFormatter={currencyTick}
              width={70}
              domain={[0, yMax]}
              tickCount={6}
              allowDataOverflow={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={plan3.targetAmount}
              stroke={CHART_TOKENS.warning}
              strokeDasharray="5 4"
              label={{
                value: "هدف 3 أشهر",
                position: "insideTopRight",
                fill: CHART_TOKENS.warning,
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={plan6.targetAmount}
              stroke={CHART_TOKENS.success}
              strokeDasharray="5 4"
              label={{
                value: "هدف 6 أشهر",
                position: "insideTopRight",
                fill: CHART_TOKENS.success,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="afterPlan"
              name="بعد تنفيذ المحفظة"
              stroke={CHART_TOKENS.success}
              strokeWidth={2}
              fill="none"
              strokeDasharray="6 4"
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="بالإيراد الحالي"
              stroke={CHART_TOKENS.primary}
              strokeWidth={3}
              fill="url(#reserveFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>

      {/* المقارنة والتوصيات */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أثر محفظة الاستدامة على سرعة البناء</CardTitle>
            <CardDescription>
              رفع قاعدة الإيراد المتكرر أهم من رفع نسبة الادخار
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              {
                label: "الادخار الشهري بالوضع الحالي",
                value: formatCurrency(plan6.monthlyContribution),
              },
              {
                label: "الادخار الشهري بعد المحفظة",
                value: formatCurrency(afterPlan6.monthlyContribution),
                highlight: true,
              },
              {
                label: "مدة الوصول لـ 6 أشهر — الوضع الحالي",
                value: monthsLabel(plan6.monthsToTarget),
              },
              {
                label: "مدة الوصول لـ 6 أشهر — بعد المحفظة",
                value: monthsLabel(afterPlan6.monthsToTarget),
                highlight: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  row.highlight
                    ? "border-success/25 bg-success/5"
                    : "border-border bg-card",
                )}
              >
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span
                  className={cn(
                    "tnum text-sm font-bold",
                    row.highlight && "text-success",
                  )}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              قواعد تشغيل الحساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {[
                "حساب بنكي منفصل باسم «حساب التشغيل المستدام» مع تحويل تلقائي في أول كل شهر.",
                "لا يُسحب من الحساب إلا لتغطية التزامات تشغيلية بقرار من مجلس الإدارة.",
                "عند بلوغ 3 أشهر، تُخفَّض النسبة أو تُوجَّه الزيادة إلى وقف استثماري.",
                "مراجعة ربع سنوية للنسبة بناءً على نمو الإيراد المتكرر.",
                "إفصاح عن رصيد الحساب في التقرير السنوي لرفع ثقة الممولين.",
              ].map((rule) => (
                <li key={rule} className="flex gap-2.5 text-xs leading-6">
                  <Info className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
