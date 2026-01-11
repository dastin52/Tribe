
export type GoalCategory = "finance" | "sport" | "growth" | "work" | "other";

export type PartnerRole = 
  | 'accomplice'  // Сообщник
  | 'guardian'    // Хранитель
  | 'sensei'      // Сэнсэй
  | 'teammate'    // Тиммейт
  | 'navigator'   // Штурман
  | 'roaster';     // Критик

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  timestamp: string;
  goal_id?: string;
}

export interface Meeting {
  id: string;
  title: string;
  time: string;
  location?: string;
  category: GoalCategory;
}

export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

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
  difficulty: number;
}

export interface Project {
  id: string;
  subgoal_id: string;
  owner_id: string;
  title: string;
  status: 'planned' | 'active' | 'completed';
}

export interface Debt {
  id: string;
  title: string;
  total_amount: number;
  remaining_amount: number;
  due_date?: string;
  type: 'i_owe' | 'they_owe';
  category: 'bank' | 'card' | 'friend' | 'other';
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
  name: string;
  photo_url?: string;
  xp: number;
  level: number;
  streak: number;
  last_active: string;
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

export interface ProgressLog {
  id: string;
  goal_id: string;
  subgoal_id?: string;
  timestamp: string;
  value: number;
  confidence: number;
  is_verified?: boolean;
  verified_by?: string;
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
  status: "planned" | "active" | "paused" | "completed" | "abandoned";
  confidence_level: number;
  difficulty: number;
  logs: ProgressLog[];
  image_url?: string; // Сгенерированное ИИ видение
  is_private?: boolean;
}

export interface Value {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
}

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
