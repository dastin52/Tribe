
import { useState, useEffect } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, Debt, Subscription, Transaction, SubGoal, ProgressLog } from '../types';
import { geminiService } from '../services/gemini';

const INITIAL_USER: User = {
  id: 'user-main',
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

const getSampleData = () => {
  const now = new Date();
  const goalId = crypto.randomUUID();
  
  const sampleGoals: YearGoal[] = [{
    id: goalId, 
    category: 'finance', 
    value_id: 'v1', 
    title: 'Путь к Свободе (1M)', 
    metric: '₽', 
    target_value: 1000000, 
    current_value: 120000, 
    start_date: now.toISOString(), 
    end_date: new Date(now.getFullYear(), 11, 31).toISOString(), 
    status: 'active', 
    confidence_level: 90, 
    difficulty: 7, 
    logs: [
      { id: 'log-initial', goal_id: goalId, timestamp: now.toISOString(), value: 120000, confidence: 1, is_verified: true, verified_by: 'p1', user_id: 'user-main' }
    ], 
    is_private: false, 
    is_shared: true
  }];

  const sampleSubgoals: SubGoal[] = [
    { id: 'sg1', year_goal_id: goalId, title: 'Формирование подушки', metric: '₽', target_value: 50000, current_value: 50000, weight: 30, deadline: now.toISOString(), frequency: 'once', difficulty: 3, is_completed: true },
    { id: 'sg2', year_goal_id: goalId, title: 'Инвестиции в акции', metric: '₽', target_value: 70000, current_value: 20000, weight: 70, deadline: new Date(now.getTime() + 30 * 86400000).toISOString(), frequency: 'monthly', difficulty: 5 }
  ];

  const samplePartners: AccountabilityPartner[] = [
    { id: 'p1', name: 'Мария', role: 'guardian', avatar: 'https://i.pravatar.cc/150?u=maria', xp: 1200 },
    { id: 'p2', name: 'Алекс', role: 'sensei', avatar: 'https://i.pravatar.cc/150?u=alex', xp: 4500 }
  ];

  const sampleTxs: Transaction[] = [
    { id: 'tx1', amount: 150000, type: 'income', category: 'Зарплата', note: 'Основной доход', timestamp: now.toISOString() },
    { id: 'tx2', amount: 4500, type: 'expense', category: 'Продукты', note: 'Закупка на неделю', timestamp: now.toISOString() }
  ];

  const sampleDebts: Debt[] = [
    { id: 'd1', title: 'Рассрочка за iPhone', total_amount: 80000, remaining_amount: 45000, type: 'i_owe', category: 'other' },
    { id: 'd2', title: 'Долг от Олега', total_amount: 15000, remaining_amount: 15000, type: 'they_owe', category: 'friend' }
  ];

  const sampleSubs: Subscription[] = [
    { id: 's1', title: 'Netflix', amount: 990, period: 'monthly', category: 'Развлечения' },
    { id: 's2', title: 'Фитнес-клуб', amount: 3500, period: 'monthly', category: 'Здоровье' }
  ];

  return { sampleGoals, sampleSubgoals, samplePartners, sampleTxs, sampleDebts, sampleSubs };
};

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [subgoals, setSubgoals] = useState<SubGoal[]>([]);
  const [values, setValues] = useState<Value[]>([
    { id: 'v1', title: 'Свобода', description: 'Возможность выбирать свой путь', priority: 5 },
    { id: 'v2', title: 'Здоровье', description: 'Энергия для великих дел', priority: 4 }
  ]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedGoals = localStorage.getItem('tribe_goals');
    
    // Если данных нет - создаем приветственный пакет
    if (!savedGoals) {
      const { sampleGoals, sampleSubgoals, samplePartners, sampleTxs, sampleDebts, sampleSubs } = getSampleData();
      setGoals(sampleGoals);
      setSubgoals(sampleSubgoals);
      setPartners(samplePartners);
      setTransactions(sampleTxs);
      setDebts(sampleDebts);
      setSubscriptions(sampleSubs);
      
      const updatedUser = { ...INITIAL_USER, level: 2, xp: 250, financials: { 
        total_assets: 120000, 
        total_debts: 45000, 
        monthly_income: 150000, 
        monthly_expenses: 4500, 
        currency: '₽' 
      }};
      setUser(updatedUser);
    } else {
      try {
        const saved = {
          user: localStorage.getItem('tribe_user'),
          goals: savedGoals,
          subgoals: localStorage.getItem('tribe_subgoals'),
          values: localStorage.getItem('tribe_values'),
          txs: localStorage.getItem('tribe_txs'),
          debts: localStorage.getItem('tribe_debts'),
          subs: localStorage.getItem('tribe_subs'),
          partners: localStorage.getItem('tribe_partners')
        };
        if (saved.user) setUser(JSON.parse(saved.user));
        if (saved.goals) setGoals(JSON.parse(saved.goals));
        if (saved.subgoals) setSubgoals(JSON.parse(saved.subgoals));
        if (saved.values) setValues(JSON.parse(saved.values));
        if (saved.txs) setTransactions(JSON.parse(saved.txs));
        if (saved.debts) setDebts(JSON.parse(saved.debts));
        if (saved.subs) setSubscriptions(JSON.parse(saved.subs));
        if (saved.partners) setPartners(JSON.parse(saved.partners));
      } catch (e) { console.error("Store init error", e); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tribe_user', JSON.stringify(user));
      localStorage.setItem('tribe_goals', JSON.stringify(goals));
      localStorage.setItem('tribe_subgoals', JSON.stringify(subgoals));
      localStorage.setItem('tribe_values', JSON.stringify(values));
      localStorage.setItem('tribe_txs', JSON.stringify(transactions));
      localStorage.setItem('tribe_debts', JSON.stringify(debts));
      localStorage.setItem('tribe_subs', JSON.stringify(subscriptions));
      localStorage.setItem('tribe_partners', JSON.stringify(partners));
    }
  }, [user, goals, subgoals, values, transactions, debts, subscriptions, partners, loading]);

  const awardXP = (amount: number, difficulty: number = 1) => {
    setUser(prev => {
       const bonus = 1 + (difficulty / 10) + (prev.streak * 0.05);
       const newXP = prev.xp + Math.round(amount * bonus);
       const threshold = prev.level * 1000;
       if (newXP >= threshold) return { ...prev, xp: newXP - threshold, level: prev.level + 1 };
       return { ...prev, xp: newXP };
    });
  };

  const updateSubgoalProgress = (sgId: string, value: number, forceVerify: boolean = false) => {
    setSubgoals(prev => prev.map(sg => {
      if (sg.id === sgId) {
        const newValue = sg.current_value + value;
        const isNowCompleted = newValue >= sg.target_value;
        const log: ProgressLog = {
          id: crypto.randomUUID(),
          goal_id: sg.year_goal_id,
          subgoal_id: sg.id,
          timestamp: new Date().toISOString(),
          value,
          confidence: 1,
          is_verified: forceVerify,
          verified_by: forceVerify ? 'self' : undefined,
          user_id: user.id
        };
        setGoals(gPrev => gPrev.map(g => g.id === sg.year_goal_id ? { ...g, logs: [...(g.logs || []), log], current_value: forceVerify ? g.current_value + value : g.current_value } : g));
        return { ...sg, current_value: newValue, is_completed: isNowCompleted };
      }
      return sg;
    }));
    awardXP(100, 5);
  };

  const addTransaction = (amount: number, type: 'income' | 'expense', category: string, note?: string, goal_id?: string) => {
    const newTx: Transaction = { id: crypto.randomUUID(), amount, type, category, note, timestamp: new Date().toISOString(), goal_id };
    setTransactions(p => [...p, newTx]);
    
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

  return {
    user, view, setView, goals, subgoals, values, transactions, debts, subscriptions, meetings, partners, loading,
    updateSubgoalProgress, addTransaction, awardXP, verifyProgress: (gId: string, lId: string, vId: string) => {
       setGoals(prev => prev.map(g => {
         if (g.id === gId) {
           const updatedLogs = g.logs.map(l => l.id === lId ? { ...l, is_verified: true, verified_by: vId } : l);
           const verifiedValue = updatedLogs.filter(l => l.is_verified).reduce((acc, l) => acc + l.value, 0);
           return { ...g, logs: updatedLogs, current_value: verifiedValue };
         }
         return g;
       }));
       awardXP(300);
    }, 
    generateGoalVision: async (goalId: string) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      const imageUrl = await geminiService.generateGoalVision(goal.title, goal.description || "");
      if (imageUrl) {
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, image_url: imageUrl } : g));
        awardXP(200);
      }
    },
    addPartner: (name: string, role: string) => {
      setPartners(p => [...p, { id: 'p-' + crypto.randomUUID(), name, role: role as any, avatar: `https://i.pravatar.cc/150?u=${name}`, xp: 0 }]);
    },
    addDebt: (d: any) => setDebts(prev => [...prev, { ...d, id: crypto.randomUUID() }]),
    addSubscription: (s: any) => setSubscriptions(prev => [...prev, { ...s, id: crypto.randomUUID() }]),
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); awardXP(500, g.difficulty); },
    toggleGoalPrivacy: (id: string) => setGoals(p => p.map(g => g.id === id ? {...g, is_private: !g.is_private} : g)),
    updateUserInfo: (d: any) => setUser(p => ({...p, ...d})),
    resetData: () => { localStorage.clear(); window.location.reload(); }
  };
}
