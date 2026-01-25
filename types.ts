

export type GoalCategory = "finance" | "sport" | "growth" | "work" | "other";
export type PartnerRole = 'accomplice' | 'guardian' | 'sensei' | 'teammate' | 'navigator' | 'roaster';

// Constants for financial logic
export const TAX_RATE = 0.13; // 13% tax on profit
export const PURCHASE_TAX = 0.05; // 5% tax on asset purchase

export interface StockHolding {
  cellId: number;
  shares: number;
  avgPurchasePrice: number;
}

export interface GameDeposit {
  id: string;
  amount: number;
  remainingTurns: number;
  interestRate: number;
  cellId: number;
}

export interface GameReaction {
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface WorldEvent {
  title: string;
  description: string;
  effect: {
    sector?: string;
    multiplier: number;
    duration: number;
  };
}

export interface GamePlayer {
  id: string;
  name: string;
  avatar: string;
  position: number;
  cash: number;
  isBankrupt: boolean;
  isReady: boolean;
  isBot?: boolean;
  deposits: GameDeposit[];
  ownedAssets: number[]; 
  assetLevels: Record<number, number>; // cellId -> level (1-5)
  portfolio: StockHolding[]; // Акции игрока
  taxCredits: number; // Налоговые льготы (оптимизация)
  isHost?: boolean;
  status?: 'pending' | 'accepted';
}

export interface GameState {
  players: GamePlayer[];
  pendingPlayers: GamePlayer[];
  currentPlayerIndex: number;
  history: string[];
  turnNumber: number;
  ownedAssets: Record<number, string>; // cellId -> playerId
  reactions: GameReaction[];
  lobbyId: string | null;
  status: 'lobby' | 'playing' | 'finished';
  lastRoll: number | null;
  hostId?: string;
  marketIndices: Record<string, number>; // sector -> multiplier (e.g. 1.2)
  activeWorldEvent: WorldEvent | null;
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
  streak?: number;
  last_active?: string;
  financials?: FinancialSnapshot;
  game_rolls: number;
  energy_profile: {
    peak_hours: number[];
    low_energy_hours?: number[];
  };
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

export type CellType = 'asset' | 'event' | 'tax' | 'start' | 'prison' | 'bank';
export interface BoardCell {
  id: number;
  type: CellType;
  district?: string;
  title: string;
  description?: string;
  cost?: number;
  rent?: number;
  icon: string;
}

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

export interface YearGoal {
  id: string;
  category: GoalCategory;
  value_id?: string;
  title: string;
  description?: string;
  metric: string;
  target_value: number;
  current_value: number;
  start_date?: string;
  end_date?: string;
  status: "active" | "completed";
  confidence_level?: number;
  difficulty?: number;
  is_shared?: boolean;
  is_private?: boolean;
  image_url?: string;
  logs: ProgressLog[];
}

export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface SubGoal {
  id: string;
  year_goal_id: string;
  title: string;
  target_value: number;
  current_value: number;
  metric: string;
  deadline: string;
  weight?: number;
  frequency?: TaskFrequency;
  difficulty?: number;
  is_completed?: boolean;
}

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
  status?: 'pending' | 'accepted';
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
  timestamp: string;
  partner_id: string;
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