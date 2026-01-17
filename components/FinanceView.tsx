
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { Transaction, Debt, Subscription, FinancialSnapshot, YearGoal } from '../types';
import { geminiService } from '../services/gemini';
// Fix: Import GoogleGenAI from @google/genai
import { GoogleGenAI } from "@google/genai";

const EXPENSE_CATEGORIES = ['Продукты', 'Транспорт', 'Жилье', 'Развлечения', 'Здоровье', 'Одежда', 'Связь', 'Подписки', 'Налоги', 'Другое'];

// Fix: Defined missing freedomLevels constant for the planning view
const freedomLevels = [
  { id: 'safety', title: 'Безопасность', target: 600000, desc: '6 месяцев жизни', icon: 'fa-shield-heart', color: 'text-blue-400' },
  { id: 'stability', title: 'Стабильность', target: 5000000, desc: 'Закрытые базы', icon: 'fa-building-columns', color: 'text-indigo-400' },
  { id: 'independence', title: 'Независимость', target: 25000000, desc: 'Доход покрывает жизнь', icon: 'fa-anchor', color: 'text-emerald-400' },
  { id: 'fuck-you', title: 'Да пошёл ты!', target: 100000000, desc: 'Полная свобода', icon: 'fa-crown', color: 'text-rose-400' },
];

