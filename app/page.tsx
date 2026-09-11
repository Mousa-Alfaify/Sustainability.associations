"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CloudOff,
  Loader2,
  Lock,
  Mail,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store/app-store";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "@/lib/data/demo-org";

const HIGHLIGHTS = [
  {
    icon: BarChart3,
    title: "تشخيص مالي دقيق",
    body: "احسب فجوتك التشغيلية وفترة الأمان المالي ومؤشر الاستقلال في دقيقة واحدة.",
  },
  {
    icon: Sparkles,
    title: "محفظة استدامة مخصصة",
    body: "3 إلى 5 مصادر دخل متكررة مقترحة حسب أصول جمعيتك وخبراتها وشراكاتها.",
  },
  {
    icon: PiggyBank,
    title: "حساب التشغيل المستدام",
    body: "خطة واضحة لبناء احتياطي يغطي من 3 إلى 6 أشهر من مصاريف التشغيل.",
  },
];

function BrandPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold">مُحرك الاستدامة</p>
          <p className="text-xs text-primary-foreground/70">للجمعيات الأهلية</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <h2 className="text-3xl font-bold leading-snug">
          من التبرعات الموسمية
          <br />
          إلى تدفق مالي مستدام
        </h2>
        <p className="mt-4 text-sm leading-7 text-primary-foreground/80">
          منصة تحلل وضع جمعيتك المالي والتشغيلي، ثم تبني لها محفظة استدامة من مصادر
          دخل متكررة تغطي الرواتب والإيجارات والأنظمة والخدمات الإدارية.
        </p>

        <ul className="mt-8 flex flex-col gap-5">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-6 text-primary-foreground/75">
                    {item.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="relative text-xs text-primary-foreground/60">
        نموذج أولي (MVP) — الأرقام التجريبية لأغراض العرض فقط
      </p>
    </section>
  );
}

function MobileBrand() {
  return (
    <div className="mb-8 flex items-center gap-3 lg:hidden">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold">مُحرك الاستدامة</p>
        <p className="text-xs text-muted-foreground">للجمعيات الأهلية</p>
      </div>
    </div>
  );
}

/** نموذج الدخول المحلي — يُعرض فقط عندما لا توجد إعدادات Supabase */
function LocalLoginForm() {
  const router = useRouter();
  const { login, authenticated, hydrated } = useAppStore();
  const [email, setEmail] = React.useState(DEMO_USER_EMAIL);
  const [password, setPassword] = React.useState("demo1234");

  React.useEffect(() => {
    if (hydrated && authenticated) router.replace("/dashboard");
  }, [hydrated, authenticated, router]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    login(DEMO_USER_NAME);
    router.push("/dashboard");
  }

  return (
    <>
      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/10 p-3 text-xs leading-6 text-warning">
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          وضع العرض التجريبي المحلي — لا توجد قاعدة بيانات مهيأة، فالبيانات تُحفظ في
          هذا المتصفح فقط ولا تُشارك بين المستخدمين. لتفعيل الحسابات الحقيقية راجع
          README.md.
        </p>
      </div>

      <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        أدخل بيانات حسابك للوصول إلى لوحة الاستدامة المالية لجمعيتك.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              dir="ltr"
              className="pr-10 text-left"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              dir="ltr"
              className="pr-10 text-left"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-2">
          <ArrowLeft className="h-4 w-4" />
          دخول إلى لوحة التحكم
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/60 p-4 text-xs leading-6 text-muted-foreground">
        <p className="font-semibold text-foreground">حساب العرض التجريبي</p>
        <p>البيانات معبّأة مسبقًا لجمعية «نماء للتنمية». اضغط دخول مباشرة لبدء العرض.</p>
      </div>
    </>
  );
}

/** نموذج الدخول/إنشاء الحساب السحابي — يُعرض عند تفعيل Supabase */
function CloudAuthForm() {
  const router = useRouter();
  const { authStatus, signInCloud, signUpCloud, authError, authBusy, clearAuthError } =
    useAppStore();

  const [tab, setTab] = React.useState<"signin" | "signup">("signin");
  const [signInEmail, setSignInEmail] = React.useState("");
  const [signInPassword, setSignInPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [confirmNotice, setConfirmNotice] = React.useState(false);

  React.useEffect(() => {
    if (authStatus === "signed-in") router.replace("/dashboard");
  }, [authStatus, router]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    clearAuthError();
    try {
      await signInCloud(signInEmail, signInPassword);
    } catch {
      // الخطأ معروض من authError
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    clearAuthError();
    if (signUpPassword !== confirmPassword) {
      return;
    }
    try {
      const signedInImmediately = await signUpCloud(signUpEmail, signUpPassword, name);
      if (!signedInImmediately) {
        setConfirmNotice(true);
      }
    } catch {
      // الخطأ معروض من authError
    }
  }

  const passwordMismatch =
    tab === "signup" && confirmPassword.length > 0 && signUpPassword !== confirmPassword;

  if (confirmNotice) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold">تحقق من بريدك الإلكتروني</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
            أرسلنا رابط تفعيل إلى <span className="font-semibold text-foreground">{signUpEmail}</span>.
            بعد الضغط على الرابط عُد إلى هنا وسجّل الدخول.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setConfirmNotice(false);
            setTab("signin");
            setSignInEmail(signUpEmail);
          }}
        >
          العودة لتسجيل الدخول
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold">مرحبًا بك</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        سجّل دخولك أو أنشئ حسابًا لبدء إدارة استدامة جمعيتك.
      </p>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "signin" | "signup");
          clearAuthError();
        }}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
          <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signin-email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  dir="ltr"
                  className="pr-10 text-left"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signin-password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type="password"
                  dir="ltr"
                  className="pr-10 text-left"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {authError && tab === "signin" && (
              <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs leading-6 text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {authError}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-2" disabled={authBusy}>
              {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
              دخول إلى لوحة التحكم
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-name">الاسم</Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-name"
                  className="pr-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="م. اسمك الكامل"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  dir="ltr"
                  className="pr-10 text-left"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  dir="ltr"
                  className="pr-10 text-left"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-confirm">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-confirm"
                  type="password"
                  dir="ltr"
                  className="pr-10 text-left"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              {passwordMismatch && (
                <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>
              )}
            </div>

            {authError && tab === "signup" && (
              <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs leading-6 text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {authError}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-2" disabled={authBusy || passwordMismatch}>
              {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
              إنشاء الحساب
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function LoginPage() {
  const { mode } = useAppStore();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <MobileBrand />
          {mode === "local" ? <LocalLoginForm /> : <CloudAuthForm />}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            الأدوار المدعومة: مدير الجمعية · المدير المالي · المدير التنفيذي · مسؤول
            الاستدامة
          </p>
        </div>
      </section>
    </div>
  );
}
