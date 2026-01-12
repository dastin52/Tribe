
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { Transaction, Debt, Subscription, FinancialSnapshot, YearGoal } from '../types';
import { geminiService } from '../services/gemini';

interface FinanceViewProps {
  financials: FinancialSnapshot;
  transactions: Transaction[];
  debts: Debt[];
  subscriptions: Subscription[];
  balanceVisible: boolean;
  setBalanceVisible: (v: boolean) => void;
  netWorth: number;
  balanceHistory: any[];
  onAddTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string, goal_id?: string) => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  goals: YearGoal[];
}

const EXPENSE_CATEGORIES = ['Продукты', 'Транспорт', 'Жилье', 'Развлечения', 'Здоровье', 'Одежда', 'Связь', 'Подписки', 'Налоги', 'Другое'];

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, setBalanceVisible, netWorth, balanceHistory, onAddTransaction, onAddDebt, onAddSubscription, goals 
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'debts' | 'subscriptions' | 'planning'>('operations');
  const [isAdding, setIsAdding] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  const [targetYears, setTargetYears] = useState(10);
  const [inflationRate, setInflationRate] = useState(0.08);
  const [yieldRate, setYieldRate] = useState(0.12);
  const [showCompound, setShowCompound] = useState(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [debtType, setDebtType] = useState<'i_owe' | 'they_owe'>('i_owe');

  // Fix: Added missing calculations for iOweTotal, theyOweTotal, and totalMonthlySubs
  const iOweTotal = useMemo(() => 
    debts.filter(d => d.type === 'i_owe').reduce((acc, d) => acc + d.remaining_amount, 0), 
  [debts]);

  const theyOweTotal = useMemo(() => 
    debts.filter(d => d.type === 'they_owe').reduce((acc, d) => acc + d.remaining_amount, 0), 
  [debts]);

  const totalMonthlySubs = useMemo(() => 
    subscriptions.reduce((acc, s) => acc + (s.period === 'monthly' ? s.amount : s.amount / 12), 0), 
  [subscriptions]);

  const averageMonthlyBurn = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const relevantExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.timestamp) >= sixMonthsAgo);
    const subsTotal = subscriptions.reduce((acc, s) => acc + s.amount, 0);
    if (relevantExpenses.length === 0) return (financials.monthly_expenses || 0) + subsTotal;
    return (relevantExpenses.reduce((acc, t) => acc + t.amount, 0) / 6) + subsTotal;
  }, [transactions, subscriptions, financials.monthly_expenses]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const filtered = transactions.filter(t => {
      const d = new Date(t.timestamp);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });
    const income = filtered.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    return { income, expense };
  }, [transactions]);

  const realYield = Math.max(0.01, yieldRate - inflationRate);
  const passiveCapitalGoal = (averageMonthlyBurn * 12) / realYield;
  
  const inflationAdjustedTotal = useMemo(() => {
    let total = 0;
    let annualExpense = averageMonthlyBurn * 12;
    for (let i = 1; i <= targetYears; i++) {
      total += annualExpense * Math.pow(1 + inflationRate, i);
    }
    return total;
  }, [averageMonthlyBurn, targetYears, inflationRate]);

  const compoundData = useMemo(() => {
    let current = netWorth;
    const history = [];
    for (let i = 0; i <= targetYears; i++) {
      history.push({ year: i, balance: Math.round(current) });
      current = current * (1 + yieldRate);
    }
    return history;
  }, [netWorth, yieldRate, targetYears]);

  const freedomIndex = Math.round((netWorth / passiveCapitalGoal) * 100);
  const formatVal = (val: number) => balanceVisible ? `${Math.round(val).toLocaleString()} ${financials.currency}` : `∗∗∗ ${financials.currency}`;

  // РАСЧЕТ УРОВНЕЙ СВОБОДЫ
  const freedomLevels = useMemo(() => {
    const burn = averageMonthlyBurn;
    return [
      {
        id: 'L1',
        title: 'Спасательный жилет',
        desc: '6 месяцев жизни в запасе',
        target: burn * 6,
        icon: 'fa-life-ring',
        color: 'text-blue-500'
      },
      {
        id: 'L2',
        title: 'Твердая почва',
        desc: '2 года жизни без долгов',
        target: burn * 24,
        icon: 'fa-anchor',
        color: 'text-emerald-500'
      },
      {
        id: 'L3',
        title: 'Автономия',
        desc: 'Пассивный доход = База',
        target: passiveCapitalGoal,
        icon: 'fa-leaf',
        color: 'text-indigo-500'
      },
      {
        id: 'L4',
        title: 'Цифровой Кочевник',
        desc: 'Любая точка мира (2x База)',
        target: passiveCapitalGoal * 2,
        icon: 'fa-plane-departure',
        color: 'text-violet-500'
      },
      {
        id: 'L5',
        title: '«Да пошёл ты!»',
        desc: '100М + Дом + Машина',
        target: 100000000,
        icon: 'fa-fort-awesome',
        color: 'text-rose-600',
        special: true
      }
    ];
  }, [averageMonthlyBurn, passiveCapitalGoal]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic leading-none">{formatVal(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const advice = await geminiService.getFinanceAdvice(transactions, goals);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твой финансовый радар</p>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setBalanceVisible(!balanceVisible)} className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-colors ${balanceVisible ? 'text-indigo-600' : 'text-slate-300'}`}><i className={`fa-solid ${balanceVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i></button>
            {activeTab !== 'planning' && <button onClick={() => setIsAdding(!isAdding)} className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all ${isAdding ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}><i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-lg`}></i></button>}
         </div>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-[2rem] mx-2">
         {['operations', 'debts', 'subscriptions', 'planning'].map((id) => (
           <button key={id} onClick={() => { setActiveTab(id as any); setIsAdding(false); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
             {id === 'operations' ? 'Операции' : id === 'debts' ? 'Долги' : id === 'subscriptions' ? 'Подписки' : 'Свобода'}
           </button>
         ))}
      </div>

      <div className="px-1 space-y-6">
        {activeTab === 'operations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#0f172a] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden mx-1">
               <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Общий капитал</span>
               <div className="text-5xl font-black tracking-tighter italic my-4 leading-none">{formatVal(netWorth)}</div>
               <div className={`h-24 w-full mt-4 -mx-4 ${balanceVisible ? '' : 'blur-md opacity-20'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={balanceHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/><stop offset="95%" stopColor="#818cf8" stopOpacity={0}/></linearGradient></defs>
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="balance" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mx-1">
               <div className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Доход / Месяц</span>
                  <span className="font-black text-emerald-600 text-sm italic">{formatVal(currentMonthStats.income)}</span>
               </div>
               <div className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Расход / Месяц</span>
                  <span className="font-black text-rose-600 text-sm italic">{formatVal(currentMonthStats.expense)}</span>
               </div>
            </div>

            <div className="space-y-3">
              {transactions.slice(-10).reverse().map(tx => (
                <div key={tx.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex justify-between items-center shadow-sm mx-1">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><i className={`fa-solid ${tx.type === 'income' ? 'fa-arrow-trend-up' : 'fa-receipt'} text-xs`}></i></div>
                      <div>
                         <span className="font-black text-slate-800 text-sm block italic uppercase">{tx.category}</span>
                         <span className="text-[8px] font-black text-slate-300 uppercase italic">{new Date(tx.timestamp).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <span className={`font-black italic text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{balanceVisible ? `${tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}` : '∗∗∗'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
           <div className="space-y-8 animate-fade-in">
              {/* Карта Свободы */}
              <div className="p-10 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden mx-1">
                 <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 italic mb-10">Прогресс к Свободе</h4>
                 
                 <div className="space-y-8">
                    {freedomLevels.map((level, idx) => {
                      const progress = Math.min(100, (netWorth / level.target) * 100);
                      const isUnlocked = netWorth >= level.target;
                      return (
                        <div key={level.id} className={`relative ${!isUnlocked && 'opacity-60'}`}>
                           <div className="flex justify-between items-end mb-2">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isUnlocked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white/40'}`}>
                                    <i className={`fa-solid ${level.icon} text-xs`}></i>
                                 </div>
                                 <div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest block italic ${level.color}`}>{level.title}</span>
                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">{level.desc}</span>
                                 </div>
                              </div>
                              <span className="text-xs font-black italic">{Math.round(progress)}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                              <div className={`h-full transition-all duration-1000 rounded-full ${isUnlocked ? 'bg-emerald-400' : 'bg-indigo-400'}`} style={{ width: `${progress}%` }}></div>
                           </div>
                           {level.special && isUnlocked && (
                             <div className="absolute -top-4 -right-2 rotate-12 bg-rose-600 text-white text-[6px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">Unlocked</div>
                           )}
                        </div>
                      )
                    })}
                 </div>
              </div>

              {/* Расширенная информация по уровням */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-6 shadow-sm mx-1">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Твой путь: Уровень «Да пошёл ты!»</h5>
                 <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed">
                   «25 лет — это жизнь. 50 лет — это целое состояние. 100 миллионов — это свобода сказать любому человеку на планете «Да пошёл ты!». Это дом, машина и капитал, который работает вечно».
                 </p>
                 <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center">
                    <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">До цели «Да пошёл ты!» осталось:</span>
                       <span className="text-xl font-black text-rose-600">{formatVal(Math.max(0, 100000000 - netWorth))}</span>
                    </div>
                    <i className="fa-solid fa-crown text-slate-200 text-3xl"></i>
                 </div>
              </div>

              {/* Настройки планирования */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-8 shadow-sm mx-1">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Моделирование</h5>
                  <div className="flex gap-2">
                     <button onClick={() => setShowCompound(false)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!showCompound ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>Запас</button>
                     <button onClick={() => setShowCompound(true)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showCompound ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>Рост</button>
                  </div>
                </div>

                {!showCompound ? (
                  <div className="space-y-6 animate-scale-up">
                    <div className="space-y-4">
                       <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 italic">
                          <span>Горизонт планирования</span>
                          <span className="text-indigo-600">{targetYears} лет</span>
                       </div>
                       <input type="range" min="1" max="100" step="1" value={targetYears} onChange={(e) => setTargetYears(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                       <span className="text-[9px] font-black text-slate-400 uppercase italic block mb-2">Накопить на срок:</span>
                       <div className="text-xl font-black italic text-slate-900">{formatVal(inflationAdjustedTotal)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-scale-up">
                    <div className="h-32 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={compoundData}>
                             <Tooltip content={<CustomTooltip />} />
                             <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} dot={false} />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                       <span className="text-[9px] font-black text-indigo-400 uppercase italic block mb-2">Через {targetYears} лет:</span>
                       <div className="text-2xl font-black text-indigo-900 italic">{formatVal(compoundData[compoundData.length - 1].balance)}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                   <div className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                         <span>Инфляция</span>
                         <span className="text-rose-500 italic">{Math.round(inflationRate * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="0.30" step="0.01" value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                         <span>Доход (%)</span>
                         <span className="text-emerald-500 italic">{Math.round(yieldRate * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="0.50" step="0.01" value={yieldRate} onChange={(e) => setYieldRate(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                   </div>
                </div>
              </div>

              {/* Кнопка AI Анализа */}
              <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[3.5rem] space-y-4 shadow-sm mx-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs shadow-lg"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-900 italic">Стратегия Роста</h5>
                </div>
                <p className="text-[11px] font-bold text-indigo-600 leading-relaxed italic relative z-10">{aiAdvice || "Нажми кнопку для анализа динамики и сокращения пути к Свободе."}</p>
                <button onClick={handleGetAdvice} disabled={loadingAdvice} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all relative z-10">
                  {loadingAdvice ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rocket"></i>} Рассчитать План Победы
                </button>
              </div>
           </div>
        )}

        {activeTab === 'debts' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 gap-3 px-1">
               <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100 text-center">
                  <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block mb-1 italic">Я должен</span>
                  <div className="text-xl font-black text-rose-700">{formatVal(iOweTotal)}</div>
               </div>
               <div className="p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-1 italic">Мне должны</span>
                  <div className="text-xl font-black text-emerald-700">{formatVal(theyOweTotal)}</div>
               </div>
            </div>
            <section className="space-y-3">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Все долги</h3>
               {debts.map(d => (
                 <div key={d.id} className={`p-6 bg-white border-l-4 rounded-[2rem] shadow-sm flex justify-between items-center mx-1 ${d.type === 'i_owe' ? 'border-rose-500' : 'border-emerald-500'}`}>
                    <div>
                       <h4 className="font-black text-slate-800 text-xs uppercase italic">{d.title}</h4>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Остаток: {formatVal(d.remaining_amount)}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.type === 'i_owe' ? 'bg-rose-50 text-rose-400' : 'bg-emerald-50 text-emerald-400'}`}><i className={`fa-solid ${d.type === 'i_owe' ? 'fa-triangle-exclamation' : 'fa-hand-holding-dollar'} text-xs`}></i></div>
                 </div>
               ))}
            </section>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 text-center shadow-inner mx-1">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1 italic">Месячные обязательства</span>
               <div className="text-4xl font-black text-indigo-900 italic">{formatVal(totalMonthlySubs)}</div>
            </div>
            <div className="space-y-3">
               {subscriptions.map(s => (
                 <div key={s.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex justify-between items-center shadow-sm mx-1">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-400"><i className="fa-solid fa-repeat text-xs"></i></div>
                       <div>
                          <span className="font-black text-slate-800 text-sm block italic uppercase">{s.title}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">{s.category}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="font-black text-indigo-600 italic block text-sm">{formatVal(s.amount)}</span>
                       <span className="text-[7px] font-black text-slate-300 uppercase italic">Месяц</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
