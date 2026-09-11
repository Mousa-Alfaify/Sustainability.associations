import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * عميل Supabase من جهة المتصفح.
 * يُنشأ فقط إذا كان متغيرا البيئة موجودين، حتى لا ينهار البناء الثابت
 * (next build / output: export) عند غيابهما — التطبيق حينها يعمل في
 * «وضع العرض التجريبي المحلي» بدل الانهيار.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "sustainability-engine-auth",
      },
    })
  : null;

/** يستخدم داخل الدوال التي تتطلب اتصالًا فعليًا؛ يرمي رسالة عربية واضحة إن غاب الإعداد */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "قاعدة البيانات غير مهيأة — أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY (راجع README.md).",
    );
  }
  return supabase;
}
