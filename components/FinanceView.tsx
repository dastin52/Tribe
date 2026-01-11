
import React, { useState, useMemo } from 'react';
import { Transaction, Debt, Subscription, FinancialSnapshot, YearGoal } from '../types';
import { geminiService } from '../services/gemini';

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

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, netWorth, onAddTransaction, onAddDebt, onAddSubscription, goals 
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'debts' | 'subscriptions' | 'planning'>('operations');
  const [isAdding, setIsAdding] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твои ресурсы</p>
         </div>
         {activeTab !== 'planning' && (
           <button onClick={() => setIsAdding(!isAdding)} className={`w-14 h-14 rounded-[2rem] shadow-xl flex items-center justify-center transition-all ${isAdding ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
             <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-xl`}></i>
           </button>
         )}
      </header>

      <div className="flex bg-slate-100 p-1 rounded-[2rem] mx-2">
         {['operations', 'debts', 'subscriptions', 'planning'].map((tab: any) => (
           <button key={tab} onClick={() => { setActiveTab(tab); setIsAdding(false); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
             {tab === 'operations' ? 'Операции' : tab === 'debts' ? 'Долги' : tab === 'subscriptions' ? 'Подписки' : 'План'}
           </button>
         ))}
      </div>

      <div className="px-1">
         {activeTab === 'planning' && (
           <div className="space-y-6">
              <div className="p-8 bg-indigo-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">AI Анализ стратегии</h4>
                <p className="mt-4 font-bold italic leading-relaxed text-sm">
                  {aiAdvice || 'Нажми кнопку ниже, чтобы ИИ проанализировал твои финансы относительно целей.'}
                </p>
                <button 
                  onClick={handleGetAdvice}
                  disabled={loadingAdvice}
                  className="mt-6 w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  {loadingAdvice ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                  Спросить совета
                </button>
              </div>
           </div>
         )}
         
         {activeTab === 'operations' && !isAdding && (
           <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Чистый капитал</span>
              <div className="text-5xl font-black tracking-tighter italic my-2">{balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-emerald-400 text-2xl">{financials.currency}</span></div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="p-4 bg-white/5 rounded-3xl border border-white/10"><span className="text-[8px] font-black text-slate-500 block mb-1 uppercase">Доходы</span><span className="text-lg font-black text-emerald-400">+{financials.monthly_income.toLocaleString()}</span></div>
                 <div className="p-4 bg-white/5 rounded-3xl border border-white/10"><span className="text-[8px] font-black text-slate-500 block mb-1 uppercase">Расходы</span><span className="text-lg font-black text-rose-400">-{financials.monthly_expenses.toLocaleString()}</span></div>
              </div>
           </div>
         )}

         {/* Добавьте здесь списки транзакций, долгов и подписок аналогично предыдущим версиям */}
      </div>
    </div>
  );
};
