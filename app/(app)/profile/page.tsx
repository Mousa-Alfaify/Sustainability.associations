"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Check,
  Coins,
  Download,
  Handshake,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoneyField, TextField } from "@/components/shared/money-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { SECTOR_OPTIONS } from "@/lib/data/demo-org";
import { analyzeOrg } from "@/lib/finance/calculations";
import type { OrgProfile } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/format";

const toLines = (list: string[]) => list.join("\n");
const fromLines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** يتحقق أن الكائن المستورد يحمل بنية ملف جمعية صالحة قبل تطبيقه */
function isValidOrgProfile(value: unknown): value is OrgProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.expenses === "object" &&
    v.expenses !== null &&
    typeof v.income === "object" &&
    v.income !== null &&
    typeof v.reserve === "number" &&
    Array.isArray(v.assets) &&
    Array.isArray(v.expertise) &&
    Array.isArray(v.partnerships)
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { mode, profile, setProfile, resetToDemo, markAnalyzed, saveStatus, saveError } =
    useAppStore();
  const [draft, setDraft] = React.useState<OrgProfile>(profile);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [localSaveError, setLocalSaveError] = React.useState<string | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // مزامنة المسودة عند تغيّر الملف من مكان آخر (إعادة الضبط، أو تعديل زميل في الوضع السحابي)
  React.useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const preview = React.useMemo(() => analyzeOrg(draft), [draft]);

  function patch(partial: Partial<OrgProfile>) {
    setDraft((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  }

  function patchExpense(key: keyof OrgProfile["expenses"], value: number) {
    setDraft((prev) => ({
      ...prev,
      expenses: { ...prev.expenses, [key]: value },
    }));
    setSaved(false);
  }

  function patchIncome(key: keyof OrgProfile["income"], value: number) {
    setDraft((prev) => ({ ...prev, income: { ...prev.income, [key]: value } }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setLocalSaveError(null);
    try {
      await setProfile(draft);
      markAnalyzed();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setLocalSaveError((error as Error).message);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    resetToDemo();
    setResetOpen(false);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (draft.name || "جمعية")
      .trim()
      .replace(/[\\/:*?"<>|\s]+/g, "-");
    a.href = url;
    a.download = `ملف-الجمعية-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isValidOrgProfile(parsed)) {
          setImportError("الملف لا يطابق بنية ملف الجمعية المتوقعة — تأكد من أنه ملف تصدير من هذه المنصة.");
          return;
        }
        setDraft(parsed);
        setSaved(false);
      } catch {
        setImportError("تعذّرت قراءة الملف — تأكد من أنه بصيغة JSON صحيحة.");
      }
    };
    reader.onerror = () => setImportError("تعذّرت قراءة الملف من جهازك.");
    reader.readAsText(file);
  }

  const combinedError = localSaveError ?? (saveStatus === "error" ? saveError : null);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>ملف الجمعية</CardTitle>
            <CardDescription>
              كل المؤشرات في المنصة تُحتسب من هذه البيانات. عدّل أي رقم وستتحدث
              التحليلات والمحفظة والخطة تلقائيًا.
              {mode === "cloud" && " التعديلات تُحفظ لكل أعضاء فريقك."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button variant="outline" size="sm" onClick={triggerImport}>
              <Upload className="h-4 w-4" />
              استيراد
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4" />
              تصدير JSON
            </Button>
            {mode === "local" && (
              <Button variant="outline" onClick={() => setResetOpen(true)}>
                <RotateCcw className="h-4 w-4" />
                بيانات تجريبية
              </Button>
            )}
            <Button onClick={() => void save().catch(() => {})} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "جارٍ الحفظ…" : saved ? "تم الحفظ" : "حفظ البيانات"}
            </Button>
          </div>
        </CardHeader>
        {(combinedError || importError) && (
          <CardContent className="pt-0">
            <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs leading-6 text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {combinedError || importError}
            </p>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Tabs defaultValue="general">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="general">
              <Building2 className="h-4 w-4" />
              بيانات عامة
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Wallet className="h-4 w-4" />
              المصاريف التشغيلية
            </TabsTrigger>
            <TabsTrigger value="income">
              <Coins className="h-4 w-4" />
              مصادر الدخل
            </TabsTrigger>
            <TabsTrigger value="capabilities">
              <Handshake className="h-4 w-4" />
              الأصول والقدرات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>البيانات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <TextField
                  id="name"
                  label="اسم الجمعية"
                  value={draft.name}
                  onChange={(v) => patch({ name: v })}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sector">مجال الجمعية</Label>
                  <Select
                    value={draft.sector}
                    onValueChange={(v) => patch({ sector: v })}
                  >
                    <SelectTrigger id="sector">
                      <SelectValue placeholder="اختر المجال" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTOR_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <TextField
                  id="city"
                  label="المدينة"
                  value={draft.city}
                  onChange={(v) => patch({ city: v })}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="employees">عدد الموظفين</Label>
                  <Input
                    id="employees"
                    type="number"
                    min={0}
                    dir="ltr"
                    className="tnum text-start"
                    value={draft.employees}
                    onChange={(e) =>
                      patch({ employees: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="beneficiaries">عدد المستفيدين</Label>
                  <Input
                    id="beneficiaries"
                    type="number"
                    min={0}
                    dir="ltr"
                    className="tnum text-start"
                    value={draft.beneficiaries}
                    onChange={(e) =>
                      patch({
                        beneficiaries: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <MoneyField
                  id="annualBudget"
                  label="الميزانية السنوية"
                  value={draft.annualBudget}
                  onChange={(v) => patch({ annualBudget: v })}
                  step={10_000}
                />
                <MoneyField
                  id="reserve"
                  label="الاحتياطي النقدي التشغيلي الحالي"
                  value={draft.reserve}
                  onChange={(v) => patch({ reserve: v })}
                  step={5_000}
                  hint="المبلغ المتاح فعليًا لتغطية التشغيل عند انقطاع التمويل"
                  className="sm:col-span-2"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>المصاريف التشغيلية الشهرية</CardTitle>
                <CardDescription>
                  أدخل القيم الشهرية. المجموع هو «المصروف التشغيلي الشهري» المستخدم في
                  حساب الفجوة وفترة الأمان المالي.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <MoneyField
                  id="salaries"
                  label="الرواتب والأجور"
                  value={draft.expenses.salaries}
                  onChange={(v) => patchExpense("salaries", v)}
                  step={1000}
                />
                <MoneyField
                  id="rent"
                  label="الإيجارات"
                  value={draft.expenses.rent}
                  onChange={(v) => patchExpense("rent", v)}
                  step={500}
                />
                <MoneyField
                  id="technology"
                  label="التقنية والأنظمة"
                  value={draft.expenses.technology}
                  onChange={(v) => patchExpense("technology", v)}
                  step={500}
                />
                <MoneyField
                  id="admin"
                  label="الخدمات الإدارية"
                  value={draft.expenses.admin}
                  onChange={(v) => patchExpense("admin", v)}
                  step={500}
                />
                <MoneyField
                  id="marketing"
                  label="التسويق"
                  value={draft.expenses.marketing}
                  onChange={(v) => patchExpense("marketing", v)}
                  step={500}
                />
                <MoneyField
                  id="otherExpenses"
                  label="مصاريف تشغيلية أخرى"
                  value={draft.expenses.other}
                  onChange={(v) => patchExpense("other", v)}
                  step={500}
                />
                <div className="rounded-lg bg-secondary p-4 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      إجمالي المصروف التشغيلي الشهري
                    </span>
                    <span className="tnum text-lg font-bold">
                      {formatCurrency(preview.monthlyOperatingCost)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ما يعادل {formatCurrency(preview.monthlyOperatingCost * 12)} سنويًا
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>الدخل غير المتكرر</CardTitle>
                  <CardDescription>
                    تُدخل بقيمتها السنوية، ولا تُحتسب ضمن تغطية التشغيل لأنها موسمية أو
                    مقيّدة بالمشاريع.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <MoneyField
                    id="seasonal"
                    label="التبرعات الموسمية (سنويًا)"
                    value={draft.income.seasonalDonationsAnnual}
                    onChange={(v) => patchIncome("seasonalDonationsAnnual", v)}
                    step={10_000}
                    hint="حملات رمضان والمواسم والتبرعات غير المنتظمة"
                  />
                  <MoneyField
                    id="grants"
                    label="المنح (سنويًا)"
                    value={draft.income.grantsAnnual}
                    onChange={(v) => patchIncome("grantsAnnual", v)}
                    step={10_000}
                    hint="منح المشاريع المقيدة بأوجه صرف محددة"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الدخل المتكرر</CardTitle>
                  <CardDescription>
                    هذه هي المصادر التي تُحتسب في تغطية المصاريف التشغيلية.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <MoneyField
                    id="recurringDonations"
                    label="التبرعات المتكررة (سنويًا)"
                    value={draft.income.recurringDonationsAnnual}
                    onChange={(v) => patchIncome("recurringDonationsAnnual", v)}
                    step={5_000}
                    hint="التبرع الشهري التلقائي والداعمون المنتظمون"
                  />
                  <MoneyField
                    id="contracts"
                    label="عقود الخدمات (شهريًا)"
                    value={draft.income.serviceContractsMonthly}
                    onChange={(v) => patchIncome("serviceContractsMonthly", v)}
                    step={1000}
                  />
                  <MoneyField
                    id="endowment"
                    label="عوائد الأوقاف (شهريًا)"
                    value={draft.income.endowmentMonthly}
                    onChange={(v) => patchIncome("endowmentMonthly", v)}
                    step={1000}
                  />
                  <MoneyField
                    id="commercial"
                    label="الإيرادات التجارية (شهريًا)"
                    value={draft.income.commercialMonthly}
                    onChange={(v) => patchIncome("commercialMonthly", v)}
                    step={1000}
                  />
                  <MoneyField
                    id="subscriptions"
                    label="الاشتراكات (شهريًا)"
                    value={draft.income.subscriptionsMonthly}
                    onChange={(v) => patchIncome("subscriptionsMonthly", v)}
                    step={500}
                  />
                  <MoneyField
                    id="otherIncome"
                    label="مصادر دخل أخرى (شهريًا)"
                    value={draft.income.otherMonthly}
                    onChange={(v) => patchIncome("otherMonthly", v)}
                    step={500}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="capabilities">
            <Card>
              <CardHeader>
                <CardTitle>الأصول والخبرات والشراكات</CardTitle>
                <CardDescription>
                  يستخدمها مُحرك المحفظة لترشيح مصادر الدخل الأنسب. سطر واحد لكل عنصر.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="assets">الأصول التي تمتلكها الجمعية</Label>
                  <Textarea
                    id="assets"
                    rows={5}
                    value={toLines(draft.assets)}
                    onChange={(e) => patch({ assets: fromLines(e.target.value) })}
                    placeholder={"مقر إداري وقاعات تدريب\nمنصة إلكترونية ومحتوى مسجّل"}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="expertise">
                    الخبرات القابلة للتحويل إلى خدمات مدفوعة
                  </Label>
                  <Textarea
                    id="expertise"
                    rows={5}
                    value={toLines(draft.expertise)}
                    onChange={(e) => patch({ expertise: fromLines(e.target.value) })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="partnerships">الشراكات الحالية</Label>
                  <Textarea
                    id="partnerships"
                    rows={4}
                    value={toLines(draft.partnerships)}
                    onChange={(e) => patch({ partnerships: fromLines(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ملخص لحظي */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>الملخص اللحظي</CardTitle>
              <CardDescription>يتحدث مع كل تعديل قبل الحفظ</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                {
                  label: "المصروف التشغيلي الشهري",
                  value: formatCurrency(preview.monthlyOperatingCost),
                },
                {
                  label: "الإيراد المتكرر الشهري",
                  value: formatCurrency(preview.monthlyRecurringIncome),
                },
                {
                  label: "الفجوة التشغيلية",
                  value: formatCurrency(Math.abs(preview.operatingGap)),
                  tone:
                    preview.operatingGap < 0 ? "text-destructive" : "text-success",
                },
                {
                  label: "نسبة تغطية التشغيل",
                  value: formatPercent(preview.coverageRatio),
                },
                {
                  label: "الاعتماد على الموسمية",
                  value: formatPercent(preview.seasonalDependency),
                },
                {
                  label: "عدد مصادر الدخل النشطة",
                  value: `${preview.activeSourcesCount}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className={`tnum text-sm font-semibold ${row.tone ?? ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}

              <Button
                className="mt-2 w-full"
                disabled={saving}
                onClick={async () => {
                  try {
                    await save();
                    router.push("/analysis");
                  } catch {
                    // الخطأ معروض أعلى الصفحة — نبقى هنا كي يراه المستخدم
                  }
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                احفظ وحلّل الجمعية
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="إعادة الضبط إلى البيانات التجريبية"
        description="سيُستبدل ملف الجمعية الحالي بالكامل ببيانات جمعية «نماء للتنمية» التجريبية، وستُفقد أي تعديلات غير محفوظة. هذا الإجراء محلي فقط ولا يمكن التراجع عنه."
        confirmLabel="إعادة الضبط"
        onConfirm={handleReset}
      />
    </div>
  );
}
