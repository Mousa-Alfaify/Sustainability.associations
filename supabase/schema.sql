-- =============================================================
-- مُحرك الاستدامة للجمعيات — مخطط قاعدة البيانات (Supabase / Postgres)
-- =============================================================
-- طريقة التشغيل: افتح مشروع Supabase الخاص بك → SQL Editor → الصق هذا
-- الملف كاملًا → Run. آمن لإعادة التشغيل بالكامل بدون تكرار على مشروع
-- فارغ (لا يُستخدم "if not exists" في كل مكان عمدًا لتفادي إخفاء
-- أخطاء التعديل لاحقًا — إن أردت إعادة التشغيل على مشروع فيه بيانات
-- فاحذف الجداول أولًا من لوحة التحكم).
--
-- البنية:
--   organizations         — صف واحد لكل جمعية، يحمل كامل ملفها المالي
--   organization_members  — عضوية المستخدمين في الجمعيات (نفس الجمعية
--                            قد يصل إليها أكثر من مستخدم بأدوار مختلفة)
--   profiles              — اسم العرض والبريد لكل مستخدم (للعرض في
--                            صفحة الفريق فقط، لا صلاحيات فيها)
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- الجداول
-- -------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  sector text not null default '',
  city text not null default '',
  employees integer not null default 0,
  beneficiaries integer not null default 0,
  annual_budget numeric not null default 0,
  expenses jsonb not null default '{"salaries":0,"rent":0,"technology":0,"admin":0,"marketing":0,"other":0}'::jsonb,
  income jsonb not null default '{"seasonalDonationsAnnual":0,"recurringDonationsAnnual":0,"grantsAnnual":0,"serviceContractsMonthly":0,"endowmentMonthly":0,"commercialMonthly":0,"subscriptionsMonthly":0,"otherMonthly":0}'::jsonb,
  reserve numeric not null default 0,
  assets jsonb not null default '[]'::jsonb,
  expertise jsonb not null default '[]'::jsonb,
  partnerships jsonb not null default '[]'::jsonb,
  scenario jsonb not null default '{"addServiceContracts":0,"addEndowment":0,"addPaidPrograms":0,"addPartnerships":0,"expenseReduction":0,"reserveAddition":0}'::jsonb,
  savings_rate numeric not null default 0.1,
  reserve_target_months integer not null default 6,
  analyzed boolean not null default false,
  portfolio_built boolean not null default false,
  join_code text not null unique default substr(md5(random()::text), 1, 8),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is 'صف واحد لكل جمعية — يحمل كامل ملفها المالي وحالة السيناريو الحالية';
comment on column public.organizations.join_code is 'رمز يشاركه صاحب الجمعية مع بقية الفريق للانضمام عبر join_organization()';

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'مسؤول الاستدامة المالية',
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

comment on table public.organization_members is 'عضوية المستخدمين في الجمعيات — يحدد من يملك صلاحية الوصول لأي صف في organizations';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'اسم العرض والبريد لكل مستخدم — تُعرض لزملائه في نفس الجمعية فقط (صفحة الفريق)';

-- -------------------------------------------------------------
-- صلاحيات الجداول (GRANT) — مطلوبة بمعزل تام عن RLS.
-- RLS يحدد أي الصفوف تُرى بعد أن يملك الدور صلاحية الوصول للجدول أصلًا؛
-- بدون هذه الأسطر يرفض PostgREST الطلب بخطأ 403 قبل أن تُقيَّم سياسات RLS
-- إطلاقًا — بغض النظر عن خيار "Automatically expose new tables" عند
-- إنشاء المشروع (الذي يُنصح بإيقافه، ولهذا هذه الأسطر ضرورية بدلًا منه).
-- -------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, delete on public.organization_members to authenticated;
grant select, update on public.profiles to authenticated;

-- -------------------------------------------------------------
-- تفعيل أمان مستوى الصف (RLS) — افتراضيًا كل شيء مرفوض حتى تُضاف سياسة
-- -------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;

