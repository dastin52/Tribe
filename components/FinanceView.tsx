
import React, { useState, useMemo } from 'react';
import { Transaction, Debt, Subscription, FinancialSnapshot, DebtCategory, DebtDirection, YearGoal } from '../types';

interface FinanceViewProps {
  financials: FinancialSnapshot;
  transactions: Transaction[];
  debts: Debt[];
  subscriptions: Subscription[];
  balanceVisible: boolean;
  netWorth: number;
  balanceHistory: any[];
  onAddTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string, goal_id?: string) => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  goals: YearGoal[];
}

type FinanceTab = 'operations' | 'debts' | 'subscriptions' | 'planning';

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, netWorth, onAddTransaction, goals 
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('operations');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txNote, setTxNote] = useState('');

  const financeGoals = useMemo(() => goals.filter(g => g.category === 'finance' && g.status === 'active'), [goals]);

  const planningMetrics = useMemo(() => {
    const monthlySavings = financials.monthly_income - financials.monthly_expenses;
    return financeGoals.map(g => {
      const remaining = g.target_value - g.current_value;
      const monthsToReach = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity;
      return { ...g, monthsToReach };
    });
  }, [financeGoals, financials]);

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txCategory) return;
    onAddTransaction(Number(txAmount), txType, txCategory, txNote, selectedGoalId || undefined);
    setIsAdding(false);
    setTxAmount(''); setTxCategory(''); setTxNote(''); setSelectedGoalId('');
  };

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

      {activeTab === 'planning' && (
        <div className="space-y-6 px-1 animate-scale-up">
           <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Чистая дельта в месяц</span>
              <div className="text-3xl font-black text-indigo-900 italic mt-1">
                {(financials.monthly_income - financials.monthly_expenses).toLocaleString()} {financials.currency}
              </div>
           </div>
           
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Прогноз по целям</h3>
              {planningMetrics.map(g => (
                <div key={g.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex justify-between items-center">
                   <div className="max-w-[60%]">
                      <h4 className="font-black text-slate-800 text-sm uppercase italic truncate">{g.title}</h4>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Осталось: {(g.target_value - g.current_value).toLocaleString()} {financials.currency}
                      </p>
                   </div>
                   <div className="text-right">
                      <span className="text-2xl font-black text-indigo-600 italic">
                        {g.monthsToReach === Infinity ? '∞' : `${g.monthsToReach}м`}
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Operations view remains largely same but updated with consistency */}
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
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Последние движения</h3>
             {transactions.slice().reverse().map(t => (
               <div key={t.id} className="p-5 bg-white rounded-3xl border border-slate-50 shadow-sm flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        <i className={`fa-solid ${t.goal_id ? 'fa-bullseye' : t.type === 'income' ? 'fa-plus' : 'fa-minus'}`}></i>
                     </div>
                     <h4 className="font-bold text-slate-800 text-sm leading-tight">{t.category}</h4>
                  </div>
                  <span className={`font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                     {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {financials.currency}
                  </span>
               </div>
             ))}
          </div>
        </div>
      )}
      
      {isAdding && activeTab === 'operations' && (
        <form onSubmit={handleTxSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-emerald-100 shadow-xl space-y-6 mx-2 animate-scale-up">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button type="button" onClick={() => setTxType('expense')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Расход</button>
              <button type="button" onClick={() => setTxType('income')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Доход</button>
           </div>
           
           <div className="space-y-4">
              <input type="number" placeholder="0" className="w-full p-6 bg-slate-50 rounded-3xl text-4xl font-black text-center outline-none" value={txAmount} onChange={e => setTxAmount(e.target.value)} required />
              <input type="text" placeholder="Категория" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={txCategory} onChange={e => setTxCategory(e.target.value)} required />
              
              {txType === 'expense' && financeGoals.length > 0 && (
                <div className="space-y-3 pt-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Зачислить в цель?</label>
                   <select className="w-full p-5 bg-indigo-50 text-indigo-600 rounded-2xl font-bold outline-none border-none" value={selectedGoalId} onChange={e => setSelectedGoalId(e.target.value)}>
                     <option value="">Не привязывать</option>
                     {financeGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                   </select>
                </div>
              )}
           </div>
           <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs">Записать в Tribe</button>
        </form>
      )}
    </div>
  );
};
