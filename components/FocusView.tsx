
import React, { useState, useEffect } from 'react';
import { SubGoal } from '../types';
import { geminiService } from '../services/gemini';

interface FocusViewProps {
  task: SubGoal | undefined;
  onExit: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ task, onExit }) => {
  const [mantra, setMantra] = useState('Фокусируйся на главном');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMantra = async () => {
      if (!task) return;
      const m = await geminiService.getFocusMantra(task.title);
      setMantra(m);
      setLoading(false);
    };
    fetchMantra();
  }, [task]);

  if (!task) return null;

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-fade-in select-none">
      {/* Background Breathing Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
         <div className="w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12 max-w-xs">
         <div className="space-y-4">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic opacity-60">Текущий фокус</span>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight drop-shadow-2xl">
              {task.title}
            </h1>
         </div>

         {/* Breathing Indicator */}
         <div className="w-32 h-32 relative flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
            <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-ping"></div>
            <div className="absolute w-2 h-2 bg-indigo-400 rounded-full"></div>
         </div>

         <div className="space-y-4 min-h-[60px]">
            {loading ? (
              <div className="flex gap-1 justify-center">
                 {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>)}
              </div>
            ) : (
              <p className="text-lg font-bold text-slate-400 italic leading-relaxed animate-fade-in">
                «{mantra}»
              </p>
            )}
         </div>

         <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-[2000ms]" 
              style={{ width: `${(task.current_value / task.target_value) * 100}%` }}
            ></div>
         </div>
      </div>

      <button 
        onClick={onExit}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-white/5 text-slate-500 hover:text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:bg-white/10 active:scale-95"
      >
         Выйти из потока
      </button>
    </div>
  );
};
