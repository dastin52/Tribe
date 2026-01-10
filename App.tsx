import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, AccountabilityPartner, PartnerRole, Transaction } from './types';
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

const catIcons: Record<string, string> = {
  'Зарплата': 'fa-money-bill-wave',
  'Инвестиции': 'fa-chart-line',
  'Продукты': 'fa-basket-shopping',
  'Транспорт': 'fa-car',
  'Жилье': 'fa-house',
  'Развлечения': 'fa-clapperboard',
  'Здоровье': 'fa-heart-pulse',
  'Прочее': 'fa-ellipsis'
};

const App: React.FC = () => {
  const store = useStore();
  const [showWizard, setShowWizard] = useState(false);
  const [financeTab, setFinanceTab] = useState<'overview' | 'operations' | 'planning' | 'debts' | 'subs'>('overview');
  
  // Planning state
  const [planYears, setPlanYears] = useState(1);
  const [inflation, setInflation] = useState(10);
  const [expectedYield, setExpectedYield] = useState(12);

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

  const planningMetrics = useMemo(() => {
    const monthlyInc = financials.monthly_income || 1;
    const yRate = expectedYield / 100;
    const n = planYears;
    const i = inflation / 100;
    
    const fireCapitalToday = (monthlyInc * 12) / (yRate || 0.01);
    const fireCapitalFuture = fireCapitalToday * Math.pow(1 + i, n);
    const passiveMonthlyFuture = (fireCapitalFuture * yRate) / 12;

    return { 
      fireCapitalToday: Math.round(fireCapitalToday),
      fireCapitalFuture: Math.round(fireCapitalFuture),
      passiveMonthlyFuture: Math.round(passiveMonthlyFuture),
      fireCoverage: Math.min(100, Math.round((netWorth / (fireCapitalToday || 1)) * 100))
    };
  }, [financials, planYears, inflation, expectedYield, netWorth]);

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

      <div className="flex gap-8 text-slate-300">
        <div className="flex flex-col items-center gap-1">
          <i className="fa-solid fa-shield-halved text-2xl"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Безопасно</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <i className="fa-solid fa-brain text-2xl"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">AI Анализ</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <i className="fa-solid fa-users text-2xl"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Племя</span>
        </div>
      </div>
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

       <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Последние отзывы</h3>
          </div>
          
          {store.reviews.length === 0 ? (
             <div className="p-10 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                <i className="fa-solid fa-comments text-slate-300 text-4xl mb-4"></i>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">Пока нет отзывов</p>
             </div>
          ) : (
             <div className="space-y-4">
                {store.reviews.map(review => {
                   const partner = store.partners.find(p => p.id === review.partner_id);
                   return (
                      <div key={review.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-3">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full ${partner ? roleMeta[partner.role].bg : 'bg-slate-100'} flex items-center justify-center text-xl`}>
                                  {partner ? roleMeta[partner.role].emoji : '👤'}
                               </div>
                               <div>
                                  <h4 className="font-black text-slate-800 text-sm">{partner?.name || 'Аноним'}</h4>
                                  <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(review.timestamp).toLocaleDateString()}</span>
                               </div>
                            </div>
                            <div className="text-xl">
                              {review.reaction === 'fire' && '🔥'}
                              {review.reaction === 'strong' && '💪'}
                            </div>
                         </div>
                         <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{review.comment}"</p>
                      </div>
                   );
                })}
             </div>
          )}
       </section>
    </div>
  );

  const renderFinanceView = () => (
    <div className="space-y-6 animate-fade-in pb-12">
       <div className="px-1 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-sm text-slate-500 mt-1">Твое финансовое будущее.</p>
          </div>
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
                <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Доходы</span>
                   <div className="text-xl font-black text-slate-800">{financials.monthly_income.toLocaleString()}</div>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                   <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">Расходы</span>
                   <div className="text-xl font-black text-slate-800">{financials.monthly_expenses.toLocaleString()}</div>
                </div>
             </div>
          </div>
       )}

       {financeTab === 'planning' && (
          <div className="space-y-6 animate-fade-in">
             <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] text-white shadow-xl space-y-6">
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Вечный пассивный доход</span>
                   <h3 className="text-3xl font-black tracking-tighter">Свобода: {planningMetrics.fireCapitalToday.toLocaleString()} {financials.currency}</h3>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span>Прогресс</span>
                      <span>{planningMetrics.fireCoverage}%</span>
                   </div>
                   <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all duration-1000" style={{ width: `${planningMetrics.fireCoverage}%` }}></div>
                   </div>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Доходность (%)</label>
                         <span className="text-sm font-black text-indigo-600">{expectedYield}%</span>
                      </div>
                      <input 
                         type="range" min="1" max="30" step="1"
                         className="w-full accent-indigo-600"
                         value={expectedYield}
                         onChange={e => setExpectedYield(Number(e.target.value))}
                      />
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Горизонт (лет)</label>
                         <span className="text-sm font-black text-slate-900">{planYears}</span>
                      </div>
                      <input 
                         type="range" min="1" max="30" step="1"
                         className="w-full accent-slate-900"
                         value={planYears}
                         onChange={e => setPlanYears(Number(e.target.value))}
                      />
                   </div>
                </div>
             </div>
          </div>
       )}

       {financeTab === 'operations' && (
          <div className="space-y-4 animate-fade-in">
             {store.transactions.map(tx => (
                <div key={tx.id} className="p-5 bg-white border border-slate-50 rounded-3xl shadow-sm flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         <i className={`fa-solid ${catIcons[tx.category] || 'fa-receipt'}`}></i>
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800 text-sm">{tx.category}</h4>
                         <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(tx.timestamp).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <div className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {financials.currency}
                   </div>
                </div>
             ))}
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
            </div>
          )}
          {store.view === AppView.SOCIAL && renderSocialFeedback()}
          {store.view === AppView.FINANCE && renderFinanceView()}
          {store.view === AppView.GOALS && (
             <div className="space-y-6 pb-12 animate-fade-in">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black text-slate-800">Цели</h2>
                   <button onClick={() => setShowWizard(true)} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center"><i className="fa-solid fa-plus"></i></button>
                </div>
                {store.goals.map(g => (
                   <div key={g.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                      <div>
                         <span className="text-[9px] font-black text-slate-400 uppercase">{g.category}</span>
                         <h4 className="font-black text-slate-800">{g.title}</h4>
                      </div>
                      <div className="text-2xl font-black text-indigo-600">{Math.round((g.current_value / (g.target_value || 1)) * 100)}%</div>
                   </div>
                ))}
             </div>
          )}
          {store.view === AppView.SETTINGS && (
            <div className="p-8 bg-slate-50 rounded-[3rem] text-center space-y-4 animate-fade-in">
               <div className="w-20 h-20 bg-indigo-600 text-white rounded-full mx-auto flex items-center justify-center text-3xl font-black">{store.user.name[0]}</div>
               <h3 className="text-xl font-black text-slate-900">{store.user.name}</h3>
               <button onClick={() => window.location.reload()} className="text-rose-600 font-black text-[10px] uppercase">Выход</button>
            </div>
          )}
        </Layout>
      )}

      {showWizard && (
        <GoalWizard 
          values={store.values} 
          onCancel={() => setShowWizard(false)} 
          onComplete={(g, subgoals, projects) => { 
            store.addGoal(g); 
            // Here you could also store subgoals and projects if the store supports it
            setShowWizard(false); 
          }} 
        />
      )}
    </div>
  );
};

export default App;