
import React, { useState, useMemo } from 'react';
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
  onAddTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string, goal_id?: string) => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  goals: YearGoal[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, setBalanceVisible, netWorth, onAddTransaction, onAddDebt, onAddSubscription, goals 
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'debts' | 'subscriptions' | 'planning'>('operations');
  const [isAdding, setIsAdding] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  // Form States
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Прочее');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [debtType, setDebtType] = useState<'i_owe' | 'they_owe'>('i_owe');

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const advice = await geminiService.getFinanceAdvice(transactions, goals);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  const handleAdd = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (activeTab === 'operations') {
      onAddTransaction(numAmount, type, category, title);
    } else if (activeTab === 'debts') {
      onAddDebt({ title, total_amount: numAmount, remaining_amount: numAmount, type: debtType, category: 'other' as any });
    } else if (activeTab === 'subscriptions') {
      onAddSubscription({ title, amount: numAmount, period: 'monthly', category });
    }
    
    setAmount('');
    setTitle('');
    setIsAdding(false);
  };

  const iOwe = useMemo(() => debts.filter(d => d.type === 'i_owe'), [debts]);
  const theyOwe = useMemo(() => debts.filter(d => d.type === 'they_owe'), [debts]);
  const totalMonthlySubs = useMemo(() => subscriptions.reduce((acc, s) => acc + s.amount, 0), [subscriptions]);

  const monthlyBurn = (financials.monthly_expenses || 0) + totalMonthlySubs;
  // Свобода: капитал покрывает 150 месяцев жизни (примерно 12 лет)
  const freedomTarget = monthlyBurn * 150 || 1000000;
  const freedomIndex = Math.round((netWorth / freedomTarget) * 100);

  const formatVal = (val: number) => balanceVisible ? `${val.toLocaleString()} ${financials.currency}` : `∗∗∗ ${financials.currency}`;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Капитал</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твоя финансовая база</p>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setBalanceVisible(!balanceVisible)}
              className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-colors ${balanceVisible ? 'text-indigo-600' : 'text-slate-300'}`}
            >
               <i className={`fa-solid ${balanceVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </button>
            {activeTab !== 'planning' && (
              <button 
                onClick={() => setIsAdding(!isAdding)} 
                className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all ${isAdding ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}
              >
                <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-lg`}></i>
              </button>
            )}
         </div>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-[2rem] mx-2">
         {['operations', 'debts', 'subscriptions', 'planning'].map((tab: any) => (
           <button 
             key={tab} 
             onClick={() => { setActiveTab(tab); setIsAdding(false); }} 
             className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
           >
             {tab === 'operations' ? 'Операции' : tab === 'debts' ? 'Долги' : tab === 'subscriptions' ? 'Подписки' : 'Свобода'}
           </button>
         ))}
      </div>

      <div className="px-1 space-y-6">
        {isAdding && (
          <div className="p-8 bg-white rounded-[3rem] border-2 border-indigo-100 shadow-xl space-y-4 animate-scale-up">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Новая запись</h3>
            <div className="flex gap-2">
              <input 
                type="number" placeholder="Сумма" 
                className="flex-1 p-5 bg-slate-50 rounded-2xl font-black text-xl outline-none" 
                value={amount} onChange={e => setAmount(e.target.value)} 
              />
              {activeTab === 'operations' && (
                <button onClick={() => setType(type === 'income' ? 'expense' : 'income')} className={`px-6 rounded-2xl font-black text-[10px] uppercase ${type === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {type === 'income' ? 'Доход' : 'Расход'}
                </button>
              )}
            </div>
            <input 
              type="text" placeholder="Заголовок (например: Зарплата, Netflix)" 
              className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" 
              value={title} onChange={e => setTitle(e.target.value)} 
            />
            {activeTab === 'debts' && (
              <div className="flex gap-2">
                <button onClick={() => setDebtType('i_owe')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest ${debtType === 'i_owe' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>Я должен</button>
                <button onClick={() => setDebtType('they_owe')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest ${debtType === 'they_owe' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>Мне должны</button>
              </div>
            )}
            <button onClick={handleAdd} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Добавить в систему</button>
          </div>
        )}

        {activeTab === 'operations' && !isAdding && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Чистый капитал</span>
               <div className="text-5xl font-black tracking-tighter italic my-2">
                 {balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-emerald-400 text-2xl">{financials.currency}</span>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                    <span className="text-[8px] font-black text-slate-500 block mb-1 uppercase tracking-widest">Доходы</span>
                    <span className="text-lg font-black text-emerald-400">{balanceVisible ? `+${financials.monthly_income.toLocaleString()}` : '∗∗∗'}</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                    <span className="text-[8px] font-black text-slate-500 block mb-1 uppercase tracking-widest">Расходы</span>
                    <span className="text-lg font-black text-rose-400">{balanceVisible ? `-${financials.monthly_expenses.toLocaleString()}` : '∗∗∗'}</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">История операций</h3>
              {transactions.length === 0 ? (
                 <p className="text-center p-10 text-[10px] font-black text-slate-300 uppercase italic">Операций пока нет</p>
              ) : transactions.slice(-10).reverse().map(tx => (
                <div key={tx.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex justify-between items-center shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         <i className={`fa-solid ${tx.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs`}></i>
                      </div>
                      <div>
                         <span className="font-bold text-slate-800 text-sm block">{tx.note || tx.category}</span>
                         <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(tx.timestamp).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <span className={`font-black italic ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {balanceVisible ? `${tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}` : '∗∗∗'}
                   </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'debts' && !isAdding && (
          <div className="space-y-8">
            <section className="space-y-3">
               <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-4 italic">Я должен (Пассивы)</h3>
               {iOwe.length === 0 ? (
                 <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center">
                    <p className="text-[9px] font-black text-emerald-600 uppercase">Чист перед племенем!</p>
                 </div>
               ) : iOwe.map(d => (
                 <div key={d.id} className="p-6 bg-white border-l-4 border-rose-500 rounded-3xl shadow-sm flex justify-between items-center">
                    <div>
                       <h4 className="font-black text-slate-800 text-xs uppercase">{d.title}</h4>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Осталось: {formatVal(d.remaining_amount)}</p>
                    </div>
                    <i className="fa-solid fa-triangle-exclamation text-rose-200"></i>
                 </div>
               ))}
            </section>

            <section className="space-y-3">
               <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-4 italic">Мне должны (Активы)</h3>
               {theyOwe.length === 0 ? (
                 <p className="text-center p-6 text-[9px] font-black text-slate-300 uppercase">Пока никто не должен</p>
               ) : theyOwe.map(d => (
                 <div key={d.id} className="p-6 bg-white border-l-4 border-emerald-500 rounded-3xl shadow-sm flex justify-between items-center">
                    <div>
                       <h4 className="font-black text-slate-800 text-xs uppercase">{d.title}</h4>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Вернут: {formatVal(d.remaining_amount)}</p>
                    </div>
                    <i className="fa-solid fa-hand-holding-dollar text-emerald-200"></i>
                 </div>
               ))}
            </section>
          </div>
        )}

        {activeTab === 'subscriptions' && !isAdding && (
          <div className="space-y-6">
            <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 text-center shadow-inner">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Месячная нагрузка</span>
               <div className="text-4xl font-black text-indigo-900 italic">
                 {formatVal(totalMonthlySubs)}
               </div>
            </div>
            
            <div className="space-y-3">
               <div className="flex justify-between items-center px-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Активные подписки</h3>
               </div>
               {subscriptions.length === 0 ? (
                 <p className="text-center p-10 text-[10px] font-black text-slate-300 uppercase italic">Подписок нет</p>
               ) : subscriptions.map(s => (
                 <div key={s.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-400">
                          <i className="fa-solid fa-repeat text-xs"></i>
                       </div>
                       <div>
                          <span className="font-black text-slate-800 text-sm block">{s.title}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{s.category}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="font-black text-indigo-600 italic block text-sm">{formatVal(s.amount)}</span>
                       <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Ежемесячно</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
           <div className="space-y-6">
              <div className="p-10 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6">Компас Свободы 1.0</h4>
                 
                 <div className="space-y-8">
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Прогресс к Свободе</span>
                          <span className="text-3xl font-black italic text-emerald-400">{freedomIndex}%</span>
                       </div>
                       <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, freedomIndex)}%` }}></div>
                       </div>
                       <p className="text-[8px] font-bold text-slate-500 uppercase mt-3 italic leading-relaxed">
                         Твоя цель: капитал, покрывающий расходы на 150 месяцев вперед.
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                          <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Точка Свободы</span>
                          <span className="text-sm font-black">{balanceVisible ? freedomTarget.toLocaleString() : '∗∗∗'} {financials.currency}</span>
                       </div>
                       <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                          <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Расход в мес.</span>
                          <span className="text-sm font-black text-rose-400">{balanceVisible ? monthlyBurn.toLocaleString() : '∗∗∗'} {financials.currency}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[3rem] space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-900">AI Финансовый Коуч</h5>
                </div>
                <p className="text-[11px] font-bold text-indigo-600 leading-relaxed italic">
                  {aiAdvice || "Для анализа твоей стратегии роста и сокращения 'сгорания' капитала мне нужно обработать данные. Нажми кнопку."}
                </p>
                <button 
                  onClick={handleGetAdvice} 
                  disabled={loadingAdvice}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  {loadingAdvice ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rocket"></i>}
                  Сгенерировать План Победы
                </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
