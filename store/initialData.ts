
import { User, YearGoal, SubGoal, AccountabilityPartner, Transaction, Meeting, Value, ProgressLog } from '../types';

const now = new Date();
const month = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, 15).toISOString();

export const INITIAL_USER: User = {
  id: 'user-main',
  name: 'Лидер Племени',
  xp: 2840,
  level: 12,
  streak: 18,
  last_active: now.toISOString(),
  financials: {
    total_assets: 842000,
    total_debts: 120000,
    monthly_income: 180000,
    monthly_expenses: 65000,
    currency: '₽'
  },
  energy_profile: { 
    peak_hours: [8, 9, 10, 11, 19, 20, 21], 
    low_energy_hours: [14, 15, 23, 0] 
  }
};

export const INITIAL_VALUES: Value[] = [
  { id: 'v1', title: 'Финансовая независимость', description: 'Свобода выбора деятельности без привязки к деньгам', priority: 5 },
  { id: 'v2', title: 'Физическая мощь', description: 'Тело как эффективный инструмент для жизни', priority: 4 },
  { id: 'v3', title: 'Осознанность', description: 'Понимание своих истинных мотивов и контроль внимания', priority: 5 },
];

// ID для связей
const goalFinanceId = 'goal-fin-2024';
const goalSportId = 'goal-sport-2024';
const goalReadId = 'goal-read-2024';

// Генерируем транзакции за 6 месяцев (имитация)
const generateFinanceHistory = (): Transaction[] => {
  const txs: Transaction[] = [];
  const categories = ['Продукты', 'Аренда', 'Развлечения', 'Транспорт', 'Здоровье'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 5);
    // Зарплата
    txs.push({
      id: `salary-${i}`,
      amount: 180000,
      type: 'income',
      category: 'Зарплата',
      timestamp: date.toISOString()
    });
    // Основные расходы
    txs.push({ id: `rent-${i}`, amount: 45000, type: 'expense', category: 'Жилье', timestamp: date.toISOString() });
    
    // Случайные расходы в течение месяца
    for (let j = 0; j < 10; j++) {
      const day = new Date(date);
      day.setDate(date.getDate() + j * 2);
      txs.push({
        id: `tx-${i}-${j}`,
        amount: Math.floor(Math.random() * 3000) + 500,
        type: 'expense',
        category: categories[j % categories.length],
        timestamp: day.toISOString()
      });
    }
  }
  return txs;
};

export const SAMPLE_TRANSACTIONS = generateFinanceHistory();

export const SAMPLE_GOALS: YearGoal[] = [
  {
    id: goalFinanceId,
    category: 'finance',
    value_id: 'v1',
    title: 'Капитал 1.5 Миллиона',
    description: 'Формирование надежного инвестиционного фундамента',
    metric: '₽',
    target_value: 1500000,
    current_value: 842000,
    start_date: month(6),
    end_date: new Date(now.getFullYear(), 11, 31).toISOString(),
    status: 'active',
    confidence_level: 85,
    difficulty: 8,
    is_shared: true,
    image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800',
    logs: [
      { id: 'l-f-1', goal_id: goalFinanceId, timestamp: month(5), value: 150000, confidence: 5, is_verified: true, verified_by: 'p-maria', user_id: 'user-main' },
      { id: 'l-f-2', goal_id: goalFinanceId, timestamp: month(3), value: 200000, confidence: 5, is_verified: true, verified_by: 'p-alex', user_id: 'user-main' },
      { id: 'l-f-3', goal_id: goalFinanceId, timestamp: month(1), value: 180000, confidence: 4, is_verified: false, user_id: 'user-main' }
    ]
  },
  {
    id: goalSportId,
    category: 'sport',
    value_id: 'v2',
    title: 'Бег: 500 км за год',
    metric: 'км',
    target_value: 500,
    current_value: 285,
    start_date: month(6),
    end_date: new Date(now.getFullYear(), 11, 31).toISOString(),
    status: 'active',
    confidence_level: 95,
    difficulty: 6,
    image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800',
    logs: [
      { id: 'l-s-1', goal_id: goalSportId, timestamp: month(4), value: 100, confidence: 5, is_verified: true, verified_by: 'p-alex', user_id: 'user-main' },
      { id: 'l-s-2', goal_id: goalSportId, timestamp: month(2), value: 150, confidence: 5, is_verified: true, verified_by: 'p-alex', user_id: 'user-main' },
      { id: 'l-s-3', goal_id: goalSportId, timestamp: now.toISOString(), value: 35, confidence: 5, is_verified: false, user_id: 'user-main' }
    ]
  },
  {
    id: goalReadId,
    category: 'growth',
    value_id: 'v3',
    title: 'Библиотека Смыслов: 24 книги',
    metric: 'книг',
    target_value: 24,
    current_value: 14,
    start_date: month(6),
    end_date: new Date(now.getFullYear(), 11, 31).toISOString(),
    status: 'active',
    confidence_level: 90,
    difficulty: 4,
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
    logs: Array.from({length: 14}).map((_, i) => ({
      id: `l-r-${i}`,
      goal_id: goalReadId,
      timestamp: month(6 - Math.floor(i/2)),
      value: 1,
      confidence: 5,
      is_verified: i < 10,
      verified_by: 'p-maria',
      user_id: 'user-main'
    }))
  }
];

