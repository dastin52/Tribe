
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, PartnerRole } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { 
  ResponsiveContainer, AreaChart, Area, YAxis
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
  
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      // Устанавливаем цвет заголовка в тон приложения
      tg.setHeaderColor('#ffffff');
      tg.setBackgroundColor('#f8fafc');
    }
  }, []);

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

  const handleUpdateProgress = (goal: YearGoal) => {
    // В реальном приложении здесь будет логика обновления current_value
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    store.setUser(prev => ({
      ...prev,
      xp: prev.xp + 150,
      streak: prev.streak + 1
    }));
    setSelectedGoal(null);
  };

  if (store.view === AppView.LANDING) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-between p-10 text-center animate-fade-in">
        <div className="mt-20">
          <div className="w-28 h-28 bg-indigo-600 rounded-[3rem] flex items-center justify-center text-white text-5xl mb-8 mx-auto shadow-2xl shadow-indigo-200 rotate-6 hover:rotate-0 transition-transform duration-500">
            <i className="fa-solid fa-mountain-sun"></i>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 uppercase italic">Tribe</h1>
          <p className="text-slate-500 font-medium max-w-[260px] mx-auto leading-tight text-xl">
            Достигай целей через энергию своего племени
          </p>
        </div>
        
        <div className="w-full max-w-xs space-y-4 mb-10">
          <button 
            onClick={() => store.startFresh()} 
            className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl shadow-slate-200 active:scale-95 transition-all uppercase tracking-widest text-sm"
          >
            Создать план
          </button>
          <button 
            onClick={() => store.startDemo()} 
            className="w-full py-6 bg-white text-slate-700 font-bold rounded-[2rem] border border-slate-100 active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            Посмотреть демо
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.view === AppView.DASHBOARD && (
        <div className="space-y-6 animate-fade-in pb-12">
          {/* Главная карточка капитала */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-1">Твой капитал</span>
                <h2 className="text-4xl font-black tracking-tighter">
                  {netWorth.toLocaleString()} <span className="text-indigo-400">{financials.currency}</span>
                </h2>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5">
                <span className="text-[10px] font-black tracking-widest uppercase">Lvl {store.user.level}</span>
              </div>
            </div>
            <div className="h-24 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceHistory}>
                  <defs>
                    <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="url(#colorBal)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm group">
              <div className="flex items-center gap-2 mb-2 text-orange-500">
                <i className="fa-solid fa-fire text-xl animate-pulse"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Стрик</span>
              </div>
              <div className="text-3xl font-black text-slate-800">{store.user.streak} <span className="text-sm font-bold text-slate-400">дн.</span></div>
            </div>
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <i className="fa-solid fa-bolt-lightning text-xl"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Опыт</span>
              </div>
              <div className="text-3xl font-black text-slate-800">{store.user.xp} <span className="text-sm font-bold text-slate-400">XP</span></div>
            </div>
          </div>

          {/* Секция активных целей */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Фокус года</h3>
              <button onClick={() => store.setView(AppView.GOALS)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Все цели</button>
            </div>
            
            {store.goals.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <i className="fa-solid fa-flag text-slate-200 text-3xl mb-3"></i>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Планов пока нет</p>
              </div>
            ) : (
              store.goals.slice(0, 3).map(goal => (
                <div 
                  key={goal.id} 
                  onClick={() => setSelectedGoal(goal)} 
                  className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-indigo-100"
                >
                  <div className="flex-1">
                    <span className={`text-[9px] font-black uppercase block mb-1 ${goal.category === 'finance' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                      {goal.category}
                    </span>
                    <h4 className="font-black text-slate-800 leading-tight pr-4">{goal.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900 tracking-tighter">
                      {Math.round((goal.current_value / (goal.target_value || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {store.view === AppView.GOALS && (
        <div className="space-y-6 animate-fade-in pb-12">
          <header className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">ЦЕЛИ</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твой вектор развития</p>
            </div>
            <button 
              onClick={() => setShowWizard(true)} 
              className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-100 flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fa-solid fa-plus text-xl"></i>
            </button>
          </header>

          <div className="space-y-4">
            {store.goals.map(goal => (
              <div key={goal.id} onClick={() => setSelectedGoal(goal)} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6 cursor-pointer hover:border-indigo-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{goal.category}</span>
                    <h3 className="text-2xl font-black text-slate-800 leading-none">{goal.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter italic">
                      {Math.round((goal.current_value / (goal.target_value || 1)) * 100)}<span className="text-sm ml-0.5">%</span>
                    </span>
                  </div>
                </div>
                <div className="relative pt-1">
                   <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100">
                     <div style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-1000"></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {store.view === AppView.SOCIAL && (
        <div className="space-y-8 animate-fade-in pb-12">
          <div className="px-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Те, кто верит в твой успех</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {store.partners.map(partner => (
              <div key={partner.id} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group active:scale-95 transition-all">
                <div className={`w-20 h-20 ${roleMeta[partner.role].bg} rounded-[2rem] flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {roleMeta[partner.role].emoji}
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1">{partner.name}</h4>
                <span className={`text-[9px] font-black uppercase tracking-widest ${roleMeta[partner.role].color}`}>
                  {roleMeta[partner.role].label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 text-center">
            <i className="fa-solid fa-user-plus text-indigo-600 text-2xl mb-3"></i>
            <h4 className="font-black text-indigo-900 text-sm mb-1 uppercase tracking-widest">Пригласить соратника</h4>
            <p className="text-xs text-indigo-400 font-medium">Вместе путь к цели в 3 раза быстрее</p>
          </div>
        </div>
      )}

      {showWizard && (
        <GoalWizard 
          values={store.values} 
          onCancel={() => setShowWizard(false)} 
          onComplete={(g, sgs, projs) => {
            store.addGoalWithPlan(g, sgs, projs);
            setShowWizard(false);
          }}
        />
      )}

      {selectedGoal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in overflow-hidden">
          <header className="p-6 flex justify-between items-center bg-white border-b border-slate-50">
            <button onClick={() => setSelectedGoal(null)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em]">Панель управления</h3>
            <div className="w-12"></div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            <div>
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2">{selectedGoal.category}</span>
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9]">{selectedGoal.title}</h2>
            </div>

            <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-[60px]"></div>
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Прогресс</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter italic">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}</span>
                    <span className="text-2xl font-black text-indigo-400">%</span>
                  </div>
                </div>
                <div className="text-right pb-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Цель</span>
                   <span className="text-lg font-black">{selectedGoal.target_value.toLocaleString()} {selectedGoal.metric}</span>
                </div>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden relative z-10 border border-white/5">
                <div className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%` }}></div>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Лог достижений</h4>
               {selectedGoal.logs.length === 0 ? (
                 <div className="p-8 text-center bg-slate-50 rounded-[2.5rem] border border-slate-100 italic text-slate-400 text-xs">
                   Пока нет подтвержденных отметок
                 </div>
               ) : (
                 selectedGoal.logs.map(log => (
                   <div key={log.id} className="p-5 bg-white rounded-3xl border border-slate-100 flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-600">{new Date(log.timestamp).toLocaleDateString()}</span>
                     <span className="text-sm font-black text-indigo-600">+{log.value} {selectedGoal.metric}</span>
                   </div>
                 ))
               )}
            </div>
          </div>

          <footer className="p-8 border-t border-slate-50 bg-white/80 backdrop-blur-lg">
            <button 
              onClick={() => handleUpdateProgress(selectedGoal)} 
              className="w-full py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-sm active:scale-95 transition-all hover:bg-indigo-700"
            >
              Внести прогресс
            </button>
          </footer>
        </div>
      )}
    </Layout>
  );
};

export default App;
