
export type GoalCategory = "finance" | "sport" | "growth" | "work" | "other";

export type PartnerRole = 'accomplice' | 'guardian' | 'sensei' | 'teammate' | 'navigator' | 'roaster';

// Added missing Value interface
export interface Value {
  id: string;
  title: string;
  description: string;
  priority: number;
}

// Added missing TaskFrequency type
export type TaskFrequency = "once" | "daily" | "weekly" | "biweekly" | "monthly" | "quarterly";

// Added missing Meeting interface
export interface Meeting {
  id: string;
  title: string;
  time: string;
  category: string;
}

// Added missing Debt interface
export interface Debt {
  id: string;
  title: string;
  total_amount: number;
  remaining_amount: number;
  type: 'i_owe' | 'they_owe';
  category: string;
  due_date?: string;
}

// Added missing Subscription interface
export interface Subscription {
  id: string;
  title: string;
  amount: number;
  period: 'monthly' | 'yearly';
  category: string;
}

// Added missing FinancialSnapshot interface
export interface FinancialSnapshot {
  total_assets: number;
  total_debts: number;
  monthly_income: number;
  monthly_expenses: number;
  currency: string;
}

// Added missing ProgressLog interface
export interface ProgressLog {
  id: string;
  goal_id: string;
  timestamp: string;
  value: number;
  confidence: number;
  is_verified: boolean;
  verified_by?: string;
  comment?: string;
  rating?: number;
  user_id: string;
}

export interface GameDeposit {
  id: string;
  amount: number;
  remainingTurns: number;
  interestRate: number;
}

export interface GameReaction {
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface GamePlayer {
  id: string;
  name: string;
  avatar: string;
  position: number;
  cash: number;
  isBankrupt: boolean;
  deposits: GameDeposit[];
  ownedAssets: number[]; // cell indices
}

export interface GameState {
  players: GamePlayer[];
  currentPlayerIndex: number;
  history: string[];
  turnNumber: number;
  ownedAssets: Record<number, string>; // cellId -> ownerPlayerId
  reactions: GameReaction[];
}

// Updated User to use FinancialSnapshot interface
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

// Updated YearGoal to use ProgressLog and included image_url
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
  is_shared?: boolean;
  image_url?: string;
}

// Updated SubGoal to use TaskFrequency type
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
  is_completed?: boolean;
}

// Added note property to Transaction
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  timestamp: string;
  note?: string;
}

export interface AccountabilityPartner {
  id: string;
  name: string;
  role: PartnerRole;
  avatar?: string;
  xp?: number;
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

export type CellType = 'asset' | 'event' | 'tax' | 'start' | 'prison';
export type AssetDistrict = 'tech' | 'realestate' | 'energy' | 'web3' | 'health' | 'edu';

export interface BoardCell {
  id: number;
  type: CellType;
  district?: AssetDistrict;
  title: string;
  cost?: number;
  rent?: number;
  icon: string;
}
