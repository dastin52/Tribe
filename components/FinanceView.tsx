
import React, { useState, useMemo } from 'react';
import { Transaction, Debt, Subscription, FinancialSnapshot, YearGoal } from '../types';

interface FinanceViewProps {
  financials: FinancialSnapshot;
  transactions: Transaction[];
  debts: Debt[];
  subscriptions: Subscription[];
  balanceVisible: boolean;
  netWorth: number;
  onAddTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string, goal_id?: string) => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  goals: YearGoal[];
}

type FinanceTab = 'operations' | 'debts' | 'subscriptions' | 'planning';

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, netWorth, onAddTransaction, onAddDebt, onAddSubscription, goals 
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('operations');
  const [isAdding, setIsAdding] = useState(false);
  
  // Forms
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');

  const financeGoals = useMemo(() => goals.filter(g => g.category === 'finance' && g.status === 'active'), [goals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    if (activeTab === 'operations') {
      onAddTransaction(Number(amount), txType, category, '', selectedGoalId);
    } else if (activeTab === 'debts') {
      onAddDebt({ title, total_amount: Number(amount), remaining_amount: Number(amount), type: 'i_owe', category: 'bank' });
    } else if (activeTab === 'subscriptions') {
      onAddSubscription({ title, amount: Number(amount), period: 'monthly', category });
    }
    
    setIsAdding(false);
    setAmount(''); setTitle(''); setCategory(''); setSelectedGoalId('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твои ресурсы</p>
         </div>
         {activeTab !== 'planning' && (
           <button onClick={() => setIsAdding(!isAdding)} className={`w-14 h-14 rounded-[2rem] shadow-xl flex items-center justify-center transition-all ${isAdding ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
             <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-xl`}></i>
           </button>
         )}
      </header>

      <div className="flex bg-slate-100 p-1 rounded-[2rem] mx-2">
         {(['operations', 'debts', 'subscriptions', 'planning'] as const).map(tab => (
           <button key={tab} onClick={() => { setActiveTab(tab); setIsAdding(false); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
             {tab === 'operations' ? 'Операции' : tab === 'debts' ? 'Долги' : tab === 'subscriptions' ? 'Подписки' : 'План'}
           </button>
         ))}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl space-y-6 mx-2 animate-scale-up">
           <h3 className="text-center font-black uppercase tracking-widest text-[10px]">Новая запись: {activeTab}</h3>
           <input type="number" placeholder="Сумма" className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none" value={amount} onChange={e => setAmount(e.target.value)} required />
           <input type="text" placeholder={activeTab === 'operations' ? 'Категория' : 'Название'} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={activeTab === 'operations' ? category : title} onChange={e => activeTab === 'operations' ? setCategory(e.target.value) : setTitle(e.target.value)} required />
           
           {activeTab === 'operations' && (
             <select className="w-full p-5 bg-indigo-50 text-indigo-600 rounded-2xl font-bold outline-none border-none" value={selectedGoalId} onChange={e => setSelectedGoalId(e.target.value)}>
               <option value="">Без привязки к цели</option>
               {financeGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
             </select>
           )}
           <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase tracking-widest text-xs">Сохранить</button>
        </form>
      ) : (
        <div className="space-y-6 px-1">
           {activeTab === 'operations' && (
             <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Чистый капитал</span>
                <div className="text-5xl font-black tracking-tighter italic my-2">{balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-emerald-400 text-2xl">{financials.currency}</span></div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                   <div className="p-4 bg-white/5 rounded-3xl border border-white/10"><span className="text-[8px] font-black text-slate-500 block mb-1 uppercase">Доходы</span><span className="text-lg font-black text-emerald-400">+{financials.monthly_income.toLocaleString()}</span></div>
                   <div className="p-4 bg-white/5 rounded-3xl border border-white/10"><span className="text-[8px] font-black text-slate-500 block mb-1 uppercase">Расходы</span><span className="text-lg font-black text-rose-400">-{financials.monthly_expenses.toLocaleString()}</span></div>
                </div>
             </div>
           )}

           {activeTab === 'debts' && debts.map(d => (
             <div key={d.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex justify-between items-center">
                <div>
                   <h4 className="font-black text-slate-800 text-sm italic uppercase">{d.title}</h4>
                   <p className="text-[10px] font-bold text-slate-400 mt-1">Осталось: {d.remaining_amount.toLocaleString()} {financials.currency}</p>
                </div>
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><i className="fa-solid fa-hand-holding-dollar"></i></div>
             </div>
           ))}

           {activeTab === 'subscriptions' && subscriptions.map(s => (
             <div key={s.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex justify-between items-center">
                <div><h4 className="font-black text-slate-800 text-sm italic uppercase">{s.title}</h4><p className="text-[10px] font-bold text-indigo-500 mt-1">{s.amount.toLocaleString()} {financials.currency} / мес</p></div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xs"><i className="fa-solid fa-sync-alt"></i></div>
             </div>
           ))}

           {activeTab === 'planning' && (
             <div className="p-8 bg-indigo-900 rounded-[3rem] text-white shadow-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Анализ стратегии</h4>
                <p className="mt-4 font-bold italic leading-relaxed text-sm">При текущих расходах ты сможешь достичь цели "Капитал Свободы" через 14 месяцев. Сокращение подписок на 15% ускорит этот путь на 2 месяца.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};
