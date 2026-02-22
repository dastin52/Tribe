
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Transaction, Debt, Subscription, FinancialSnapshot, YearGoal } from '../types';
import { GoogleGenAI } from "@google/genai";
import { alphaVantageService } from '../services/alphaVantage';

const EXPENSE_CATEGORIES = ['Продукты', 'Транспорт', 'Жилье', 'Развлечения', 'Здоровье', 'Одежда', 'Связь', 'Подписки', 'Налоги', 'Спорт', 'Путешествия', 'Другое'];
const DEBT_CATEGORIES = ['bank', 'card', 'friend', 'other'];
const DEBT_LABELS: Record<string, string> = { bank: 'Банк', card: 'Кредитка', friend: 'Друг/Знакомый', other: 'Другое' };

const freedomLevels = [
  { id: 'safety', title: 'Подушка', target: 500000, desc: '6 мес. безопасности', icon: 'fa-shield-heart', color: 'text-blue-400' },
  { id: 'stability', title: 'Стабильность', target: 3000000, desc: 'Базовый капитал', icon: 'fa-building-columns', color: 'text-indigo-400' },
  { id: 'independence', title: 'Независимость', target: 35000000, desc: 'Пассивный доход 150к/мес', icon: 'fa-anchor', color: 'text-emerald-400' },
  { id: 'abundance', title: 'Изобилие', target: 100000000, desc: 'Полная свобода (F*ck you money)', icon: 'fa-crown', color: 'text-rose-400' },
];

interface BudgetCategory {
  name: string;
  percent: number;
  group: 'essential' | 'dreams' | 'invest';
  realCategory?: string;
}

interface FinanceViewProps {
  financials: FinancialSnapshot;
  transactions: Transaction[];
  debts: Debt[];
  subscriptions: Subscription[];
  balanceVisible: boolean;
  setBalanceVisible: (v: boolean) => void;
  netWorth: number;
  balanceHistory: any[];
  onAddTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string) => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  goals: YearGoal[];
}

const CustomChartTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl animate-fade-in">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{label}</p>
        <p className="text-sm font-black text-white italic">
          {Math.round(payload[0].value).toLocaleString()} {currency}
        </p>
      </div>
    );
  }
  return null;
};

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, setBalanceVisible, netWorth, balanceHistory, onAddTransaction, onAddDebt, onAddSubscription, goals 
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'debts' | 'subscriptions' | 'planning' | 'advice'>('operations');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    title: '',
    category: EXPENSE_CATEGORIES[0],
    debtCategory: DEBT_CATEGORIES[0] as any,
    type: 'expense' as 'income' | 'expense',
    debtType: 'i_owe' as 'i_owe' | 'they_owe',
    period: 'monthly' as 'monthly' | 'yearly',
    dueDate: ''
  });

  const iOweTotal = useMemo(() => debts.filter(d => d.type === 'i_owe').reduce((acc, d) => acc + d.remaining_amount, 0), [debts]);
  const theyOweTotal = useMemo(() => debts.filter(d => d.type === 'they_owe').reduce((acc, d) => acc + d.remaining_amount, 0), [debts]);
  const totalMonthlySubs = useMemo(() => subscriptions.reduce((acc, s) => acc + (s.period === 'monthly' ? s.amount : s.amount / 12), 0), [subscriptions]);

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

  const formatVal = (val: number) => balanceVisible ? `${Math.round(val).toLocaleString()} ₽` : `∗∗∗ ₽`;

  const submitAdd = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (activeTab === 'operations') {
      onAddTransaction(amount, formData.type, formData.category);
    } else if (activeTab === 'debts') {
      onAddDebt({
        title: formData.title || (formData.debtType === 'i_owe' ? 'Мой долг' : 'Долг мне'),
        total_amount: amount,
        remaining_amount: amount,
        type: formData.debtType,
        category: formData.debtCategory,
        due_date: formData.dueDate || undefined
      });
    } else if (activeTab === 'subscriptions') {
      onAddSubscription({
        title: formData.title || 'Подписка',
        amount: amount,
        period: formData.period,
        category: formData.category
      });
    }
    setIsAdding(false);
    setFormData({ 
      amount: '', title: '', category: EXPENSE_CATEGORIES[0], debtCategory: DEBT_CATEGORIES[0],
      type: 'expense', debtType: 'i_owe', period: 'monthly', dueDate: ''
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Твой финансовый радар</p>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setBalanceVisible(!balanceVisible)} className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-colors ${balanceVisible ? 'text-indigo-600' : 'text-slate-300'}`}><i className={`fa-solid ${balanceVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i></button>
            <button onClick={() => setIsAdding(!isAdding)} className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all ${isAdding ? 'bg-slate-900 text-white rotate-45' : 'bg-indigo-600 text-white'}`}>
                <i className="fa-solid fa-plus text-lg"></i>
            </button>
         </div>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-[2rem] mx-2 overflow-x-auto no-scrollbar">
         {['operations', 'debts', 'subscriptions', 'planning', 'advice'].map((id) => (
           <button key={id} onClick={() => { setActiveTab(id as any); setIsAdding(false); }} className={`flex-1 py-3 px-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
             {id === 'operations' ? 'Операции' : id === 'debts' ? 'Долги' : id === 'subscriptions' ? 'Подписки' : id === 'planning' ? 'Свобода' : 'Советы'}
           </button>
         ))}
      </div>

      <div className="px-1 space-y-6">
        {isAdding && (
          <div className="mx-1 p-8 bg-white border-2 border-indigo-100 rounded-[2.5rem] shadow-xl animate-scale-up space-y-6">
             <h3 className="text-xl font-black text-slate-900 italic uppercase">
               {activeTab === 'operations' ? 'Новая операция' : activeTab === 'debts' ? 'Добавить долг' : 'Новая подписка'}
             </h3>
             <div className="space-y-4">
                {(activeTab === 'debts' || activeTab === 'subscriptions') && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Название</label>
                    <input type="text" placeholder="..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                )}
                {activeTab === 'operations' && (
                   <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                      <button onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}>Расход</button>
                      <button onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400'}`}>Доход</button>
                   </div>
                )}
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Сумма</label>
                   <input type="number" placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl outline-none border-2 border-transparent focus:border-indigo-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <button onClick={submitAdd} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4">Сохранить</button>
             </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#0f172a] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden mx-1">
               <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Общий капитал</span>
               <div className="text-5xl font-black tracking-tighter italic my-4 leading-none">{formatVal(netWorth)}</div>
               <div className="flex justify-between mt-6 pt-6 border-t border-white/5">
                  <div>
                     <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Доходы за мес</span>
                     <span className="text-lg font-black italic">{formatVal(currentMonthStats.income)}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block mb-1">Расходы за мес</span>
                     <span className="text-lg font-black italic">{formatVal(currentMonthStats.expense)}</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 italic">История операций</h4>
               <div className="space-y-3">
                  {transactions.slice().reverse().map(t => (
                    <div key={t.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm mx-1">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                             <i className={`fa-solid ${t.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'} text-xs`}></i>
                          </div>
                          <div>
                             <h5 className="font-bold text-slate-800 text-xs italic uppercase">{t.category}</h5>
                             <span className="text-[8px] font-black text-slate-300 uppercase italic">{new Date(t.timestamp).toLocaleDateString('ru')}</span>
                          </div>
                       </div>
                       <span className={`font-black italic text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₽</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'debts' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-3 mx-1">
                 <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100">
                    <span className="text-[8px] font-black text-rose-500 uppercase italic">Я должен</span>
                    <div className="text-xl font-black text-rose-900 italic mt-1">{formatVal(iOweTotal)}</div>
                 </div>
                 <div className="p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                    <span className="text-[8px] font-black text-emerald-500 uppercase italic">Мне должны</span>
                    <div className="text-xl font-black text-emerald-900 italic mt-1">{formatVal(theyOweTotal)}</div>
                 </div>
              </div>
              <div className="space-y-3">
                 {debts.map(d => (
                   <div key={d.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mx-1 space-y-4">
                      <div className="flex justify-between items-start">
                         <div>
                            <h5 className="font-black text-slate-800 text-sm uppercase italic">{d.title}</h5>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{DEBT_LABELS[d.category]}</span>
                         </div>
                         <div className="text-right">
                            <span className={`text-xs font-black italic ${d.type === 'i_owe' ? 'text-rose-500' : 'text-emerald-500'}`}>
                               {formatVal(d.remaining_amount)}
                            </span>
                         </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                         <div className={`h-full ${d.type === 'i_owe' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${(1 - d.remaining_amount / d.total_amount) * 100}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'subscriptions' && (
           <div className="space-y-6 animate-fade-in">
              <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl mx-1 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                 <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] italic">Подписки / мес</span>
                 <div className="text-4xl font-black italic mt-2">{formatVal(totalMonthlySubs)}</div>
              </div>
              <div className="space-y-3">
                 {subscriptions.map(s => (
                   <div key={s.id} className="p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mx-1 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                            <i className="fa-solid fa-repeat text-xs"></i>
                         </div>
                         <div>
                            <h5 className="font-black text-slate-800 text-xs uppercase italic">{s.title}</h5>
                            <span className="text-[8px] font-black text-slate-400 uppercase italic">{s.period === 'monthly' ? 'Ежемесячно' : 'Ежегодно'}</span>
                         </div>
                      </div>
                      <span className="font-black italic text-sm">{s.amount.toLocaleString()} ₽</span>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'planning' && (
           <div className="space-y-8 animate-fade-in">
              <div className="p-10 bg-gradient-to-br from-[#020617] to-[#1e1b4b] rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden mx-1">
                 <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 italic mb-10">Прогресс к Свободе</h4>
                 <div className="space-y-10">
                    {freedomLevels.map((level) => {
                      const remaining = level.target - netWorth;
                      const isUnlocked = remaining <= 0;
                      const progress = Math.min(100, (netWorth / level.target) * 100);
                      return (
                        <div key={level.id} className={`relative transition-all duration-500 ${!isUnlocked && 'opacity-70 grayscale-[0.5]'}`}>
                           <div className="flex justify-between items-end mb-3">
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isUnlocked ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/5 text-white/20 border border-white/5'}`}>
                                    <i className={`fa-solid ${level.icon} text-sm`}></i>
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <span className={`text-[11px] font-black uppercase tracking-widest block italic ${level.color}`}>{level.title}</span>
                                       {isUnlocked && <i className="fa-solid fa-check-circle text-emerald-400 text-[10px]"></i>}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{level.desc}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className="text-xs font-black italic block">{isUnlocked ? '100%' : `${Math.round(progress)}%`}</span>
                                 <span className="text-[7px] font-black uppercase text-slate-500 tracking-tighter italic">Цель: {level.target.toLocaleString()} ₽</span>
                              </div>
                           </div>
                           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5 mb-2">
                              <div className={`h-full transition-all duration-[1500ms] rounded-full ${isUnlocked ? 'bg-emerald-400' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`} style={{ width: `${progress}%` }}></div>
                           </div>
                           <div className="flex justify-between items-center px-1">
                              <span className="text-[8px] font-black uppercase italic text-slate-500">
                                 {isUnlocked ? 'СТАТУС: РАЗБЛОКИРОВАНО' : 'СТАТУС: В ПРОЦЕССЕ'}
                              </span>
                              {!isUnlocked && (
                                <span className="text-[9px] font-black text-rose-400 italic">
                                   Осталось: <span className="text-white">{(level.target - netWorth).toLocaleString()}</span> ₽
                                </span>
                              )}
                           </div>
                        </div>
                      )
                    })}
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 space-y-6 shadow-sm mx-1 relative overflow-hidden">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Твой путь: Уровень «F*ck you money»</h5>
                 <p className="text-[12px] font-bold text-slate-600 italic leading-relaxed">
                   «35 миллионов — это независимость. 100 миллионов — это свобода сказать любому человеку на планете «Пошёл ты!». Это капитал, который работает вечно».
                 </p>
                 <div className="p-6 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex justify-between items-center shadow-lg">
                    <div>
                       <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1 italic">До полной свободы осталось:</span>
                       <span className="text-2xl font-black text-white italic">
                         {netWorth >= 100000000 ? 'ЦЕЛЬ ДОСТИГНУТА!' : `${(100000000 - netWorth).toLocaleString()} ₽`}
                       </span>
                    </div>
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <i className="fa-solid fa-crown"></i>
                    </div>
                 </div>
              </div>
           </div>
        )}
        {activeTab === 'advice' && (
          <AdviceSection />
        )}
      </div>
    </div>
  );
};

const AdviceSection: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState('SPY');
  const [amount, setAmount] = useState('1000');
  const [years, setYears] = useState(10);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assets = [
    { symbol: 'SPY', name: 'S&P 500' },
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'GLD', name: 'Gold' },
    { symbol: 'BTCUSD', name: 'Bitcoin' },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const quote = await alphaVantageService.getGlobalQuote(selectedAsset);
      const history = await alphaVantageService.getHistoricalData(selectedAsset);
      
      if (!quote && !history.length) {
        setError('Не удалось загрузить данные. Возможно, превышен лимит API (5 запросов в минуту).');
      } else {
        setCurrentQuote(quote);
        setHistoricalData(history);
      }
    } catch (err) {
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const calculation = useMemo(() => {
    if (!historicalData.length || !amount) return null;
    
    const initialAmount = parseFloat(amount);
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() - years);
    
    // Find closest historical point
    const startPoint = historicalData.find(d => new Date(d.date) >= targetDate) || historicalData[0];
    const endPoint = historicalData[historicalData.length - 1];
    
    if (!startPoint || !endPoint) return null;

    const shares = initialAmount / startPoint.close;
    const finalValue = shares * endPoint.close;
    const profit = finalValue - initialAmount;
    const returnPercent = (profit / initialAmount) * 100;

    // Bank deposit comparison (assuming 8% annual compound interest)
    const bankRate = 0.08;
    const bankFinalValue = initialAmount * Math.pow(1 + bankRate, years);
    const bankProfit = bankFinalValue - initialAmount;

    return {
      initialAmount,
      finalValue,
      profit,
      returnPercent,
      bankFinalValue,
      bankProfit,
      startDate: startPoint.date,
      startPrice: startPoint.close,
      endPrice: endPoint.close
    };
  }, [historicalData, amount, years]);

  return (
    <div className="space-y-6 animate-fade-in px-1">
      <div className="p-8 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 italic mb-4">Финансовый калькулятор «Что если?»</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase italic">Актив</label>
              <select 
                value={selectedAsset} 
                onChange={e => setSelectedAsset(e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              >
                {assets.map(a => <option key={a.symbol} value={a.symbol} className="bg-slate-900">{a.name} ({a.symbol})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase italic">Срок (лет)</label>
              <select 
                value={years} 
                onChange={e => setYears(parseInt(e.target.value))}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              >
                {[5, 10, 20, 30].map(y => <option key={y} value={y} className="bg-slate-900">{y} лет</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-500 uppercase italic">Сумма вложения ($)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              placeholder="1000"
            />
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-calculator"></i>}
            {loading ? 'Загрузка...' : 'Рассчитать'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-bold italic text-center">
          {error}
        </div>
      )}

      {calculation && (
        <div className="space-y-4 animate-scale-up">
          <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase italic mb-1">Результат через {years} лет</h5>
                <div className="text-3xl font-black text-slate-900 italic">${Math.round(calculation.finalValue).toLocaleString()}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black italic ${calculation.profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {calculation.profit >= 0 ? '+' : ''}{Math.round(calculation.returnPercent)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[8px] font-black text-slate-400 uppercase italic block mb-1">Инвестиция в {selectedAsset}</span>
                <span className="text-sm font-black text-slate-900 italic">+${Math.round(calculation.profit).toLocaleString()}</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl">
                <span className="text-[8px] font-black text-indigo-400 uppercase italic block mb-1">Вклад в банке (8%)</span>
                <span className="text-sm font-black text-indigo-900 italic">+${Math.round(calculation.bankProfit).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-white">
              <p className="text-[9px] font-bold italic leading-relaxed opacity-80">
                {calculation.profit > calculation.bankProfit 
                  ? `Инвестиция в ${selectedAsset} принесла бы на $${Math.round(calculation.profit - calculation.bankProfit).toLocaleString()} больше, чем обычный вклад.`
                  : `В данном случае банковский вклад оказался бы выгоднее на $${Math.round(calculation.bankProfit - calculation.profit).toLocaleString()}.`}
              </p>
            </div>
          </div>

          {currentQuote && (
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-chart-line text-xs"></i>
                </div>
                <div>
                  <h5 className="font-black text-slate-800 text-xs uppercase italic">{currentQuote.symbol}</h5>
                  <span className="text-[8px] font-black text-slate-400 uppercase italic">Текущая цена</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black italic text-sm">${currentQuote.price}</div>
                <div className={`text-[8px] font-black italic ${currentQuote.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {currentQuote.changePercent}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!calculation && !loading && !error && (
        <div className="p-10 text-center space-y-4 opacity-40">
          <i className="fa-solid fa-lightbulb text-4xl text-indigo-600"></i>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Выберите актив и срок, чтобы увидеть <br/> магию сложного процента
          </p>
        </div>
      )}
    </div>
  );
};
