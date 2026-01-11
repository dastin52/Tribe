
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { DashboardView } from './components/DashboardView';
import { FinanceView } from './components/FinanceView';
import { GoalsView } from './components/GoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SocialView } from './components/SocialView';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const App: React.FC = () => {
  const store = useStore();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<YearGoal | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(false);
  
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta && (Math.abs(event.beta) > 150 || Math.abs(event.gamma || 0) > 70)) {
        setBalanceVisible(true);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      if (store.view === AppView.LANDING) {
        tg.MainButton.setText('НАЧАТЬ ПУТЬ 🚀');
        tg.MainButton.show();
        tg.MainButton.onClick(() => store.startFresh());
      } else {
        tg.MainButton.hide();
      }

      if (selectedGoal || showWizard) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          setSelectedGoal(null);
          setShowWizard(false);
        });
      } else {
        tg.BackButton.hide();
      }
    }
  }, [store.view, selectedGoal, showWizard]);

  const financials = store.user.financials || { total_assets: 0, total_debts: 0, monthly_income: 0, monthly_expenses: 0, currency: '₽' };
  const netWorth = financials.total_assets - financials.total_debts;

  const balanceHistory = useMemo(() => {
    if (!store.transactions || store.transactions.length === 0) {
      return Array.from({length: 7}).map((_, i) => ({ date: i, balance: netWorth }));
    }
    const sorted = [...store.transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let current = netWorth - store.transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    return sorted.map(t => {
      current += (t.type === 'income' ? t.amount : -t.amount);
      return {
        date: new Date(t.timestamp).toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
        balance: current
      };
    }).slice(-7);
  }, [store.transactions, netWorth]);

  const ikigaiData = useMemo(() => {
    const counts = { finance: 0, sport: 0, growth: 0, work: 0, other: 0 };
    store.goals.forEach(g => counts[g.category]++);
    return [
      { name: 'Любишь (Growth)', value: counts.growth + counts.sport + 1, color: '#f43f5e' },
      { name: 'Силен (Work)', value: counts.work + 2, color: '#3b82f6' },
      { name: 'Платят (Finance)', value: counts.finance + 1, color: '#10b981' },
      { name: 'Миру (Social)', value: store.partners.length + 1, color: '#8b5cf6' },
    ];
  }, [store.goals, store.partners]);

  const todayTasks = useMemo(() => {
    return store.subgoals.filter(sg => {
      if (sg.frequency === 'daily') return true;
      return sg.current_value < sg.target_value;
    }).slice(0, 3);
  }, [store.subgoals]);

  if (store.view === AppView.LANDING) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10 space-y-12 w-full max-w-sm">
          <div className="space-y-6">
            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-5xl mx-auto shadow-2xl shadow-indigo-100 rotate-3">
              <i className="fa-solid fa-mountain-sun"></i>
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Tribe</h1>
              <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase">Social Operating System for Goals</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => store.startFresh()} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl shadow-slate-200 active:scale-95 transition-all uppercase tracking-widest text-xs">Начать новый путь</button>
            <button onClick={() => store.startDemo()} className="w-full py-6 bg-white text-slate-900 border-2 border-slate-100 font-black rounded-[2rem] active:scale-95 transition-all uppercase tracking-widest text-xs">Посмотреть демо</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.view === AppView.DASHBOARD && (
        <DashboardView 
          user={store.user} 
          meetings={store.meetings} 
          todayTasks={todayTasks} 
          balanceVisible={balanceVisible} 
          setBalanceVisible={setBalanceVisible}
          netWorth={netWorth}
          balanceHistory={balanceHistory}
          onUpdateTask={store.updateSubgoalProgress}
        />
      )}

      {store.view === AppView.FINANCE && (
        <FinanceView 
          financials={financials}
          transactions={store.transactions}
          debts={store.debts}
          subscriptions={store.subscriptions}
          balanceVisible={balanceVisible}
          netWorth={netWorth}
          balanceHistory={balanceHistory}
          onAddTransaction={store.addTransaction}
        />
      )}

      {store.view === AppView.GOALS && (
        <GoalsView 
          goals={store.goals} 
          onAddGoal={() => setShowWizard(true)} 
          onSelectGoal={setSelectedGoal} 
        />
      )}

      {store.view === AppView.ANALYTICS && (
        <AnalyticsView 
          goals={store.goals} 
          partners={store.partners} 
          ikigaiData={ikigaiData} 
          onTogglePrivacy={store.toggleGoalPrivacy} 
        />
      )}

      {store.view === AppView.SOCIAL && <SocialView partners={store.partners} />}

      {showWizard && <GoalWizard values={store.values} onCancel={() => setShowWizard(false)} onComplete={(g, s, p) => { store.addGoalWithPlan(g, s, p); setShowWizard(false); }} />}

      {selectedGoal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in overflow-hidden">
           <header className="p-6 flex justify-between items-center border-b border-slate-50">
              <button onClick={() => setSelectedGoal(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left"></i></button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Детали цели</span>
              <button onClick={() => { store.toggleGoalPrivacy(selectedGoal.id); setSelectedGoal({...selectedGoal, is_private: !selectedGoal.is_private}) }} className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedGoal.is_private ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                 <i className={`fa-solid ${selectedGoal.is_private ? 'fa-lock' : 'fa-globe-americas'} text-xs`}></i>
              </button>
           </header>
           <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar pb-32">
              <div>
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2">{selectedGoal.category}</span>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9]">{selectedGoal.title}</h2>
              </div>
              <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden text-center">
                <div className="text-6xl font-black tracking-tighter italic">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%</div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%` }}></div>
                </div>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
