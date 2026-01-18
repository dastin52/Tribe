
import { User, YearGoal, SubGoal, AccountabilityPartner, Transaction, Meeting, Value, ProgressLog } from '../types';

const now = new Date();

export const INITIAL_USER: User = {
  id: 'temp-id',
  name: 'Игрок',
  photo_url: '',
  xp: 0,
  level: 1,
  streak: 0,
  last_active: now.toISOString(),
  financials: {
    total_assets: 0,
    total_debts: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    currency: '₽'
  },
  energy_profile: { 
    peak_hours: [9, 10, 11, 18, 19, 20], 
    low_energy_hours: [14, 15] 
  }
};

export const INITIAL_VALUES: Value[] = [
  { id: 'v1', title: 'Финансовая Свобода', description: 'Возможность говорить "Да пошел ты" любым обстоятельствам', priority: 5 },
  { id: 'v2', title: 'Атлетизм', description: 'Тело, которое не ограничивает разум', priority: 4 },
];

export const SAMPLE_PARTNERS: AccountabilityPartner[] = [];
export const SAMPLE_TRANSACTIONS: Transaction[] = [];
export const SAMPLE_GOALS: YearGoal[] = [];
export const SAMPLE_SUBGOALS: SubGoal[] = [];
export const SAMPLE_MEETINGS: Meeting[] = [];
