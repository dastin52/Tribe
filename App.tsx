
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
import { FocusView } from './components/FocusView';

const App: React.FC = () => {
  const store = useStore();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<YearGoal | null>(null);

  const todayTasks = useMemo(() => {
    return store.subgoals.filter(sg => !sg.is_completed);
  }, [store.subgoals]);

  const focusedTask = useMemo(() => {
    return store.subgoals.find(sg => sg.id === store.activeTaskId);
  }, [store.subgoals, store.activeTaskId]);

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
              Навигатор твоего развития <br/> и устойчивого роста
            </p>
          </div>
          <button onClick={() => store.setView(AppView.DASHBOARD)} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Вступить в племя</button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.view === AppView.DASHBOARD && (
        <DashboardView 
          user={store.user} 
          todayTasks={todayTasks} 
          goals={store.goals}
          onSetView={store.setView}
          onEnterFocus={store.enterFocusMode}
          onCompleteMOS={store.onCompleteMOS}
        />
      )}
      {store.view === AppView.FINANCE && (
        <FinanceView financials={store.user.financials as any} transactions={store.transactions} debts={[]} subscriptions={[]} balanceVisible={true} setBalanceVisible={()=>{}} netWorth={0} balanceHistory={[]} onAddTransaction={()=>{}} onAddDebt={()=>{}} onAddSubscription={()=>{}} goals={store.goals} />
      )}
      {store.view === AppView.GOALS && <GoalsView goals={store.goals} onAddGoal={() => setShowWizard(true)} onSelectGoal={setSelectedGoal} />}
      {store.view === AppView.SOCIAL && (
        <SocialView 
          gameState={store.gameState}
          partners={[]}
          pendingRequests={[]}
          rollDice={store.rollDice}
          buyAsset={()=>{}}
          buyStock={()=>{}}
          sellStock={()=>{}}
          upgradeAsset={()=>{}}
          makeDeposit={()=>{}}
          generateInviteLink={()=>{}}
          currentUserId={store.user.id}
        />
      )}
      {store.view === AppView.SETTINGS && <SettingsView user={store.user} onUpdate={store.updateUserInfo} onReset={store.resetData} />}
      {store.view === AppView.FOCUS && <FocusView task={focusedTask} onExit={store.exitFocusMode} />}
      
      {showWizard && <GoalWizard onCancel={() => setShowWizard(false)} onComplete={(g, s) => { store.addGoalWithPlan(g, s); setShowWizard(false); }} />}
    </Layout>
  );
};

export default App;
