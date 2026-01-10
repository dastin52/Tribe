
import { useState, useEffect } from 'react';
import { User, Value, YearGoal, Action, AppView, ProgressLog, AccountabilityPartner, PartnerReview, Debt, Subscription, Transaction } from '../types';
import { geminiService } from '../services/gemini';

const INITIAL_USER: User = {
  id: 'user-1',
  name: 'Лидер',
  xp: 0,
  level: 1,
  streak: 0,
  last_active: new Date().toISOString(),
  financials: {
    total_assets: 0,
    total_debts: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    currency: '₽'
  },
  energy_profile: { peak_hours: [9, 10, 11, 16, 17], low_energy_hours: [14, 22, 23] }
};

const DEFAULT_PARTNERS: AccountabilityPartner[] = [
  { id: 'p1', name: 'Любимка', role: 'guardian' },
  { id: 'p2', name: 'Бро', role: 'accomplice' },
  { id: 'p3', name: 'Сэнсэй', role: 'sensei' },
  { id: 'p4', name: 'Совесть', role: 'roaster' },
  { id: 'p5', name: 'Штурман', role: 'navigator' }
];

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [values, setValues] = useState<Value[]>([]);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>(DEFAULT_PARTNERS);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = {
      values: localStorage.getItem('tribe_values'),
      goals: localStorage.getItem('tribe_goals'),
      user: localStorage.getItem('tribe_user'),
      reviews: localStorage.getItem('tribe_reviews'),
      debts: localStorage.getItem('tribe_debts'),
      subs: localStorage.getItem('tribe_subs'),
      partners: localStorage.getItem('tribe_partners'),
      txs: localStorage.getItem('tribe_txs')
    };

    if (saved.user) setUser(JSON.parse(saved.user));
    if (saved.values) setValues(JSON.parse(saved.values));
    if (saved.goals) setGoals(JSON.parse(saved.goals));
    if (saved.reviews) setReviews(JSON.parse(saved.reviews));
    if (saved.debts) setDebts(JSON.parse(saved.debts));
    if (saved.subs) setSubscriptions(JSON.parse(saved.subs));
    if (saved.partners) setPartners(JSON.parse(saved.partners));
    if (saved.txs) setTransactions(JSON.parse(saved.txs));
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tribe_values', JSON.stringify(values));
      localStorage.setItem('tribe_goals', JSON.stringify(goals));
      localStorage.setItem('tribe_user', JSON.stringify(user));
      localStorage.setItem('tribe_reviews', JSON.stringify(reviews));
      localStorage.setItem('tribe_debts', JSON.stringify(debts));
      localStorage.setItem('tribe_subs', JSON.stringify(subscriptions));
      localStorage.setItem('tribe_partners', JSON.stringify(partners));
      localStorage.setItem('tribe_txs', JSON.stringify(transactions));
    }
  }, [values, goals, user, reviews, debts, subscriptions, partners, transactions, loading]);

  const awardXP = (amount: number) => {
    setUser(prev => {
       const newXP = prev.xp + amount;
       const threshold = prev.level * 1000;
       if (newXP >= threshold) {
          return { ...prev, xp: newXP - threshold, level: prev.level + 1 };
       }
       return { ...prev, xp: newXP };
    });
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);

    // Update assets based on income/expense
    setUser(prev => {
      if (!prev.financials) return prev;
      const amountChange = tx.type === 'income' ? tx.amount : -tx.amount;
      return {
        ...prev,
        financials: {
          ...prev.financials,
          total_assets: prev.financials.total_assets + amountChange
        }
      };
    });
    awardXP(20);
  };

  const startDemo = () => {
    const g1Id = crypto.randomUUID();
    const l1Id = crypto.randomUUID();
    
    setGoals([
      {
        id: g1Id, category: 'finance', value_id: 'v1', title: 'Финансовая подушка', metric: '₽', 
        target_value: 500000, current_value: 120000, start_date: new Date().toISOString(), 
        end_date: new Date(Date.now() + 31536000000).toISOString(), status: 'active', confidence_level: 70, 
        logs: [
          { id: l1Id, goal_id: g1Id, timestamp: new Date(Date.now() - 86400000).toISOString(), value: 50000, confidence: 95, is_verified: false }
        ]
      }
    ]);
    
    setDebts([
      { id: 'd1', title: 'Кредит на авто', total_amount: 1200000, remaining_amount: 850000, interest_rate: 12.5 }
    ]);
    
    setSubscriptions([
      { id: 's1', title: 'Netflix', amount: 999, period: 'monthly', category: 'Развлечения' },
      { id: 's2', title: 'Gym Membership', amount: 3500, period: 'monthly', category: 'Здоровье' }
    ]);

    const demoTxs: Transaction[] = [
      { id: 't1', amount: 120000, type: 'income', category: 'Зарплата', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Основная работа' },
      { id: 't2', amount: 4500, type: 'expense', category: 'Продукты', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 't3', amount: 1200, type: 'expense', category: 'Транспорт', timestamp: new Date().toISOString() },
      { id: 't4', amount: 15000, type: 'income', category: 'Инвестиции', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 't5', amount: 35000, type: 'expense', category: 'Жилье', timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
    ];
    setTransactions(demoTxs);

    setUser({ 
      ...INITIAL_USER, 
      is_demo: true, 
      xp: 5200, 
      level: 5, 
      streak: 15,
      financials: {
        total_assets: 1450000,
        total_debts: 850000,
        monthly_income: 185000,
        monthly_expenses: 92000,
        currency: '₽'
      }
    });
    setView(AppView.DASHBOARD);
  };

  const startFresh = () => {
    setUser({ ...INITIAL_USER, is_demo: false });
    setValues([]);
    setGoals([]);
    setReviews([]);
    setDebts([]);
    setSubscriptions([]);
    setTransactions([]);
    setView(AppView.VALUES);
  };

  const addGoal = (g: YearGoal) => {
    setGoals(prev => [...prev, g]);
  };

  const addPartnerReview = (review: Omit<PartnerReview, 'id' | 'timestamp'>) => {
    const newReview = { ...review, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setReviews(prev => [...prev, newReview]);
    
    setGoals(prev => prev.map(g => {
       const logIndex = g.logs.findIndex(l => l.id === review.log_id);
       if (logIndex !== -1) {
          const updatedLogs = [...g.logs];
          updatedLogs[logIndex] = { ...updatedLogs[logIndex], is_verified: review.is_verified };
          const confidenceShift = review.is_verified ? (review.rating >= 4 ? 5 : 2) : -15;
          return { 
             ...g, 
             logs: updatedLogs, 
             confidence_level: Math.min(100, Math.max(0, g.confidence_level + confidenceShift))
          };
       }
       return g;
    }));

    if (review.is_verified) awardXP(300);
  };

  return {
    user, setUser, view, setView, values, goals, addGoal, partners, reviews, 
    addPartnerReview, loading, startDemo, startFresh, debts, subscriptions, transactions, addTransaction,
    refreshSocialInsight: async () => {}
  };
}
