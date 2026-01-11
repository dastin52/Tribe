
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
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [generatingVision, setGeneratingVision] = useState(false);
  
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
      { name: 'Племя', value: store.partners.length * 10 + 5, color: '#8b5cf6' },
    ];
  }, [store.goals, store.partners]);

  const todayTasks = useMemo(() => {
    return store.subgoals.filter(sg => sg.current_value < sg.target_value);
  }, [store.subgoals]);

  const handleGenerateVision = async () => {
    if (!selectedGoal) return;
    setGeneratingVision(true);
    await store.generateGoalVision(selectedGoal.id);
    const updated = store.goals.find(g => g.id === selectedGoal.id);
    if (updated) setSelectedGoal(updated);
    setGeneratingVision(false);
  };

  if (store.view === AppView.LANDING) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white opacity-40"></div>
        <div className="relative z-10 space-y-12 w-full max-w-sm">
          <div className="space-y-6">
            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-5xl mx-auto shadow-2xl rotate-3">
              <i className="fa-solid fa-mountain-sun"></i>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tribe</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
              Твоя операционная система <br/> достижений и капитала
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => store.setView(AppView.DASHBOARD)} className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-xs active:scale-95 transition-all">Войти в Tribe</button>
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
          partners={store.partners}
          onSetView={store.setView}
          onSelectGoal={setSelectedGoal}
        />
      )}
      {store.view === AppView.FINANCE && (
        <FinanceView 
          financials={financials} transactions={store.transactions}
          debts={store.debts} subscriptions={store.subscriptions}
          balanceVisible={balanceVisible} setBalanceVisible={setBalanceVisible} 
          netWorth={netWorth}
          onAddTransaction={store.addTransaction} onAddDebt={store.addDebt} 
          onAddSubscription={store.addSubscription} goals={store.goals}
        />
      )}
      {store.view === AppView.GOALS && <GoalsView goals={store.goals} onAddGoal={() => setShowWizard(true)} onSelectGoal={setSelectedGoal} />}
      {store.view === AppView.ANALYTICS && <AnalyticsView goals={store.goals} partners={store.partners} ikigaiData={ikigaiData} onTogglePrivacy={store.toggleGoalPrivacy} />}
      {store.view === AppView.SOCIAL && <SocialView partners={store.partners} goals={store.goals} onVerify={store.verifyProgress} onAddPartner={store.addPartner} />}
      {store.view === AppView.SETTINGS && <SettingsView user={store.user} onUpdate={store.updateUserInfo} onReset={store.resetData} />}
      {showWizard && <GoalWizard values={store.values} onCancel={() => setShowWizard(false)} onComplete={(g, s) => { store.addGoalWithPlan(g, s); setShowWizard(false); }} />}
      
      {selectedGoal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in overflow-y-auto custom-scrollbar">
           <header className="p-6 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <button onClick={() => setSelectedGoal(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left"></i></button>
              <h3 className="font-black text-[10px] uppercase tracking-widest">Детали Цели</h3>
              <div className="w-10"></div>
           </header>
           
           <div className="p-8 space-y-8 pb-20">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selectedGoal.category}</span>
                   {selectedGoal.is_shared && <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Совместная</span>}
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none uppercase">{selectedGoal.title}</h2>
              </div>

              <div className="relative group">
                <div className="aspect-video w-full bg-slate-100 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-100">
                  {selectedGoal.image_url ? (
                    <img src={selectedGoal.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                      <i className="fa-solid fa-image text-3xl"></i>
                      <p className="text-[9px] font-black uppercase tracking-widest">Видение не создано</p>
                    </div>
                  )}
                </div>
                {!selectedGoal.image_url && (
                  <button onClick={handleGenerateVision} disabled={generatingVision} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2.5rem]">
                    <div className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      {generatingVision ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>}
                      Сгенерировать видение
                    </div>
                  </button>
                )}
              </div>

              <div className="p-8 bg-slate-900 rounded-[3.5rem] text-white flex justify-between items-center shadow-xl">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Общий прогресс</span>
                  <div className="text-5xl font-black italic">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%</div>
                </div>
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center">
                   <i className="fa-solid fa-bolt text-indigo-400 text-2xl"></i>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Мировые задачи (Milestones)</h4>
                 <div className="space-y-3">
                    {store.subgoals.filter(sg => sg.year_goal_id === selectedGoal.id).map(sg => (
                      <div key={sg.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                         <div className="flex justify-between items-center mb-4">
                            <h5 className="font-black text-slate-800 text-sm uppercase italic">{sg.title}</h5>
                            <span className="text-[10px] font-black text-indigo-500">{Math.round((sg.current_value / sg.target_value) * 100)}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: `${(sg.current_value / (sg.target_value || 1)) * 100}%`}}></div>
                         </div>
                         <div className="mt-2 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Дедлайн: {new Date(sg.deadline).toLocaleDateString()}</span>
                            {sg.is_completed && <span className="text-emerald-500">Завершено <i className="fa-solid fa-check"></i></span>}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
