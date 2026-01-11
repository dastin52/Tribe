
import { useState, useEffect } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, PartnerReview, Debt, Subscription, Transaction, SubGoal, Project, Meeting, DebtCategory, DebtDirection } from '../types';

const INITIAL_USER: User = {
  id: 'user-' + Math.random().toString(36).substr(2, 9),
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
  const [subgoals, setSubgoals] = useState<SubGoal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>(DEFAULT_PARTNERS);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setUser(prev => ({
        ...prev,
        telegram_id: String(u.id),
        name: u.first_name + (u.last_name ? ' ' + u.last_name : ''),
        photo_url: u.photo_url
      }));
    }
  }, []);

  useEffect(() => {
    const saved = {
      values: localStorage.getItem('tribe_values'),
      goals: localStorage.getItem('tribe_goals'),
      subgoals: localStorage.getItem('tribe_subgoals'),
      projects: localStorage.getItem('tribe_projects'),
      user: localStorage.getItem('tribe_user'),
      reviews: localStorage.getItem('tribe_reviews'),
      debts: localStorage.getItem('tribe_debts'),
      subs: localStorage.getItem('tribe_subs'),
      partners: localStorage.getItem('tribe_partners'),
      txs: localStorage.getItem('tribe_txs'),
      meetings: localStorage.getItem('tribe_meetings')
    };

    if (saved.user) setUser(JSON.parse(saved.user));
    if (saved.values) setValues(JSON.parse(saved.values));
    if (saved.goals) setGoals(JSON.parse(saved.goals));
    if (saved.subgoals) setSubgoals(JSON.parse(saved.subgoals));
    if (saved.projects) setProjects(JSON.parse(saved.projects));
    if (saved.reviews) setReviews(JSON.parse(saved.reviews));
    if (saved.debts) setDebts(JSON.parse(saved.debts));
    if (saved.subs) setSubscriptions(JSON.parse(saved.subs));
    if (saved.partners) setPartners(JSON.parse(saved.partners));
    if (saved.txs) setTransactions(JSON.parse(saved.txs));
    if (saved.meetings) setMeetings(JSON.parse(saved.meetings));
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tribe_values', JSON.stringify(values));
      localStorage.setItem('tribe_goals', JSON.stringify(goals));
      localStorage.setItem('tribe_subgoals', JSON.stringify(subgoals));
      localStorage.setItem('tribe_projects', JSON.stringify(projects));
      localStorage.setItem('tribe_user', JSON.stringify(user));
      localStorage.setItem('tribe_reviews', JSON.stringify(reviews));
      localStorage.setItem('tribe_debts', JSON.stringify(debts));
      localStorage.setItem('tribe_subs', JSON.stringify(subscriptions));
      localStorage.setItem('tribe_partners', JSON.stringify(partners));
      localStorage.setItem('tribe_txs', JSON.stringify(transactions));
      localStorage.setItem('tribe_meetings', JSON.stringify(meetings));
    }
  }, [values, goals, subgoals, projects, user, reviews, debts, subscriptions, partners, transactions, meetings, loading]);

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

  const addTransaction = (amount: number, type: 'income' | 'expense', category: string, note?: string) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount,
      type,
      category,
      note,
      timestamp: new Date().toISOString()
    };
    
    setTransactions(prev => [...prev, newTx]);
    
    setUser(prev => {
      const financials = prev.financials || INITIAL_USER.financials!;
      return {
        ...prev,
        financials: {
          ...financials,
          total_assets: type === 'income' ? financials.total_assets + amount : financials.total_assets - amount,
          monthly_income: type === 'income' ? financials.monthly_income + amount : financials.monthly_income,
          monthly_expenses: type === 'expense' ? financials.monthly_expenses + amount : financials.monthly_expenses,
        }
      };
    });
    awardXP(50);
  };

  const addDebt = (debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debt, id: crypto.randomUUID() };
    setDebts(prev => [...prev, newDebt]);
    awardXP(100);
  };

  const addSubscription = (sub: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = { ...sub, id: crypto.randomUUID() };
    setSubscriptions(prev => [...prev, newSub]);
    awardXP(50);
  };

  const updateUserInfo = (data: Partial<User>) => {
    setUser(prev => ({ ...prev, ...data }));
    if (data.financials) {
       setUser(prev => ({ ...prev, financials: { ...prev.financials!, ...data.financials } }));
    }
  };

  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const startDemo = () => {
    const g1Id = crypto.randomUUID();
    const g2Id = crypto.randomUUID();
    
    setGoals([
      {
        id: g1Id, category: 'finance', value_id: 'v1', title: 'Купить велосипед (Carbon Road)', metric: '₽', 
        target_value: 250000, current_value: 45000, start_date: new Date().toISOString(), 
        end_date: new Date(Date.now() + 180 * 86400000).toISOString(), status: 'active', confidence_level: 85, 
        logs: [], is_private: false
      },
      {
        id: g2Id, category: 'sport', value_id: 'v2', title: 'Пробежать 10км', metric: 'км', 
        target_value: 10, current_value: 2, start_date: new Date().toISOString(), 
        end_date: new Date(Date.now() + 60 * 86400000).toISOString(), status: 'active', confidence_level: 60, 
        logs: [], is_private: true
      }
    ]);

    setSubgoals([
      { id: 'sg1', year_goal_id: g1Id, title: 'Откладывать на байк', metric: '₽', target_value: 250000, current_value: 45000, weight: 100, deadline: new Date().toISOString(), frequency: 'monthly', auto_calculate_amount: 35000 },
      { id: 'sg2', year_goal_id: g2Id, title: 'Утренняя пробежка', metric: 'раз', target_value: 24, current_value: 3, weight: 100, deadline: new Date().toISOString(), frequency: 'daily' }
    ]);

    setMeetings([
      { id: 'm1', title: 'Тренировка с тренером', time: '18:00', category: 'sport' },
      { id: 'm2', title: 'Страт. сессия по бюджету', time: '21:00', category: 'finance' }
    ]);
    
    setTransactions([
      { id: 't1', amount: 150000, type: 'income', category: 'Зарплата', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 't2', amount: 35000, type: 'expense', category: 'Накопления', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'На велосипед' }
    ]);

    setDebts([
      { id: 'd1', title: 'Сбербанк (Кредитка)', total_amount: 50000, remaining_amount: 35000, type: 'i_owe', category: 'card', due_date: '2025-12-12' },
      { id: 'd2', title: 'Алексей (Друг)', total_amount: 10000, remaining_amount: 10000, type: 'they_owe', category: 'friend', due_date: '2025-05-20' }
    ]);

    setSubscriptions([
      { id: 's1', title: 'Telegram Premium', amount: 299, period: 'monthly', category: 'digital', next_billing_date: '2025-04-10' },
      { id: 's2', title: 'Фитнес-клуб', amount: 3500, period: 'monthly', category: 'sport', next_billing_date: '2025-04-01' }
    ]);

    setUser({ 
      ...INITIAL_USER, 
      is_demo: true, 
      xp: 1200, 
      level: 2, 
      streak: 5,
      financials: {
        total_assets: 455000,
        total_debts: 45000,
        monthly_income: 150000,
        monthly_expenses: 85000,
        currency: '₽'
      }
    });
    setView(AppView.DASHBOARD);
  };

  const startFresh = () => {
    setUser({ ...INITIAL_USER, is_demo: false });
    setValues([]);
    setGoals([]);
    setSubgoals([]);
    setProjects([]);
    setReviews([]);
    setDebts([]);
    setSubscriptions([]);
    setTransactions([]);
    setMeetings([]);
    setView(AppView.VALUES);
  };

  const addGoalWithPlan = (goal: YearGoal, sgs: SubGoal[], projs: Project[]) => {
    setGoals(prev => [...prev, goal]);
    setSubgoals(prev => [...prev, ...sgs]);
    setProjects(prev => [...prev, ...projs]);
    awardXP(500);
  };

  const updateSubgoalProgress = (sgId: string, value: number) => {
    setSubgoals(prev => prev.map(sg => {
      if (sg.id === sgId) {
        const newValue = sg.current_value + value;
        setGoals(gPrev => gPrev.map(g => {
          if (g.id === sg.year_goal_id) {
            const addedVal = (value / sg.target_value) * g.target_value * (sg.weight / 100);
            return { ...g, current_value: Math.min(g.target_value, g.current_value + addedVal) };
          }
          return g;
        }));
        return { ...sg, current_value: Math.min(sg.target_value, newValue) };
      }
      return sg;
    }));
    awardXP(100);
  };

  const toggleGoalPrivacy = (goalId: string) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, is_private: !g.is_private } : g));
  };

  return {
    user, setUser, view, setView, values, goals, addGoalWithPlan, partners, reviews, 
    loading, startDemo, startFresh, debts, subscriptions, transactions, meetings,
    subgoals, projects, updateSubgoalProgress, toggleGoalPrivacy, addTransaction,
    addDebt, addSubscription, updateUserInfo, resetData
  };
}
