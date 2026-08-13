"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";
import type { FinancialMetrics, IndependenceScore } from "@/lib/types";
import { formatCurrency, formatMonths, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DiagnosisItem {
  severity: "critical" | "warning" | "ok";
  title: string;
  detail: string;
  evidence: string;
}

/** تشخيص المشكلة المالية — مشتق بالكامل من أرقام الجمعية */
export function buildDiagnosis(
  metrics: FinancialMetrics,
  score: IndependenceScore,
): DiagnosisItem[] {
  const items: DiagnosisItem[] = [];

  items.push(
    metrics.operatingGap < 0
      ? {
          severity: "critical",
          title: "فجوة تشغيلية شهرية غير مغطاة",
          detail:
            "الإيرادات المتكررة لا تكفي لتغطية الرواتب والإيجار والأنظمة، ويتم سدّ الفارق من التبرعات الموسمية والمنح.",
          evidence: `المصروف ${formatCurrency(metrics.monthlyOperatingCost)} مقابل إيراد متكرر ${formatCurrency(metrics.monthlyRecurringIncome)} — العجز ${formatCurrency(Math.abs(metrics.operatingGap))} شهريًا (تغطية ${formatPercent(metrics.coverageRatio)}).`,
        }
      : {
          severity: "ok",
          title: "التشغيل مغطى من إيرادات متكررة",
          detail: "الإيرادات المتكررة تغطي كامل المصروف التشغيلي الشهري.",
          evidence: `فائض شهري ${formatCurrency(metrics.operatingGap)} وتغطية ${formatPercent(metrics.coverageRatio)}.`,
        },
  );

  items.push(
    metrics.runwayMonths < 3
      ? {
          severity: metrics.runwayMonths < 2 ? "critical" : "warning",
          title: "احتياطي تشغيلي أقل من الحد الآمن",
          detail:
            "الحد الأدنى الموصى به هو احتياطي يغطي 3 أشهر، والمستهدف 6 أشهر لحماية الرواتب من أي انقطاع تمويلي.",
          evidence: `الاحتياطي ${formatCurrency(metrics.reserve)} يغطي ${formatMonths(metrics.runwayMonths)} فقط.`,
        }
      : {
          severity: metrics.runwayMonths >= 6 ? "ok" : "warning",
          title: "احتياطي تشغيلي ضمن النطاق المقبول",
          detail: "الاحتياطي يتجاوز الحد الأدنى الآمن (3 أشهر).",
          evidence: `الاحتياطي ${formatCurrency(metrics.reserve)} يغطي ${formatMonths(metrics.runwayMonths)}.`,
        },
  );

  items.push(
    metrics.seasonalDependency > 0.4
      ? {
          severity: metrics.seasonalDependency > 0.5 ? "critical" : "warning",
          title: "اعتماد مرتفع على التبرعات الموسمية",
          detail:
            "ارتباط الدخل بموسم واحد يجعل التخطيط طويل المدى غير ممكن ويعرّض الرواتب للخطر عند تراجع الحملة.",
          evidence: `التبرعات الموسمية تمثل ${formatPercent(metrics.seasonalDependency)} من إجمالي الدخل (${formatCurrency(metrics.monthlySeasonalIncome)} شهريًا كمعدل).`,
        }
      : {
          severity: "ok",
          title: "اعتماد متوازن على التبرعات الموسمية",
          detail: "نسبة الموسمية ضمن النطاق الصحي لمحفظة دخل متنوعة.",
          evidence: `نسبة الاعتماد ${formatPercent(metrics.seasonalDependency)}.`,
        },
  );

  items.push(
    metrics.effectiveSourcesCount < 3
      ? {
          severity: "warning",
          title: "تركّز مصادر الدخل",
          detail:
            "رغم وجود عدة مصادر، فإن معظم الدخل يأتي من مصدر أو مصدرين — أي أن التنويع شكلي وليس فعليًا.",
          evidence: `${metrics.activeSourcesCount} مصادر نشطة، لكن العدد الفعّال بعد ترجيح الحجم ${metrics.effectiveSourcesCount.toFixed(1)} فقط.`,
        }
      : {
          severity: "ok",
          title: "تنوع فعلي في مصادر الدخل",
          detail: "توزيع الدخل بين المصادر متوازن بدرجة مقبولة.",
          evidence: `العدد الفعّال للمصادر ${metrics.effectiveSourcesCount.toFixed(1)} من ${metrics.activeSourcesCount} مصدر نشط.`,
        },
  );

  if (metrics.monthlyRestrictedIncome > 0) {
    items.push({
      severity: "warning",
      title: "تمويل مقيّد بالمشاريع لا يغطي التشغيل",
      detail:
        "المنح غالبًا مخصصة للمشاريع ولا تسمح بتغطية الرواتب والمصاريف الإدارية، ما يترك التشغيل بلا غطاء.",
      evidence: `منح بقيمة ${formatCurrency(metrics.monthlyRestrictedIncome * 12)} سنويًا (${formatCurrency(metrics.monthlyRestrictedIncome)} شهريًا) خارج تغطية التشغيل.`,
    });
  }

  items.push({
    severity:
      score.total < 31 ? "critical" : score.total < 51 ? "warning" : "ok",
    title: `التصنيف العام: ${score.band.label}`,
    detail: score.band.description,
    evidence: `مؤشر الاستقلال المالي ${score.total.toFixed(1)} من 100.`,
  });

  return items;
}

const SEVERITY_STYLE = {
  critical: {
    icon: AlertTriangle,
    wrapper: "border-destructive/25 bg-destructive/5",
    chip: "bg-destructive/10 text-destructive",
    label: "حرج",
  },
  warning: {
    icon: TrendingDown,
    wrapper: "border-warning/25 bg-warning/5",
    chip: "bg-warning/10 text-warning",
    label: "تحذير",
  },
  ok: {
    icon: CheckCircle2,
    wrapper: "border-success/25 bg-success/5",
    chip: "bg-success/10 text-success",
    label: "سليم",
  },
} as const;

export function DiagnosisPanel({ items }: { items: DiagnosisItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => {
        const style = SEVERITY_STYLE[item.severity];
        const Icon = style.icon;
        return (
          <div
            key={item.title}
            className={cn(
              "animate-fade-up rounded-xl border p-4",
              style.wrapper,
            )}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  style.chip,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-medium",
                      style.chip,
                    )}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-6 text-muted-foreground">
                  {item.detail}
                </p>
                <p className="mt-2 rounded-md bg-card/70 px-2.5 py-1.5 text-xs font-medium leading-6">
                  {item.evidence}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
