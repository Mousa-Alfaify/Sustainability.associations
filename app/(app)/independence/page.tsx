"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Info, SlidersHorizontal } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
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
import { ScoreGauge } from "@/components/shared/score-gauge";
import { ChartFrame, ChartTooltip, CHART_TOKENS } from "@/components/charts/chart-kit";
import { useAppStore } from "@/lib/store/app-store";
import {
  BAND_BG_CLASS,
  SCORE_BANDS,
  SCORE_TARGETS,
  SCORE_WEIGHTS,
} from "@/lib/finance/independence-score";
import { formatDecimal, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEIGHT_NOTES: Record<string, string> = {
  coverage:
    "الوزن الأعلى لأن قدرة الجمعية على تغطية تشغيلها من دخل متكرر هي جوهر الاستقلال المالي.",
  diversity:
    "يُحتسب بمؤشر هيرفندال: عدة مصادر صغيرة أمام مصدر مهيمن لا تُعد تنويعًا حقيقيًا.",
  reserve:
    "الاحتياطي هو صمّام الأمان الذي يحمي الرواتب عند انقطاع أي مصدر تمويل.",
  seasonalIndependence:
    "كلما انخفض الاعتماد على موسم واحد، ارتفعت قدرة الجمعية على التخطيط طويل المدى.",
};

export default function IndependencePage() {
  const { score, metrics, comparison, scenarioActive } = useAppStore();

  const radarData = score.components.map((c) => ({
    subject: c.label,
    value: Math.round(c.ratio * 100),
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>مؤشر الاستقلال المالي</CardTitle>
            <CardDescription>درجة مركّبة من 0 إلى 100</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge
              score={score.total}
              compareTo={scenarioActive ? comparison.nextScore.total : undefined}
              size={240}
            />
            <Badge className={cn("mt-3 border", BAND_BG_CLASS[score.band.tone])}>
              {score.band.label}
            </Badge>
            <p className="mt-3 text-center text-xs leading-6 text-muted-foreground">
              {score.band.description}
            </p>
            {scenarioActive && (
              <div className="mt-4 w-full rounded-lg border border-success/20 bg-success/5 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  المؤشر بعد تطبيق السيناريو
                </p>
                <p className="tnum text-xl font-bold text-success">
                  {formatDecimal(comparison.nextScore.total)}
                  <span className="text-sm font-medium">
                    {" "}
                    (+{formatDecimal(comparison.delta.score)})
                  </span>
                </p>
              </div>
            )}
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/scenarios">
                <SlidersHorizontal className="h-4 w-4" />
                جرّب رفع المؤشر بالسيناريوهات
              </Link>
            </Button>
          </CardContent>
        </Card>

        <ChartFrame
          title="مكونات المؤشر"
          description="نسبة التحقق في كل مكوّن مقارنة بالهدف المرجعي (100%)"
          height={340}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke={CHART_TOKENS.grid} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: CHART_TOKENS.axis, fontSize: 10 }}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={(value) => `${Math.round(value)}%`} />
                }
              />
              <Radar
                name="نسبة التحقق"
                dataKey="value"
                stroke={CHART_TOKENS.primary}
                fill={CHART_TOKENS.primary}
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      {/* تفصيل المكونات */}
      <Card>
        <CardHeader>
          <CardTitle>كيف تُحتسب الدرجة؟</CardTitle>
          <CardDescription>
            كل مكوّن يُطبَّع إلى نسبة من 0 إلى 1 مقابل هدف مرجعي، ثم يُضرب في وزنه.
            الأوزان معرّفة في ملف واحد وقابلة للتعديل.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {score.components.map((c) => (
            <div key={c.key} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{c.label}</span>
                  <Badge variant="outline">الوزن {c.weight}%</Badge>
                </div>
                <span className="tnum text-sm font-bold text-primary">
                  {formatDecimal(c.points)} / {c.weight} نقطة
                </span>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${c.ratio * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>نسبة التحقق {formatPercent(c.ratio)}</span>
                <span>الهدف 100%</span>
              </div>

              <p className="mt-3 text-xs leading-6 text-foreground">{c.detail}</p>
              <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-6 text-muted-foreground">
                <Info className="mt-1 h-3 w-3 shrink-0" />
                {WEIGHT_NOTES[c.key]}
              </p>
            </div>
          ))}

          <div className="rounded-xl bg-secondary p-4">
            <p className="text-sm font-semibold">المعادلة</p>
            <p dir="ltr" className="mt-2 rounded-md bg-card p-3 text-start text-xs leading-6">
              Score = {SCORE_WEIGHTS.coverage}×min(Coverage/
              {SCORE_TARGETS.coverageTarget}, 1) + {SCORE_WEIGHTS.diversity}
              ×min(EffectiveSources/{SCORE_TARGETS.effectiveSourcesTarget}, 1) +{" "}
              {SCORE_WEIGHTS.reserve}×min(RunwayMonths/
              {SCORE_TARGETS.reserveTargetMonths}, 1) +{" "}
              {SCORE_WEIGHTS.seasonalIndependence}×clamp((
              {SCORE_TARGETS.seasonalCeiling} − SeasonalDependency) / (
              {SCORE_TARGETS.seasonalCeiling} − {SCORE_TARGETS.seasonalFloor}), 0, 1)
            </p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              EffectiveSources = 1 ÷ مؤشر هيرفندال لتركّز مصادر الدخل — حاليًا{" "}
              {formatDecimal(metrics.effectiveSourcesCount)} من أصل{" "}
              {metrics.activeSourcesCount} مصادر نشطة.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* التصنيفات */}
      <Card>
        <CardHeader>
          <CardTitle>سلّم التصنيف</CardTitle>
          <CardDescription>موقع جمعيتك على سلّم الاستدامة المالية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {SCORE_BANDS.map((band) => {
              const active = band.key === score.band.key;
              return (
                <div
                  key={band.key}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                    active
                      ? cn("border-2", BAND_BG_CLASS[band.tone])
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="tnum rounded-md bg-card px-2 py-1 text-xs font-semibold">
                      {band.min} – {band.max}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{band.label}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {band.description}
                      </p>
                    </div>
                  </div>
                  {active && (
                    <Badge className="shrink-0 border bg-card">
                      جمعيتك هنا · {formatDecimal(score.total)}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-accent p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-accent-foreground">
              أسرع طريق لرفع المؤشر هو معالجة المكوّن الأضعف: ابدأ من محفظة الاستدامة
              ثم طبّق السيناريو لترى الأثر مباشرة.
            </p>
            <Button asChild className="shrink-0">
              <Link href="/portfolio">
                محفظة الاستدامة
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
