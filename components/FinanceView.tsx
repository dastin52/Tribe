
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
const INCOME_CATEGORIES = ['Зарплата', 'Бизнес', 'Бонус', 'Подарок', 'Инвестиции', 'Продажа', 'Другое'];
const DEBT_CATEGORIES = ['Банк', 'Кредитка', 'Друг', 'Рассрочка', 'Ипотека', 'Другое'];

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, setBalanceVisible, netWorth, balanceHistory, onAddTransaction, onAddDebt, onAddSubscription, goals 
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'debts' | 'subscriptions' | 'planning'>('operations');
  const [isAdding, setIsAdding] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  // Параметры для планирования
  const [targetYears, setTargetYears] = useState(10);
  const [inflationRate, setInflationRate] = useState(0.08); // 8% по умолчанию
  const [yieldRate, setYieldRate] = useState(0.12); // 12% доходность капитала по умолчанию
  const [showCompound, setShowCompound] = useState(false); // Переключатель на сложный процент
  const [showFormulaInfo, setShowFormulaInfo] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [debtType, setDebtType] = useState<'i_owe' | 'they_owe'>('i_owe');

  // Расчет средних расходов за последние полгода
  const averageMonthlyBurn = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const relevantExpenses = transactions.filter(t => 
      t.type === 'expense' && new Date(t.timestamp) >= sixMonthsAgo
    );
    
    // Сумма подписок (фиксированная)
    const subsTotal = subscriptions.reduce((acc, s) => acc + s.amount, 0);
    
    if (relevantExpenses.length === 0) return (financials.monthly_expenses || 0) + subsTotal;
    
    const totalExpenses = relevantExpenses.reduce((acc, t) => acc + t.amount, 0);
    // Делим на 6, чтобы получить среднее в месяц
    return (totalExpenses / 6) + subsTotal;
  }, [transactions, subscriptions, financials.monthly_expenses]);

  // Расчет показателей за текущий месяц
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

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const advice = await geminiService.getFinanceAdvice(transactions, goals);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  const handleAdd = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (activeTab === 'operations') onAddTransaction(numAmount, type, category, title);
    else if (activeTab === 'debts') onAddDebt({ title, total_amount: numAmount, remaining_amount: numAmount, type: debtType, category: 'other' });
    else if (activeTab === 'subscriptions') onAddSubscription({ title, amount: numAmount, period: 'monthly', category });
    setIsAdding(false);
  };

  const iOweTotal = useMemo(() => debts.filter(d => d.type === 'i_owe').reduce((acc, d) => acc + d.remaining_amount, 0), [debts]);
  const theyOweTotal = useMemo(() => debts.filter(d => d.type === 'they_owe').reduce((acc, d) => acc + d.remaining_amount, 0), [debts]);
  const totalMonthlySubs = useMemo(() => subscriptions.reduce((acc, s) => acc + s.amount, 0), [subscriptions]);

  // Расчет пассивного капитала: (Расход * 12) / Реальная Доходность (Доходность - Инфляция)
  const realYield = Math.max(0.01, yieldRate - inflationRate);
  const passiveCapitalGoal = (averageMonthlyBurn * 12) / realYield;
  
  // Расчет суммы на X лет (сколько нужно иметь сейчас, чтобы тратить столько-то лет с учетом инфляции)
  const inflationAdjustedTotal = useMemo(() => {
    let total = 0;
    let annualExpense = averageMonthlyBurn * 12;
    for (let i = 1; i <= targetYears; i++) {
      total += annualExpense * Math.pow(1 + inflationRate, i);
    }
    return total;
  }, [averageMonthlyBurn, targetYears, inflationRate]);

  // Данные для графика роста (сложный процент)
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
            {/* График и текущий баланс */}
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

            {/* Сводка за месяц */}
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

            {/* Список транзакций */}
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
           <div className="space-y-6 animate-fade-in">
              {/* Карточка финансовой независимости */}
              <div className="p-10 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden mx-1">
                 <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                 <div className="flex justify-between items-start mb-10">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 italic">Финансовая независимость</h4>
                    <button onClick={() => setShowFormulaInfo(showFormulaInfo === 'passive' ? null : 'passive')} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]"><i className="fa-solid fa-info"></i></button>
                 </div>
                 
                 <div className="space-y-8">
                    <div>
                       <div className="flex justify-between items-end mb-4">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">Твоя автономность</span>
                          <span className="text-5xl font-black italic text-emerald-400 tracking-tighter">{freedomIndex}%</span>
                       </div>
                       <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                          <div className="h-full bg-emerald-400 transition-all duration-1000 rounded-full" style={{ width: `${Math.min(100, freedomIndex)}%` }}></div>
                       </div>
                    </div>
                    
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                       <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 italic tracking-widest">Капитал для пассивного дохода</span>
                       <span className="text-2xl font-black block">{formatVal(passiveCapitalGoal)}</span>
                       <span className="text-[7px] font-black text-indigo-400/60 uppercase italic tracking-wider">
                          Базис: {formatVal(averageMonthlyBurn)} / мес
                       </span>
                    </div>

                    {showFormulaInfo === 'passive' && (
                       <div className="p-4 bg-indigo-900/50 rounded-2xl border border-indigo-400/20 text-[9px] font-medium leading-relaxed italic animate-fade-in">
                          Формула: (Средний годовой расход) / (Доходность - Инфляция). <br/>
                          Это сумма, которую ты можешь "положить под процент", и проценты будут полностью покрывать твою жизнь, не уменьшая основной капитал.
                       </div>
                    )}
                 </div>
              </div>

              {/* Интерактивные настройки планирования */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-8 shadow-sm mx-1">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Моделирование будущего</h5>
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
                       <span className="text-[9px] font-black text-slate-400 uppercase italic block mb-2">Нужно накопить на этот срок:</span>
                       <div className="text-xl font-black italic text-slate-900">{formatVal(inflationAdjustedTotal)}</div>
                       <p className="text-[8px] font-bold text-slate-400 mt-4 uppercase italic opacity-70 leading-tight">* Если ты решишь просто тратить капитал без работы, эта сумма покроет твои расходы на {targetYears} лет с учетом инфляции.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-scale-up">
                    <div className="h-32 w-full -mx-2">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={compoundData}>
                             <Tooltip content={<CustomTooltip />} />
                             <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} dot={false} />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                       <span className="text-[9px] font-black text-indigo-400 uppercase italic block mb-2">Капитал через {targetYears} лет:</span>
                       <div className="text-2xl font-black text-indigo-900 italic">{formatVal(compoundData[compoundData.length - 1].balance)}</div>
                       <div className="mt-4 flex justify-between items-center">
                          <p className="text-[8px] font-bold text-indigo-400 uppercase italic leading-tight">Расчет "Сложного Процента": <br/> Твой капитал работает на тебя.</p>
                          <button onClick={() => setShowFormulaInfo(showFormulaInfo === 'growth' ? null : 'growth')} className="w-5 h-5 rounded-full border border-indigo-200 flex items-center justify-center text-[8px] text-indigo-400"><i className="fa-solid fa-info"></i></button>
                       </div>
                       {showFormulaInfo === 'growth' && (
                         <div className="mt-4 p-3 bg-white rounded-xl border border-indigo-100 text-[8px] text-indigo-600 font-bold uppercase italic animate-fade-in leading-relaxed">
                            Рост = Капитал * (1 + Доходность)^Годы. <br/>
                            Это магия, при которой твои деньги сами создают новые деньги, если ты их не тратишь.
                         </div>
                       )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                   <div className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                         <span>Инфляция (РФ)</span>
                         <span className="text-rose-500 italic">{Math.round(inflationRate * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="0.30" step="0.01" value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                         <span>Доходность (%)</span>
                         <span className="text-emerald-500 italic">{Math.round(yieldRate * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="0.50" step="0.01" value={yieldRate} onChange={(e) => setYieldRate(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                   </div>
                </div>
              </div>

              {/* Анализ расходов за 6 месяцев */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-6 shadow-sm mx-1 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Средний расход (6 мес.)</h5>
                  <button onClick={() => setShowFormulaInfo(showFormulaInfo === 'average' ? null : 'average')} className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[8px] text-slate-400"><i className="fa-solid fa-info"></i></button>
                </div>
                
                {showFormulaInfo === 'average' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[9px] font-bold text-slate-500 uppercase italic animate-fade-in">
                    Мы взяли все твои траты за последние полгода и разделили их на 6. Это твоя реальная "стоимость жизни" в месяц.
                  </div>
                )}

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-tighter italic">Расходы + Подписки:</span>
                      <span className="text-xl font-black italic text-indigo-600">{formatVal(averageMonthlyBurn)}</span>
                   </div>
                   <div className="h-px bg-slate-50 my-2"></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-50 rounded-2xl">
                         <span className="text-[7px] font-black text-slate-300 uppercase block mb-1">За полгода</span>
                         <span className="text-xs font-black italic">{formatVal(averageMonthlyBurn * 6)}</span>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-2xl">
                         <span className="text-[7px] font-black text-slate-300 uppercase block mb-1">За год</span>
                         <span className="text-xs font-black italic">{formatVal(averageMonthlyBurn * 12)}</span>
                      </div>
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
