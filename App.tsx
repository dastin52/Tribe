
import React, { useState, useMemo } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { DashboardView } from './components/DashboardView';
import { FinanceView } from './components/FinanceView';
import { GoalsView } from './components/GoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SocialView } from './components/SocialView';
import { SettingsView } from './components/SettingsView';

const App: React.FC = () => {
  const store = useStore();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<YearGoal | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(false);
  
  const financials = store.user.financials || { total_assets: 0, total_debts: 0, monthly_income: 0, monthly_expenses: 0, currency: '₽' };
  const netWorth = financials.total_assets - financials.total_debts;

  const balanceHistory = useMemo(() => {
    if (!store.transactions || store.transactions.length === 0) return Array.from({length: 7}).map((_, i) => ({ date: i, balance: netWorth }));
    const sorted = [...store.transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let current = netWorth - store.transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    return sorted.map(t => { 
      current += (t.type === 'income' ? t.amount : -t.amount); 
      return { date: new Date(t.timestamp).toLocaleDateString([], { month: '2-digit', day: '2-digit' }), balance: current }; 
    }).slice(-7);
  }, [store.transactions, netWorth]);

  const ikigaiData = useMemo(() => {
    const counts = { finance: 0, sport: 0, growth: 0, work: 0, other: 0 };
    store.goals.forEach(g => counts[g.category]++);
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return [
      { name: 'Развитие', value: (counts.growth + counts.sport) / total * 100 + 5, color: '#f43f5e' },
      { name: 'Работа', value: counts.work / total * 100 + 10, color: '#3b82f6' },
      { name: 'Капитал', value: counts.finance / total * 100 + 15, color: '#10b981' },
      { name: 'Племя', value: store.partners.length * 10, color: '#8b5cf6' },
    ];
  }, [store.goals, store.partners]);

  const todayTasks = useMemo(() => {
    return store.subgoals.filter(sg => sg.current_value < sg.target_value).slice(0, 5);
  }, [store.subgoals]);

  if (store.view === AppView.LANDING) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center animate-fade-in relative overflow-hidden">
        <div className="relative z-10 space-y-12 w-full max-w-sm">
          <div className="space-y-6">
            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-5xl mx-auto shadow-2xl rotate-3">
              <i className="fa-solid fa-mountain-sun"></i>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tribe</h1>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => store.setView(AppView.DASHBOARD)} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-xs">Начать путь</button>
            <button onClick={() => store.startDemo()} className="w-full py-6 bg-white text-slate-900 border-2 border-slate-100 font-black rounded-[2rem] uppercase tracking-widest text-xs">Демо-версия</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.view === AppView.DASHBOARD && (
        <DashboardView 
          user={store.user} meetings={store.meetings} todayTasks={todayTasks} 
          balanceVisible={balanceVisible} setBalanceVisible={setBalanceVisible}
          netWorth={netWorth} balanceHistory={balanceHistory}
          onUpdateTask={store.updateSubgoalProgress} goals={store.goals}
        />
      )}
      {store.view === AppView.FINANCE && (
        <FinanceView 
          financials={financials} transactions={store.transactions}
          debts={store.debts} subscriptions={store.subscriptions}
          balanceVisible={balanceVisible} netWorth={netWorth} balanceHistory={balanceHistory}
          onAddTransaction={store.addTransaction} onAddDebt={store.addDebt} 
          onAddSubscription={store.addSubscription} goals={store.goals}
        />
      )}
      {store.view === AppView.GOALS && <GoalsView goals={store.goals} onAddGoal={() => setShowWizard(true)} onSelectGoal={setSelectedGoal} />}
      {store.view === AppView.ANALYTICS && <AnalyticsView goals={store.goals} partners={store.partners} ikigaiData={ikigaiData} onTogglePrivacy={store.toggleGoalPrivacy} />}
      {store.view === AppView.SOCIAL && <SocialView partners={store.partners} goals={store.goals} onVerify={store.verifyProgress} />}
      {store.view === AppView.SETTINGS && <SettingsView user={store.user} onUpdate={store.updateUserInfo} onReset={store.resetData} />}
      {showWizard && <GoalWizard values={[]} onCancel={() => setShowWizard(false)} onComplete={(g, s) => { store.addGoalWithPlan(g, s); setShowWizard(false); }} />}
      {selectedGoal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in">
           <header className="p-6 flex justify-between items-center border-b border-slate-50">
              <button onClick={() => setSelectedGoal(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left"></i></button>
              <h3 className="font-black text-xs uppercase tracking-widest">Цель</h3>
              <div className="w-10"></div>
           </header>
           <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{selectedGoal.title}</h2>
              <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white text-center">
                <div className="text-6xl font-black italic">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%</div>
                <div className="h-2 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{width: `${(selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100}%`}}></div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl">
                 <p className="text-slate-500 font-medium italic">"{selectedGoal.description || 'Нет описания'}"</p>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
