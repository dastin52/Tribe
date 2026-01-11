
export type GoalCategory = "finance" | "sport" | "growth" | "work" | "other";

export type PartnerRole = 
  | 'accomplice'  // Сообщник (Friend)
  | 'guardian'    // Хранитель (Spouse/Family)
  | 'sensei'      // Сэнсэй (Coach/Mentor)
  | 'teammate'    // Тиммейт (Colleague)
  | 'navigator'   // Штурман (Strategy partner)
  | 'roaster';     // Критик (High accountability)

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  timestamp: string;
}

export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface Action {
  id: string;
  title: string;
  is_completed: boolean;
  priority: number;
}

export interface SubGoal {
  id: string;
  year_goal_id: string;
  title: string;
  metric: string;
  target_value: number;
  current_value: number;
  weight: number;
  deadline: string;
  frequency: TaskFrequency;
  estimated_days?: number;
  auto_calculate_amount?: number; // Для финансовых целей: сколько откладывать
}

export interface Project {
  id: string;
  subgoal_id: string;
  owner_id: string;
  title: string;
  status: 'planned' | 'active' | 'completed';
  estimated_effort_hours?: number;
  complexity?: number;
}

export interface Debt {
  id: string;
  title: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate?: number;
  due_date?: string;
}

export interface Subscription {
  id: string;
  title: string;
  amount: number;
  period: 'monthly' | 'yearly';
  category: string;
}

export interface FinancialSnapshot {
  total_assets: number;
  total_debts: number;
  monthly_income: number;
  monthly_expenses: number;
  currency: string;
}

export interface User {
  id: string;
  telegram_id?: string;
  name: string;
  photo_url?: string;
  xp: number;
  level: number;
  streak: number;
  last_active: string;
  is_demo?: boolean;
  financials?: FinancialSnapshot;
  energy_profile: {
    peak_hours: number[];
    low_energy_hours: number[];
  };
}

export interface AccountabilityPartner {
  id: string;
  name: string;
  role: PartnerRole;
  avatar?: string;
}

export interface PartnerReview {
  id: string;
  partner_id: string;
  log_id: string;
  rating: number; // 1-5
  comment: string;
  reaction: 'fire' | 'slow' | 'doubt' | 'strong';
  timestamp: string;
  is_verified: boolean;
}

export interface ProgressLog {
  id: string;
  goal_id: string;
  subgoal_id?: string;
  timestamp: string;
  value: number;
  confidence: number;
  is_verified?: boolean;
}

export interface YearGoal {
  id: string;
  category: GoalCategory;
  value_id: string;
  title: string;
  description?: string;
  metric: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: GoalStatus;
  confidence_level: number;
  logs: ProgressLog[];
  partner_id?: string;
  is_shared?: boolean;
}

export interface Value {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
}

export type GoalStatus = "planned" | "active" | "paused" | "completed" | "abandoned";

export enum AppView {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  VALUES = 'values',
  GOALS = 'goals',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  SOCIAL = 'social',
  FINANCE = 'finance'
}
