
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

  const categoryChips: {id: GoalCategory | 'all', label: string}[] = [
    { id: 'all', label: 'Все' },
    { id: 'finance', label: 'Капитал' },
    { id: 'sport', label: 'Тело' },
    { id: 'growth', label: 'Рост' },
    { id: 'work', label: 'Работа' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Цели</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твой вектор развития</p>
        </div>
        <button onClick={onAddGoal} className="w-14 h-14 bg-indigo-600 text-white rounded-[2rem] shadow-xl flex items-center justify-center active:scale-90 transition-all">
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </header>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-2">
        {categoryChips.map(chip => (
          <button 
            key={chip.id}
            onClick={() => setFilter(chip.id)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === chip.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400'}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="p-16 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
             <i className="fa-solid fa-bullseye text-4xl text-slate-200 mb-4"></i>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Тут пока пусто</p>
          </div>
        ) : filteredGoals.map(goal => {
          const totalValue = goal.logs ? goal.logs.reduce((acc, l) => acc + l.value, 0) : goal.current_value;
          const verifiedValue = goal.logs ? goal.logs.filter(l => l.is_verified).reduce((acc, l) => acc + l.value, 0) : goal.current_value;
          const totalPct = Math.min(100, (totalValue / (goal.target_value || 1)) * 100);
          const verifiedPct = Math.min(100, (verifiedValue / (goal.target_value || 1)) * 100);

          return (
            <div key={goal.id} onClick={() => onSelectGoal(goal)} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6 cursor-pointer hover:border-indigo-100 transition-all group relative overflow-hidden">
              {goal.is_shared && <div className="absolute top-0 right-10 bg-emerald-500 text-white text-[7px] font-black uppercase px-3 py-1 rounded-b-xl tracking-widest shadow-sm">Команда</div>}
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{goal.category} {goal.is_private && '🔒'}</span>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{goal.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter italic">
                    {Math.round(verifiedPct)}<span className="text-sm ml-0.5 font-bold text-slate-300">/ {Math.round(totalPct)}%</span>
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden relative">
                  <div style={{ width: `${totalPct}%` }} className="absolute inset-y-0 left-0 bg-indigo-100 transition-all duration-1000"></div>
                  <div style={{ width: `${verifiedPct}%` }} className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-1000"></div>
                </div>
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                   <span className="text-slate-400">Пруф: {verifiedValue} {goal.metric}</span>
                   <span className={`${totalValue > verifiedValue ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                     {totalValue > verifiedValue ? 'Нужна проверка' : 'Подтверждено'}
                   </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
