
import { useState, useEffect, useCallback } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, Debt, Subscription, Transaction, SubGoal, ProgressLog, Meeting, PartnerRole } from '../types';
import { geminiService } from '../services/gemini';
import { INITIAL_USER, INITIAL_VALUES, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_MEETINGS, SAMPLE_TRANSACTIONS } from './initialData';

const STORE_VERSION = '2.0.0';

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [subgoals, setSubgoals] = useState<SubGoal[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [values, setValues] = useState<Value[]>(INITIAL_VALUES);
  const [loading, setLoading] = useState(true);

  // Загрузка по модулям для отказоустойчивости
  useEffect(() => {
    const safeLoad = (key: string, fallback: any) => {
      try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        return (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback)) ? fallback : parsed;
      } catch (e) { return fallback; }
    };

    const version = localStorage.getItem('tribe_version');
    if (version !== STORE_VERSION) {
      console.log("System update detected. Re-initializing modules...");
    }

    setUser(safeLoad('tribe_user', INITIAL_USER));
    setGoals(safeLoad('tribe_goals', SAMPLE_GOALS));
    setSubgoals(safeLoad('tribe_subgoals', SAMPLE_SUBGOALS));
    setPartners(safeLoad('tribe_partners', SAMPLE_PARTNERS));
    setTransactions(safeLoad('tribe_txs', SAMPLE_TRANSACTIONS));
    setMeetings(safeLoad('tribe_meetings', SAMPLE_MEETINGS));
    setValues(safeLoad('tribe_values', INITIAL_VALUES));
    setDebts(safeLoad('tribe_debts', []));
    setSubscriptions(safeLoad('tribe_subs', []));

    localStorage.setItem('tribe_version', STORE_VERSION);
    setLoading(false);
  }, []);

  // Синхронизация каждого модуля независимо
  useEffect(() => { if (!loading) localStorage.setItem('tribe_user', JSON.stringify(user)); }, [user, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('tribe_goals', JSON.stringify(goals)); }, [goals, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('tribe_subgoals', JSON.stringify(subgoals)); }, [subgoals, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('tribe_txs', JSON.stringify(transactions)); }, [transactions, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('tribe_partners', JSON.stringify(partners)); }, [partners, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('tribe_meetings', JSON.stringify(meetings)); }, [meetings, loading]);

  const generateGoalVision = useCallback(async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || goal.image_url?.startsWith('data:')) return;
    try {
      const imageUrl = await geminiService.generateGoalVision(goal.title, goal.description || "");
      if (imageUrl) {
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, image_url: imageUrl } : g));
      }
    } catch (e) { console.error("Vision error", e); }
  }, [goals]);

  return {
    user, view, setView, goals, subgoals, transactions, debts, subscriptions, partners, loading, meetings, values,
    
    // Feature: Goal Management
    addGoalWithPlan: async (g: YearGoal, s: SubGoal[]) => {
      setGoals(p => [...p, g]);
      setSubgoals(p => [...p, ...s]);
      setTimeout(() => generateGoalVision(g.id), 1000);
    },
    
    // Feature: Progress & Social Verification
    updateSubgoalProgress: (sgId: string, value: number, forceVerify: boolean = false) => {
      setSubgoals(prev => prev.map(sg => {
        if (sg.id === sgId) {
          const log: ProgressLog = {
            id: crypto.randomUUID(), goal_id: sg.year_goal_id, subgoal_id: sg.id, timestamp: new Date().toISOString(), value, confidence: 5, is_verified: forceVerify, verified_by: forceVerify ? 'self' : undefined, user_id: user.id
          };
          setGoals(gPrev => gPrev.map(g => {
            if (g.id === sg.year_goal_id) {
              const updatedLogs = [...(g.logs || []), log];
              const totalValue = updatedLogs.reduce((acc, l) => acc + (l.is_verified ? l.value : 0), 0);
              return { ...g, logs: updatedLogs, current_value: totalValue, status: totalValue >= g.target_value ? 'completed' : 'active' };
            }
            return g;
          }));
          return { ...sg, current_value: sg.current_value + value, is_completed: (sg.current_value + value) >= sg.target_value };
        }
        return sg;
      }));
    },
    
    verifyProgress: (gId: string, lId: string, vId: string) => {
       setGoals(prev => prev.map(g => {
         if (g.id === gId) {
           const updatedLogs = (g.logs || []).map(l => l.id === lId ? { ...l, is_verified: true, verified_by: vId } : l);
           const totalValue = updatedLogs.reduce((acc, l) => acc + (l.is_verified ? l.value : 0), 0);
           return { ...g, logs: updatedLogs, current_value: totalValue, status: totalValue >= g.target_value ? 'completed' : 'active' };
         }
         return g;
       }));
    },
    
    // Feature: Finance
    addTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string) => {
      const newTx: Transaction = { id: crypto.randomUUID(), amount, type, category, note, timestamp: new Date().toISOString() };
      setTransactions(p => [...p, newTx]);
      setUser(prev => ({ ...prev, financials: { ...prev.financials!, total_assets: type === 'income' ? prev.financials!.total_assets + amount : prev.financials!.total_assets - amount } }));
    },
    
    // System
    addPartner: (name: string, role: string) => setPartners(p => [...p, { id: crypto.randomUUID(), name, role: role as PartnerRole, avatar: `https://i.pravatar.cc/150?u=${name}`, xp: 0 }]),
    addDebt: (d: any) => setDebts(prev => [...prev, { ...d, id: crypto.randomUUID() }]),
    addSubscription: (s: any) => setSubscriptions(prev => [...prev, { ...s, id: crypto.randomUUID() }]),
    toggleGoalPrivacy: (id: string) => setGoals(p => p.map(g => g.id === id ? {...g, is_private: !g.is_private} : g)),
    updateUserInfo: (d: any) => setUser(p => ({...p, ...d})),
    resetData: () => { localStorage.clear(); window.location.reload(); },
    generateGoalVision
  };
}
