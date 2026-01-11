
import React from 'react';
import { YearGoal } from '../types';

interface GoalsViewProps {
  goals: YearGoal[];
  onAddGoal: () => void;
  onSelectGoal: (g: YearGoal) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onAddGoal, onSelectGoal }) => {
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
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} onClick={() => onSelectGoal(goal)} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6 cursor-pointer hover:border-indigo-100 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{goal.category} {goal.is_private && '🔒'}</span>
                <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{goal.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 tracking-tighter italic">
                  {Math.round((goal.current_value / (goal.target_value || 1)) * 100)}<span className="text-sm ml-0.5 font-bold">%</span>
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
              <div style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }} className="h-full bg-indigo-600 transition-all duration-1000"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
