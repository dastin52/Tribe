
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, PartnerRole, SubGoal, Transaction } from './types';
import { Layout } from './components/Layout';
import { GoalWizard } from './components/GoalWizard';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
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

  // Фильтрация задач на сегодня
  const todayTasks = useMemo(() => {
    return store.subgoals.filter(sg => {
      if (sg.frequency === 'daily') return true;
      if (sg.frequency === 'weekly') {
        const daysSinceStart = Math.floor((Date.now() - new Date(sg.deadline).getTime()) / 86400000);
        return daysSinceStart % 7 === 0;
      }
      if (sg.frequency === 'monthly') return new Date().getDate() === 1 || new Date().getDate() === 15;
      return sg.current_value < sg.target_value;
    }).slice(0, 4);
  }, [store.subgoals]);

  if (store.view === AppView.LANDING) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-between p-10 text-center animate-fade-in">
        <div className="mt-20">
          <div className="w-28 h-28 bg-indigo-600 rounded-[3.5rem] flex items-center justify-center text-white text-5xl mb-8 mx-auto shadow-2xl shadow-indigo-200 rotate-6 hover:rotate-0 transition-transform duration-500">
            <i className="fa-solid fa-mountain-sun"></i>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 uppercase italic">Tribe</h1>
          <p className="text-slate-500 font-medium max-w-[260px] mx-auto leading-tight text-xl">
            Твоя социальная ОС для достижений
          </p>
        </div>
        
        <div className="w-full max-w-xs space-y-4 mb-10">
          <button 
            onClick={() => store.startFresh()} 
            className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl shadow-slate-200 active:scale-95 transition-all uppercase tracking-widest text-sm"
          >
            Начать путь
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
          {/* Главный виджет */}
          <div className="bg-slate-900 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                {store.user.photo_url ? (
                  <img src={store.user.photo_url} className="w-14 h-14 rounded-[1.5rem] border-2 border-white/20 object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center font-black text-xl">
                    {store.user.name[0]}
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Добро пожаловать,</span>
                  <h2 className="text-2xl font-black tracking-tight">{store.user.name}</h2>
                </div>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5">
                <span className="text-[10px] font-black tracking-widest uppercase">Ур. {store.user.level}</span>
              </div>
            </div>
            
            <div className="space-y-1 mb-6 relative z-10">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Чистый капитал</span>
              <div className="text-4xl font-black tracking-tighter">
                {netWorth.toLocaleString()} <span className="text-indigo-400">{financials.currency}</span>
              </div>
            </div>

            <div className="h-20 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceHistory}>
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="rgba(99,102,241,0.1)" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Задачи на сегодня */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Задачи на сегодня</h3>
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-[2.5rem] border border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Все задачи выполнены 🎉
                </div>
              ) : (
                todayTasks.map(sg => (
                  <div key={sg.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-98 transition-all">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => store.updateSubgoalProgress(sg.id, sg.auto_calculate_amount || 1)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <i className="fa-solid fa-check text-sm"></i>
                      </button>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{sg.title}</h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          {sg.frequency === 'daily' ? 'Ежедневно' : sg.frequency === 'monthly' ? 'Раз в месяц' : 'План'} • 
                          {sg.auto_calculate_amount ? ` +${sg.auto_calculate_amount} ${sg.metric}` : ` ${sg.metric}`}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                      {Math.round((sg.current_value / sg.target_value) * 100)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

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
        </div>
      )}

      {store.view === AppView.FINANCE && (
        <div className="space-y-6 animate-fade-in pb-12">
          <header className="px-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Управление ресурсами</p>
          </header>

          <div className="space-y-4">
             {/* Сводка */}
             <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                  <i className="fa-solid fa-coins text-8xl -rotate-12 translate-x-4 translate-y-4"></i>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block">Всего активов</span>
                  <div className="text-3xl font-black tracking-tight">{financials.total_assets.toLocaleString()} {financials.currency}</div>
                </div>
                <button className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <i className="fa-solid fa-plus"></i>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Доходы (мес)</span>
                   <div className="text-xl font-black text-emerald-600">+{financials.monthly_income.toLocaleString()}</div>
                </div>
                <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Расходы (мес)</span>
                   <div className="text-xl font-black text-rose-600">-{financials.monthly_expenses.toLocaleString()}</div>
                </div>
             </div>

             {/* Долги */}
             <section className="space-y-3">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Долговые обязательства</h3>
               {store.debts.length === 0 ? (
                 <div className="p-6 text-center bg-slate-50 rounded-[2rem] border border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Долгов нет 🎉</div>
               ) : (
                 store.debts.map(debt => (
                   <div key={debt.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                         <h4 className="font-bold text-slate-800 text-sm">{debt.title}</h4>
                         <span className="text-xs font-black text-slate-900">{debt.remaining_amount.toLocaleString()} {financials.currency}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                         <div className="h-full bg-slate-800" style={{ width: `${(debt.remaining_amount / debt.total_amount) * 100}%` }}></div>
                      </div>
                   </div>
                 ))
               )}
             </section>

             {/* Транзакции */}
             <section className="space-y-3">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">История операций</h3>
                   <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Все</button>
                </div>
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                   {store.transactions.length === 0 ? (
                     <div className="p-10 text-center text-slate-300 text-xs italic">Операций пока нет</div>
                   ) : (
                     store.transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="p-5 border-b border-slate-50 flex justify-between items-center last:border-none">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                                 <i className={`fa-solid ${tx.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                              </div>
                              <div>
                                 <div className="font-bold text-slate-800 text-sm">{tx.category}</div>
                                 <div className="text-[9px] text-slate-400 font-bold uppercase">{new Date(tx.timestamp).toLocaleDateString()}</div>
                              </div>
                           </div>
                           <div className={`font-black text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {financials.currency}
                           </div>
                        </div>
                     ))
                   )}
                </div>
             </section>
          </div>
        </div>
      )}

      {store.view === AppView.GOALS && (
        <div className="space-y-6 animate-fade-in pb-12">
          <header className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Цели</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Вектор года</p>
            </div>
            <button 
              onClick={() => setShowWizard(true)} 
              className="w-14 h-14 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-100 flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fa-solid fa-plus text-xl"></i>
            </button>
          </header>

          <div className="space-y-4">
            {store.goals.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <i className="fa-solid fa-flag text-slate-100 text-5xl mb-4"></i>
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Создай свою первую цель</p>
              </div>
            ) : (
              store.goals.map(goal => (
                <div key={goal.id} onClick={() => setSelectedGoal(goal)} className="p-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 cursor-pointer hover:border-indigo-100 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="max-w-[70%]">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{goal.category}</span>
                      <h3 className="text-2xl font-black text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">{goal.title}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter italic">
                        {Math.round((goal.current_value / (goal.target_value || 1)) * 100)}<span className="text-sm ml-0.5">%</span>
                      </span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                     <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-50 border border-slate-100/50">
                       <div style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-1000"></div>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {store.view === AppView.SOCIAL && (
        <div className="space-y-8 animate-fade-in pb-12">
          <div className="px-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твои соратники</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {store.partners.map(partner => (
              <div key={partner.id} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group active:scale-95 transition-all">
                <div className={`w-20 h-20 ${roleMeta[partner.role].bg} rounded-[2.5rem] flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {roleMeta[partner.role].emoji}
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1">{partner.name}</h4>
                <span className={`text-[9px] font-black uppercase tracking-widest ${roleMeta[partner.role].color}`}>
                  {roleMeta[partner.role].label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 text-center cursor-pointer active:scale-95 transition-all">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-xl shadow-xl shadow-indigo-100">
               <i className="fa-solid fa-user-plus"></i>
            </div>
            <h4 className="font-black text-indigo-900 text-sm mb-1 uppercase tracking-widest">Пригласить в Tribe</h4>
            <p className="text-xs text-indigo-400 font-medium">Верификация целей друзьями увеличивает шансы на успех в 2.5 раза</p>
          </div>
        </div>
      )}

      {store.view === AppView.SETTINGS && (
        <div className="space-y-8 animate-fade-in pb-12">
          <header className="px-2 text-center">
            <div className="relative inline-block mb-4">
               {store.user.photo_url ? (
                  <img src={store.user.photo_url} className="w-24 h-24 rounded-[2.5rem] border-4 border-white shadow-xl object-cover" />
               ) : (
                  <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-3xl text-white font-black shadow-xl">
                    {store.user.name[0]}
                  </div>
               )}
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center border-4 border-white">
                  <i className="fa-solid fa-camera text-xs"></i>
               </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{store.user.name}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {store.user.telegram_id || 'LOCAL_USER'}</p>
          </header>

          <div className="space-y-4">
             <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Настройки аккаунта</h4>
                <div className="space-y-2">
                   {['Уведомления', 'Приватность', 'Язык (RU)', 'Валюта (₽)'].map(item => (
                     <button key={item} className="w-full p-4 bg-slate-50 rounded-2xl text-left font-bold text-sm text-slate-700 flex justify-between items-center active:bg-slate-100">
                        {item} <i className="fa-solid fa-chevron-right text-[10px] opacity-30"></i>
                     </button>
                   ))}
                </div>
             </div>

             <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100 space-y-4">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-1">Опасная зона</h4>
                <button onClick={() => { if(confirm('Сбросить все данные?')) store.startFresh() }} className="w-full p-4 bg-white rounded-2xl text-left font-bold text-sm text-rose-600 border border-rose-100 active:bg-rose-100">
                   Сбросить прогресс и данные
                </button>
             </div>
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
            <button onClick={() => setSelectedGoal(null)} className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em]">Цель в деталях</h3>
            <button className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-400">
              <i className="fa-solid fa-ellipsis"></i>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            <div>
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2">{selectedGoal.category}</span>
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9]">{selectedGoal.title}</h2>
            </div>

            <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[70px]"></div>
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Общий прогресс</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter italic">{Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}</span>
                    <span className="text-2xl font-black text-indigo-400">%</span>
                  </div>
                </div>
                <div className="text-right pb-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">План</span>
                   <span className="text-lg font-black">{selectedGoal.target_value.toLocaleString()} {selectedGoal.metric}</span>
                </div>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden relative z-10 border border-white/5">
                <div className="h-full bg-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all duration-1000" style={{ width: `${Math.min(100, (selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%` }}></div>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Контрольные точки (ИИ-план)</h4>
               {store.subgoals.filter(sg => sg.year_goal_id === selectedGoal.id).map(sg => (
                 <div key={sg.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 flex justify-between items-center group active:scale-95 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                        <i className="fa-solid fa-bullseye"></i>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 block leading-tight">{sg.title}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{sg.frequency} • {sg.metric}</span>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                     {Math.round((sg.current_value / sg.target_value) * 100)}%
                   </span>
                 </div>
               ))}
            </div>
          </div>

          <footer className="p-8 border-t border-slate-50 bg-white/80 backdrop-blur-lg">
            <button 
              onClick={() => setSelectedGoal(null)} 
              className="w-full py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-sm active:scale-95 transition-all hover:bg-indigo-700"
            >
              Закрыть панель
            </button>
          </footer>
        </div>
      )}
    </Layout>
  );
};

export default App;