export const SAMPLE_SUBGOALS: SubGoal[] = [
  // Подцели для финансов
  { id: 'sg-f-1', year_goal_id: goalFinanceId, title: 'Подушка безопасности 300к', metric: '₽', target_value: 300000, current_value: 300000, weight: 20, deadline: month(4), frequency: 'once', difficulty: 3, is_completed: true },
  { id: 'sg-f-2', year_goal_id: goalFinanceId, title: 'Инвестиции в акции', metric: '₽', target_value: 500000, current_value: 250000, weight: 40, deadline: month(1), frequency: 'monthly', difficulty: 5 },
  { id: 'sg-f-3', year_goal_id: goalFinanceId, title: 'Пополнение ИИС', metric: '₽', target_value: 400000, current_value: 292000, weight: 40, deadline: now.toISOString(), frequency: 'monthly', difficulty: 4 },
  
  // Подцели для спорта
  { id: 'sg-s-1', year_goal_id: goalSportId, title: 'Первые 100 км', metric: 'км', target_value: 100, current_value: 100, weight: 20, deadline: month(4), frequency: 'once', difficulty: 4, is_completed: true },
  { id: 'sg-s-2', year_goal_id: goalSportId, title: 'Летний интенсив', metric: 'км', target_value: 200, current_value: 150, weight: 40, deadline: month(1), frequency: 'weekly', difficulty: 6 },
  
  // Подцели для чтения
  { id: 'sg-r-1', year_goal_id: goalReadId, title: 'Нон-фикшн блок', metric: 'книг', target_value: 12, current_value: 10, weight: 50, deadline: month(2), frequency: 'monthly', difficulty: 3 }
];

export const SAMPLE_PARTNERS: AccountabilityPartner[] = [
  { id: 'p-maria', name: 'Мария', role: 'guardian', avatar: 'https://i.pravatar.cc/150?u=maria', xp: 4200 },
  { id: 'p-alex', name: 'Алекс', role: 'sensei', avatar: 'https://i.pravatar.cc/150?u=alex', xp: 8500 },
  { id: 'p-ivan', name: 'Иван', role: 'roaster', avatar: 'https://i.pravatar.cc/150?u=ivan', xp: 1200 }
];

export const SAMPLE_MEETINGS: Meeting[] = [
  { id: 'm1', title: 'Разбор портфеля с Алексом', time: new Date(now.getTime() + 86400000 * 2).toISOString(), location: 'Zoom', category: 'finance' },
  { id: 'm2', title: 'Книжный клуб: Атлант расправил плечи', time: new Date(now.getTime() + 86400000 * 5).toISOString(), location: 'Коворкинг', category: 'growth' }
];
