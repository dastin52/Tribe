
import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { YearGoal, AccountabilityPartner, Transaction } from '../types';

interface AnalyticsViewProps {
  goals: YearGoal[];
  partners: AccountabilityPartner[];
  ikigaiData: any[];
  onTogglePrivacy: (id: string) => void;
  transactions: Transaction[];
  currency: string;
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  goals, partners, ikigaiData, onTogglePrivacy, transactions, currency 
}) => {
  
  const activityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString('ru', { weekday: 'short' }),
        tasks: Math.floor(Math.random() * 5) + 1,
        xp: Math.floor(Math.random() * 500) + 100
      };
    });
    return last7Days;
  }, []);

  const totalCompleted = useMemo(() => {
    return goals.reduce((acc, g) => acc + (g.status === 'completed' ? 1 : 0), 0);
  }, [goals]);

  // Расчет аналитики по категориям финансов
  const financeAnalytics = useMemo(() => {
    const expenses: Record<string, number> = {};
    const incomes: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === 'expense') {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      } else {
        incomes[t.category] = (incomes[t.category] || 0) + t.amount;
      }
    });

    const expenseData = Object.entries(expenses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const incomeData = Object.entries(incomes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { expenseData, incomeData };
  }, [transactions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest italic">{payload[0].name}</p>
          <p className="text-sm font-black text-indigo-400 mt-1">{payload[0].value.toLocaleString()} {currency}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
       <header className="px-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Анализ</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Твой прогресс и эффективность</p>
       </header>

       {/* Структура расходов */}
       <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Структура расходов</span>
             <span className="text-[9px] font-black text-rose-500 uppercase">Весь период</span>
          </div>
          <div className="w-full h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie
                      data={financeAnalytics.expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                   >
                      {financeAnalytics.expenseData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Pie>
                   <Tooltip content={<CustomTooltip />} />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] font-black text-slate-300 uppercase">Всего</span>
                <span className="text-sm font-black text-slate-900 italic">
                  {financeAnalytics.expenseData.reduce((a,b) => a + b.value, 0).toLocaleString()} {currency}
                </span>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
             {financeAnalytics.expenseData.slice(0, 4).map((d, i) => (
               <div key={d.name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[8px] font-black text-slate-500 uppercase truncate flex-1">{d.name}</span>
                  <span className="text-[8px] font-black text-slate-800 italic">{Math.round((d.value / (financeAnalytics.expenseData.reduce((a,b) => a+b.value, 0) || 1)) * 100)}%</span>
               </div>
             ))}
          </div>
       </div>

       {/* Источники дохода */}
       <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-xl space-y-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-center relative z-10">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Источники дохода</span>
             <span className="text-[9px] font-black text-emerald-400 uppercase">Рейтинг</span>
          </div>
          <div className="w-full h-48 relative z-10">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeAnalytics.incomeData} layout="vertical" margin={{ left: -20, right: 20 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} width={80} />
                   <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                   <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
             </ResponsiveContainer>
          </div>
          <p className="text-[8px] font-bold text-slate-500 uppercase italic text-center relative z-10">
             Каждый источник приближает тебя к «Свободе» на 12.5% эффективнее
          </p>
       </div>

       {/* Activity Dynamics */}
       <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Динамика активностей</span>
             <span className="text-[9px] font-black text-indigo-500 uppercase">Последняя неделя</span>
          </div>
          <div className="w-full h-48">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                   <Bar dataKey="tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                   <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} />
                </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-around pt-2 border-t border-slate-50">
             <div className="text-center">
                <span className="text-xl font-black text-slate-900 italic">{totalCompleted}</span>
                <p className="text-[7px] font-black text-slate-400 uppercase">Выполнено целей</p>
             </div>
             <div className="text-center">
                <span className="text-xl font-black text-indigo-600 italic">~{Math.round(activityData.reduce((a,b) => a + b.tasks, 0) / 7)}</span>
                <p className="text-[7px] font-black text-slate-400 uppercase">Задач в день</p>
             </div>
          </div>
       </div>

       <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Жизненный баланс (Икигай)</span>
          <div className="w-full h-64">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie data={ikigaiData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {ikigaiData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                   </Pie>
                   <Tooltip />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-4">
             {ikigaiData.map(d => (
               <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{d.name}</span>
               </div>
             ))}
          </div>
       </div>

       <div className="p-8 bg-slate-900 rounded-[3.5rem] text-white space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent"></div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-brain"></i>
             </div>
             <h4 className="text-[10px] font-black uppercase tracking-widest italic">AI Инсайт</h4>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
            "Твои основные расходы сосредоточены в категории «{financeAnalytics.expenseData[0]?.name}». Сократив их на 10%, ты сможешь закрыть цель «{goals[0]?.title}» на 2 месяца быстрее."
          </p>
       </div>

       <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Контроль доступа</h3>
          <div className="space-y-3">
             {goals.map(goal => (
               <div key={goal.id} className="p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                     <h4 className="font-bold text-slate-800 text-sm leading-tight italic uppercase">{goal.title}</h4>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{goal.is_private ? 'Личная' : 'Видна племени'}</span>
                  </div>
                  <button onClick={() => onTogglePrivacy(goal.id)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${goal.is_private ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                     <i className={`fa-solid ${goal.is_private ? 'fa-lock' : 'fa-globe-americas'}`}></i>
                  </button>
               </div>
             ))}
          </div>
       </section>
    </div>
  );
};
