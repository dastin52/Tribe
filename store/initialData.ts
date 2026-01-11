
import { User, YearGoal, SubGoal, AccountabilityPartner, Transaction, Meeting, Value } from '../types';

export const INITIAL_USER: User = {
  id: 'user-main',
  name: 'Лидер Племени',
  xp: 450,
  level: 3,
  streak: 5,
  last_active: new Date().toISOString(),
  financials: {
    total_assets: 245000,
    total_debts: 45000,
    monthly_income: 150000,
    monthly_expenses: 55000,
    currency: '₽'
  },
  energy_profile: { peak_hours: [9, 10, 11, 16, 17], low_energy_hours: [14, 22, 23] }
};

export const INITIAL_VALUES: Value[] = [
  { id: 'v1', title: 'Финансовая свобода', description: 'Жизнь на доход от капитала', priority: 5 },
  { id: 'v2', title: 'Здоровье', description: 'Энергия для свершений', priority: 5 },
];

const now = new Date();
const financeGoalId = 'g-finance-001';
const sportGoalId = 'g-sport-001';
const growthGoalId = 'g-growth-001';

export const SAMPLE_GOALS: YearGoal[] = [
  {
    id: sportGoalId,
    category: 'sport',
    value_id: 'v2',
    title: 'Марафонская выносливость',
    metric: 'км',
    target_value: 42,
    current_value: 42,
    start_date: new Date(now.getTime() - 60 * 86400000).toISOString(),
    end_date: now.toISOString(),
    status: 'completed',
    confidence_level: 100,
    difficulty: 9,
    logs: [
      { id: 'l-s-1', goal_id: sportGoalId, timestamp: now.toISOString(), value: 42, confidence: 5, is_verified: true, verified_by: 'p-alex', user_id: 'user-main' }
    ],
    image_url: 'https://images.unsplash.com/photo-1530549387074-d56a992d5256?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: financeGoalId,
    category: 'finance',
    value_id: 'v1',
    title: 'Первый Капитал',
    metric: '₽',
    target_value: 1000000,
    current_value: 250000,
    start_date: new Date(now.getTime() - 30 * 86400000).toISOString(),
    end_date: new Date(now.getFullYear(), 11, 31).toISOString(),
    status: 'active',
    confidence_level: 85,
    difficulty: 7,
    logs: [
      { id: 'l-f-1', goal_id: financeGoalId, timestamp: now.toISOString(), value: 150000, confidence: 5, is_verified: true, verified_by: 'p-maria', user_id: 'user-main' },
      { id: 'l-f-2', goal_id: financeGoalId, timestamp: now.toISOString(), value: 100000, confidence: 4, is_verified: false, user_id: 'user-main' }
    ],
    is_shared: true
  },
  {
    id: growthGoalId,
    category: 'growth',
    value_id: 'v1',
    title: 'Книжная полка стратега',
    metric: 'книг',
    target_value: 24,
    current_value: 0,
    start_date: now.toISOString(),
    end_date: new Date(now.getFullYear(), 11, 31).toISOString(),
    status: 'active',
    confidence_level: 90,
    difficulty: 5,
    logs: []
  }
];

export const SAMPLE_SUBGOALS: SubGoal[] = [
  { id: 'sg-f-1', year_goal_id: financeGoalId, title: 'Подушка безопасности', metric: '₽', target_value: 300000, current_value: 250000, weight: 30, deadline: now.toISOString(), frequency: 'once', difficulty: 4 },
  { id: 'sg-g-1', year_goal_id: growthGoalId, title: 'Прочитать "Атомные привычки"', metric: 'стр', target_value: 320, current_value: 0, weight: 10, deadline: now.toISOString(), frequency: 'weekly', difficulty: 3 }
];

export const SAMPLE_PARTNERS: AccountabilityPartner[] = [
  { id: 'p-maria', name: 'Мария', role: 'guardian', avatar: 'https://i.pravatar.cc/150?u=maria', xp: 1500 },
  { id: 'p-alex', name: 'Алекс', role: 'sensei', avatar: 'https://i.pravatar.cc/150?u=alex', xp: 3200 }
];

export const SAMPLE_MEETINGS: Meeting[] = [
  { id: 'm1', title: 'Стратегическая сессия', time: new Date(now.getTime() + 7200000).toISOString(), location: 'Zoom', category: 'growth' }
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', amount: 150000, type: 'income', category: 'Зарплата', timestamp: now.toISOString() },
  { id: 'tx-2', amount: 12000, type: 'expense', category: 'Продукты', timestamp: now.toISOString() }
];
