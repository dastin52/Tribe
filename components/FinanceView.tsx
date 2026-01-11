
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Transaction, Debt, Subscription, FinancialSnapshot, DebtCategory, DebtDirection } from '../types';

interface FinanceViewProps {
  financials: FinancialSnapshot;
  transactions: Transaction[];
  debts: Debt[];
  subscriptions: Subscription[];
  balanceVisible: boolean;
  netWorth: number;
  balanceHistory: any[];
  onAddTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string) => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
}

type FinanceTab = 'operations' | 'debts' | 'subscriptions' | 'planning';

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, netWorth, balanceHistory, onAddTransaction, onAddDebt, onAddSubscription
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('operations');
  const [isAdding, setIsAdding] = useState(false);

  // Forms states
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txNote, setTxNote] = useState('');

  const [debtType, setDebtType] = useState<DebtDirection>('i_owe');
  const [debtCat, setDebtCat] = useState<DebtCategory>('friend');
  const [debtTitle, setDebtTitle] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState('');

  const [subTitle, setSubTitle] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDate, setSubDate] = useState('');

  // Planning state
  const [planYears, setPlanYears] = useState(1);
  const INFLATION_RATE = 0.085; // 8.5% средняя инфляция
  const PASSIVE_YIELD = 0.10; // 10% ожидаемая доходность капитала

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txCategory) return;
    onAddTransaction(Number(txAmount), txType, txCategory, txNote);
    resetForm();
  };

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtAmount || !debtTitle) return;
    onAddDebt({
      title: debtTitle,
      total_amount: Number(debtAmount),
      remaining_amount: Number(debtAmount),
      type: debtType,
      category: debtCat,
      due_date: debtDate
    });
    resetForm();
  };

  const handleSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subAmount || !subTitle) return;
    onAddSubscription({
      title: subTitle,
      amount: Number(subAmount),
      period: 'monthly',
      category: 'general',
      next_billing_date: subDate
    });
    resetForm();
  };

  const resetForm = () => {
    setTxAmount(''); setTxCategory(''); setTxNote('');
    setDebtAmount(''); setDebtTitle(''); setDebtDate('');
    setSubAmount(''); setSubTitle(''); setSubDate('');
    setIsAdding(false);
  };

  const quickCategories = txType === 'income' ? ['Зарплата', 'Фриланс', 'Подарок', 'Инвестиции'] : ['Продукты', 'Транспорт', 'Развлечения', 'Жилье', 'Здоровье'];

  // Planning calculations
  const planningResults = useMemo(() => {
    const monthly = financials.monthly_expenses || 1;
    const annual = monthly * 12;
    
    // Сумма на период с учетом инфляции (FV of an annuity)
    // Formula: P * ((1+r)^n - 1) / r
    const totalNeeded = annual * ((Math.pow(1 + INFLATION_RATE, planYears) - 1) / INFLATION_RATE);
    
    // Капитал для пассивного дохода: Годовые расходы / Доходность
    const freedomCapital = annual / PASSIVE_YIELD;

    return {
      totalNeeded,
      freedomCapital,
      monthly
    };
  }, [financials.monthly_expenses, planYears]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твоя финансовая свобода</p>
         </div>
         {activeTab !== 'planning' && (
           <button 
             onClick={() => setIsAdding(!isAdding)} 
             className={`w-14 h-14 rounded-[2rem] shadow-xl flex items-center justify-center transition-all active:scale-90 ${isAdding ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}
           >
             <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-xl`}></i>
           </button>
         )}
      </header>

      {/* Internal Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-[2rem] mx-2">
         {(['operations', 'debts', 'subscriptions', 'planning'] as const).map(tab => (
           <button 
             key={tab}
             onClick={() => { setActiveTab(tab); setIsAdding(false); }}
             className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
           >
             {tab === 'operations' ? 'Операции' : tab === 'debts' ? 'Долги' : tab === 'subscriptions' ? 'Подписки' : 'План'}
           </button>
         ))}
      </div>

      {isAdding && activeTab === 'operations' && (
        <form onSubmit={handleTxSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-emerald-100 shadow-xl space-y-6 animate-scale-up">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button type="button" onClick={() => setTxType('expense')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Расход</button>
              <button type="button" onClick={() => setTxType('income')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Доход</button>
           </div>
           <div className="space-y-4">
              <div className="relative">
                 <input type="number" placeholder="0.00" className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" value={txAmount} onChange={e => setTxAmount(e.target.value)} required />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">{financials.currency}</span>
              </div>
              <input type="text" placeholder="Категория" className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border-none ring-2 ring-slate-100 focus:ring-emerald-500 transition-all" value={txCategory} onChange={e => setTxCategory(e.target.value)} required />
              <div className="flex flex-wrap gap-2">
                 {quickCategories.map(cat => <button key={cat} type="button" onClick={() => setTxCategory(cat)} className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-[9px] font-black uppercase tracking-tighter rounded-full border border-slate-100 text-slate-500 transition-colors">{cat}</button>)}
              </div>
              <input type="text" placeholder="Заметка" className="w-full p-5 bg-slate-50 rounded-2xl font-medium text-slate-600 outline-none border-none ring-1 ring-slate-100 focus:ring-emerald-500 transition-all text-sm" value={txNote} onChange={e => setTxNote(e.target.value)} />
           </div>
           <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-lg uppercase tracking-widest text-xs active:scale-95">Записать операцию</button>
        </form>
      )}

      {isAdding && activeTab === 'debts' && (
        <form onSubmit={handleDebtSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-indigo-100 shadow-xl space-y-6 animate-scale-up">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button type="button" onClick={() => setDebtType('i_owe')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${debtType === 'i_owe' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Я должен</button>
              <button type="button" onClick={() => setDebtType('they_owe')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${debtType === 'they_owe' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Мне должны</button>
           </div>
           <div className="space-y-4">
              <div className="relative">
                 <input type="number" placeholder="0.00" className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all" value={debtAmount} onChange={e => setDebtAmount(e.target.value)} required />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">{financials.currency}</span>
              </div>
              <input type="text" placeholder="Кто / Организация" className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all" value={debtTitle} onChange={e => setDebtTitle(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                 {(['bank', 'card', 'friend', 'other'] as DebtCategory[]).map(cat => (
                   <button key={cat} type="button" onClick={() => setDebtCat(cat)} className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${debtCat === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}>
                     {cat === 'bank' ? 'Банк' : cat === 'card' ? 'Карта' : cat === 'friend' ? 'Друг' : 'Инoе'}
                   </button>
                 ))}
              </div>
              <input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all" value={debtDate} onChange={e => setDebtDate(e.target.value)} />
           </div>
           <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-lg uppercase tracking-widest text-xs active:scale-95">Добавить долг</button>
        </form>
      )}

      {isAdding && activeTab === 'subscriptions' && (
        <form onSubmit={handleSubSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-violet-100 shadow-xl space-y-6 animate-scale-up">
           <div className="space-y-4">
              <div className="relative">
                 <input type="number" placeholder="0.00" className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none ring-2 ring-transparent focus:ring-violet-500 transition-all" value={subAmount} onChange={e => setSubAmount(e.target.value)} required />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">{financials.currency}</span>
              </div>
              <input type="text" placeholder="Сервис (Netflix, Telegram, и т.д.)" className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-violet-500 transition-all" value={subTitle} onChange={e => setSubTitle(e.target.value)} required />
              <input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-violet-500 transition-all" value={subDate} onChange={e => setSubDate(e.target.value)} />
           </div>
           <button type="submit" className="w-full py-5 bg-violet-600 text-white font-black rounded-3xl shadow-lg uppercase tracking-widest text-xs active:scale-95">Добавить подписку</button>
        </form>
      )}

      {activeTab === 'operations' && (
        <>
          <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            <div className="space-y-1 mb-8 relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Чистые активы</span>
              <div className="text-5xl font-black tracking-tighter italic">
                {balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-emerald-400 text-2xl">{financials.currency}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
               <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Доходы (мес)</span>
                  <span className="text-lg font-black text-emerald-400">+{financials.monthly_income.toLocaleString()} {financials.currency}</span>
               </div>
               <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Расходы (мес)</span>
                  <span className="text-lg font-black text-rose-400">-{financials.monthly_expenses.toLocaleString()} {financials.currency}</span>
               </div>
            </div>
          </div>

          <section className="space-y-4 px-1">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">История операций</h3>
             <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Операций пока нет</div>
                ) : (
                  transactions.slice().reverse().map(t => (
                    <div key={t.id} className="p-5 bg-white rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center group active:scale-98 transition-transform">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             <i className={`fa-solid ${t.type === 'income' ? 'fa-plus' : 'fa-minus'}`}></i>
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800 text-sm leading-tight">{t.category}</h4>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(t.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className={`font-black tracking-tighter block ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                             {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {financials.currency}
                          </span>
                          {t.note && <span className="text-[9px] text-slate-400 font-medium italic">{t.note}</span>}
                       </div>
                    </div>
                  ))
                )}
             </div>
          </section>
        </>
      )}

      {activeTab === 'debts' && (
        <section className="space-y-6 px-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Учет долгов</h3>
           <div className="space-y-4">
              {debts.length === 0 ? (
                <div className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Долгов нет. Свобода!</div>
              ) : (
                debts.map(d => (
                  <div key={d.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                     <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${d.type === 'i_owe' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              <i className={`fa-solid ${d.type === 'i_owe' ? 'fa-arrow-right-from-bracket' : 'fa-arrow-right-to-bracket'}`}></i>
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 leading-tight">{d.title}</h4>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {d.category === 'bank' ? 'Банковский кредит' : d.category === 'card' ? 'Кредитная карта' : d.category === 'friend' ? 'Личный долг' : 'Прочее'}
                              </span>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Остаток</span>
                           <span className="text-xl font-black text-slate-900 tracking-tighter">{d.remaining_amount.toLocaleString()} {financials.currency}</span>
                        </div>
                     </div>
                     <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div 
                           className={`h-full transition-all duration-1000 ${d.type === 'i_owe' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                           style={{ width: `${Math.max(5, (d.remaining_amount / d.total_amount) * 100)}%` }}
                        ></div>
                     </div>
                     {d.due_date && (
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                           <i className="fa-solid fa-clock"></i>
                           <span>Крайний срок: {new Date(d.due_date).toLocaleDateString()}</span>
                        </div>
                     )}
                  </div>
                ))
              )}
           </div>
        </section>
      )}

      {activeTab === 'subscriptions' && (
        <section className="space-y-6 px-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Твои подписки</h3>
           <div className="grid grid-cols-1 gap-3">
              {subscriptions.length === 0 ? (
                <div className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Подписок не обнаружено</div>
              ) : (
                subscriptions.map(s => (
                  <div key={s.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center group active:scale-95 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center text-xl">
                           <i className="fa-solid fa-repeat"></i>
                        </div>
                        <div>
                           <h4 className="font-black text-slate-800 leading-tight">{s.title}</h4>
                           <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">
                             Списание {s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString([], { day: '2-digit', month: 'short' }) : '—'}
                           </span>
                        </div>
                     </div>
                     <span className="text-xl font-black text-slate-900 tracking-tighter">
                       {s.amount.toLocaleString()} <span className="text-xs">{financials.currency}</span>
                     </span>
                  </div>
                ))
              )}
           </div>
           {subscriptions.length > 0 && (
             <div className="p-8 bg-violet-50 rounded-[3rem] border border-violet-100 text-center space-y-2">
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block">Итого в месяц</span>
                <span className="text-3xl font-black text-violet-600 tracking-tighter">
                  {subscriptions.reduce((acc, s) => acc + (s.period === 'monthly' ? s.amount : s.amount / 12), 0).toLocaleString()} {financials.currency}
                </span>
             </div>
           )}
        </section>
      )}

      {activeTab === 'planning' && (
        <section className="space-y-8 px-1 animate-fade-in">
           <div className="p-8 bg-slate-900 rounded-[3.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[50px]"></div>
              <div className="relative z-10 text-center space-y-4">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Горизонт планирования</span>
                 <div className="text-5xl font-black tracking-tighter text-amber-400 italic">
                    {planYears < 1 ? '6 мес' : planYears === 1 ? '1 год' : `${planYears} лет`}
                 </div>
                 <input 
                   type="range" 
                   min="0.5" 
                   max="100" 
                   step="0.5" 
                   value={planYears} 
                   onChange={(e) => setPlanYears(parseFloat(e.target.value))}
                   className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    <span>6 месяцев</span>
                    <span>100 лет</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
              <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                       <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Запас прочности</h4>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-tight font-medium">Сумма для жизни на {planYears < 1 ? '6 мес' : `${planYears} лет`} с учетом ежегодной инфляции 8.5%:</p>
                 <div className="text-3xl font-black text-slate-900 tracking-tighter">
                    {Math.round(planningResults.totalNeeded).toLocaleString()} <span className="text-lg text-slate-400">{financials.currency}</span>
                 </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] text-white shadow-xl space-y-4 relative overflow-hidden">
                 <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mb-10 -mr-10"></div>
                 <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                       <i className="fa-solid fa-crown text-amber-300"></i>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Финансовая свобода</h4>
                 </div>
                 <p className="text-[10px] text-emerald-50/70 leading-tight font-medium relative z-10">
                    Капитал, который при доходности 10% годовых будет пожизненно приносить вам текущие {planningResults.monthly.toLocaleString()} {financials.currency}/мес:
                 </p>
                 <div className="text-4xl font-black tracking-tighter relative z-10 italic">
                    {Math.round(planningResults.freedomCapital).toLocaleString()} <span className="text-xl opacity-60 font-bold">{financials.currency}</span>
                 </div>
                 <div className="pt-2">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest">Цель №1: Ранняя пенсия</span>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                Расчет основан на ваших средних расходах: {planningResults.monthly.toLocaleString()} {financials.currency}/мес. <br/>
                Инфляция: 8.5% | Доходность: 10%
              </p>
           </div>
        </section>
      )}
    </div>
  );
};
