import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, PartnerRole } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const roleMeta: Record<PartnerRole, { label: string, emoji: string, color: string, bg: string }> = {
  accomplice: { label: 'Сообщник', emoji: '🤝', color: 'text-blue-600', bg: 'bg-blue-50' },
  guardian: { label: 'Хранитель', emoji: '🛡️', color: 'text-rose-600', bg: 'bg-rose-50' },
  sensei: { label: 'Сэнсэй', emoji: '🥋', color: 'text-amber-600', bg: 'bg-amber-50' },
  teammate: { label: 'Тиммейт', emoji: '💼', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  navigator: { label: 'Штурман', emoji: '🧭', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  roaster: { label: 'Критик', emoji: '🔥', color: 'text-orange-600', bg: 'bg-orange-50' },
};

const App: React.FC = () => {
  const store = useStore();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<YearGoal | null>(null);
  const [financeTab, setFinanceTab] = useState<'overview' | 'operations' | 'planning' | 'debts' | 'subs'>('overview');
  
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  }, []);

  const financials = store.user.financials || { total_assets: 0, total_debts: 0, monthly_income: 0, monthly_expenses: 0, currency: '₽' };
  const netWorth = financials.total_assets - financials.total_debts;

  const balanceHistory = useMemo(() => {
    if (!store.transactions.length) return [{ date: 'Начало', balance: netWorth }];
    const sorted = [...store.transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let current = netWorth - store.transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    return sorted.map(t => {
      current += (t.type === 'income' ? t.amount : -t.amount);
      return {
        date: new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        balance: current
      };
    }).slice(-10);
  }, [store.transactions, netWorth]);

  const handleUpdateProgress = (goalId: string) => {
    store.setUser(prev => ({
      ...prev,
      xp: prev.xp + 150,
      streak: prev.streak + 1
    }));
    setSelectedGoal(null);
    alert('Прогресс сохранен! +150 XP');
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center p-8 text-center space-y-12 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter">
          TRIBE
        </h1>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">
          Твоя личная система достижения целей через поддержку племени.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-4">
        <button 
          onClick={() => store.startFresh()}
          className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          НАЧАТЬ ПУТЬ
        </button>
        <button 
          onClick={() => store.startDemo()}
          className="w-full py-5 bg-white text-indigo-600 border-2 border-indigo-50 font-black rounded-[2rem] active:scale-95 transition-all"
        >
          ДЕМО-РЕЖИМ
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#fcfdfe]">
      {store.view === AppView.LANDING ? renderLanding() : (
        <Layout activeView={store.view} setView={store.setView}>
          {store.view === AppView.DASHBOARD && (
            <div className="space-y-6 pb-12 animate-fade-in">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                      {store.user.level}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-tighter">Уровень {store.user.level}</div>
                      <div className="text-[10px] font-bold text-indigo-600">{store.user.xp} XP</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                     <i className="fa-solid fa-fire text-orange-500"></i>
                     <span className="text-sm font-black text-orange-600 uppercase tracking-tighter">{store.user.streak} ДНЕЙ</span>
                  </div>
               </div>
               <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Чистый Капитал</div>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter">{netWorth.toLocaleString()} {financials.currency}</div>
               </div>
               {store.goals.length > 0 && (
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Главная цель</h3>
                    <div onClick={() => setSelectedGoal(store.goals[0])} className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 cursor-pointer">
                       <span className="text-[9px] font-black text-indigo-200 uppercase">{store.goals[0].category}</span>
                       <h4 className="font-black text-xl mb-2 leading-tight">{store.goals[0].title}</h4>
                       <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white" style={{ width: `${Math.min(100, (store.goals[0].current_value / (store.goals[0].target_value || 1)) * 100)}%` }}></div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}
          {store.view === AppView.GOALS && (
            <div className="space-y-6 pb-12 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Цели</h2>
                  <button onClick={() => setShowWizard(true)} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all">
                    <i className="fa-solid fa-plus"></i>
                  </button>
              </div>
              {store.goals.length === 0 ? (
                <div className="p-10 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                   <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">Нет целей</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {store.goals.map(g => (
                    <div key={g.id} onClick={() => setSelectedGoal(g)} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[9px] font-black text-indigo-500 uppercase">{g.category}</span>
                          <h4 className="font-black text-slate-800 text-lg">{g.title}</h4>
                        </div>
                        <div className="text-xl font-black text-indigo-600">{Math.round((g.current_value / (g.target_value || 1)) * 100)}%</div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (g.current_value / (g.target_value || 1)) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {store.view === AppView.FINANCE && (
            <div className="space-y-6 animate-fade-in">
               <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic px-1">Капитал</h2>
               <div className="p-8 bg-slate-900 rounded-[3rem] text-white shadow-xl">
                  <span className="text-[10px] font-black text-indigo-300 uppercase">Баланс</span>
                  <div className="text-4xl font-black tracking-tighter mb-4">{netWorth.toLocaleString()} {financials.currency}</div>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={balanceHistory}>
                          <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          )}
          {store.view === AppView.SETTINGS && (
            <div className="p-8 bg-slate-50 rounded-[3rem] text-center space-y-6">
               <div className="w-24 h-24 bg-indigo-600 text-white rounded-full mx-auto flex items-center justify-center text-4xl font-black shadow-xl">
                 {store.user.name[0]}
               </div>
               <h3 className="text-2xl font-black text-slate-900">{store.user.name}</h3>
               <button onClick={() => window.location.reload()} className="w-full py-4 text-rose-600 font-black text-[10px] uppercase border border-rose-100 rounded-2xl">
                 Сбросить сессию
               </button>
            </div>
          )}
        </Layout>
      )}

      {showWizard && (
        <GoalWizard 
          values={store.values} 
          onCancel={() => setShowWizard(false)} 
          onComplete={(g, subgoals, projects) => { 
            store.addGoalWithPlan(g, subgoals, projects); 
            setShowWizard(false); 
          }} 
        />
      )}

      {selectedGoal && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-fade-in">
           <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
              <button onClick={() => setSelectedGoal(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                 <i className="fa-solid fa-chevron-left"></i>
              </button>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Просмотр цели</h3>
              <div className="w-10"></div>
           </header>
           <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selectedGoal.category}</span>
                 <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-tight">{selectedGoal.title}</h2>
              </div>
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Прогресс</span>
                    <span className="text-3xl font-black tracking-tighter">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%</span>
                 </div>
                 <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%` }}></div>
                 </div>
              </div>
           </div>
           <footer className="p-6 border-t bg-white sticky bottom-0">
              <button onClick={() => handleUpdateProgress(selectedGoal.id)} className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest text-sm shadow-xl shadow-indigo-100">
                 ОТМЕТИТЬ ПРОГРЕСС
              </button>
           </footer>
        </div>
      )}
    </div>
  );
};

export default App;