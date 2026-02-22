
import { User, YearGoal, SubGoal, AccountabilityPartner, Transaction, Meeting, Value, ProgressLog } from '../types';

const now = new Date();
const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

export const INITIAL_USER: User = {
  id: 'user-1',
  name: 'Алексей Навигатор',
  photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  xp: 2450,
  level: 4,
  streak: 12,
  game_rolls: 3, 
  last_active: now.toISOString(),
  financials: {
    total_assets: 850000,
    total_debts: 45000,
    monthly_income: 180000,
    monthly_expenses: 95000,
    currency: '₽'
  },
  energy_profile: { 
    peak_hours: [8, 9, 10, 11, 19, 20, 21], 
    low_energy_hours: [14, 15, 16] 
  }
};

export const SAMPLE_GOALS: YearGoal[] = [
  {
    id: 'goal-finance-1',
    category: 'finance',
    goal_type: 'financial',
    phase: 'work',
    title: 'Капитал Свободы',
    core_intent: 'Создать фундамент, который позволит выбирать проекты по душе, а не по нужде.',
    success_definition: 'На счету 1.000.000 ₽ ликвидных активов.',
    constraints: 'Могу откладывать не более 30% дохода без потери качества жизни.',
    risk_factors: 'Импульсивные покупки гаджетов, инфляция.',
    metric: '₽',
    target_value: 1000000,
    current_value: 850000,
    start_date: monthAgo.toISOString(),
    end_date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    is_private: false,
    logs: [],
    mos: { id: 'mos-1', title: 'Проверить баланс и не тратить лишнего', is_completed: false }
  },
  {
    id: 'goal-sport-1',
    category: 'sport',
    goal_type: 'transformation',
    phase: 'acceleration',
    title: 'Атлетичный фундамент',
    core_intent: 'Вернуть ощущение легкости в теле и подготовиться к полумарафону в сентябре.',
    success_definition: 'Пробежать 21км без остановок за < 2 часов.',
    constraints: '3 тренировки в неделю по 45 минут в утреннее время.',
    risk_factors: 'Проблемы с коленом, лень после тяжелых рабочих дней.',
    metric: 'км',
    target_value: 500,
    current_value: 45,
    start_date: now.toISOString(),
    end_date: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    is_private: false,
    logs: [],
    mos: { id: 'mos-2', title: 'Надеть кроссовки и выйти на 10 мин', is_completed: false }
  },
  {
    id: 'goal-growth-1',
    category: 'growth',
    goal_type: 'learning',
    phase: 'fatigue',
    title: 'Системное мышление',
    core_intent: 'Перестать тушить пожары и начать видеть структуру в бизнесе и жизни.',
    success_definition: 'Внедрение системы управления проектами, которая работает без моего участия 48 часов.',
    constraints: 'Очень высокая когнитивная нагрузка на основной работе.',
    risk_factors: 'Перегорание, избыток теории без практики.',
    metric: 'глав',
    target_value: 12,
    current_value: 4,
    start_date: monthAgo.toISOString(),
    end_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    is_private: false,
    logs: [],
    mos: { id: 'mos-3', title: 'Прочитать 1 страницу или выписать 1 мысль', is_completed: false }
  }
];

export const SAMPLE_SUBGOALS: SubGoal[] = [
  {
    id: 'sub-1',
    year_goal_id: 'goal-finance-1',
    title: 'Анализ структуры расходов за неделю',
    effort_type: 'thinking',
    target_value: 1,
    current_value: 0,
    metric: 'анализ',
    deadline: now.toISOString(),
    weight: 20,
    is_completed: false
  },
  {
    id: 'sub-2',
    year_goal_id: 'goal-sport-1',
    title: 'Утренняя пробежка в парке (5км)',
    effort_type: 'action',
    target_value: 1,
    current_value: 0,
    metric: 'тренировка',
    deadline: now.toISOString(),
    weight: 15,
    is_completed: false
  },
  {
    id: 'sub-3',
    year_goal_id: 'goal-growth-1',
    title: 'Ежедневная рефлексия дня',
    effort_type: 'habit',
    target_value: 1,
    current_value: 0,
    metric: 'запись',
    deadline: now.toISOString(),
    weight: 10,
    is_completed: false
  }
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 120000, type: 'income', category: 'Зарплата', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't2', amount: 45000, type: 'expense', category: 'Жилье', timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't3', amount: 8400, type: 'expense', category: 'Продукты', timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't4', amount: 1200, type: 'expense', category: 'Транспорт', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't5', amount: 3500, type: 'expense', category: 'Здоровье', timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't6', amount: 1500, type: 'expense', category: 'Подписки', timestamp: now.toISOString() },
  { id: 't7', amount: 25000, type: 'income', category: 'Фриланс', timestamp: now.toISOString() }
];

export const INITIAL_VALUES: Value[] = [
  { id: 'v1', title: 'Автономия', description: 'Свобода принимать решения без оглядки на мнение большинства.', priority: 5 },
  { id: 'v2', title: 'Витальность', description: 'Высокий уровень энергии для реализации самых смелых идей.', priority: 4 },
];

export const SAMPLE_PARTNERS: AccountabilityPartner[] = [];
export const SAMPLE_MEETINGS: Meeting[] = [];
