
import { useState, useEffect } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, PartnerReview, Debt, Subscription, Transaction, SubGoal, Project, Meeting, ProgressLog } from '../types';

const INITIAL_USER: User = {
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  name: 'Лидер Племени',
  xp: 0,
  level: 1,
  streak: 1,
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
  { id: 'p1', name: 'Мария', role: 'guardian', avatar: 'https://i.pravatar.cc/150?u=p1' },
  { id: 'p2', name: 'Алекс', role: 'accomplice', avatar: 'https://i.pravatar.cc/150?u=p2' }
];

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [subgoals, setSubgoals] = useState<SubGoal[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>(DEFAULT_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = {
      user: localStorage.getItem('tribe_user'),
      goals: localStorage.getItem('tribe_goals'),
      subgoals: localStorage.getItem('tribe_subgoals'),
      txs: localStorage.getItem('tribe_txs'),
      debts: localStorage.getItem('tribe_debts'),
      subs: localStorage.getItem('tribe_subs'),
      meetings: localStorage.getItem('tribe_meetings')
    };
    try {
      if (saved.user) setUser(JSON.parse(saved.user));
      if (saved.goals) setGoals(JSON.parse(saved.goals));
      if (saved.subgoals) setSubgoals(JSON.parse(saved.subgoals));
      if (saved.txs) setTransactions(JSON.parse(saved.txs));
      if (saved.debts) setDebts(JSON.parse(saved.debts));
      if (saved.subs) setSubscriptions(JSON.parse(saved.subs));
      if (saved.meetings) setMeetings(JSON.parse(saved.meetings));
    } catch (e) { console.error("Store init error"); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tribe_user', JSON.stringify(user));
      localStorage.setItem('tribe_goals', JSON.stringify(goals));
      localStorage.setItem('tribe_subgoals', JSON.stringify(subgoals));
      localStorage.setItem('tribe_txs', JSON.stringify(transactions));
      localStorage.setItem('tribe_debts', JSON.stringify(debts));
      localStorage.setItem('tribe_subs', JSON.stringify(subscriptions));
      localStorage.setItem('tribe_meetings', JSON.stringify(meetings));
    }
  }, [user, goals, subgoals, transactions, debts, subscriptions, meetings, loading]);

  const awardXP = (amount: number, difficulty: number = 1) => {
    setUser(prev => {
       const bonus = 1 + (difficulty / 10) + (prev.streak * 0.05);
       const newXP = prev.xp + Math.round(amount * bonus);
       const threshold = prev.level * 1000;
       if (newXP >= threshold) return { ...prev, xp: newXP - threshold, level: prev.level + 1 };
       return { ...prev, xp: newXP };
    });
  };

  const updateSubgoalProgress = (sgId: string, value: number) => {
    setSubgoals(prev => prev.map(sg => {
      if (sg.id === sgId) {
        const newValue = sg.current_value + value;
        const log: ProgressLog = {
          id: crypto.randomUUID(),
          goal_id: sg.year_goal_id,
          subgoal_id: sg.id,
          timestamp: new Date().toISOString(),
          value,
          confidence: 1,
          is_verified: false
        };
        setGoals(gPrev => gPrev.map(g => g.id === sg.year_goal_id ? { ...g, logs: [...(g.logs || []), log] } : g));
        return { ...sg, current_value: Math.min(sg.target_value, newValue) };
      }
      return sg;
    }));
    awardXP(100, 5);
  };

  const verifyProgress = (goalId: string, logId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const updatedLogs = g.logs.map(l => l.id === logId ? { ...l, is_verified: true, verified_by: partners[0].id } : l);
        const verifiedValue = updatedLogs.filter(l => l.is_verified).reduce((acc, l) => acc + l.value, 0);
        // В Tribe реальный подтвержденный прогресс
        return { ...g, logs: updatedLogs, current_value: verifiedValue };
      }
      return g;
    }));
    awardXP(300);
  };

  const addTransaction = (amount: number, type: 'income' | 'expense', category: string, note?: string, goal_id?: string) => {
    const newTx: Transaction = { id: crypto.randomUUID(), amount, type, category, note, timestamp: new Date().toISOString(), goal_id };
    setTransactions(p => [...p, newTx]);
    if (goal_id && type === 'expense') {
       const log: ProgressLog = { id: crypto.randomUUID(), goal_id, timestamp: new Date().toISOString(), value: amount, confidence: 1, is_verified: true };
       setGoals(p => p.map(g => g.id === goal_id ? { ...g, current_value: g.current_value + amount, logs: [...g.logs, log] } : g));
    }
    setUser(prev => {
      const f = prev.financials || INITIAL_USER.financials!;
      return { ...prev, financials: { ...f, 
        total_assets: type === 'income' ? f.total_assets + amount : f.total_assets - amount,
        monthly_income: type === 'income' ? f.monthly_income + amount : f.monthly_income,
        monthly_expenses: type === 'expense' ? f.monthly_expenses + amount : f.monthly_expenses,
      }};
    });
    awardXP(50);
  };

  // Add implementation for toggleGoalPrivacy to fix property access error in App.tsx
  const toggleGoalPrivacy = (goalId: string) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, is_private: !g.is_private } : g));
  };

  return {
    user, view, setView, goals, subgoals, transactions, debts, subscriptions, meetings, partners, loading,
    updateSubgoalProgress, addTransaction, awardXP, verifyProgress, toggleGoalPrivacy,
    addDebt: (d: any) => setDebts(prev => [...prev, { ...d, id: crypto.randomUUID() }]),
    addSubscription: (s: any) => setSubscriptions(prev => [...prev, { ...s, id: crypto.randomUUID() }]),
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); awardXP(500, g.difficulty); },
    updateUserInfo: (d: any) => setUser(p => ({...p, ...d})),
    resetData: () => { localStorage.clear(); window.location.reload(); },
    startDemo: () => {
      const now = new Date();
      const g1Id = crypto.randomUUID();
      setGoals([{
        id: g1Id, category: 'finance', value_id: 'v1', title: 'Капитал Свободы', metric: '₽', 
        target_value: 1000000, current_value: 450000, start_date: now.toISOString(), 
        end_date: new Date(now.getTime() + 365 * 86400000).toISOString(), status: 'active', 
        confidence_level: 85, difficulty: 8, logs: [
          { id: 'l1', goal_id: g1Id, timestamp: now.toISOString(), value: 450000, confidence: 1, is_verified: true, verified_by: 'p1' }
        ], is_private: false
      }]);
      setSubgoals([{ id: 'sg1', year_goal_id: g1Id, title: 'Пополнение ИИС', metric: '₽', target_value: 50000, current_value: 10000, weight: 100, deadline: now.toISOString(), frequency: 'monthly', difficulty: 4 }]);
      setTransactions([{ id: 't1', amount: 150000, type: 'income', category: 'Зарплата', timestamp: now.toISOString() }]);
      setDebts([{ id: 'd1', title: 'MacBook рассрочка', total_amount: 150000, remaining_amount: 70000, type: 'i_owe', category: 'bank' }]);
      setSubscriptions([{ id: 's1', title: 'Tribe Pro', amount: 990, period: 'monthly', category: 'digital' }]);
      setUser({ ...INITIAL_USER, level: 3, xp: 450, streak: 12, financials: { ...INITIAL_USER.financials!, total_assets: 450000 } });
      setView(AppView.DASHBOARD);
    }
  };
}
