import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, YearGoal, PartnerRole } from './types';
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
  const [activeTab, setActiveTab] = useState<'all' | 'finance' | 'sport' | 'growth'>('all');
  
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
    if (!store.transactions.length) return [{ date: '01.01', balance: netWorth }];
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

  const handleUpdateProgress = (goalId: string) => {
    store.setUser(prev => ({
      ...prev,
      xp: prev.xp + 150,
      streak: prev.streak + 1
    }));
    setSelectedGoal(null);
    // В реальном приложении здесь было бы сохранение лога
  };

  if (store.view === AppView.LANDING) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="mb-12">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl mb-6 mx-auto shadow-2xl shadow-indigo-200 rotate-3">
            <i className="fa-solid fa-mountain-sun"></i>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">TRIBE</h1>
          <p className="text-slate-500 font-medium max-w-[240px] mx-auto leading-tight text-lg">
            Достигай целей через энергию своего племени
          </p>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={() => store.startFresh()}
            className="w-full py-5 bg-indigo-600 text-white font-bold rounded-3xl shadow-xl shadow-indigo-100 active:scale-95 transition-all"
          >
            СОЗДАТЬ ПЛАН
          </button>
          <button 
            onClick={() => store.startDemo()}
            className="w-full py-5 bg-white text-slate-700 font-bold rounded-3xl border border-slate-200 active:scale-95 transition-all"
          >
            ПОСМОТРЕТЬ ДЕМО
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={store.view} setView={store.setView}>
      {store.view === AppView.DASHBOARD && (
        <div className="space-y-6 animate-fade-in pb-12">
          {/* Header Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px]"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Чистый Капитал</span>
                <h2 className="text-4xl font-black tracking-tighter">{netWorth.toLocaleString()} {financials.currency}</h2>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="text-[10px] font-bold">lvl {store.user.level}</span>
              </div>
            </div>
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceHistory}>
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-orange-500">
                <i className="fa-solid fa-fire text-lg"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Стрик</span>
              </div>
              <div className="text-2xl font-black">{store.user.streak} дней</div>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <i className="fa-solid fa-bolt text-lg"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Опыт</span>
              </div>
              <div className="text-2xl font-black">{store.user.xp} XP</div>
            </div>
          </div>

          {/* Goals Quick View */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Активные цели</h3>
              <button onClick={() => store.setView(AppView.GOALS)} className="text-[10px] font-bold text-indigo-600 uppercase">Все</button>
            </div>
            {store.goals.slice(0, 2).map(goal => (
              <div 
                key={goal.id} 
                onClick={() => setSelectedGoal(goal)}
                className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer"
              >
                <div className="flex-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{goal.category}</span>
                  <h4 className="font-bold text-slate-800 leading-tight">{goal.title}</h4>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-indigo-600">{Math.round((goal.current_value / (goal.target_value || 1)) * 100)}%</div>
                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {store.view === AppView.GOALS && (
        <div className="space-y-6 animate-fade-in pb-12">
          <header className="flex justify-between items-end px-1">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">ЦЕЛИ</h2>
              <p className="text-xs text-slate-500 font-medium">Твоя карта достижений на год</p>
            </div>
            <button 
              onClick={() => setShowWizard(true)}
              className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fa-solid fa-plus text-lg"></i>
            </button>
          </header>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {['all', 'finance', 'sport', 'growth'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  activeTab === tab ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
                }`}
              >
                {tab === 'all' ? 'Все' : tab === 'finance' ? 'Деньги' : tab === 'sport' ? 'Спорт' : 'Рост'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {store.goals.filter(g => activeTab === 'all' || g.category === activeTab).map(goal => (
              <div 
                key={goal.id} 
                onClick={() => setSelectedGoal(goal)}
                className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{goal.category}</span>
                    <h3 className="text-xl font-black text-slate-800 leading-tight">{goal.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">{Math.round((goal.current_value / (goal.target_value || 1)) * 100)}%</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                  <span>{goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()} {goal.metric}</span>
                  <span className="flex items-center gap-1"><i className="fa-solid fa-shield-halved text-indigo-400"></i> {goal.confidence_level}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {store.view === AppView.SOCIAL && (
        <div className="space-y-8 animate-fade-in pb-12">
          <header className="px-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
            <p className="text-xs text-slate-500 font-medium">Люди, которые не дадут тебе сдаться</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            {store.partners.map(partner => (
              <div key={partner.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${roleMeta[partner.role].bg} rounded-full flex items-center justify-center text-2xl mb-4`}>
                  {roleMeta[partner.role].emoji}
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{partner.name}</h4>
                <span className={`text-[9px] font-black uppercase ${roleMeta[partner.role].color}`}>
                  {roleMeta[partner.role].label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl">
                <i className="fa-solid fa-link"></i>
              </div>
              <h4 className="font-bold">Пригласить в племя</h4>
            </div>
            <p className="text-sm text-indigo-100 mb-6">Отправь ссылку другу, чтобы он стал твоим «Критиком» или «Сообщником».</p>
            <button className="w-full py-4 bg-white text-indigo-600 font-black text-xs uppercase rounded-2xl">
              Поделиться ссылкой
            </button>
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
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in">
          <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
            <button onClick={() => setSelectedGoal(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Детали цели</h3>
            <div className="w-10"></div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {selectedGoal.category}
              </span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none pt-2">
                {selectedGoal.title}
              </h2>
            </div>

            <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Прогресс года</span>
                <span className="text-4xl font-black tracking-tighter">
                  {Math.round((selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-700" 
                  style={{ width: `${Math.min(100, (selectedGoal.current_value / (selectedGoal.target_value || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-tighter">
                <span>{selectedGoal.current_value.toLocaleString()} {selectedGoal.metric}</span>
                <span>Цель: {selectedGoal.target_value.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Шаги к успеху</h4>
              <div className="space-y-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300">
                          {i}
                        </div>
                        <div className="text-sm font-bold text-slate-800">Этап декомпозиции {i}</div>
                      </div>
                      <i className="fa-solid fa-circle-check text-slate-100 text-xl"></i>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <footer className="p-8 border-t bg-white sticky bottom-0">
            <button 
              onClick={() => handleUpdateProgress(selectedGoal.id)}
              className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all"
            >
              ОТМЕТИТЬ ПРОГРЕСС
            </button>
          </footer>
        </div>
      )}
    </Layout>
  );
};

export default App;