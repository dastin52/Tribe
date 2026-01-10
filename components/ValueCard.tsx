
import React from 'react';
import { Value } from '../types';

interface ValueCardProps {
  value: Value;
}

export const ValueCard: React.FC<ValueCardProps> = ({ value }) => {
  const priorityColors = [
    'bg-slate-100 text-slate-500',
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-orange-100 text-orange-600',
    'bg-rose-100 text-rose-600',
  ];

  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-800">{value.title}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${priorityColors[value.priority - 1]}`}>
          Приоритет {value.priority}
        </span>
      </div>
      <p className="text-sm text-slate-500 line-clamp-2">{value.description}</p>
    </div>
  );
};
