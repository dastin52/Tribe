
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
import { SettingsView } from './components/SettingsView';

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
  const [balanceVisible, setBalanceVisible] = useState(true);
  
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const financials = store.user.financials || { total_assets: 0, total_debts: 0, monthly_income: 0, monthly_expenses: 0, currency: '₽' };
  const netWorth = financials.total_assets - financials.total_debts;

  const ikigaiData = useMemo(() => {
    const counts = { finance: 0, sport: 0, growth: 0, work: 0, other: 0 };
    store.goals.forEach(g => counts[g.category]++);
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return [
      { name: 'Развитие', value: (counts.growth + counts.sport) / total * 100 + 5, color: '#f43f5e' },
      { name: 'Работа', value: counts.work / total * 100 + 10, color: '#3b82f6' },
      { name: 'Капитал', value: counts.finance / total * 100 + 15, color: '#10b981' },
      { name: 'Племя', value: store.partners.length * 10 + 5, color: '#8b5cf6' },
    ];
  }, [store.goals, store.partners]);

  const todayTasks = useMemo(() => {
    return store.subgoals.filter(sg => sg.current_value < sg.target_value);
  }, [store.subgoals]);

  if (store.view === AppView.LANDING) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center p-10 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white opacity-40"></div>
        <div className="relative z-10 space-y-12 w-full max-sm:max-w-xs">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-4xl mx-auto shadow-2xl rotate-3">
              <i className="fa-solid fa-mountain-sun"></i>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tribe</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
              Твоя операционная система <br/> достижений и капитала
            </p>
          </div>
          <button onClick={() => store.setView(AppView.DASHBOARD)} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Начать</button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.view === AppView.DASHBOARD && (
        <DashboardView 
          user={store.user} meetings={[]} todayTasks={todayTasks} 
          balanceVisible={balanceVisible} setBalanceVisible={setBalanceVisible}
          netWorth={netWorth} balanceHistory={[]}
          onUpdateTask={()=>{}} goals={store.goals}
          partners={store.partners} onSetView={store.setView} onSelectGoal={setSelectedGoal}
        />
      )}
      {store.view === AppView.FINANCE && (
        <FinanceView financials={financials as any} transactions={store.transactions} debts={[]} subscriptions={[]} balanceVisible={balanceVisible} setBalanceVisible={setBalanceVisible} netWorth={netWorth} balanceHistory={[]} onAddTransaction={store.addTransaction} onAddDebt={()=>{}} onAddSubscription={()=>{}} goals={store.goals} />
      )}
      {store.view === AppView.GOALS && <GoalsView goals={store.goals} onAddGoal={() => setShowWizard(true)} onSelectGoal={setSelectedGoal} />}
      {store.view === AppView.ANALYTICS && <AnalyticsView goals={store.goals} partners={store.partners} ikigaiData={ikigaiData} onTogglePrivacy={()=>{}} transactions={store.transactions} currency={financials.currency} />}
      {store.view === AppView.SOCIAL && (
        <SocialView 
          gameState={store.gameState}
          rollDice={store.rollDice}
          buyAsset={store.buyAsset}
          generateInviteLink={store.generateInviteLink}
          joinFakePlayer={store.joinFakePlayer}
          startGame={store.startGame}
          joinLobbyManual={store.joinLobbyManual}
          resetLobby={store.resetLobby}
          currentUserId={store.user.id}
        />
      )}
      {store.view === AppView.SETTINGS && <SettingsView user={store.user} onUpdate={store.updateUserInfo} onReset={store.resetData} />}
      {showWizard && <GoalWizard values={[]} onCancel={() => setShowWizard(false)} onComplete={(g, s) => { store.addGoalWithPlan(g, s); setShowWizard(false); }} />}
    </Layout>
  );
};

export default App;
