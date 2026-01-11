
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, PartnerRole, SubGoal, Meeting } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip
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
  const [balanceVisible, setBalanceVisible] = useState(false);
  
  // Logic for "Flip to reveal" or tilting
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta && (Math.abs(event.beta) > 150 || Math.abs(event.gamma || 0) > 70)) {
        setBalanceVisible(true);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Telegram UI Logic
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
            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-5xl mx-auto shadow-2xl shadow-indigo-100 rotate-3 animate-bounce-subtle">
              <i className="fa-solid fa-mountain-sun"></i>
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">Tribe</h1>
              <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase">Social Operating System for Goals</p>
            </div>
          </div>

          <div className="p-8 bg-slate-50/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 space-y-4">
             <div className="flex -space-x-2 justify-center">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] shadow-sm">
                    {['🧗','📈','🧘','🏆'][i-1]}
                  </div>
                ))}
             </div>
             <p className="text-slate-600 text-sm font-semibold leading-tight px-4">
               Достигай целей в кругу своего Племени. С поддержкой и контролем.
             </p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => store.startFresh()} 
              className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl shadow-slate-200 active:scale-95 transition-all uppercase tracking-widest text-xs"
            >
              Начать новый путь
            </button>
            <button 
              onClick={() => store.startDemo()} 
              className="w-full py-6 bg-white text-slate-900 border-2 border-slate-100 font-black rounded-[2rem] active:scale-95 transition-all uppercase tracking-widest text-xs"
            >
              Посмотреть демо
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.view === AppView.DASHBOARD && (
        <div className="space-y-6 animate-fade-in pb-12">
          {/* Header */}
          <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg overflow-hidden border-2 border-white">
                   {store.user.photo_url ? <img src={store.user.photo_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user"></i>}
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 leading-none">{store.user.name}</h2>
                   <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">EXP: {store.user.xp} • LVL {store.user.level}</span>
                </div>
             </div>
             <button onClick={() => setBalanceVisible(!balanceVisible)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm active:scale-95">
                <i className={`fa-solid ${balanceVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
             </button>
          </div>

          {/* Capital Card */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="space-y-1 mb-6 relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Твой капитал</span>
              <div className="text-4xl font-black tracking-tighter">
                {balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-indigo-400">{financials.currency}</span>
              </div>
              {!balanceVisible && <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Наклони телефон для просмотра</p>}
            </div>
            <div className="h-16 w-full opacity-30">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceHistory}>
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agenda */}
          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Повестка дня</h3>
                <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded-md tracking-tighter">Live</span>
             </div>
             <div className="space-y-3">
                {store.meetings.map(m => (
                  <div key={m.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-98 transition-transform">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs">
                          {m.time}
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{m.title}</h4>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.category}</span>
                       </div>
                    </div>
                    <i className="fa-solid fa-video text-slate-200 text-sm"></i>
                  </div>
                ))}
                {todayTasks.map(sg => (
                  <div key={sg.id} className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <button onClick={() => store.updateSubgoalProgress(sg.id, 1)} className="w-10 h-10 rounded-2xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm active:scale-90 transition-all">
                          <i className="fa-solid fa-check"></i>
                       </button>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{sg.title}</h4>
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Цель: {sg.target_value} {sg.metric}</span>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        </div>
      )}

      {store.view === AppView.ANALYTICS && (
        <div className="space-y-8 animate-fade-in pb-12">
           <header className="px-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Анализ</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твой Икигай и баланс жизни</p>
           </header>

           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Жизненный баланс</span>
              <div className="w-full h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={ikigaiData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                          {ikigaiData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                 {ikigaiData.map(d => (
                   <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{d.name}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-8 bg-slate-900 rounded-[3.5rem] text-white space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-brain"></i>
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest">ИИ Оценка достижений</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                "У тебя отличный фокус на финансах, но социальный сектор проседает. Твое Племя (Social) может дать больше энергии, если ты откроешь для них 2-3 цели для верификации."
              </p>
           </div>

           <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Контроль доступа</h3>
              <div className="space-y-3">
                 {store.goals.map(goal => (
                   <div key={goal.id} className="p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm leading-tight">{goal.title}</h4>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{goal.is_private ? 'Личная' : 'Видна племени'}</span>
                      </div>
                      <button onClick={() => store.toggleGoalPrivacy(goal.id)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${goal.is_private ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                         <i className={`fa-solid ${goal.is_private ? 'fa-lock' : 'fa-globe-americas'}`}></i>
                      </button>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      )}

      {store.view === AppView.SOCIAL && (
        <div className="space-y-8 animate-fade-in pb-12">
          <div className="px-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твое окружение</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {store.partners.map(partner => (
              <div key={partner.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group active:scale-95 transition-all">
                <div className={`w-20 h-20 ${roleMeta[partner.role].bg} rounded-[2.5rem] flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                  {roleMeta[partner.role].emoji}
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1">{partner.name}</h4>
                <span className={`text-[9px] font-black uppercase tracking-widest ${roleMeta[partner.role].color}`}>
                  {roleMeta[partner.role].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {store.view === AppView.GOALS && (
        <div className="space-y-6 animate-fade-in pb-12">
          <header className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Цели</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твой вектор развития</p>
            </div>
            <button onClick={() => setShowWizard(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-[2rem] shadow-xl flex items-center justify-center active:scale-90 transition-all">
              <i className="fa-solid fa-plus text-xl"></i>
            </button>
          </header>
          <div className="space-y-4">
            {store.goals.map(goal => (
              <div key={goal.id} onClick={() => setSelectedGoal(goal)} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6 cursor-pointer hover:border-indigo-100 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{goal.category} {goal.is_private && '🔒'}</span>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{goal.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter italic">
                      {Math.round((goal.current_value / (goal.target_value || 1)) * 100)}<span className="text-sm ml-0.5 font-bold">%</span>
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }} className="h-full bg-indigo-600 transition-all duration-1000"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedGoal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in overflow-hidden">
           <header className="p-6 flex justify-between items-center border-b border-slate-50">
              <button onClick={() => setSelectedGoal(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                 <i className="fa-solid fa-chevron-left"></i>
              </button>
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
              <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px]"></div>
                <div className="flex justify-between items-end relative z-10">
                   <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Прогресс</span>
                      <div className="text-6xl font-black tracking-tighter italic">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%</div>
                   </div>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 relative z-10">
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%` }}></div>
                </div>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
