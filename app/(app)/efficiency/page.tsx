"use client";

import * as React from "react";
import { Check, Info, Scissors, TrendingDown, Wallet } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  axisProps,
  CHART_TOKENS,
  ChartFrame,
  ChartTooltip,
  currencyTick,
} from "@/components/charts/chart-kit";
import { useAppStore } from "@/lib/store/app-store";
import { EXPENSE_LABELS } from "@/lib/finance/calculations";
import type { Difficulty, Priority } from "@/lib/types";
import { formatArabicCount, formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE_VARIANT: Record<Difficulty, "success" | "warning" | "danger"> = {
  منخفضة: "success",
  متوسطة: "warning",
  مرتفعة: "danger",
};

const IMPACT_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  عالي: "success",
  متوسط: "warning",
  منخفض: "outline",
};

const PRIORITY_VARIANT: Record<Priority, "default" | "secondary" | "outline"> = {
  عالية: "default",
  متوسطة: "secondary",
  منخفضة: "outline",
};

export default function EfficiencyPage() {
  const { metrics, opportunities, scenario, setScenario } = useAppStore();
  const [selected, setSelected] = React.useState<string[]>(() =>
    opportunities.filter((o) => o.recommended).map((o) => o.id),
  );

  React.useEffect(() => {
    setSelected(opportunities.filter((o) => o.recommended).map((o) => o.id));
  }, [opportunities]);

  const selectedSavings = opportunities
    .filter((o) => selected.includes(o.id))
    .reduce((sum, o) => sum + o.monthlySaving, 0);

  const totalPotential = opportunities.reduce((sum, o) => sum + o.monthlySaving, 0);

  const chartData = opportunities.map((o) => ({
    name: o.name.length > 28 ? `${o.name.slice(0, 26)}…` : o.name,
    value: o.monthlySaving,
    selected: selected.includes(o.id),
  }));

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function applyToScenario() {
    setScenario((prev) => ({ ...prev, expenseReduction: selectedSavings }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">فرص تحسين الكفاءة</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-7 text-muted-foreground">
              كل ريال تُوفّره يساوي ريالًا تحصّله — لكن بتكلفة أقل ووقت أسرع. الفرص
              أدناه مبنية على بنود مصروفاتك الفعلية، ولا تشمل خفض الرواتب لأن فقدان
              الكفاءات هو أعلى تكلفة على الجمعية.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="kpi-grid">
        <KpiCard
          label="المصروف التشغيلي الحالي"
          value={formatCurrency(metrics.monthlyOperatingCost)}
          icon={Wallet}
        />
        <KpiCard
          label="إجمالي الفرص المتاحة"
          value={formatCurrency(totalPotential)}
          hint={`${formatPercent(totalPotential / metrics.monthlyOperatingCost)} من المصروف التشغيلي`}
          icon={TrendingDown}
          tone="primary"
        />
        <KpiCard
          label="التوفير من الفرص المختارة"
          value={formatCurrency(selectedSavings)}
          hint={`${formatArabicCount(selected.length, {
            one: "فرصة واحدة مختارة",
            two: "فرصتان مختارتان",
            few: "فرص مختارة",
            many: "فرصة مختارة",
          })} من ${opportunities.length}`}
          icon={Check}
          tone="success"
          progress={
            totalPotential > 0 ? (selectedSavings / totalPotential) * 100 : 0
          }
        />
        <KpiCard
          label="المصروف بعد التوفير"
          value={formatCurrency(metrics.monthlyOperatingCost - selectedSavings)}
          hint={`توفير سنوي ${formatCurrency(selectedSavings * 12)}`}
          icon={Wallet}
          tone="success"
        />
      </section>

      <ChartFrame
        title="التوفير الشهري لكل فرصة"
        description="الأعمدة الملوّنة هي الفرص المختارة حاليًا"
        height={320}
        action={
          <Button size="sm" onClick={applyToScenario}>
            طبّق على السيناريو
          </Button>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
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
              width={190}
              tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Bar
              dataKey="value"
              name="التوفير الشهري"
              radius={[0, 6, 6, 0]}
              barSize={16}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.selected ? CHART_TOKENS.primary : CHART_TOKENS.neutral}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>قائمة الفرص</CardTitle>
            <CardDescription>
              اختر الفرص التي تناسب جمعيتك ثم طبّقها على السيناريو لترى الأثر على
              المؤشر.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              التوفير المختار:{" "}
              <span className="tnum font-bold text-foreground">
                {formatCurrency(selectedSavings)}
              </span>
            </span>
            <Button size="sm" onClick={applyToScenario}>
              طبّق على السيناريو
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {opportunities.map((opportunity) => {
            const isSelected = selected.includes(opportunity.id);
            return (
              <div
                key={opportunity.id}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  isSelected
                    ? "border-primary/40 bg-accent/60"
                    : "border-border bg-card",
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(opportunity.id)}
                      aria-pressed={isSelected}
                      aria-label={`اختيار ${opportunity.name}`}
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-card hover:border-primary/50",
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{opportunity.name}</p>
                        <Badge variant={PRIORITY_VARIANT[opportunity.priority]}>
                          أولوية {opportunity.priority}
                        </Badge>
                        <Badge variant="outline">
                          {EXPENSE_LABELS[opportunity.targetExpense]}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-xs leading-6 text-muted-foreground">
                        {opportunity.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-4 lg:flex-nowrap">
                    <div className="text-center">
                      <p className="text-[11px] text-muted-foreground">توفير شهري</p>
                      <p className="tnum text-lg font-bold text-primary">
                        {formatCurrency(opportunity.monthlySaving)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 text-[11px] text-muted-foreground">
                        سهولة التطبيق
                      </p>
                      <Badge variant={EASE_VARIANT[opportunity.ease]}>
                        {opportunity.ease}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 text-[11px] text-muted-foreground">الأثر</p>
                      <Badge variant={IMPACT_VARIANT[opportunity.impact]}>
                        {opportunity.impact}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs leading-6 text-muted-foreground">
            <Info className="mt-1 h-3.5 w-3.5 shrink-0" />
            <span>
              خفض المصروفات وحده لا يبني الاستدامة — قيمته الحقيقية أنه يقلّص الفجوة
              فورًا بينما تُبنى مصادر الدخل المتكررة خلال ٣ إلى ٩ أشهر. حاليًا مُطبَّق
              على السيناريو: {formatCurrency(scenario.expenseReduction)} شهريًا.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
