"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  CloudOff,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/navigation";
import { DEMO_USER_NAME, DEMO_USER_ROLE } from "@/lib/data/demo-org";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BAND_BG_CLASS } from "@/lib/finance/independence-score";
import { formatDecimal } from "@/lib/format";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">مُحرك الاستدامة</p>
        <p className="text-xs text-muted-foreground">للجمعيات الأهلية</p>
      </div>
    </div>
  );
}

function NavLinks({ cloudMode, onNavigate }: { cloudMode: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => {
        const items = NAV_ITEMS.filter(
          (item) => item.group === group && (!item.cloudOnly || cloudMode),
        );
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </p>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** مؤشر صغير في الرأس يعكس حالة الحفظ الفعلية — لا رسالة "تم" ثابتة */
function SaveStatusBadge() {
  const { mode, saveStatus, saveError } = useAppStore();
  if (mode !== "cloud" || saveStatus === "idle") return null;

  if (saveStatus === "saving") {
    return (
      <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex">
        <Loader2 className="h-3 w-3 animate-spin" />
        جارٍ الحفظ…
      </Badge>
    );
  }
  if (saveStatus === "saved") {
    return (
      <Badge variant="success" className="hidden gap-1.5 sm:inline-flex">
        <Check className="h-3 w-3" />
        محفوظ لكل الفريق
      </Badge>
    );
  }
  return (
    <Badge variant="danger" className="hidden gap-1.5 sm:inline-flex" title={saveError ?? ""}>
      <AlertTriangle className="h-3 w-3" />
      تعذّر الحفظ
    </Badge>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    mode,
    profile,
    score,
    userName,
    logout,
    resetToDemo,
    hydrated,
    authenticated,
    authStatus,
    orgStatus,
  } = useAppStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  const cloudMode = mode === "cloud";

  // حماية المسارات: يعيد التوجيه بحسب حالة المصادقة والعضوية الفعليتين
  React.useEffect(() => {
    if (!hydrated) return;
    if (cloudMode) {
      if (authStatus === "signed-out") {
        router.replace("/");
      } else if (authStatus === "signed-in" && orgStatus === "none") {
        router.replace("/onboarding");
      }
    } else if (!authenticated) {
      router.replace("/");
    }
  }, [hydrated, cloudMode, authStatus, orgStatus, authenticated, router]);

  const current = NAV_ITEMS.find((item) => item.href === pathname);

  function handleReset() {
    resetToDemo();
    setResetOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-border bg-card lg:flex">
        <div className="border-b border-border p-5">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks cloudMode={cloudMode} />
        </div>
        <div className="border-t border-border p-4">
          <div className="mb-3 rounded-lg bg-secondary p-3">
            <p className="truncate text-xs text-muted-foreground">الجمعية النشطة</p>
            <p className="truncate text-sm font-semibold">{profile.name || "بلا اسم بعد"}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge className={cn("border", BAND_BG_CLASS[score.band.tone])}>
                {score.band.label}
              </Badge>
              <span className="tnum text-xs font-semibold text-muted-foreground">
                {formatDecimal(score.total)}/100
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {cloudMode ? (
              <Button variant="outline" size="sm" className="flex-1" onClick={logout}>
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setResetOpen(true)}
                  title="إعادة البيانات التجريبية"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة ضبط
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="تسجيل الخروج"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* الشريط الجانبي — الجوال */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 flex w-72 flex-col bg-card shadow-elevated">
            <div className="flex items-center justify-between border-b border-border p-4">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks cloudMode={cloudMode} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:ps-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          {!cloudMode && (
            <div className="flex items-center gap-2 border-b border-warning/20 bg-warning/10 px-4 py-1.5 text-[11px] text-warning sm:px-6">
              <CloudOff className="h-3.5 w-3.5 shrink-0" />
              وضع محلي — البيانات محفوظة في هذا المتصفح فقط ولا تُشارك مع بقية الفريق
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold sm:text-lg">
                {current?.label ?? "مُحرك الاستدامة"}
              </h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {current?.description}
              </p>
            </div>
            <SaveStatusBadge />
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-end leading-tight">
                <p className="text-sm font-medium">{userName || DEMO_USER_NAME}</p>
                <p className="text-xs text-muted-foreground">{DEMO_USER_ROLE}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(userName || DEMO_USER_NAME).charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>

        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          مُحرك الاستدامة للجمعيات — نموذج أولي (MVP) · جميع الأرقام بالريال السعودي
        </footer>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="إعادة الضبط إلى البيانات التجريبية"
        description="سيُستبدل ملف الجمعية الحالي بالكامل ببيانات جمعية «نماء للتنمية» التجريبية، وستُفقد أي تعديلات أدخلتها في هذا المتصفح. هذا الإجراء محلي فقط ولا يمكن التراجع عنه."
        confirmLabel="إعادة الضبط"
        onConfirm={handleReset}
      />
    </div>
  );
}
