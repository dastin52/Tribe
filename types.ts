
export type GoalCategory = "finance" | "sport" | "growth" | "work" | "other";

export type PartnerRole = 
  | 'accomplice'  // Сообщник (Friend)
  | 'guardian'    // Хранитель (Spouse/Family)
  | 'sensei'      // Сэнсэй (Coach/Mentor)
  | 'teammate'    // Тиммейт (Colleague)
  | 'navigator'   // Штурман (Strategy partner)
  | 'roaster';     // Критик (High accountability)

export interface User {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  last_active: string;
  is_demo?: boolean;
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
  timestamp: string;
  value: number;
  confidence: number;
  is_verified?: boolean;
  metadata?: {
    income?: number;
    expense?: number;
    savings?: number;
    volume?: number;
    duration_mins?: number;
    intensity?: number;
  };
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
}

export interface DailyLog {
  id: string;
  date: string;
  energy_level: number;
  mood: number;
  note?: string;
}

export interface Value {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
}

export type GoalStatus = "planned" | "active" | "paused" | "completed" | "abandoned";

export interface SubGoal {
  id: string;
  year_goal_id: string;
  title: string;
  metric: string;
  target_value: number;
  current_value: number;
  weight: number;
  estimated_days: number;
  deadline: string;
}

export interface Project {
  id: string;
  subgoal_id: string;
  owner_id: string;
  title: string;
  estimated_effort_hours: number;
  complexity: number;
  status: "planned" | "active" | "completed";
}

export interface Action {
  id: string;
  project_id: string;
  title: string;
  type: "one_time" | "habit";
  estimated_time_minutes: number;
  completion_status: boolean;
  completed_at?: string;
}

export enum AppView {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  VALUES = 'values',
  GOALS = 'goals',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  SOCIAL = 'social'
}
