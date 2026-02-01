
export type GoalCategory = "finance" | "sport" | "growth" | "work" | "other";
export type PartnerRole = 'observer' | 'navigator' | 'guardian' | 'motivator';
export type GoalType = 'learning' | 'project' | 'habit' | 'transformation' | 'financial';
export type EffortType = 'thinking' | 'action' | 'habit';
export type GoalPhase = 'acceleration' | 'work' | 'fatigue' | 'pause' | 'finish';

export interface MOS {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface YearGoal {
  id: string;
  category: GoalCategory;
  goal_type: GoalType;
  phase: GoalPhase;
  title: string;
  core_intent: string; // Зачем эта цель существует
  success_definition: string; // Что считается успехом (мин/норма/макс)
  constraints: string; // Ограничения времени/энергии
  risk_factors: string; // Почему может сорваться
  description?: string;
  metric: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed";
  is_private: boolean;
  logs: ProgressLog[];
  mos?: MOS; // Minimum Operational Step
}

export interface SubGoal {
  id: string;
  year_goal_id: string;
  title: string;
  effort_type: EffortType;
  target_value: number;
  current_value: number;
  metric: string;
  deadline: string;
  weight: number;
  is_completed: boolean;
}

export interface ProgressLog {
  id: string;
  goal_id: string;
  timestamp: string;
  value: number;
  is_verified: boolean;
  verified_by?: string;
  honesty_score?: 'yes' | 'partial' | 'no';
  comment?: string;
  user_id: string;
  // Added rating property for goal assessment
  rating?: number;
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
  game_rolls: number;
  // Added optional streak and activity tracking
  streak?: number;
  last_active?: string;
  energy_profile: {
    peak_hours: number[];
    low_energy_hours: number[];
  };
  // Updated financials to use structured snapshot
  financials?: FinancialSnapshot;
}

export enum AppView {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  SOCIAL = 'social',
  FINANCE = 'finance',
  GOALS = 'goals',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  FOCUS = 'focus'
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  timestamp: string;
}

export interface Debt {
  id: string;
  title: string;
  total_amount: number;
  remaining_amount: number;
  type: 'i_owe' | 'they_owe';
  category: 'bank' | 'card' | 'friend' | 'other';
  due_date?: string;
}

export interface Subscription {
  id: string;
  title: string;
  amount: number;
  period: 'monthly' | 'yearly';
  category: string;
}

export interface AccountabilityPartner {
  id: string;
  name: string;
  role: PartnerRole;
}

export interface Value {
  id: string;
  title: string;
  description: string;
  priority: number;
}

export interface Meeting {
  id: string;
  title: string;
}

export interface BoardCell {
  id: number;
  type: 'start' | 'asset' | 'event' | 'tax' | 'bank' | 'prison';
  title: string;
  icon: string;
  description: string;
  district?: string;
  cost?: number;
  rent?: number;
}

export interface GamePlayer {
  id: string;
  name: string;
  position: number;
  cash: number;
  isHost?: boolean;
  isReady?: boolean;
  isBot?: boolean;
  ownedAssets: number[];
  assetLevels: Record<number, number>;
  portfolio: { cellId: number; shares: number }[];
  status?: string;
}

export interface GameState {
  players: GamePlayer[];
  lobbyId: string | null;
  status: 'lobby' | 'playing' | 'finished';
  marketIndices: Record<string, number>;
  activeWorldEvent: any | null;
  ownedAssets: Record<number, string>;
  history: string[];
  turnNumber: number;
  hostId?: string;
  pendingPlayers?: GamePlayer[];
  currentPlayerIndex?: number;
}

// Global financial constants
export const TAX_RATE = 0.13;
export const PURCHASE_TAX = 0.05;
