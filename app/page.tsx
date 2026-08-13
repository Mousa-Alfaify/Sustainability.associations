"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  Lock,
  Mail,
  PiggyBank,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function LoginPage() {
  const router = useRouter();
  const { login, authenticated, hydrated } = useAppStore();
  const [email, setEmail] = React.useState(DEMO_USER_EMAIL);
  const [password, setPassword] = React.useState("demo1234");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && authenticated) router.replace("/dashboard");
  }, [hydrated, authenticated, router]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    // مصادقة تجريبية محلية — تُستبدل لاحقًا بـ Supabase Auth
    window.setTimeout(() => {
      login(DEMO_USER_NAME);
      router.push("/dashboard");
    }, 500);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* الجانب التعريفي */}
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
          نموذج أولي (MVP) — البيانات المعروضة تجريبية لأغراض العرض
        </p>
      </section>

      {/* نموذج الدخول */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">مُحرك الاستدامة</p>
              <p className="text-xs text-muted-foreground">للجمعيات الأهلية</p>
            </div>
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

            <Button type="submit" size="lg" className="mt-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}
              دخول إلى لوحة التحكم
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/60 p-4 text-xs leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">حساب العرض التجريبي</p>
            <p>
              البيانات معبّأة مسبقًا لجمعية «نماء للتنمية». اضغط دخول مباشرة لبدء
              العرض.
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            الأدوار المدعومة: مدير الجمعية · المدير المالي · المدير التنفيذي · مسؤول
            الاستدامة
          </p>
        </div>
      </section>
    </div>
  );
}
