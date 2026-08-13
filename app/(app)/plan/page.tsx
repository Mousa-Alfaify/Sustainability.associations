"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarRange,
  CircleDot,
  Flag,
  Target,
  UserRound,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  axisProps,
  CHART_TOKENS,
  ChartFrame,
  ChartTooltip,
} from "@/components/charts/chart-kit";
import { useAppStore } from "@/lib/store/app-store";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function PlanPage() {
  const { plan, portfolio, metrics, score } = useAppStore();

  const trajectory = [
    { name: "الآن", تغطية: Math.round(metrics.coverageRatio * 100), مؤشر: score.total },
    ...plan.map((quarter) => ({
      name: quarter.label,
      تغطية: Math.round(quarter.targetCoverage * 100),
      مؤشر: quarter.targetScore,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-2 border-primary/20">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarRange className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">خطة الاستدامة — 12 شهرًا</h2>
              <p className="mt-1 max-w-3xl text-sm leading-7 text-muted-foreground">
                خطة تنفيذية مقسّمة إلى أربعة أرباع، مبنية على محفظة الاستدامة المقترحة
                لجمعيتك. الهدف النهائي: الانتقال من تغطية{" "}
                {formatPercent(metrics.coverageRatio)} إلى{" "}
                {formatPercent(portfolio.coverageAfter)} من المصروف التشغيلي.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/scenarios">
              شاهد الأثر على المؤشر
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <ChartFrame
        title="مسار المستهدفات الفصلية"
        description="نسبة تغطية التشغيل ومؤشر الاستقلال المالي المستهدفان في نهاية كل ربع"
        height={300}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trajectory} margin={{ top: 10, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={CHART_TOKENS.grid} vertical={false} />
            <XAxis dataKey="name" {...axisProps} reversed />
            <YAxis
              {...axisProps}
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}`}
              width={44}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(value) => `${Math.round(value)}`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="تغطية"
              name="تغطية التشغيل %"
              stroke={CHART_TOKENS.primary}
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="مؤشر"
              name="مؤشر الاستقلال"
              stroke={CHART_TOKENS.warning}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>

      {/* الخط الزمني */}
      <div className="relative">
        <div className="absolute inset-y-0 end-[19px] hidden w-px bg-border md:block" />
        <div className="flex flex-col gap-4">
          {plan.map((quarter, index) => (
            <div
              key={quarter.id}
              className="animate-fade-up relative md:pe-12"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="absolute end-0 top-6 hidden h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-primary text-xs font-bold text-primary-foreground md:flex">
                {index + 1}
              </div>

              <Card>
                <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{quarter.label}</Badge>
                      <Badge variant="outline">{quarter.months}</Badge>
                    </div>
                    <CardTitle className="mt-2">{quarter.headline}</CardTitle>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[11px] text-muted-foreground">تغطية مستهدفة</p>
                      <p className="tnum text-lg font-bold text-primary">
                        {formatPercent(quarter.targetCoverage)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-muted-foreground">مؤشر مستهدف</p>
                      <p className="tnum text-lg font-bold text-primary">
                        {quarter.targetScore}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                        <Flag className="h-3.5 w-3.5 text-primary" />
                        الأهداف
                      </p>
                      <ul className="flex flex-col gap-2">
                        {quarter.goals.map((goal) => (
                          <li key={goal} className="flex gap-2 text-xs leading-6">
                            <CircleDot className="mt-1.5 h-3 w-3 shrink-0 text-primary" />
                            <span className="text-muted-foreground">{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                        <UserRound className="h-3.5 w-3.5 text-primary" />
                        المهام والمسؤوليات
                      </p>
                      <ul className="flex flex-col gap-2">
                        {quarter.tasks.map((task) => (
                          <li
                            key={task.title}
                            className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5"
                          >
                            <span className="text-xs leading-6 text-muted-foreground">
                              {task.title}
                            </span>
                            <Badge variant="secondary" className="shrink-0">
                              {task.owner}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-start gap-2 rounded-lg bg-accent p-3">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                    <div>
                      <p className="text-xs font-semibold text-accent-foreground">
                        مؤشر القياس في نهاية الربع
                      </p>
                      <p className="mt-0.5 text-xs leading-6 text-accent-foreground/90">
                        {quarter.kpi}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-2 border-success/25 bg-success/5">
        <CardHeader>
          <CardTitle>النتيجة المستهدفة بنهاية السنة الأولى</CardTitle>
          <CardDescription>
            بافتراض تنفيذ المحفظة وفرص الكفاءة وفق الجدول أعلاه
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "الإيراد الشهري المتكرر",
              value: formatCurrency(portfolio.projectedRecurringIncome),
              from: formatCurrency(metrics.monthlyRecurringIncome),
            },
            {
              label: "المصروف التشغيلي الشهري",
              value: formatCurrency(portfolio.projectedOperatingCost),
              from: formatCurrency(metrics.monthlyOperatingCost),
            },
            {
              label: "الفجوة التشغيلية",
              value: formatCurrency(portfolio.projectedGap),
              from: formatCurrency(metrics.operatingGap),
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="tnum mt-1 text-xl font-bold text-success">{item.value}</p>
              <p className="tnum mt-0.5 text-xs text-muted-foreground">
                من {item.from}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
