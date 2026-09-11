"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Building2, KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";

const ROLE_OPTIONS = [
  "مدير الجمعية",
  "المدير المالي",
  "المدير التنفيذي",
  "مسؤول الاستدامة المالية",
];

/**
 * صفحة أول دخول: يُنشئ المستخدم جمعيته الخاصة، أو ينضم إلى جمعية
 * زملائه عبر رمز الدعوة الذي يشاركونه معه. تظهر فقط في الوضع السحابي
 * لمستخدم مسجَّل دخوله وليس عضوًا في أي جمعية بعد.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { mode, authStatus, orgStatus, userName, createOrg, joinOrg, onboardingError, onboardingBusy, clearOnboardingError, logout } =
    useAppStore();

  const [tab, setTab] = React.useState<"create" | "join">("create");
  const [orgName, setOrgName] = React.useState("");
  const [role, setRole] = React.useState(ROLE_OPTIONS[0]);
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    if (mode === "local") {
      router.replace("/");
      return;
    }
    if (authStatus === "signed-out") {
      router.replace("/");
      return;
    }
    if (orgStatus === "ready") {
      router.replace("/dashboard");
    }
  }, [mode, authStatus, orgStatus, router]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    clearOnboardingError();
    try {
      await createOrg(orgName, role);
      router.replace("/dashboard");
    } catch {
      // الخطأ معروض من onboardingError
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    clearOnboardingError();
    try {
      await joinOrg(code, role);
      router.replace("/dashboard");
    } catch {
      // الخطأ معروض من onboardingError
    }
  }

  if (mode === "local" || authStatus !== "signed-in" || orgStatus === "ready") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">مُحرك الاستدامة</p>
              <p className="text-xs text-muted-foreground">مرحبًا {userName || "بك"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h1 className="text-xl font-bold">لنبدأ</h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            أنشئ جمعيتك على المنصة، أو انضم إلى جمعية موجودة بالفعل عبر رمز الدعوة
            الذي يشاركه معك زميلك.
          </p>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "create" | "join");
              clearOnboardingError();
            }}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Building2 className="h-4 w-4" />
                إنشاء جمعية جديدة
              </TabsTrigger>
              <TabsTrigger value="join">
                <KeyRound className="h-4 w-4" />
                الانضمام برمز دعوة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="org-name">اسم الجمعية</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="مثال: جمعية نماء للتنمية"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-role">دورك في الجمعية</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="create-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {onboardingError && tab === "create" && (
                  <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs leading-6 text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {onboardingError}
                  </p>
                )}

                <Button type="submit" size="lg" className="mt-1" disabled={onboardingBusy}>
                  {onboardingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                  إنشاء الجمعية والمتابعة
                </Button>
                <p className="text-xs leading-6 text-muted-foreground">
                  ستبدأ ببيانات فارغة تملأها من صفحة «ملف الجمعية»، وستحصل على رمز
                  دعوة من صفحة «الفريق» لمشاركته مع زملائك.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="join">
              <form onSubmit={handleJoin} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-code">رمز الدعوة</Label>
                  <Input
                    id="join-code"
                    dir="ltr"
                    className="text-left tracking-widest"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="مثال: a1b2c3d4"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="join-role">دورك في الجمعية</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="join-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {onboardingError && tab === "join" && (
                  <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs leading-6 text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {onboardingError}
                  </p>
                )}

                <Button type="submit" size="lg" className="mt-1" disabled={onboardingBusy}>
                  {onboardingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                  الانضمام والمتابعة
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