interface BudgetCategory {
  name: string;
  percent: number;
  group: 'essential' | 'dreams' | 'invest';
  realCategory?: string;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  financials, transactions, debts, subscriptions, balanceVisible, setBalanceVisible, netWorth, balanceHistory, onAddTransaction, onAddDebt, onAddSubscription, goals 
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'debts' | 'subscriptions' | 'planning'>('operations');
  const [isAdding, setIsAdding] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [aiBudgetAdvice, setAiBudgetAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Состояние планировщика
  const [plannedIncome, setPlannedIncome] = useState(financials.monthly_income || 170000);
  const [budgetStructure, setBudgetStructure] = useState<BudgetCategory[]>([
    { name: 'Аренда/Ипотека', percent: 25, group: 'essential', realCategory: 'Жилье' },
    { name: 'Продукты', percent: 10, group: 'essential', realCategory: 'Продукты' },
    { name: 'Транспорт', percent: 3, group: 'essential', realCategory: 'Транспорт' },
    { name: 'Связь/Подписки', percent: 2, group: 'essential', realCategory: 'Связь' },
    { name: 'Покупки', percent: 15, group: 'dreams', realCategory: 'Одежда' },
    { name: 'Развлечения', percent: 15, group: 'dreams', realCategory: 'Развлечения' },
    { name: 'Подушка', percent: 20, group: 'invest' },
    { name: 'Фондовый рынок', percent: 10, group: 'invest' },
  ]);

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
    
    // Группировка трат по категориям для планировщика
    const categoryTotals: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.type === 'expense') {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    });

    const income = filtered.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    return { income, expense, categoryTotals };
  }, [transactions]);

  const formatVal = (val: number) => balanceVisible ? `${Math.round(val).toLocaleString()} ${financials.currency}` : `∗∗∗ ${financials.currency}`;

  const handleUpdatePercent = (index: number, val: string) => {
    const newBudget = [...budgetStructure];
    newBudget[index].percent = parseInt(val) || 0;
    setBudgetStructure(newBudget);
  };

  // Fix: Fixed GoogleGenAI initialization and text property access following @google/genai guidelines
  const handleOptimizeBudget = async () => {
    setLoadingAdvice(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const budgetContext = budgetStructure.map(b => `${b.name}: план ${b.percent}%, факт ${currentMonthStats.categoryTotals[b.realCategory || ''] || 0} руб`).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Проанализируй бюджет: Доход ${plannedIncome}. Структура: ${budgetContext}. 
        Найди перерасходы и скажи кратко (до 30 слов), как перенаправить деньги в Инвестиции, чтобы быстрее достичь целей.`,
      });
      // Fix: Access .text property directly (not a method)
      setAiBudgetAdvice(response.text);
    } catch (e) {
      setAiBudgetAdvice("Попробуйте сократить необязательные покупки и направить 5% дохода в подушку безопасности.");
    }
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
            {/* Карточка баланса */}
            <div className="bg-[#0f172a] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden mx-1">
               <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Общий капитал</span>
               <div className="text-5xl font-black tracking-tighter italic my-4 leading-none">{formatVal(netWorth)}</div>
               <div className={`h-24 w-full mt-4 -mx-4 ${balanceVisible ? '' : 'blur-md opacity-20'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={balanceHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/><stop offset="95%" stopColor="#818cf8" stopOpacity={0}/></linearGradient></defs>
                        <Tooltip />
                        <Area type="monotone" dataKey="balance" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* ПЛАНИРОВЩИК БЮДЖЕТА (Раскрывающийся) */}
            <div className="mx-1 overflow-hidden border border-slate-100 rounded-[2.5rem] bg-white shadow-sm transition-all">
              <button 
                onClick={() => setShowPlanner(!showPlanner)}
                className="w-full p-6 flex justify-between items-center group active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-calculator"></i>
                   </div>
                   <div className="text-left">
                      <h3 className="font-black text-xs uppercase italic text-slate-800">Планировщик 50/30/20</h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Контроль расходов по целям</p>
                   </div>
                </div>
                <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform duration-500 ${showPlanner ? 'rotate-180' : ''}`}></i>
              </button>

              {showPlanner && (
                <div className="px-6 pb-8 space-y-8 animate-fade-in">
                  <div className="p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex justify-between items-center">
                     <div>
                        <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Планируемый доход</span>
                        <input 
                          type="number" 
                          value={plannedIncome}
                          onChange={e => setPlannedIncome(parseInt(e.target.value) || 0)}
                          className="bg-transparent text-xl font-black text-indigo-900 outline-none w-32 border-b-2 border-indigo-200 focus:border-indigo-600 transition-colors"
                        />
                     </div>
                     <div className="text-right">
                        <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Распределено</span>
                        <span className="text-xl font-black text-indigo-900 italic">
                          {budgetStructure.reduce((acc, b) => acc + b.percent, 0)}%
                        </span>
                     </div>
                  </div>

                  {/* Группы бюджета */}
                  {(['essential', 'dreams', 'invest'] as const).map(group => (
                    <div key={group} className="space-y-3">
                       <h4 className={`text-[10px] font-black uppercase tracking-widest italic px-2 ${group === 'essential' ? 'text-amber-600' : group === 'dreams' ? 'text-rose-600' : 'text-emerald-600'}`}>
                         {group === 'essential' ? 'Обязательные расходы' : group === 'dreams' ? 'Желания и мечты' : 'Инвестиции и подушка'}
                       </h4>
                       <div className={`rounded-[2rem] overflow-hidden border ${group === 'essential' ? 'bg-amber-50/30 border-amber-100' : group === 'dreams' ? 'bg-rose-50/30 border-rose-100' : 'bg-emerald-50/30 border-emerald-100'}`}>
                          {budgetStructure.filter(b => b.group === group).map((item, idx) => {
                            const index = budgetStructure.findIndex(b => b.name === item.name);
                            const targetAmt = (plannedIncome * item.percent) / 100;
                            const realAmt = item.realCategory ? (currentMonthStats.categoryTotals[item.realCategory] || 0) : 0;
                            const isOverspent = realAmt > targetAmt;

                            return (
                              <div key={item.name} className="p-4 border-b last:border-0 border-white/50 flex items-center justify-between">
                                 <div className="flex-1">
                                    <span className="text-[9px] font-black text-slate-800 uppercase italic block">{item.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[8px] font-bold text-slate-400 uppercase italic">Факт: {realAmt.toLocaleString()} ₽</span>
                                       {isOverspent && <span className="text-[7px] font-black text-rose-500 bg-rose-50 px-1 rounded uppercase animate-pulse">Перерасход!</span>}
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                       <div className="flex items-center gap-1">
                                          <input 
                                            type="number" 
                                            value={item.percent}
                                            onChange={e => handleUpdatePercent(index, e.target.value)}
                                            className="w-10 text-right bg-transparent font-black text-xs outline-none"
                                          />
                                          <span className="text-[10px] font-black text-slate-300">%</span>
                                       </div>
                                       <span className="text-[8px] font-black text-slate-400">{targetAmt.toLocaleString()} ₽</span>
                                    </div>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                  ))}

                  {/* Кнопка ИИ Оптимизации */}
                  <div className="pt-2">
                     <button 
                       onClick={handleOptimizeBudget}
                       disabled={loadingAdvice}
                       className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                     >
                       {loadingAdvice ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i>}
                       Оптимизировать расходы
                     </button>
                     {aiBudgetAdvice && (
                        <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-3xl animate-scale-up relative">
                           <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-50 rotate-45 border-l border-t border-indigo-100"></div>
                           <p className="text-[11px] font-bold text-indigo-800 italic leading-relaxed">
                             "{aiBudgetAdvice}"
                           </p>
                        </div>
                     )}
                  </div>
                </div>
              )}
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
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Последние операции</h3>
              {transactions.slice(-8).reverse().map(tx => (
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
                    {freedomLevels.map((level) => {
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