-- -------------------------------------------------------------
-- دالة مساعدة: هل المستخدم الحالي عضو في هذه الجمعية؟
-- SECURITY DEFINER حتى لا تدخل في حلقة تقييم RLS داخل السياسات نفسها
-- -------------------------------------------------------------

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

-- -------------------------------------------------------------
-- سياسات organizations: القراءة والتعديل لأعضاء الجمعية فقط.
-- لا سياسة إدراج/حذف مباشرة — الإنشاء يتم فقط عبر create_organization()
-- -------------------------------------------------------------

create policy "الأعضاء يقرؤون بيانات جمعيتهم"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "الأعضاء يحدّثون بيانات جمعيتهم"
  on public.organizations for update
  using (public.is_org_member(id))
  with check (public.is_org_member(id));

-- -------------------------------------------------------------
-- سياسات organization_members
-- -------------------------------------------------------------

create policy "الأعضاء يرون زملاءهم في نفس الجمعية"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

create policy "العضو يغادر جمعيته بنفسه"
  on public.organization_members for delete
  using (user_id = auth.uid());

-- -------------------------------------------------------------
-- سياسات profiles
-- -------------------------------------------------------------

create policy "المستخدم يرى ملفه الشخصي"
  on public.profiles for select
  using (id = auth.uid());

create policy "الزملاء في نفس الجمعية يرون بعضهم"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.organization_members me
      join public.organization_members them
        on me.organization_id = them.organization_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );

create policy "المستخدم يحدّث اسمه المعروض فقط"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- -------------------------------------------------------------
-- إنشاء جمعية جديدة + إضافة المنشئ كعضو أول، ضمن معاملة واحدة.
-- SECURITY DEFINER لأن إدراج organizations لا يملك سياسة INSERT عامة.
-- -------------------------------------------------------------

create or replace function public.create_organization(org_name text, member_role text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول أولًا';
  end if;

  insert into public.organizations (name, created_by)
  values (coalesce(nullif(trim(org_name), ''), 'جمعيتي'), auth.uid())
  returning * into new_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org.id, auth.uid(), coalesce(nullif(trim(member_role), ''), 'مسؤول الاستدامة المالية'));

  return new_org;
end;
$$;

comment on function public.create_organization is 'ينشئ جمعية جديدة ويجعل المستخدم الحالي أول أعضائها';

-- -------------------------------------------------------------
-- الانضمام إلى جمعية موجودة عبر رمز الدعوة (join_code)
-- -------------------------------------------------------------

create or replace function public.join_organization(code text, member_role text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول أولًا';
  end if;

  select * into target_org from public.organizations where join_code = trim(code);

  if target_org.id is null then
    raise exception 'رمز الانضمام غير صحيح';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (target_org.id, auth.uid(), coalesce(nullif(trim(member_role), ''), 'مسؤول الاستدامة المالية'))
  on conflict (organization_id, user_id) do update set role = excluded.role;

  return target_org;
end;
$$;

comment on function public.join_organization is 'ينضم المستخدم الحالي إلى جمعية موجودة عبر رمز الدعوة';

-- بوستجرس يمنح EXECUTE على الدوال الجديدة لـ PUBLIC افتراضيًا، لكن هذين
-- السطرين صريحان حتى لا يعتمد الإعداد على سلوك افتراضي قد يتغيّر
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.join_organization(text, text) to authenticated;

-- -------------------------------------------------------------
-- تحديث updated_at تلقائيًا عند أي تعديل على صف الجمعية
-- -------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- تعبئة profiles تلقائيًا عند إنشاء حساب مصادقة جديد
-- -------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- التزامن اللحظي (Realtime) — حتى يرى كل عضو تعديلات زملائه فورًا
-- -------------------------------------------------------------

alter publication supabase_realtime add table public.organizations;

-- =============================================================
-- انتهى. بعد التشغيل تحقق من: Database → Replication → تأكد أن جدول
-- organizations مفعّل ضمن supabase_realtime (السطر الأخير أعلاه يفعّله
-- تلقائيًا في أغلب المشاريع، وإن لم يظهر فعّله يدويًا من هناك).
-- =============================================================
