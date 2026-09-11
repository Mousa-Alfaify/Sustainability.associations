import type { OrgProfile, ScenarioInputs } from "@/lib/types";

/** صف جدول organizations كما يُعيده Supabase (snake_case) */
export interface OrganizationRow {
  id: string;
  name: string;
  sector: string;
  city: string;
  employees: number;
  beneficiaries: number;
  annual_budget: number;
  expenses: OrgProfile["expenses"];
  income: OrgProfile["income"];
  reserve: number;
  assets: string[];
  expertise: string[];
  partnerships: string[];
  scenario: ScenarioInputs;
  savings_rate: number;
  reserve_target_months: number;
  analyzed: boolean;
  portfolio_built: boolean;
  join_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MemberRow {
  organization_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

/** تحويل صف الجمعية من قاعدة البيانات إلى شكل ملف الجمعية المستخدم في كل محركات الحساب */
export function rowToOrgProfile(row: OrganizationRow): OrgProfile {
  return {
    name: row.name,
    sector: row.sector,
    city: row.city,
    employees: row.employees,
    beneficiaries: row.beneficiaries,
    annualBudget: row.annual_budget,
    expenses: row.expenses,
    income: row.income,
    reserve: row.reserve,
    assets: row.assets ?? [],
    expertise: row.expertise ?? [],
    partnerships: row.partnerships ?? [],
  };
}

/** تحويل ملف الجمعية إلى الأعمدة المقابلة لتحديث الصف في قاعدة البيانات */
export function orgProfileToRowPatch(profile: OrgProfile) {
  return {
    name: profile.name,
    sector: profile.sector,
    city: profile.city,
    employees: profile.employees,
    beneficiaries: profile.beneficiaries,
    annual_budget: profile.annualBudget,
    expenses: profile.expenses,
    income: profile.income,
    reserve: profile.reserve,
    assets: profile.assets,
    expertise: profile.expertise,
    partnerships: profile.partnerships,
  };
}
