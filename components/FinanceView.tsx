
import React, { useState, useMemo } from 'react';
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
  financials = { total_assets: 0, total_debts: 0, monthly_income: 0, monthly_expenses: 0, currency: '₽' }, 
  transactions = [], 
  debts = [], 
  subscriptions = [], 
  balanceVisible, 
  netWorth, 
  onAddTransaction, 
  onAddDebt, 
  onAddSubscription 
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
  const [inflationRate, setInflationRate] = useState(8.5);
  const [yieldRate, setYieldRate] = useState(10);

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
      category: 'digital',
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

  const quickCategories = txType === 'income' ? ['Зарплата', 'Фриланс', 'Подарок'] : ['Продукты', 'Транспорт', 'Дом'];

  const planningResults = useMemo(() => {
    const monthly = financials.monthly_expenses || 1;
    const annual = monthly * 12;
    const infl = inflationRate / 100;
    const yld = yieldRate / 100;
    const totalNeeded = annual * ((Math.pow(1 + infl, planYears) - 1) / (infl || 0.0001));
    const freedomCapital = annual / (yld || 0.0001);
    return { totalNeeded, freedomCapital, monthly };
  }, [financials.monthly_expenses, planYears, inflationRate, yieldRate]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твои ресурсы</p>
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

      {/* Tabs */}
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

      {/* Add Forms */}
      {isAdding && (
        <div className="animate-scale-up px-2">
          {activeTab === 'operations' && (
            <form onSubmit={handleTxSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-emerald-100 shadow-xl space-y-6">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button type="button" onClick={() => setTxType('expense')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Расход</button>
                  <button type="button" onClick={() => setTxType('income')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Доход</button>
               </div>
               <div className="space-y-4">
                  <input type="number" placeholder="Сумма" className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none focus:ring-2 focus:ring-emerald-500" value={txAmount} onChange={e => setTxAmount(e.target.value)} required />
                  <input type="text" placeholder="Категория" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={txCategory} onChange={e => setTxCategory(e.target.value)} required />
                  <div className="flex flex-wrap gap-2">
                     {quickCategories.map(cat => <button key={cat} type="button" onClick={() => setTxCategory(cat)} className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-[9px] font-black uppercase rounded-full border border-slate-100 text-slate-500">{cat}</button>)}
                  </div>
               </div>
               <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs">Записать</button>
            </form>
          )}

          {activeTab === 'debts' && (
            <form onSubmit={handleDebtSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-indigo-100 shadow-xl space-y-6">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button type="button" onClick={() => setDebtType('i_owe')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${debtType === 'i_owe' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Я должен</button>
                  <button type="button" onClick={() => setDebtType('they_owe')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${debtType === 'they_owe' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Мне должны</button>
               </div>
               <div className="space-y-4">
                  <input type="number" placeholder="Сумма" className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none" value={debtAmount} onChange={e => setDebtAmount(e.target.value)} required />
                  <input type="text" placeholder="Кто / Куда" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={debtTitle} onChange={e => setDebtTitle(e.target.value)} required />
               </div>
               <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs">Добавить долг</button>
            </form>
          )}

          {activeTab === 'subscriptions' && (
            <form onSubmit={handleSubSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-indigo-100 shadow-xl space-y-6">
               <div className="space-y-4">
                  <input type="number" placeholder="Сумма в месяц" className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none" value={subAmount} onChange={e => setSubAmount(e.target.value)} required />
                  <input type="text" placeholder="Название сервиса" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={subTitle} onChange={e => setSubTitle(e.target.value)} required />
                  <input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={subDate} onChange={e => setSubDate(e.target.value)} />
               </div>
               <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs">Добавить подписку</button>
            </form>
          )}
        </div>
      )}

      {/* Operations View */}
      {activeTab === 'operations' && !isAdding && (
        <div className="space-y-6 px-1">
          <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Чистый капитал</span>
            <div className="text-5xl font-black tracking-tighter italic my-2">
              {balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-emerald-400 text-2xl">{financials.currency}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
               <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Доходы</span>
                  <span className="text-lg font-black text-emerald-400">+{financials.monthly_income.toLocaleString()}</span>
               </div>
               <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Расходы</span>
                  <span className="text-lg font-black text-rose-400">-{financials.monthly_expenses.toLocaleString()}</span>
               </div>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Последние транзакции</h3>
             {transactions.length === 0 ? (
               <div className="p-12 text-center text-slate-300 font-black uppercase text-[10px]">Тут пусто</div>
             ) : (
               transactions.slice().reverse().map(t => (
                 <div key={t.id} className="p-5 bg-white rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          <i className={`fa-solid ${t.type === 'income' ? 'fa-plus' : 'fa-minus'}`}></i>
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm">{t.category}</h4>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(t.timestamp).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <span className={`font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                       {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {financials.currency}
                    </span>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {/* Debts View */}
      {activeTab === 'debts' && !isAdding && (
        <div className="space-y-6 px-1">
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2.5rem]">
                 <span className="text-[8px] font-black text-rose-400 uppercase block mb-1">Я должен</span>
                 <span className="text-xl font-black text-rose-600 tracking-tighter">{debts.filter(d => d.type === 'i_owe').reduce((acc, d) => acc + d.remaining_amount, 0).toLocaleString()} {financials.currency}</span>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2.5rem]">
                 <span className="text-[8px] font-black text-emerald-400 uppercase block mb-1">Мне должны</span>
                 <span className="text-xl font-black text-emerald-600 tracking-tighter">{debts.filter(d => d.type === 'they_owe').reduce((acc, d) => acc + d.remaining_amount, 0).toLocaleString()} {financials.currency}</span>
              </div>
           </div>
           
           <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Список обязательств</h3>
              {debts.length === 0 ? (
                <div className="p-12 text-center text-slate-300 font-black uppercase text-[10px]">Долгов нет</div>
              ) : (
                debts.map(d => (
                  <div key={d.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-xl ${d.type === 'i_owe' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           <i className={`fa-solid ${d.type === 'i_owe' ? 'fa-hand-holding-dollar' : 'fa-coins'}`}></i>
                        </div>
                        <div>
                           <h4 className="font-black text-slate-800 text-sm uppercase italic">{d.title}</h4>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.category === 'friend' ? 'Дружеский' : 'Банковский'}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className={`text-lg font-black tracking-tighter ${d.type === 'i_owe' ? 'text-rose-600' : 'text-emerald-600'}`}>
                           {d.remaining_amount.toLocaleString()} {financials.currency}
                        </div>
                        {d.due_date && <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">До {new Date(d.due_date).toLocaleDateString()}</span>}
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* Subscriptions View */}
      {activeTab === 'subscriptions' && !isAdding && (
        <div className="space-y-6 px-1">
           <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] block opacity-60">Месячные подписки</span>
              <div className="text-4xl font-black tracking-tighter italic mt-2">
                 {subscriptions.reduce((acc, s) => acc + s.amount, 0).toLocaleString()} <span className="text-lg opacity-60">{financials.currency}</span>
              </div>
           </div>

           <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Активные сервисы</h3>
              {subscriptions.length === 0 ? (
                <div className="p-12 text-center text-slate-300 font-black uppercase text-[10px]">Подписок нет</div>
              ) : (
                subscriptions.map(s => (
                  <div key={s.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600">
                           <i className="fa-solid fa-credit-card"></i>
                        </div>
                        <div>
                           <h4 className="font-black text-slate-800 text-sm uppercase italic">{s.title}</h4>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.period === 'monthly' ? 'Ежемесячно' : 'Ежегодно'}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-lg font-black tracking-tighter text-slate-900">{s.amount.toLocaleString()} {financials.currency}</span>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* Planning View */}
      {activeTab === 'planning' && (
        <section className="space-y-8 px-1">
           <div className="p-8 bg-slate-900 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 text-center space-y-4">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Срок: {planYears} лет</span>
                 <input type="range" min="1" max="50" value={planYears} onChange={(e) => setPlanYears(parseInt(e.target.value))} className="w-full accent-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-6 relative z-10">
                 <div className="space-y-3">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Инфляция: {inflationRate}%</span>
                    <input type="range" min="0" max="30" step="0.5" value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value))} className="w-full accent-rose-500" />
                 </div>
                 <div className="space-y-3">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Доходность: {yieldRate}%</span>
                    <input type="range" min="1" max="50" value={yieldRate} onChange={(e) => setYieldRate(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
              <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl space-y-4 relative overflow-hidden">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><i className="fa-solid fa-shield-halved"></i></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Подушка безопасности</h4>
                 </div>
                 <div className="text-4xl font-black tracking-tighter italic">
                    {Math.round(planningResults.totalNeeded).toLocaleString()} <span className="text-lg opacity-60">{financials.currency}</span>
                 </div>
              </div>
              <div className="p-8 bg-emerald-600 rounded-[3rem] text-white shadow-xl space-y-4 relative overflow-hidden">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><i className="fa-solid fa-crown"></i></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Капитал Свободы</h4>
                 </div>
                 <div className="text-4xl font-black tracking-tighter italic">
                    {Math.round(planningResults.freedomCapital).toLocaleString()} <span className="text-lg opacity-60">{financials.currency}</span>
                 </div>
              </div>
           </div>
        </section>
      )}
    </div>
  );
};
