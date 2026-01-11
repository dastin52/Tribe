
import { useState, useEffect } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, Debt, Subscription, Transaction, SubGoal, ProgressLog } from '../types';
import { geminiService } from '../services/gemini';

const INITIAL_USER: User = {
  id: 'user-main',
  name: 'Лидер Племени',
  xp: 0,
  level: 1,
  streak: 5,
  last_active: new Date().toISOString(),
  financials: {
    total_assets: 182836,
    total_debts: 45000,
    monthly_income: 150000,
    monthly_expenses: 4500,
    currency: '₽'
  },
  energy_profile: { peak_hours: [9, 10, 11, 16, 17], low_energy_hours: [14, 22, 23] }
};

const getSampleData = () => {
  const now = new Date();
  
  // Цели
  const financeGoalId = crypto.randomUUID();
  const sportGoalId = crypto.randomUUID();
  
  const sampleGoals: YearGoal[] = [
    {
      id: financeGoalId, 
      category: 'finance', 
      value_id: 'v1', 
      title: 'Путь к Свободе (1.5M)', 
      metric: '₽', 
      target_value: 1500000, 
      current_value: 182836, 
      start_date: now.toISOString(), 
      end_date: new Date(now.getFullYear(), 11, 31).toISOString(), 
      status: 'active', 
      confidence_level: 90, 
      difficulty: 8, 
      logs: [], 
      is_private: false, 
      is_shared: true
    },
    {
      id: sportGoalId,
      category: 'sport',
      value_id: 'v2',
      title: 'Идеальная форма',
      metric: 'тренировок',
      target_value: 100,
      current_value: 24,
      start_date: now.toISOString(),
      end_date: new Date(now.getFullYear(), 11, 31).toISOString(),
      status: 'active',
      confidence_level: 85,
      difficulty: 6,
      logs: []
    }
  ];

  const sampleSubgoals: SubGoal[] = [
    { id: 'sg1', year_goal_id: financeGoalId, title: 'Формирование подушки', metric: '₽', target_value: 100000, current_value: 100000, weight: 30, deadline: now.toISOString(), frequency: 'once', difficulty: 3, is_completed: true },
    { id: 'sg2', year_goal_id: financeGoalId, title: 'Инвестиции в акции', metric: '₽', target_value: 200000, current_value: 82836, weight: 70, deadline: new Date(now.getTime() + 30 * 86400000).toISOString(), frequency: 'monthly', difficulty: 5 },
    { id: 'sg3', year_goal_id: sportGoalId, title: 'Утренняя зарядка', metric: 'дней', target_value: 30, current_value: 12, weight: 50, deadline: new Date(now.getTime() + 7 * 86400000).toISOString(), frequency: 'daily', difficulty: 2 }
  ];

  const samplePartners: AccountabilityPartner[] = [
    { id: 'p1', name: 'Мария', role: 'guardian', avatar: 'https://i.pravatar.cc/150?u=maria', xp: 1200 },
    { id: 'p2', name: 'Алекс', role: 'sensei', avatar: 'https://i.pravatar.cc/150?u=alex', xp: 4500 }
  ];

  // Генерация транзакций за 6 месяцев
  const sampleTxs: Transaction[] = [];
  const categories = ['Продукты', 'Транспорт', 'Развлечения', 'Здоровье', 'Коммунальные', 'Одежда'];
  
  for (let m = 0; m < 6; m++) {
    const monthDate = new Date();
    monthDate.setMonth(now.getMonth() - m);
    monthDate.setDate(1);
    
    // Доход
    sampleTxs.push({ 
      id: `inc-${m}`, 
      amount: 150000, 
      type: 'income', 
      category: 'Зарплата', 
      note: 'Зарплата', 
      timestamp: monthDate.toISOString() 
    });

    // Расходы (около 20 на месяц)
    for (let i = 1; i <= 20; i++) {
      const txDate = new Date(monthDate);
      txDate.setDate(i + Math.floor(Math.random() * 5));
      const amount = Math.floor(Math.random() * 3000) + 500;
      const cat = categories[Math.floor(Math.random() * categories.length)];
      sampleTxs.push({
        id: `tx-${m}-${i}`,
        amount,
        type: 'expense',
        category: cat,
        note: `Трата в ${cat.toLowerCase()}`,
        timestamp: txDate.toISOString()
      });
    }
  }

  const sampleDebts: Debt[] = [
    { id: 'd1', title: 'Рассрочка за технику', total_amount: 80000, remaining_amount: 45000, type: 'i_owe', category: 'bank' },
    { id: 'd2', title: 'Долг от Олега', total_amount: 15000, remaining_amount: 15000, type: 'they_owe', category: 'friend' }
  ];

  const sampleSubs: Subscription[] = [
    { id: 's1', title: 'Кинопоиск', amount: 490, period: 'monthly', category: 'Развлечения' },
    { id: 's2', title: 'Спортзал', amount: 4000, period: 'monthly', category: 'Здоровье' }
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
    // Fix: Define 'now' variable to resolve the reference error in lastMonthExpenses calculation
    const now = new Date();
    
    if (!savedGoals) {
      const { sampleGoals, sampleSubgoals, samplePartners, sampleTxs, sampleDebts, sampleSubs } = getSampleData();
      setGoals(sampleGoals);
      setSubgoals(sampleSubgoals);
      setPartners(samplePartners);
      setTransactions(sampleTxs);
      setDebts(sampleDebts);
      setSubscriptions(sampleSubs);
      
      const lastMonthExpenses = sampleTxs.filter(t => t.type === 'expense' && new Date(t.timestamp).getMonth() === now.getMonth()).reduce((acc, t) => acc + t.amount, 0);

      setUser({ ...INITIAL_USER, level: 3, xp: 450, financials: { 
        total_assets: 182836,
        total_debts: 45000, 
        monthly_income: 150000, 
        monthly_expenses: lastMonthExpenses || 45000,
        currency: '₽' 
      }});
    } else {
      try {
        const u = localStorage.getItem('tribe_user');
        const g = localStorage.getItem('tribe_goals');
        const sg = localStorage.getItem('tribe_subgoals');
        const v = localStorage.getItem('tribe_values');
        const tx = localStorage.getItem('tribe_txs');
        const d = localStorage.getItem('tribe_debts');
        const s = localStorage.getItem('tribe_subs');
        const p = localStorage.getItem('tribe_partners');

        if (u) setUser(JSON.parse(u));
        if (g) setGoals(JSON.parse(g));
        if (sg) setSubgoals(JSON.parse(sg));
        if (v) setValues(JSON.parse(v));
        if (tx) setTransactions(JSON.parse(tx));
        if (d) setDebts(JSON.parse(d));
        if (s) setSubscriptions(JSON.parse(s));
        if (p) setPartners(JSON.parse(p));
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
    addTransaction, awardXP,
    updateSubgoalProgress: (sgId: string, value: number, forceVerify: boolean = false) => {
      setSubgoals(prev => prev.map(sg => {
        if (sg.id === sgId) {
          const newValue = sg.current_value + value;
          const isNowCompleted = newValue >= sg.target_value;
          const log: ProgressLog = {
            id: crypto.randomUUID(), goal_id: sg.year_goal_id, subgoal_id: sg.id, timestamp: new Date().toISOString(), value, confidence: 1, is_verified: forceVerify, verified_by: forceVerify ? 'self' : undefined, user_id: user.id
          };
          setGoals(gPrev => gPrev.map(g => g.id === sg.year_goal_id ? { ...g, logs: [...(g.logs || []), log], current_value: forceVerify ? g.current_value + value : g.current_value } : g));
          return { ...sg, current_value: newValue, is_completed: isNowCompleted };
        }
        return sg;
      }));
      awardXP(100, 5);
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
    addPartner: (name: string, role: string) => setPartners(p => [...p, { id: 'p-' + crypto.randomUUID(), name, role: role as any, avatar: `https://i.pravatar.cc/150?u=${name}`, xp: 0 }]),
    addDebt: (d: any) => setDebts(prev => [...prev, { ...d, id: crypto.randomUUID() }]),
    addSubscription: (s: any) => setSubscriptions(prev => [...prev, { ...s, id: crypto.randomUUID() }]),
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); awardXP(500, g.difficulty); },
    toggleGoalPrivacy: (id: string) => setGoals(p => p.map(g => g.id === id ? {...g, is_private: !g.is_private} : g)),
    updateUserInfo: (d: any) => setUser(p => ({...p, ...d})),
    resetData: () => { localStorage.clear(); window.location.reload(); },
    verifyProgress: (gId: string, lId: string, vId: string) => {
       setGoals(prev => prev.map(g => {
         if (g.id === gId) {
           const updatedLogs = g.logs.map(l => l.id === lId ? { ...l, is_verified: true, verified_by: vId } : l);
           const verifiedValue = updatedLogs.filter(l => l.is_verified).reduce((acc, l) => acc + l.value, 0);
           return { ...g, logs: updatedLogs, current_value: verifiedValue };
         }
         return g;
       }));
       awardXP(300);
    }
  };
}
