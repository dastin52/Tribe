
import { User, YearGoal, SubGoal, AccountabilityPartner, Transaction, Meeting, Value, ProgressLog } from '../types';

const now = new Date();
const dateAgo = (m: number, d: number = 15) => new Date(now.getFullYear(), now.getMonth() - m, d).toISOString();

export const INITIAL_USER: User = {
  id: 'demo-user',
  name: 'Александр',
  photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300',
  xp: 12450,
  level: 24,
  streak: 42,
  last_active: now.toISOString(),
  financials: {
    total_assets: 2450000,
    total_debts: 450000,
    monthly_income: 280000,
    monthly_expenses: 110000,
    currency: '₽'
  },
  energy_profile: { 
    peak_hours: [7, 8, 9, 10, 20, 21, 22], 
    low_energy_hours: [14, 15, 16] 
  }
};

export const INITIAL_VALUES: Value[] = [
  { id: 'v1', title: 'Финансовая Свобода', description: 'Возможность говорить "Да пошел ты" любым обстоятельствам', priority: 5 },
  { id: 'v2', title: 'Атлетизм', description: 'Тело, которое не ограничивает разум', priority: 4 },
  { id: 'v3', title: 'Мастерство', description: 'Постоянное обучение и рост в профессии', priority: 5 },
];

const goal100M = 'goal-100m';
const goalMarathon = 'goal-marathon';
const goalEnglish = 'goal-english';

export const SAMPLE_PARTNERS: AccountabilityPartner[] = [
  { id: 'p-maria', name: 'Мария', role: 'sensei', avatar: 'https://i.pravatar.cc/150?u=maria', xp: 8200 },
  { id: 'p-igor', name: 'Игорь', role: 'roaster', avatar: 'https://i.pravatar.cc/150?u=igor', xp: 4500 },
  { id: 'p-elena', name: 'Елена', role: 'guardian', avatar: 'https://i.pravatar.cc/150?u=elena', xp: 9100 }
];

// Генерация реалистичных транзакций
const genTxs = (): Transaction[] => {
  const txs: Transaction[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = (day: number) => dateAgo(i, day);
    txs.push({ id: `inc-s-${i}`, amount: 220000, type: 'income', category: 'Зарплата', timestamp: d(1) });
    txs.push({ id: `inc-d-${i}`, amount: 60000, type: 'income', category: 'Дивиденды/Фриланс', timestamp: d(15) });
    txs.push({ id: `exp-r-${i}`, amount: 55000, type: 'expense', category: 'Жилье', timestamp: d(2) });
    txs.push({ id: `exp-f-${i}`, amount: 35000, type: 'expense', category: 'Продукты', timestamp: d(10) });
    txs.push({ id: `exp-a-${i}`, amount: 12000, type: 'expense', category: 'Транспорт', timestamp: d(20) });
    if (i === 2) txs.push({ id: `exp-joy-${i}`, amount: 45000, type: 'expense', category: 'Развлечения', note: 'Отпуск выходного дня', timestamp: d(12) });
  }
  return txs;
};
export const SAMPLE_TRANSACTIONS = genTxs();

export const SAMPLE_GOALS: YearGoal[] = [
  {
    id: goal100M, category: 'finance', value_id: 'v1', title: 'Путь к 100 000 000 ₽',
    description: 'Создание капитала для полной независимости.', metric: '₽',
    target_value: 100000000, current_value: 2450000, start_date: dateAgo(6), end_date: dateAgo(-24),
    status: 'active', confidence_level: 90, difficulty: 10, is_shared: true,
    image_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=800',
    logs: [
      { id: 'l1', goal_id: goal100M, timestamp: dateAgo(5), value: 400000, confidence: 5, is_verified: true, verified_by: 'p-maria', comment: 'Отличный старт, дисциплина — твой ключ.', rating: 5, user_id: 'demo-user' },
      { id: 'l2', goal_id: goal100M, timestamp: dateAgo(3), value: 650000, confidence: 5, is_verified: true, verified_by: 'p-igor', comment: 'Неплохо, но мог бы и больше отложить. Обед в рестике был лишним.', rating: 3, user_id: 'demo-user' },
      { id: 'l3', goal_id: goal100M, timestamp: dateAgo(1), value: 800000, confidence: 5, is_verified: true, verified_by: 'p-elena', comment: 'Вижу рост активов. Хранитель одобряет.', rating: 5, user_id: 'demo-user' }
    ]
  },
  {
    id: goalMarathon, category: 'sport', value_id: 'v2', title: 'Марафон в Сочи (42.2 км)',
    description: 'Выбежать из 4 часов.', metric: 'км', target_value: 42, current_value: 32,
    start_date: dateAgo(4), end_date: dateAgo(-1), status: 'active', confidence_level: 80, difficulty: 7,
    image_url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=800',
    logs: [
      { id: 'ls1', goal_id: goalMarathon, timestamp: dateAgo(2), value: 21, confidence: 5, is_verified: true, verified_by: 'p-maria', comment: 'Половинка пройдена! Темп держишь.', rating: 5, user_id: 'demo-user' },
      { id: 'ls2', goal_id: goalMarathon, timestamp: dateAgo(0, 5), value: 11, confidence: 4, is_verified: false, user_id: 'demo-user' }
    ]
  },
  {
    id: goalEnglish, category: 'growth', value_id: 'v3', title: 'English C1: Fluent',
    description: 'Свободное общение с инвесторами.', metric: 'уроков', target_value: 100, current_value: 64,
    start_date: dateAgo(6), end_date: dateAgo(-2), status: 'active', confidence_level: 95, difficulty: 5,
    image_url: 'https://images.unsplash.com/photo-1543167664-40d6994796a1?q=80&w=800',
    logs: Array.from({length: 10}).map((_, i) => ({
      id: `le-${i}`, goal_id: goalEnglish, timestamp: dateAgo(i % 5), value: 6, confidence: 5, is_verified: true, verified_by: 'p-elena', rating: 5, user_id: 'demo-user'
    }))
  }
];

export const SAMPLE_SUBGOALS: SubGoal[] = [
  { id: 'sg1', year_goal_id: goal100M, title: 'Подушка: 6 мес', metric: '₽', target_value: 600000, current_value: 600000, weight: 10, deadline: dateAgo(4), frequency: 'once', difficulty: 3, is_completed: true },
  { id: 'sg2', year_goal_id: goal100M, title: 'Инвест-портфель: 2М', metric: '₽', target_value: 2000000, current_value: 1850000, weight: 30, deadline: dateAgo(0), frequency: 'monthly', difficulty: 6 },
  { id: 'sg3', year_goal_id: goalMarathon, title: 'Длительная 30км', metric: 'км', target_value: 30, current_value: 30, weight: 50, deadline: dateAgo(1), frequency: 'once', difficulty: 8, is_completed: true }
];

export const SAMPLE_MEETINGS: Meeting[] = [
  { id: 'm1', title: 'Разбор стратегии 100М', time: new Date(now.getTime() + 172800000).toISOString(), category: 'finance' },
  { id: 'm2', title: 'Беговая тренировка', time: new Date(now.getTime() + 86400000).toISOString(), category: 'sport' }
];
