
import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Transaction, Debt, Subscription, FinancialSnapshot } from '../types';

interface FinanceViewProps {
  financials: FinancialSnapshot;
  transactions: Transaction[];
  debts: Debt[];
  subscriptions: Subscription[];
  balanceVisible: boolean;
  netWorth: number;
  balanceHistory: any[];
  onAddTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, netWorth, balanceHistory, onAddTransaction
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txNote, setTxNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txCategory) return;
    onAddTransaction(Number(txAmount), txType, txCategory, txNote);
    setTxAmount('');
    setTxCategory('');
    setTxNote('');
    setIsAdding(false);
  };

  const quickCategories = txType === 'income' ? ['Зарплата', 'Фриланс', 'Подарок', 'Инвестиции'] : ['Продукты', 'Транспорт', 'Развлечения', 'Жилье', 'Здоровье'];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твоя финансовая свобода</p>
         </div>
         <button 
           onClick={() => setIsAdding(!isAdding)} 
           className={`w-14 h-14 rounded-[2rem] shadow-xl flex items-center justify-center transition-all active:scale-90 ${isAdding ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'}`}
         >
           <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-xl`}></i>
         </button>
      </header>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-8 bg-white rounded-[3rem] border-2 border-emerald-100 shadow-xl space-y-6 animate-scale-up">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                type="button" 
                onClick={() => setTxType('expense')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
              >
                Расход
              </button>
              <button 
                type="button" 
                onClick={() => setTxType('income')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                Доход
              </button>
           </div>

           <div className="space-y-4">
              <div className="relative">
                 <input 
                   type="number" 
                   placeholder="0.00"
                   className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all"
                   value={txAmount}
                   onChange={e => setTxAmount(e.target.value)}
                   required
                 />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">{financials.currency}</span>
              </div>

              <input 
                type="text" 
                placeholder="Категория"
                className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none border-none ring-2 ring-slate-100 focus:ring-emerald-500 transition-all"
                value={txCategory}
                onChange={e => setTxCategory(e.target.value)}
                required
              />

              <div className="flex flex-wrap gap-2">
                 {quickCategories.map(cat => (
                   <button 
                    key={cat} 
                    type="button" 
                    onClick={() => setTxCategory(cat)}
                    className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-[9px] font-black uppercase tracking-tighter rounded-full border border-slate-100 text-slate-500 transition-colors"
                   >
                     {cat}
                   </button>
                 ))}
              </div>

              <input 
                type="text" 
                placeholder="Заметка (необязательно)"
                className="w-full p-5 bg-slate-50 rounded-2xl font-medium text-slate-600 outline-none border-none ring-1 ring-slate-100 focus:ring-emerald-500 transition-all text-sm"
                value={txNote}
                onChange={e => setTxNote(e.target.value)}
              />
           </div>

           <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs active:scale-95 transition-all">
              Записать операцию
           </button>
        </form>
      )}

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

      <section className="space-y-4">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Последние транзакции</h3>
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

      {debts.length > 0 && (
        <section className="space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Долговые обязательства</h3>
           {debts.map(d => (
             <div key={d.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h4 className="font-bold text-slate-800">{d.title}</h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Осталось выплатить</span>
                   </div>
                   <span className="text-xl font-black text-slate-900 tracking-tighter">{d.remaining_amount.toLocaleString()} {financials.currency}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                   <div 
                      className="h-full bg-slate-900 transition-all" 
                      style={{ width: `${Math.max(0, Math.min(100, (1 - d.remaining_amount / d.total_amount) * 100))}%` }}
                   ></div>
                </div>
             </div>
           ))}
        </section>
      )}
    </div>
  );
};
