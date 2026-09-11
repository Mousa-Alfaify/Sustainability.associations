"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, LogOut, RefreshCw, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAppStore } from "@/lib/store/app-store";

export default function TeamPage() {
  const router = useRouter();
  const { mode, user, joinCode, members, membersLoading, refreshMembers, leaveOrg } =
    useAppStore();
  const [copied, setCopied] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);

  if (mode !== "cloud") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            صفحة الفريق متاحة فقط في الوضع السحابي (بعد تفعيل Supabase). راجع
            README.md لخطوات التفعيل.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function copyCode() {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // بعض المتصفحات تمنع الوصول للحافظة — الرمز معروض نصيًا أصلًا
    }
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await leaveOrg();
      router.replace("/onboarding");
    } finally {
      setLeaving(false);
      setLeaveOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>رمز الدعوة</CardTitle>
          <CardDescription>
            شارك هذا الرمز مع زملائك في الجمعية — عند التسجيل يختارون «الانضمام
            برمز دعوة» ويدخلونه ليصلوا إلى نفس بيانات جمعيتكم فورًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              readOnly
              dir="ltr"
              value={joinCode ?? ""}
              className="text-left font-mono text-base tracking-widest"
            />
            <Button onClick={copyCode} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "تم النسخ" : "نسخ الرمز"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>أعضاء الفريق</CardTitle>
            <CardDescription>كل من انضم إلى هذه الجمعية عبر رمز الدعوة</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshMembers()} disabled={membersLoading}>
            {membersLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {membersLoading && members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              جارٍ تحميل الأعضاء…
            </div>
          ) : members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا يوجد أعضاء بعد — أنت أول من انضم إلى هذه الجمعية.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {member.profile?.display_name || member.profile?.email || "عضو"}
                      {member.user_id === user?.id && (
                        <span className="mr-2 text-xs text-muted-foreground">(أنت)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {member.profile?.email}
                    </p>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">مغادرة الجمعية</CardTitle>
          <CardDescription>
            ستفقد الوصول إلى بيانات هذه الجمعية، وستحتاج رمز دعوة جديدًا للعودة
            إليها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setLeaveOpen(true)}>
            <LogOut className="h-4 w-4" />
            مغادرة الجمعية
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="تأكيد مغادرة الجمعية"
        description="لن تتمكن من رؤية بيانات هذه الجمعية أو تعديلها بعد المغادرة، إلا إذا انضممت مجددًا برمز دعوة."
        confirmLabel="مغادرة"
        busy={leaving}
        onConfirm={handleLeave}
      />
    </div>
  );
}
