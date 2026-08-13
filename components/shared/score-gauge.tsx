"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { bandForScore, BAND_HEX } from "@/lib/finance/independence-score";
import { formatDecimal } from "@/lib/format";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  /** يعرض قيمة مقارنة (الوضع بعد الخطة) كقوس شفاف */
  compareTo?: number;
  label?: string;
  className?: string;
}

/**
 * مؤشر نصف دائري لعرض درجة الاستقلال المالي مع حركة انتقالية سلسة
 * عند تغيّر السيناريو — وهي اللحظة البصرية الأهم في العرض.
 */
export function ScoreGauge({
  score,
  size = 220,
  compareTo,
  label = "مؤشر الاستقلال المالي",
  className,
}: ScoreGaugeProps) {
  const [animated, setAnimated] = React.useState(0);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // نصف دائرة
  const clamped = Math.min(100, Math.max(0, animated));
  const band = bandForScore(score);
  const color = BAND_HEX[band.tone];

  const dash = (clamped / 100) * circumference;
  const compareDash =
    typeof compareTo === "number"
      ? (Math.min(100, Math.max(0, compareTo)) / 100) * circumference
      : null;

  const cx = size / 2;
  const cy = size / 2;
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size / 2 + stroke}
        viewBox={`0 0 ${size} ${size / 2 + stroke}`}
        role="img"
        aria-label={`${label}: ${formatDecimal(score)} من 100`}
      >
        <path
          d={arcPath}
          fill="none"
          stroke="hsl(214 25% 92%)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {compareDash !== null && (
          <path
            d={arcPath}
            fill="none"
            stroke={BAND_HEX[bandForScore(compareTo ?? 0).tone]}
            strokeOpacity={0.25}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${compareDash} ${circumference}`}
          />
        )}
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 900ms ease-out, stroke 500ms ease" }}
        />
      </svg>
      <div className="-mt-10 flex flex-col items-center">
        <span className="tnum text-4xl font-bold" style={{ color }}>
          {formatDecimal(score)}
        </span>
        <span className="text-xs text-muted-foreground">من 100</span>
      </div>
    </div>
  );
}
