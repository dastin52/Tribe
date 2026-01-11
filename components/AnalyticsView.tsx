
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { YearGoal, AccountabilityPartner } from '../types';

interface AnalyticsViewProps {
  goals: YearGoal[];
  partners: AccountabilityPartner[];
  ikigaiData: any[];
  onTogglePrivacy: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ goals, partners, ikigaiData, onTogglePrivacy }) => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
       <header className="px-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Анализ</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твой Икигай и баланс жизни</p>
       </header>

       <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Жизненный баланс</span>
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

       <div className="p-8 bg-slate-900 rounded-[3.5rem] text-white space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-brain"></i>
             </div>
             <h4 className="text-[10px] font-black uppercase tracking-widest">ИИ Оценка достижений</h4>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
            "У тебя отличный фокус на финансах, но социальный сектор проседает. Твое Племя (Social) может дать больше энергии, если ты откроешь для них 2-3 цели для верификации."
          </p>
       </div>

       <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Контроль доступа</h3>
          <div className="space-y-3">
             {goals.map(goal => (
               <div key={goal.id} className="p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                     <h4 className="font-bold text-slate-800 text-sm leading-tight">{goal.title}</h4>
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
