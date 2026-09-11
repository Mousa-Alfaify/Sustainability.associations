import type { RealtimeChannel } from "@supabase/supabase-js";
import { requireSupabase } from "@/lib/supabase/client";
import type { MemberRow, OrganizationRow, ProfileRow } from "@/lib/supabase/types";

/**
 * طبقة الوصول لقاعدة البيانات — كل استدعاء هنا شبكي حقيقي عبر supabase-js.
 * الأخطاء تُرمى برسالة عربية واضحة، والاستدعاء في app-store.tsx يلتقطها
 * ويعرضها للمستخدم بدل ابتلاعها بصمت.
 */

const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "User already registered": "هذا البريد الإلكتروني مسجّل بالفعل — جرّب تسجيل الدخول",
  "Email not confirmed": "لم يتم تأكيد البريد الإلكتروني بعد — تحقق من صندوق الوارد",
  "Password should be at least 6 characters": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  "Unable to validate email address: invalid format": "صيغة البريد الإلكتروني غير صحيحة",
};

/** يحوّل رسائل Supabase/الشبكة الشائعة إلى عربية، ويُبقي أي رسالة أخرى كما هي مع سياق */
function translateError(message: string, context: string): string {
  if (KNOWN_MESSAGES[message]) return KNOWN_MESSAGES[message];
  if (/failed to fetch|network|fetch failed|load failed/i.test(message)) {
    return "تعذّر الاتصال بالخادم — تحقّق من اتصالك بالإنترنت، أو من صحة إعدادات Supabase في .env.local";
  }
  return `${context}: ${message}`;
}

export async function signUp(email: string, password: string, displayName: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(translateError(error.message, "تعذّر إنشاء الحساب"));
  return data;
}

export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateError(error.message, "تعذّر تسجيل الدخول"));
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(translateError(error.message, "تعذّر تسجيل الخروج"));
}

export async function getSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(translateError(error.message, "تعذّر التحقق من الجلسة"));
  return data.session;
}

/** جلب جمعية المستخدم الحالي — RLS يحصر النتيجة على الجمعية التي هو عضو فيها */
export async function fetchMyOrganization(): Promise<OrganizationRow | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("organizations")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(translateError(error.message, "تعذّر تحميل بيانات الجمعية"));
  return data as OrganizationRow | null;
}

export async function createOrganization(
  name: string,
  role: string,
): Promise<OrganizationRow> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_organization", {
    org_name: name,
    member_role: role,
  });
  if (error) throw new Error(translateError(error.message, "تعذّر إنشاء الجمعية"));
  return data as OrganizationRow;
}

export async function joinOrganization(
  code: string,
  role: string,
): Promise<OrganizationRow> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("join_organization", {
    code,
    member_role: role,
  });
  if (error) throw new Error(translateError(error.message, "تعذّر الانضمام"));
  return data as OrganizationRow;
}

export async function updateOrganization(
  id: string,
  patch: Record<string, unknown>,
): Promise<OrganizationRow> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("organizations")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(translateError(error.message, "تعذّر حفظ التعديلات"));
  return data as OrganizationRow;
}

export interface MemberWithProfile extends MemberRow {
  profile: ProfileRow | null;
}

export async function fetchMembers(orgId: string): Promise<MemberWithProfile[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("organization_members")
    .select("organization_id, user_id, role, joined_at, profile:profiles(id, email, display_name, created_at)")
    .eq("organization_id", orgId)
    .order("joined_at", { ascending: true });
  if (error) throw new Error(translateError(error.message, "تعذّر تحميل أعضاء الفريق"));
  return (data ?? []) as unknown as MemberWithProfile[];
}

export async function leaveOrganization(userId: string) {
  const client = requireSupabase();
  const { error } = await client.from("organization_members").delete().eq("user_id", userId);
  if (error) throw new Error(translateError(error.message, "تعذّرت مغادرة الجمعية"));
}

export async function updateDisplayName(userId: string, displayName: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);
  if (error) throw new Error(translateError(error.message, "تعذّر تحديث الاسم"));
}

/** اشتراك لحظي في تغيّرات صف الجمعية — يُستدعى callback عند أي تعديل من زميل آخر */
export function subscribeOrganization(
  orgId: string,
  onChange: (row: OrganizationRow) => void,
): RealtimeChannel {
  const client = requireSupabase();
  return client
    .channel(`organization-${orgId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "organizations", filter: `id=eq.${orgId}` },
      (payload) => onChange(payload.new as OrganizationRow),
    )
    .subscribe();
}
