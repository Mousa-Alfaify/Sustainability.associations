import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type KpiTone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONE_STYLES: Record<KpiTone, { icon: string; value: string }> = {
  neutral: { icon: "bg-secondary text-muted-foreground", value: "text-foreground" },
  primary: { icon: "bg-primary/10 text-primary", value: "text-foreground" },
  success: { icon: "bg-success/10 text-success", value: "text-success" },
  warning: { icon: "bg-warning/10 text-warning", value: "text-warning" },
  danger: { icon: "bg-destructive/10 text-destructive", value: "text-destructive" },
};

export interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: KpiTone;
  /** شريط تقدم اختياري 0..100 */
  progress?: number;
  footer?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  progress,
  footer,
  className,
}: KpiCardProps) {
  const styles = TONE_STYLES[tone];
  return (
    <Card className={cn("flex flex-col justify-between p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "tnum mt-2 whitespace-nowrap text-[1.35rem] font-bold tracking-tight sm:text-2xl",
              styles.value,
            )}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              styles.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              tone === "danger"
                ? "bg-destructive"
                : tone === "warning"
                  ? "bg-warning"
                  : tone === "success"
                    ? "bg-success"
                    : "bg-primary",
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-3 text-xs leading-5 text-muted-foreground">{hint}</p>}
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
