
import React, { useState, useMemo } from 'react';
import { YearGoal, GoalCategory } from '../types';

interface GoalsViewProps {
  goals: YearGoal[];
  onAddGoal: () => void;
  onSelectGoal: (g: YearGoal) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onAddGoal, onSelectGoal }) => {
  const [filter, setFilter] = useState<GoalCategory | 'all'>('all');

  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals;
    return goals.filter(g => g.category === filter);
  }, [goals, filter]);

  const getStatusBadge = (goal: YearGoal) => {
    if (goal.status === 'completed') return { label: 'ЗАВЕРШЕНО', color: 'bg-emerald-500 text-white' };
    const logs = goal.logs || [];
    const hasUnverified = logs.some(l => !l.is_verified);
    if (hasUnverified) return { label: 'НУЖЕН ПРУФ', color: 'bg-amber-500 text-white animate-pulse' };
    if (goal.current_value > 0) return { label: 'В РАБОТЕ', color: 'bg-indigo-500 text-white' };
    return { label: 'ТОЛЬКО СТАРТ', color: 'bg-slate-200 text-slate-500' };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Цели</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Твой вектор развития</p>
        </div>
        <button onClick={onAddGoal} className="w-14 h-14 bg-slate-900 text-white rounded-[2rem] shadow-xl flex items-center justify-center active:scale-90 transition-all">
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-2">
        {['all', 'finance', 'sport', 'growth', 'work'].map(id => (
          <button 
            key={id}
            onClick={() => setFilter(id as any)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}
          >
            {id === 'all' ? 'Все' : id === 'finance' ? 'Капитал' : id === 'sport' ? 'Тело' : id === 'growth' ? 'Рост' : 'Работа'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredGoals.map(goal => {
          const status = getStatusBadge(goal);
          const totalPct = Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100);
          const verifiedPct = Math.min(100, ((goal.logs?.filter(l => l.is_verified).reduce((a, b) => a + b.value, 0) || 0) / (goal.target_value || 1)) * 100);

          return (
            <div key={goal.id} onClick={() => onSelectGoal(goal)} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6 cursor-pointer hover:border-indigo-100 transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-10 text-[7px] font-black uppercase px-3 py-1 rounded-b-xl tracking-widest shadow-sm z-10 ${status.color}`}>
                {status.label}
              </div>
              
              <div className="flex justify-between items-start pt-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{goal.category}</span>
                    <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(s => (
                         <i key={s} className={`fa-solid fa-star text-[7px] ${s <= 4 ? 'text-amber-400' : 'text-slate-100'}`}></i>
                       ))}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{goal.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter italic">
                    {Math.round(totalPct)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden relative border border-slate-100/50">
                  <div style={{ width: `${totalPct}%` }} className="absolute inset-y-0 left-0 bg-indigo-100 transition-all duration-1000"></div>
                  <div style={{ width: `${verifiedPct}%` }} className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-1000"></div>
                </div>
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest italic opacity-70">
                   <span>Оценка племени: 4.2 / 5</span>
                   <span className="text-slate-400">Прогресс: {goal.current_value} {goal.metric}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
