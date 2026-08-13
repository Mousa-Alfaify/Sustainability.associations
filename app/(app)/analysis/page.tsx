"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, Divide, Minus, Plus, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  axisProps,
  CHART_TOKENS,
  ChartFrame,
  ChartTooltip,
  currencyTick,
} from "@/components/charts/chart-kit";
import {
  buildDiagnosis,
  DiagnosisPanel,
} from "@/components/dashboard/diagnosis-panel";
import { useAppStore } from "@/lib/store/app-store";
import { EXPENSE_LABELS } from "@/lib/finance/calculations";
import {
  formatCurrency,
  formatDecimal,
  formatMonths,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface FormulaCardProps {
  title: string;
  formula: string;
  terms: { label: string; value: string }[];
  result: string;
  note: string;
  tone?: "neutral" | "danger" | "success";
  icon: React.ElementType;
}

function FormulaCard({
  title,
  formula,
  terms,
  result,
  note,
  tone = "neutral",
  icon: Icon,
}: FormulaCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
        <p className="rounded-md bg-muted px-2.5 py-1.5 text-xs leading-6 text-muted-foreground">
          {formula}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between">
        <ul className="flex flex-col gap-1.5">
          {terms.map((term) => (
            <li
              key={term.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{term.label}</span>
              <span className="tnum font-medium">{term.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-3">
          <p
            className={cn(
              "tnum text-xl font-bold",
              tone === "danger"
                ? "text-destructive"
                : tone === "success"
                  ? "text-success"
                  : "text-foreground",
            )}
          >
            {result}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalysisPage() {
  const { profile, metrics, score, portfolio } = useAppStore();
  const diagnosis = React.useMemo(
    () => buildDiagnosis(metrics, score),
    [metrics, score],
  );

  const expenseKeys = Object.keys(profile.expenses) as (keyof typeof profile.expenses)[];

  const gapChart = [
    {
      name: "المصروف التشغيلي",
      value: metrics.monthlyOperatingCost,
      fill: CHART_TOKENS.danger,
    },
    {
      name: "الإيراد المتكرر",
      value: metrics.monthlyRecurringIncome,
      fill: CHART_TOKENS.primary,
    },
    {
      name: "الفجوة",
      value: Math.abs(metrics.operatingGap),
      fill: CHART_TOKENS.warning,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* المعادلات الأربع */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FormulaCard
          icon={Plus}
          title="المصروف التشغيلي الشهري"
          formula="الرواتب + الإيجارات + التقنية + الإدارة + التسويق + أخرى"
          terms={expenseKeys
            .filter((key) => profile.expenses[key] > 0)
            .map((key) => ({
              label: EXPENSE_LABELS[key],
              value: formatCurrency(profile.expenses[key]),
            }))}
          result={formatCurrency(metrics.monthlyOperatingCost)}
          note={`ما يعادل ${formatCurrency(metrics.monthlyOperatingCost * 12)} سنويًا`}
        />

        <FormulaCard
          icon={Calculator}
          title="الإيراد الشهري المتكرر"
          formula="مجموع المصادر المتكررة فقط (باستثناء الموسمية والمنح المقيدة)"
          terms={metrics.streams
            .filter((s) => s.recurring && s.monthly > 0)
            .map((s) => ({ label: s.label, value: formatCurrency(s.monthly) }))}
          result={formatCurrency(metrics.monthlyRecurringIncome)}
          note={`يغطي ${formatPercent(metrics.coverageRatio)} من المصروف التشغيلي`}
        />

        <FormulaCard
          icon={Minus}
          title="الفجوة التشغيلية"
          formula="الإيراد المتكرر − المصروف التشغيلي"
          terms={[
            {
              label: "الإيراد المتكرر",
              value: formatCurrency(metrics.monthlyRecurringIncome),
            },
            {
              label: "المصروف التشغيلي",
              value: `− ${formatCurrency(metrics.monthlyOperatingCost)}`,
            },
          ]}
          result={`${metrics.operatingGap < 0 ? "عجز " : "فائض "}${formatCurrency(Math.abs(metrics.operatingGap))}`}
          note={
            metrics.operatingGap < 0
              ? "هذا المبلغ يُغطى حاليًا من التبرعات الموسمية والمنح — وهو مصدر الخطر"
              : "فائض شهري يمكن توجيهه لبناء الاحتياطي"
          }
          tone={metrics.operatingGap < 0 ? "danger" : "success"}
        />

        <FormulaCard
          icon={Divide}
          title="فترة الأمان المالي"
          formula="الاحتياطي النقدي ÷ المصروف التشغيلي الشهري"
          terms={[
            { label: "الاحتياطي النقدي", value: formatCurrency(metrics.reserve) },
            {
              label: "المصروف الشهري",
              value: `÷ ${formatCurrency(metrics.monthlyOperatingCost)}`,
            },
          ]}
          result={formatMonths(metrics.runwayMonths)}
          note="عدد الأشهر التي تستطيع الجمعية الاستمرار بها بدون أي تمويل جديد"
          tone={metrics.runwayMonths < 3 ? "danger" : "success"}
        />
      </section>

      {/* الرسوم */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="الفجوة التشغيلية الشهرية"
          description="الفرق بين ما تنفقه الجمعية شهريًا وما تحصّله من مصادر يمكن الاعتماد عليها"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gapChart} margin={{ top: 10, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={CHART_TOKENS.grid} vertical={false} />
              <XAxis dataKey="name" {...axisProps} reversed interval={0} />
              <YAxis
                {...axisProps}
                orientation="right"
                tickFormatter={currencyTick}
                width={64}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" name="المبلغ الشهري" radius={[8, 8, 0, 0]}>
                {gapChart.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="المصادر المتكررة مقابل غير المتكررة"
          description="المعدل الشهري لكل مصدر دخل بعد تطبيع القيم السنوية"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.streams
                .filter((s) => s.monthly > 0)
                .map((s) => ({
                  name: s.label,
                  value: Math.round(s.monthly),
                  recurring: s.recurring,
                }))}
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
                width={120}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" name="المعدل الشهري" radius={[0, 6, 6, 0]} barSize={18}>
                {metrics.streams
                  .filter((s) => s.monthly > 0)
                  .map((s, index) => (
                    <Cell
                      key={index}
                      fill={s.recurring ? CHART_TOKENS.primary : CHART_TOKENS.neutral}
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </section>

      {/* جدول المصادر */}
      <Card>
        <CardHeader>
          <CardTitle>تصنيف مصادر الدخل</CardTitle>
          <CardDescription>
            الفصل بين المتكرر وغير المتكرر هو أساس التحليل: المنح والتبرعات الموسمية لا
            تُحتسب في تغطية التشغيل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المصدر</TableHead>
                <TableHead>الطبيعة</TableHead>
                <TableHead>المعدل الشهري</TableHead>
                <TableHead>القيمة السنوية</TableHead>
                <TableHead>النسبة من الدخل</TableHead>
                <TableHead>يغطي التشغيل؟</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.streams
                .filter((s) => s.monthly > 0)
                .map((stream) => (
                  <TableRow key={stream.key}>
                    <TableCell className="font-medium">{stream.label}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stream.recurring
                            ? "success"
                            : stream.seasonal
                              ? "warning"
                              : "outline"
                        }
                      >
                        {stream.recurring
                          ? "متكرر"
                          : stream.seasonal
                            ? "موسمي"
                            : "مقيّد بالمشاريع"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tnum">
                      {formatCurrency(stream.monthly)}
                    </TableCell>
                    <TableCell className="tnum">
                      {formatCurrency(stream.annual)}
                    </TableCell>
                    <TableCell className="tnum">
                      {formatPercent(
                        metrics.totalMonthlyIncome > 0
                          ? stream.monthly / metrics.totalMonthlyIncome
                          : 0,
                      )}
                    </TableCell>
                    <TableCell>
                      {stream.recurring ? (
                        <span className="text-success">نعم</span>
                      ) : (
                        <span className="text-muted-foreground">لا</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              <TableRow className="bg-muted/60 font-semibold">
                <TableCell>الإجمالي</TableCell>
                <TableCell>—</TableCell>
                <TableCell className="tnum">
                  {formatCurrency(metrics.totalMonthlyIncome)}
                </TableCell>
                <TableCell className="tnum">
                  {formatCurrency(metrics.totalAnnualIncome)}
                </TableCell>
                <TableCell className="tnum">100%</TableCell>
                <TableCell className="tnum">
                  {formatPercent(
                    metrics.totalMonthlyIncome > 0
                      ? metrics.monthlyRecurringIncome / metrics.totalMonthlyIncome
                      : 0,
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">إجمالي الدخل السنوي</p>
              <p className="tnum mt-1 text-lg font-bold">
                {formatCurrency(metrics.totalAnnualIncome)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">
                العدد الفعّال لمصادر الدخل
              </p>
              <p className="tnum mt-1 text-lg font-bold">
                {formatDecimal(metrics.effectiveSourcesCount)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">
                نسبة الدخل المتكرر من الإجمالي
              </p>
              <p className="tnum mt-1 text-lg font-bold">
                {formatPercent(
                  metrics.totalMonthlyIncome > 0
                    ? metrics.monthlyRecurringIncome / metrics.totalMonthlyIncome
                    : 0,
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التشخيص */}
      <Card>
        <CardHeader>
          <CardTitle>تشخيص المشكلة</CardTitle>
          <CardDescription>
            ملاحظات مستخرجة آليًا من أرقام جمعيتك، مرتبة حسب الخطورة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DiagnosisPanel items={diagnosis} />
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-accent p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-accent-foreground">
              الحل المقترح: {portfolio.sources.length} مصادر دخل متكررة تضيف{" "}
              <span className="font-semibold">
                {formatCurrency(portfolio.newMonthlyRevenue)}
              </span>{" "}
              شهريًا، مع توفير {formatCurrency(portfolio.targetedSavings)} من تحسين
              الكفاءة.
            </p>
            <Button asChild className="shrink-0">
              <Link href="/portfolio">
                <Sparkles className="h-4 w-4" />
                ابنِ محفظة الاستدامة
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
