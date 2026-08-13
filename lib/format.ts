/** تنسيق الأرقام والعملة — الريال السعودي بأرقام لاتينية لسهولة القراءة المالية */

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const SAR = "ر.س";

/** علامة الطرح الطباعية (U+2212) بدل الشرطة لتوحيد شكل الأرقام السالبة */
const withMinusSign = (formatted: string) => formatted.replace(/^-/, "−");

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return withMinusSign(numberFormatter.format(Math.round(value)));
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${withMinusSign(numberFormatter.format(Math.round(value)))} ${SAR}`;
}

/** يعرض الإشارة صراحةً — مفيد للفجوة التشغيلية */
export function formatSignedCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${numberFormatter.format(Math.abs(rounded))} ${SAR}`;
}

export function formatPercent(ratio: number, digits = 0): string {
  if (!Number.isFinite(ratio)) return "—";
  const pct = ratio * 100;
  const body = digits === 0 ? String(Math.round(pct)) : decimalFormatter.format(pct);
  return `${withMinusSign(body)}%`;
}

export function formatMonths(months: number): string {
  if (!Number.isFinite(months)) return "—";
  const rounded = Math.round(months * 10) / 10;
  if (rounded === 0) return "لا يوجد احتياطي";
  if (rounded === 1) return "شهر واحد";
  if (rounded === 2) return "شهران";
  if (rounded < 11) return `${decimalFormatter.format(rounded)} أشهر`;
  return `${decimalFormatter.format(rounded)} شهرًا`;
}

export function formatDecimal(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return withMinusSign(
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value),
  );
}

/** اختصار المبالغ الكبيرة في محاور الرسوم: 60000 -> 60 ألف */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${decimalFormatter.format(value / 1_000_000)} م`;
  if (abs >= 1000) {
    const thousands = value / 1000;
    // كسر عشري واحد للقيم الصغيرة حتى لا تتكرر نفس التسمية على المحور
    return `${Math.abs(thousands) < 10 ? decimalFormatter.format(thousands) : formatNumber(thousands)} ألف`;
  }
  return formatNumber(value);
}

/** صيغ الجمع العربية (مفرد / مثنى / جمع قلة / جمع كثرة) */
export interface ArabicForms {
  one: string;
  two: string;
  few: string;
  many: string;
}

/**
 * صياغة عدد بالعربية وفق قواعد التمييز:
 * 1 مفرد، 2 مثنى، 3–10 جمع، 11 فأكثر تمييز مفرد منصوب.
 */
export function formatArabicCount(count: number, forms: ArabicForms): string {
  const n = Math.round(count);
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return `${formatNumber(n)} ${forms.few}`;
  return `${formatNumber(n)} ${forms.many}`;
}

/** عدد صحيح من الأشهر بصياغة عربية سليمة */
export function formatMonthsCount(months: number): string {
  return formatArabicCount(months, {
    one: "شهر واحد",
    two: "شهران",
    few: "أشهر",
    many: "شهرًا",
  });
}

/** عدد مصادر الدخل بصياغة عربية سليمة */
export function formatSourcesCount(count: number): string {
  return formatArabicCount(count, {
    one: "مصدر واحد",
    two: "مصدران",
    few: "مصادر",
    many: "مصدرًا",
  });
}
