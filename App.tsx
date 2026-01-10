import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, AccountabilityPartner, PartnerRole, Transaction, SubGoal, Project } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Extend window for Telegram
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
  
  // Telegram Integration
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

  const updateGoalProgress = (goalId: string, newValue: number) => {
    store.setUser(prev => ({
      ...prev,
      xp: prev.xp + 100,
      streak: prev.streak + 1
    }));
    // In a real app, this would update the store's state properly via a dispatcher
    // For now, we simulate the update in the local view for demo purposes
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center p-8 text-center space-y-12 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter">
          TRIBE
        </h1>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">
          Твоя личная экосистема для достижения целей через ценности и социальное давление.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button 
          onClick={() => store.startDemo()}
          className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          ПОПРОБОВАТЬ ДЕМО
        </button>
        <button 
          onClick={() => store.startFresh()}
          className="w-full py-5 bg-white text-indigo-600 border-2 border-indigo-50 font-black rounded-[2rem] active:scale-95 transition-all"
        >
          НАЧАТЬ С НУЛЯ
        </button>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex justify-between items-center px-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Цели</h2>
          <button onClick={() => setShowWizard(true)} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all">
            <i className="fa-solid fa-plus"></i>
          </button>
      </div>

      {store.goals.length === 0 ? (
        <div className="p-10 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
           <i className="fa-solid fa-bullseye text-slate-300 text-4xl mb-4"></i>
           <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">Нет активных целей</p>
        </div>
      ) : (
        <div className="space-y-4">
          {store.goals.map(g => (
            <div 
              key={g.id} 
              onClick={() => setSelectedGoal(g)}
              className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{g.category}</span>
                  <h4 className="font-black text-slate-800 text-lg">{g.title}</h4>
                </div>
                <div className="text-2xl font-black text-indigo-600">{Math.round((g.current_value / (g.target_value || 1)) * 100)}%</div>
              </div>
              
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (g.current_value / (g.target_value || 1)) * 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                <span>{g.current_value.toLocaleString()} / {g.target_value.toLocaleString()} {g.metric}</span>
                <span>Доверие: {g.confidence_level}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSocialFeedback = () => (
    <div className="space-y-6 animate-fade-in pb-12">
       <div className="px-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Племя</h2>
          <p className="text-sm text-slate-500 mt-1">Окружение, которое тянет тебя вверх.</p>
       </div>

       <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Твои Хранители</h3>
          <div className="grid grid-cols-2 gap-4">
             {store.partners.map(partner => (
                <div key={partner.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center gap-3">
                   <div className={`w-16 h-16 rounded-full ${roleMeta[partner.role].bg} flex items-center justify-center text-3xl`}>
                      {roleMeta[partner.role].emoji}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-800 text-sm">{partner.name}</h4>
                      <span className={`text-[9px] font-black uppercase ${roleMeta[partner.role].color}`}>
                        {roleMeta[partner.role].label}
                      </span>
                   </div>
                </div>
             ))}
          </div>
       </section>
    </div>
  );

  const renderFinanceView = () => (
    <div className="space-y-6 animate-fade-in pb-12">
       <div className="px-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Капитал</h2>
       </div>

       <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {(['overview', 'operations', 'planning', 'debts', 'subs'] as const).map(tab => (
             <button
                key={tab}
                onClick={() => setFinanceTab(tab)}
                className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${
                   financeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                }`}
             >
                {tab === 'overview' ? 'Обзор' : tab === 'operations' ? 'Журнал' : tab === 'planning' ? 'Планы' : tab === 'debts' ? 'Долги' : 'Подписки'}
             </button>
          ))}
       </div>

       {financeTab === 'overview' && (
          <div className="space-y-6">
             <div className="p-8 bg-slate-900 rounded-[3rem] text-white shadow-xl space-y-4 relative overflow-hidden">
                <div>
                   <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Чистый капитал</span>
                   <div className="text-4xl font-black tracking-tighter">{netWorth.toLocaleString()} {financials.currency}</div>
                </div>
                
                <div className="h-24 w-full mt-4">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceHistory}>
                         <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white rounded-3xl border border-slate-100">
                   <span className="text-[9px] font-black text-emerald-500 uppercase">Доходы</span>
                   <div className="text-lg font-black text-slate-800">+{financials.monthly_income.toLocaleString()}</div>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-slate-100">
                   <span className="text-[9px] font-black text-rose-500 uppercase">Расходы</span>
                   <div className="text-lg font-black text-slate-800">-{financials.monthly_expenses.toLocaleString()}</div>
                </div>
             </div>
          </div>
       )}
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
                     <span className="text-sm font-black text-orange-600">{store.user.streak} ДНЕЙ</span>
                  </div>
               </div>
               
               <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-4">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Чистый Капитал</div>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{netWorth.toLocaleString()} {financials.currency}</div>
                  </div>
               </div>

               {store.goals.length > 0 && (
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Главная цель</h3>
                    <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                       <span className="text-[9px] font-black text-indigo-200 uppercase">{store.goals[0].category}</span>
                       <h4 className="font-black text-xl mb-2">{store.goals[0].title}</h4>
                       <div className="flex justify-between text-xs font-black opacity-80 mb-2">
                          <span>{Math.round((store.goals[0].current_value / store.goals[0].target_value) * 100)}%</span>
                          <span>{store.goals[0].current_value} / {store.goals[0].target_value} {store.goals[0].metric}</span>
                       </div>
                       <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white" style={{ width: `${(store.goals[0].current_value / store.goals[0].target_value) * 100}%` }}></div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}
          {store.view === AppView.SOCIAL && renderSocialFeedback()}
          {store.view === AppView.FINANCE && renderFinanceView()}
          {store.view === AppView.GOALS && renderGoals()}
          {store.view === AppView.SETTINGS && (
            <div className="p-8 bg-slate-50 rounded-[3rem] text-center space-y-4 animate-fade-in">
               <div className="w-20 h-20 bg-indigo-600 text-white rounded-full mx-auto flex items-center justify-center text-3xl font-black uppercase">{store.user.name[0]}</div>
               <h3 className="text-xl font-black text-slate-900">{store.user.name}</h3>
               <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="p-4 bg-white rounded-3xl border border-slate-100">
                     <div className="text-xs font-black text-slate-400 uppercase mb-1">XP</div>
                     <div className="text-lg font-black text-indigo-600">{store.user.xp}</div>
                  </div>
                  <div className="p-4 bg-white rounded-3xl border border-slate-100">
                     <div className="text-xs font-black text-slate-400 uppercase mb-1">Стрик</div>
                     <div className="text-lg font-black text-orange-500">{store.user.streak}</div>
                  </div>
               </div>
               <button onClick={() => window.location.reload()} className="w-full mt-6 py-4 text-rose-600 font-black text-[10px] uppercase border border-rose-100 rounded-2xl">Выйти из аккаунта</button>
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
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">План реализации</h3>
              <div className="w-10"></div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selectedGoal.category}</span>
                 <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{selectedGoal.title}</h2>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-300 uppercase">Прогресс</span>
                    <span className="text-2xl font-black">{Math.round((selectedGoal.current_value / selectedGoal.target_value) * 100)}%</span>
                 </div>
                 <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${(selectedGoal.current_value / selectedGoal.target_value) * 100}%` }}></div>
                 </div>
                 <div className="text-center text-xs font-medium text-slate-400">
                    {selectedGoal.current_value.toLocaleString()} / {selectedGoal.target_value.toLocaleString()} {selectedGoal.metric}
                 </div>
              </div>

              <section className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Этапы (Subgoals)</h3>
                 <div className="space-y-3">
                    {store.subgoals.filter(sg => sg.year_goal_id === selectedGoal.id).map((sg, i) => (
                       <div key={sg.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                {i + 1}
                             </div>
                             <div>
                                <div className="text-sm font-black text-slate-800">{sg.title}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Вес: {sg.weight}%</div>
                             </div>
                          </div>
                          <i className="fa-solid fa-circle-check text-slate-100 text-xl"></i>
                       </div>
                    ))}
                 </div>
              </section>
           </div>

           <footer className="p-6 border-t bg-white">
              <button 
                onClick={() => {
                  updateGoalProgress(selectedGoal.id, selectedGoal.current_value + 1);
                  setSelectedGoal(null);
                }}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 transition-all"
              >
                 ОТМЕТИТЬ ПРОГРЕСС (+1)
              </button>
           </footer>
        </div>
      )}
    </div>
  );
};

export default App;