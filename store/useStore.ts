
import { useState, useEffect } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, Debt, Subscription, Transaction, SubGoal, ProgressLog, Meeting, PartnerRole } from '../types';
import { geminiService } from '../services/gemini';

const INITIAL_USER: User = {
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

const getSampleData = () => {
  const now = new Date();
  const financeGoalId = crypto.randomUUID();
  const sportGoalId = crypto.randomUUID();
  const travelGoalId = crypto.randomUUID();
  const readingGoalId = crypto.randomUUID();
  
  const sampleGoals: YearGoal[] = [
    {
      id: financeGoalId, 
      category: 'finance', 
      value_id: 'v1', 
      title: 'Финансовая крепость', 
      metric: '₽', 
      target_value: 500000, 
      current_value: 120000, 
      start_date: now.toISOString(), 
      end_date: new Date(now.getFullYear(), 11, 31).toISOString(), 
      status: 'active', 
      confidence_level: 95, 
      difficulty: 7, 
      logs: [
        { id: 'l1', goal_id: financeGoalId, timestamp: now.toISOString(), value: 50000, confidence: 5, is_verified: true, verified_by: 'p1', user_id: 'user-main' }
      ], 
      is_shared: true
    },
    {
      id: sportGoalId,
      category: 'sport',
      value_id: 'v2',
      title: 'Марафонская выносливость',
      metric: 'км',
      target_value: 42,
      current_value: 42,
      start_date: now.toISOString(),
      end_date: now.toISOString(),
      status: 'completed',
      confidence_level: 100,
      difficulty: 9,
      logs: [
        { id: 'l2', goal_id: sportGoalId, timestamp: now.toISOString(), value: 42, confidence: 5, is_verified: true, verified_by: 'p2', user_id: 'user-main' }
      ]
    },
    {
      id: travelGoalId,
      category: 'other',
      value_id: 'v3',
      title: 'Экспедиция на Алтай',
      metric: 'дней',
      target_value: 14,
      current_value: 5,
      start_date: now.toISOString(),
      end_date: new Date(now.getTime() + 30 * 86400000).toISOString(),
      status: 'active',
      confidence_level: 70,
      difficulty: 6,
      logs: [
        { id: 'l3', goal_id: travelGoalId, timestamp: now.toISOString(), value: 5, confidence: 4, is_verified: false, user_id: 'user-main' }
      ],
      is_shared: true
    },
    {
      id: readingGoalId,
      category: 'growth',
      value_id: 'v4',
      title: 'Книжная полка лидера',
      metric: 'книг',
      target_value: 12,
      current_value: 0,
      start_date: now.toISOString(),
      end_date: new Date(now.getFullYear(), 11, 31).toISOString(),
      status: 'active',
      confidence_level: 80,
      difficulty: 4,
      logs: []
    }
  ];

  const sampleSubgoals: SubGoal[] = [
    { id: 'sg1', year_goal_id: financeGoalId, title: 'Подушка безопасности', metric: '₽', target_value: 100000, current_value: 100000, weight: 20, deadline: now.toISOString(), frequency: 'once', difficulty: 3, is_completed: true },
    { id: 'sg2', year_goal_id: financeGoalId, title: 'Акции компаний', metric: '₽', target_value: 400000, current_value: 20000, weight: 80, deadline: now.toISOString(), frequency: 'monthly', difficulty: 8 },
    { id: 'sg3', year_goal_id: readingGoalId, title: 'Первая книга года', metric: 'стр', target_value: 300, current_value: 0, weight: 10, deadline: now.toISOString(), frequency: 'weekly', difficulty: 2 }
  ];

  const samplePartners: AccountabilityPartner[] = [
    { id: 'p1', name: 'Мария', role: 'guardian', avatar: 'https://i.pravatar.cc/150?u=maria', xp: 1200 },
    { id: 'p2', name: 'Алекс', role: 'sensei', avatar: 'https://i.pravatar.cc/150?u=alex', xp: 4500 }
  ];

  const sampleTxs: Transaction[] = [];
  
  const sampleMeetings: Meeting[] = [
    { id: 'm1', title: 'Совет Племени', time: new Date(now.getTime() + 3600000).toISOString(), location: 'Zoom', category: 'growth' }
  ];

  return { sampleGoals, sampleSubgoals, samplePartners, sampleTxs, sampleDebts: [], sampleSubs: [], sampleMeetings };
};

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [subgoals, setSubgoals] = useState<SubGoal[]>([]);
  const [values, setValues] = useState<Value[]>([
    { id: 'v1', title: 'Свобода', description: 'Выбор своего пути', priority: 5 },
    { id: 'v2', title: 'Здоровье', description: 'Энергия для жизни', priority: 4 }
  ]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedGoals = localStorage.getItem('tribe_goals');
    
    if (!savedGoals) {
      const { sampleGoals, sampleSubgoals, samplePartners, sampleTxs, sampleMeetings } = getSampleData();
      setGoals(sampleGoals);
      setSubgoals(sampleSubgoals);
      setPartners(samplePartners);
      setTransactions(sampleTxs);
      setMeetings(sampleMeetings);
      setLoading(false);
    } else {
      try {
        const u = localStorage.getItem('tribe_user');
        const g = localStorage.getItem('tribe_goals');
        const sg = localStorage.getItem('tribe_subgoals');
        const m = localStorage.getItem('tribe_meetings');
        const d = localStorage.getItem('tribe_debts');
        const s = localStorage.getItem('tribe_subs');
        const p = localStorage.getItem('tribe_partners');
        const t = localStorage.getItem('tribe_txs');

        if (u) setUser(JSON.parse(u));
        if (g) setGoals(JSON.parse(g));
        if (sg) setSubgoals(JSON.parse(sg));
        if (m) setMeetings(JSON.parse(m));
        if (d) setDebts(JSON.parse(d));
        if (s) setSubscriptions(JSON.parse(s));
        if (p) setPartners(JSON.parse(p));
        if (t) setTransactions(JSON.parse(t));
      } catch (e) { console.error("Store init error", e); }
      setLoading(false);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tribe_user', JSON.stringify(user));
      localStorage.setItem('tribe_goals', JSON.stringify(goals));
      localStorage.setItem('tribe_subgoals', JSON.stringify(subgoals));
      localStorage.setItem('tribe_meetings', JSON.stringify(meetings));
      localStorage.setItem('tribe_debts', JSON.stringify(debts));
      localStorage.setItem('tribe_subs', JSON.stringify(subscriptions));
      localStorage.setItem('tribe_partners', JSON.stringify(partners));
      localStorage.setItem('tribe_txs', JSON.stringify(transactions));
    }
  }, [user, goals, subgoals, meetings, debts, subscriptions, partners, transactions, loading]);

  const generateVision = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const imageUrl = await geminiService.generateGoalVision(goal.title, goal.description || "");
    if (imageUrl) {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, image_url: imageUrl } : g));
    }
  };

  return {
    user, view, setView, goals, subgoals, values, transactions, debts, subscriptions, partners, loading, meetings,
    addGoalWithPlan: async (g: YearGoal, s: SubGoal[]) => {
      setGoals(p => [...p, g]);
      setSubgoals(p => [...p, ...s]);
      // Авто-генерация картинки
      await generateVision(g.id);
    },
    updateSubgoalProgress: (sgId: string, value: number, forceVerify: boolean = false) => {
      setSubgoals(prev => prev.map(sg => {
        if (sg.id === sgId) {
          const newValue = sg.current_value + value;
          const isNowCompleted = newValue >= sg.target_value;
          const log: ProgressLog = {
            id: crypto.randomUUID(), goal_id: sg.year_goal_id, subgoal_id: sg.id, timestamp: new Date().toISOString(), value, confidence: 5, is_verified: forceVerify, verified_by: forceVerify ? 'self' : undefined, user_id: user.id
          };
          setGoals(gPrev => gPrev.map(g => {
            if (g.id === sg.year_goal_id) {
              const updatedLogs = [...(g.logs || []), log];
              const totalValue = updatedLogs.reduce((acc, l) => acc + l.value, 0);
              const status = totalValue >= g.target_value ? 'completed' : 'active';
              return { ...g, logs: updatedLogs, current_value: totalValue, status };
            }
            return g;
          }));
          return { ...sg, current_value: newValue, is_completed: isNowCompleted };
        }
        return sg;
      }));
    },
    verifyProgress: (gId: string, lId: string, vId: string) => {
       setGoals(prev => prev.map(g => {
         if (g.id === gId) {
           const updatedLogs = g.logs.map(l => l.id === lId ? { ...l, is_verified: true, verified_by: vId } : l);
           return { ...g, logs: updatedLogs };
         }
         return g;
       }));
    },
    addTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string) => {
      const newTx: Transaction = { id: crypto.randomUUID(), amount, type, category, note, timestamp: new Date().toISOString() };
      setTransactions(p => [...p, newTx]);
    },
    addDebt: (d: Omit<Debt, 'id'>) => {
      setDebts(p => [...p, { ...d, id: crypto.randomUUID() }]);
    },
    addSubscription: (s: Omit<Subscription, 'id'>) => {
      setSubscriptions(p => [...p, { ...s, id: crypto.randomUUID() }]);
    },
    addPartner: (name: string, role: string) => {
      const newPartner: AccountabilityPartner = {
        id: crypto.randomUUID(),
        name,
        role: role as PartnerRole,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`,
        xp: 0
      };
      setPartners(p => [...p, newPartner]);
    },
    toggleGoalPrivacy: (id: string) => {
      setGoals(p => p.map(g => g.id === id ? { ...g, is_private: !g.is_private } : g));
    },
    updateUserInfo: (d: any) => setUser(p => ({...p, ...d})),
    resetData: () => { localStorage.clear(); window.location.reload(); },
    generateGoalVision: generateVision
  };
}
