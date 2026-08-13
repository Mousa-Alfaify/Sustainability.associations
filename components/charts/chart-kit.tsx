"use client";

import * as React from "react";
import type { TooltipProps } from "recharts";
import { formatCompact, formatCurrency } from "@/lib/format";

/** لوحة ألوان مؤسسية محدودة — تجنّبًا لازدحام الألوان */
export const CHART_COLORS = [
  "#0f5f56",
  "#4a9d92",
  "#3f6f9c",
  "#c2740f",
  "#7c8ba1",
  "#9ec5be",
  "#b45309",
  "#334155",
];

export const CHART_TOKENS = {
  grid: "#e5eaf0",
  axis: "#64748b",
  primary: "#0f5f56",
  primarySoft: "#9ec5be",
  danger: "#b91c1c",
  success: "#1c7a53",
  warning: "#c2740f",
  neutral: "#94a3b8",
};

export const axisProps = {
  tick: { fill: CHART_TOKENS.axis, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: CHART_TOKENS.grid },
} as const;

export function currencyTick(value: number): string {
  return formatCompact(value);
}

interface ChartTooltipProps extends TooltipProps<number, string> {
  /** تنسيق مخصص للقيمة */
  valueFormatter?: (value: number) => string;
  labelSuffix?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = formatCurrency,
  labelSuffix,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      dir="rtl"
      className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-elevated"
    >
      {label !== undefined && (
        <p className="mb-1 font-semibold text-foreground">
          {String(label)}
          {labelSuffix ?? ""}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: entry.color ?? CHART_TOKENS.primary }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="tnum font-semibold text-foreground">
              {valueFormatter(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** غلاف موحّد لعنوان الرسم البياني */
export function ChartFrame({
  title,
  description,
  action,
  children,
  height = 300,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </div>
  );
}
