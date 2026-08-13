"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SAR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  suffix?: string;
  className?: string;
  step?: number;
}

/** حقل رقمي مالي — يعرض العملة ويمنع القيم السالبة */
export function MoneyField({
  id,
  label,
  value,
  onChange,
  hint,
  suffix = SAR,
  className,
  step = 100,
}: MoneyFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {/* الحقل بالاتجاه LTR للأرقام، لذا نستخدم مواضع فيزيائية صريحة
          حتى لا يختلف جانب رمز العملة عن جانب الحشوة */}
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={0}
          step={step}
          dir="ltr"
          className="tnum pr-14 text-left"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  className?: string;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  className,
}: TextFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
