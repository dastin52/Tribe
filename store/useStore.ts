
import { useState, useEffect, useCallback } from 'react';
import { User, Value, YearGoal, Action, AppView, ProgressLog, DailyLog, AccountabilityPartner, PartnerReview, GoalCategory } from '../types';
import { geminiService } from '../services/gemini';

const INITIAL_USER: User = {
  id: 'user-1',
  name: 'Лидер',
  xp: 0,
  level: 1,
  streak: 0,
  last_active: new Date().toISOString(),
  energy_profile: { peak_hours: [9, 10, 11, 16, 17], low_energy_hours: [14, 22, 23] }
};

const DEFAULT_PARTNERS: AccountabilityPartner[] = [
  { id: 'p1', name: 'Любимка', role: 'guardian' },
  { id: 'p2', name: 'Бро', role: 'accomplice' },
  { id: 'p3', name: 'Сэнсэй', role: 'sensei' },
  { id: 'p4', name: 'Совесть', role: 'roaster' },
  { id: 'p5', name: 'Штурман', role: 'navigator' }
];

const generateDemoData = () => {
  const g1Id = crypto.randomUUID();
  const g2Id = crypto.randomUUID();
  const g3Id = crypto.randomUUID();
  
  const demoGoals: YearGoal[] = [
    {
      id: g1Id, category: 'sport', value_id: 'v1', title: 'Пробежать марафон', metric: 'км', 
      target_value: 42, current_value: 18, start_date: new Date().toISOString(), 
      end_date: new Date(Date.now() + 10000000000).toISOString(), status: 'active', confidence_level: 85, 
      logs: [
        { id: 'l1', goal_id: g1Id, timestamp: new Date(Date.now() - 86400000).toISOString(), value: 10, confidence: 90, is_verified: true },
        { id: 'l2', goal_id: g1Id, timestamp: new Date().toISOString(), value: 18, confidence: 80, is_verified: false }
      ]
    },
    {
      id: g2Id, category: 'finance', value_id: 'v2', title: 'Капитал $50k', metric: '$', 
      target_value: 50000, current_value: 12500, start_date: new Date().toISOString(), 
      end_date: new Date(Date.now() + 30000000000).toISOString(), status: 'active', confidence_level: 60, logs: []
    },
    {
      id: g3Id, category: 'growth', value_id: 'v3', title: 'Прочитать 30 книг', metric: 'книг', 
      target_value: 30, current_value: 12, start_date: new Date().toISOString(), 
      end_date: new Date(Date.now() + 15000000000).toISOString(), status: 'active', confidence_level: 95, logs: []
    }
  ];

  const demoReviews: PartnerReview[] = [
    { id: 'r1', partner_id: 'p3', log_id: 'l1', rating: 5, comment: 'Техника бега улучшилась. Пульс в норме. Продолжай в том же духе!', reaction: 'fire', timestamp: new Date(Date.now() - 43200000).toISOString(), is_verified: true },
    { id: 'r2', partner_id: 'p2', log_id: 'l1', rating: 4, comment: 'Хороший темп, бро! Завтра вместе?', reaction: 'strong', timestamp: new Date(Date.now() - 40000000).toISOString(), is_verified: true }
  ];

  const demoValues: Value[] = [
    { id: 'v1', owner_id: 'user-1', title: 'Здоровье', description: 'Энергия для жизни и свершений', priority: 5 },
    { id: 'v2', owner_id: 'user-1', title: 'Свобода', description: 'Финансовая независимость', priority: 4 },
    { id: 'v3', owner_id: 'user-1', title: 'Мудрость', description: 'Постоянное обучение', priority: 3 }
  ];

  const demoActions: Action[] = [
    { id: 'a1', project_id: 'any', title: 'Бег 5км (Базовый)', type: 'habit', estimated_time_minutes: 30, completion_status: false },
    { id: 'a2', project_id: 'any', title: 'Чтение 30 мин', type: 'habit', estimated_time_minutes: 30, completion_status: true, completed_at: new Date().toISOString() },
    { id: 'a3', project_id: 'any', title: 'Анализ расходов', type: 'one_time', estimated_time_minutes: 15, completion_status: false }
  ];

  return { demoGoals, demoReviews, demoValues, demoActions };
};

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [values, setValues] = useState<Value[]>([]);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>(DEFAULT_PARTNERS);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [socialInsight, setSocialInsight] = useState<any>(null);

  useEffect(() => {
    const saved = {
      values: localStorage.getItem('tribe_values'),
      goals: localStorage.getItem('tribe_goals'),
      actions: localStorage.getItem('tribe_actions'),
      user: localStorage.getItem('tribe_user'),
      daily: localStorage.getItem('tribe_daily'),
      reviews: localStorage.getItem('tribe_reviews'),
      partners: localStorage.getItem('tribe_partners')
    };

    if (saved.user) {
      setUser(JSON.parse(saved.user));
      setView(AppView.DASHBOARD);
    }
    if (saved.values) setValues(JSON.parse(saved.values));
    if (saved.goals) setGoals(JSON.parse(saved.goals));
    if (saved.actions) setActions(JSON.parse(saved.actions));
    if (saved.daily) setDailyLogs(JSON.parse(saved.daily));
    if (saved.reviews) setReviews(JSON.parse(saved.reviews));
    if (saved.partners) setPartners(JSON.parse(saved.partners));
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tribe_values', JSON.stringify(values));
      localStorage.setItem('tribe_goals', JSON.stringify(goals));
      localStorage.setItem('tribe_actions', JSON.stringify(actions));
      localStorage.setItem('tribe_user', JSON.stringify(user));
      localStorage.setItem('tribe_daily', JSON.stringify(dailyLogs));
      localStorage.setItem('tribe_reviews', JSON.stringify(reviews));
      localStorage.setItem('tribe_partners', JSON.stringify(partners));
    }
  }, [values, goals, actions, user, dailyLogs, reviews, partners, loading]);

  const startDemo = () => {
    const demo = generateDemoData();
    setValues(demo.demoValues);
    setGoals(demo.demoGoals);
    setReviews(demo.demoReviews);
    setActions(demo.demoActions);
    setUser({ ...INITIAL_USER, is_demo: true, xp: 4500, level: 4, streak: 12 });
    setView(AppView.DASHBOARD);
  };

  const startFresh = () => {
    setUser({ ...INITIAL_USER, is_demo: false });
    setValues([]);
    setGoals([]);
    setActions([]);
    setReviews([]);
    setView(AppView.VALUES);
  };

  const awardXP = (amount: number) => {
    setUser(prev => {
      const newXP = prev.xp + amount;
      const nextLevelThreshold = prev.level * 1000;
      if (newXP >= nextLevelThreshold) {
        return { ...prev, xp: newXP - nextLevelThreshold, level: prev.level + 1 };
      }
      return { ...prev, xp: newXP };
    });
  };

  const handleCheckIn = () => {
    const today = new Date().toDateString();
    const lastActive = new Date(user.last_active).toDateString();
    if (today !== lastActive) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const newStreak = lastActive === yesterday.toDateString() ? user.streak + 1 : 1;
      setUser(prev => ({ ...prev, streak: newStreak, last_active: new Date().toISOString() }));
      awardXP(100);
    }
  };

  const addValue = (v: Omit<Value, 'id' | 'owner_id'>) => {
    setValues(prev => [...prev, { ...v, id: crypto.randomUUID(), owner_id: user.id }]);
    awardXP(200);
  };

  const addGoal = (g: YearGoal) => {
    setGoals(prev => [...prev, g]);
    awardXP(500);
  };

  const updateGoalMetric = (goalId: string, newValue: number, confidence: number, metadata?: any) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const log: ProgressLog = {
          id: crypto.randomUUID(),
          goal_id: goalId,
          timestamp: new Date().toISOString(),
          value: newValue,
          confidence,
          is_verified: false,
          metadata
        };
        return { ...g, current_value: newValue, confidence_level: confidence, logs: [...g.logs, log] };
      }
      return g;
    }));
    awardXP(150);
  };

  const addPartnerReview = (review: Omit<PartnerReview, 'id' | 'timestamp'>) => {
    const newReview: PartnerReview = {
      ...review,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setReviews(prev => [...prev, newReview]);
    
    setGoals(prev => prev.map(g => {
      const logIndex = g.logs.findIndex(l => l.id === review.log_id);
      if (logIndex !== -1) {
        const updatedLogs = [...g.logs];
        updatedLogs[logIndex] = { ...updatedLogs[logIndex], is_verified: review.is_verified };
        const confAdjustment = review.is_verified ? (review.rating >= 4 ? 5 : 2) : -10;
        return { ...g, logs: updatedLogs, confidence_level: Math.min(100, Math.max(0, g.confidence_level + confAdjustment)) };
      }
      return g;
    }));

    if (review.is_verified) awardXP(300);
  };

  const toggleAction = (actionId: string) => {
    setActions(prev => prev.map(a => {
      if (a.id === actionId) {
        const completed = !a.completion_status;
        if (completed) awardXP(50);
        return { ...a, completion_status: completed, completed_at: completed ? new Date().toISOString() : undefined };
      }
      return a;
    }));
  };

  const refreshSocialInsight = async () => {
    if (reviews.length === 0) return;
    try {
      const insight = await geminiService.synthesizeSocialFeedback(reviews.slice(-5));
      setSocialInsight(insight);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    user, view, setView, values, addValue, goals, addGoal, updateGoalMetric, actions, 
    toggleAction, dailyLogs, partners, reviews, addPartnerReview,
    socialInsight, refreshSocialInsight, handleCheckIn, awardXP, loading, startDemo, startFresh
  };
}
