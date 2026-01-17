
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, ProgressLog } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { DashboardView } from './components/DashboardView';
import { FinanceView } from './components/FinanceView';
import { GoalsView } from './components/GoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SocialView } from './components/SocialView';
import { SettingsView } from './components/SettingsView';

// Fix: Define the Telegram property on the Window interface to satisfy TypeScript's strict type checking.
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
  const [generatingVision, setGeneratingVision] = useState(false);
  
  // Telegram WebApp Initialization
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.enableClosingConfirmation();
    }
  }, []);

  const financials = store.user.financials || { total_assets: 0, total_debts: 0, monthly_income: 0, monthly_expenses: 0, currency: '₽' };
  const netWorth = financials.total_assets - financials.total_debts;

  const balanceHistory = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const currentMonth = new Date().getMonth();
    const history = [];
    const base = netWorth;
    for (let i = 6; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12;
      history.push({
        date: months[monthIdx],
        balance: Math.round(base - (i * (base * 0.05)) + (Math.random() * (base * 0.02)))
      });
    }
    return history;
  }, [netWorth]);

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
        <div className="relative z-10 space-y-12 w-full max-w-sm">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-4xl mx-auto shadow-2xl rotate-3">
              <i className="fa-solid fa-mountain-sun"></i>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tribe</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
              Твоя операционная система <br/> достижений и капитала
            </p>
          </div>
          <button onClick={() => store.setView(AppView.DASHBOARD)} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Смотреть демо</button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.isDemo && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-lg animate-pulse">
          Демонстрационный режим
        </div>
      )}

      {store.view === AppView.DASHBOARD && (
        <DashboardView 
          user={store.user} meetings={store.meetings} todayTasks={todayTasks} 
          balanceVisible={balanceVisible} setBalanceVisible={setBalanceVisible}
          netWorth={netWorth} balanceHistory={balanceHistory}
          onUpdateTask={store.updateSubgoalProgress} goals={store.goals}
          partners={store.partners}
          onSetView={store.setView}
          onSelectGoal={setSelectedGoal}
        />
      )}
      {store.view === AppView.FINANCE && (
        <FinanceView financials={financials} transactions={store.transactions} debts={store.debts} subscriptions={store.subscriptions} balanceVisible={balanceVisible} setBalanceVisible={setBalanceVisible} netWorth={netWorth} balanceHistory={balanceHistory} onAddTransaction={store.addTransaction} onAddDebt={store.addDebt} onAddSubscription={store.addSubscription} goals={store.goals} />
      )}
      {store.view === AppView.GOALS && <GoalsView goals={store.goals} onAddGoal={() => setShowWizard(true)} onSelectGoal={setSelectedGoal} />}
      {store.view === AppView.ANALYTICS && <AnalyticsView goals={store.goals} partners={store.partners} ikigaiData={ikigaiData} onTogglePrivacy={store.toggleGoalPrivacy} transactions={store.transactions} currency={financials.currency} />}
      {store.view === AppView.SOCIAL && (
        <SocialView 
          partners={store.partners} 
          goals={store.goals} 
          onVerify={store.verifyProgress} 
          onAddPartner={store.addPartner} 
          gameState={store.gameState}
          rollDice={store.rollDice}
          buyAsset={store.buyAsset}
          respondToOffer={store.respondToOffer}
          completeTutorial={store.completeTutorial}
        />
      )}
      {store.view === AppView.SETTINGS && <SettingsView user={store.user} onUpdate={store.updateUserInfo} onReset={store.resetData} />}
      {showWizard && <GoalWizard values={store.values} onCancel={() => setShowWizard(false)} onComplete={(g, s) => { store.addGoalWithPlan(g, s); setShowWizard(false); }} />}
      
      {selectedGoal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in overflow-hidden">
           <header className="p-4 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <button onClick={() => setSelectedGoal(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left"></i></button>
              <h3 className="font-black text-[10px] uppercase tracking-widest italic">Детали Цели</h3>
              <div className="w-10"></div>
           </header>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-10">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">{selectedGoal.category}</span>
                   {selectedGoal.is_shared && <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Команда</span>}
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none uppercase">{selectedGoal.title}</h2>
              </div>
              <div className="aspect-video w-full bg-slate-100 rounded-[2rem] overflow-hidden shadow-inner">
                  {selectedGoal.image_url && <img src={selectedGoal.image_url} className="w-full h-full object-cover" />}
              </div>
              <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Общий прогресс</span>
                  <div className="text-4xl font-black italic">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%</div>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center">
                   <i className="fa-solid fa-bolt text-indigo-400 text-xl"></i>
                </div>
              </div>
           </div>
        </div>
      )}

      {store.showRegPrompt && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-end justify-center animate-fade-in p-4">
           <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 space-y-8 shadow-2xl animate-scale-up">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl mx-auto">
                 <i className="fa-solid fa-rocket"></i>
              </div>
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase text-center">Твоя очередь</h3>
              <button onClick={store.startMyOwnJourney} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl uppercase tracking-widest text-[11px] italic shadow-xl">Начать свой путь</button>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
