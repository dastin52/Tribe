
import React, { useState } from 'react';
import { Value } from '../types';

interface ValueCardProps {
  value: Value;
}

export const ValueCard: React.FC<ValueCardProps> = ({ value }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityColors = [
    'bg-slate-100 text-slate-500',
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-orange-100 text-orange-600',
    'bg-rose-100 text-rose-600',
  ];

  const barColors = [
    'bg-slate-400',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-rose-500',
  ];

  const progress = (value.priority / 5) * 100;

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className="p-6 rounded-[2.5rem] border border-slate-100 bg-white hover:border-indigo-100 transition-all shadow-sm space-y-4 group cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-black text-slate-800 uppercase italic text-sm group-hover:text-indigo-600 transition-colors tracking-tight">
          {value.title}
        </h3>
        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider italic ${priorityColors[value.priority - 1] || priorityColors[0]}`}>
          Приоритет {value.priority}
        </span>
      </div>
      
      <p className={`text-[11px] font-medium text-slate-500 italic leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
        {value.description}
      </p>
      
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center px-1">
          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest italic">Значимость</span>
          <span className="text-[7px] font-black text-slate-400 italic">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden relative border border-slate-100/50">
          <div 
            style={{ width: `${progress}%` }} 
            className={`absolute inset-y-0 left-0 transition-all duration-1000 rounded-full ${barColors[value.priority - 1] || barColors[0]}`}
          ></div>
        </div>
      </div>
    </div>
  );
};
