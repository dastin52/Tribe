
import React, { useState, useEffect, useMemo } from 'react';
import { User, SubGoal, YearGoal, AppView, GoalPhase } from '../types';
import { geminiService } from '../services/gemini';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine, Tooltip } from 'recharts';

const PHASE_CONFIG: Record<GoalPhase, { label: string, color: string, icon: string }> = {
  acceleration: { label: 'РАЗГОН', color: 'text-amber-500', icon: 'fa-rocket' },
  work: { label: 'РАБОТА', color: 'text-indigo-500', icon: 'fa-gears' },
  fatigue: { label: 'УСТАЛОСТЬ', color: 'text-rose-500', icon: 'fa-battery-quarter' },
  pause: { label: 'ПАУЗА', color: 'text-slate-400', icon: 'fa-pause' },
  finish: { label: 'ФИНИШ', color: 'text-emerald-500', icon: 'fa-flag-checkered' }
};

interface DashboardViewProps {
  user: User;
  todayTasks: SubGoal[];
  goals: YearGoal[];
  onSetView: (view: AppView) => void;
  onEnterFocus: (taskId: string) => void;
  onCompleteMOS: (goalId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, todayTasks, goals, onSetView, onEnterFocus, onCompleteMOS 
}) => {
  const [briefing, setBriefing] = useState<string>('Настраиваю навигатор...');
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const mainGoal = activeGoals[0];

  useEffect(() => {
    const fetchBriefing = async () => {
      if (mainGoal) {
        const text = await geminiService.getMOSAdvice(mainGoal, 'Норма');
        setBriefing(text || 'Готов к новым свершениям!');
      }
    };
    fetchBriefing();
  }, [mainGoal]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg overflow-hidden border-2 border-white">
               {user.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user"></i>}
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 leading-none italic uppercase">{user.name}</h2>
               <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">LVL {user.level}</span>
            </div>
         </div>
         <button onClick={() => onSetView(AppView.SOCIAL)} className="bg-slate-900 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl active:scale-95 transition-all">
            <i className="fa-solid fa-dice text-amber-400"></i>
            <span className="text-white font-black text-[10px] italic">{user.game_rolls} ХОДОВ</span>
         </button>
      </div>

      {/* Navigator Core: MOS & Briefing */}
      <section className="mx-1 p-8 bg-slate-950 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]"></div>
         <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center">
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Навигатор: Твой шаг</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            
            <p className="text-xl font-black italic leading-tight text-white/90">
               «{briefing}»
            </p>

            {mainGoal?.mos && !mainGoal.mos.is_completed && (
              <button 
                onClick={() => onCompleteMOS(mainGoal.id)}
                className="w-full py-5 bg-indigo-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest italic shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                 <i className="fa-solid fa-bolt"></i>
                 Сделал минимум на сегодня
              </button>
            )}
         </div>
      </section>

      {/* Goal Phases Horizontal List */}
      <section className="space-y-4">
         <div className="flex justify-between items-end px-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Активные пути</h3>
            <button onClick={() => onSetView(AppView.GOALS)} className="text-[9px] font-black text-indigo-600 uppercase italic">Все</button>
         </div>
         <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
            {activeGoals.map(goal => (
              <div key={goal.id} className="flex-shrink-0 w-64 p-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="flex justify-between items-start">
                    <div className={`flex items-center gap-2 ${PHASE_CONFIG[goal.phase].color}`}>
                       <i className={`fa-solid ${PHASE_CONFIG[goal.phase].icon} text-[10px]`}></i>
                       <span className="text-[8px] font-black uppercase tracking-widest">{PHASE_CONFIG[goal.phase].label}</span>
                    </div>
                    <span className="text-xl font-black italic text-slate-900 tracking-tighter">
                       {Math.round((goal.current_value / (goal.target_value || 1)) * 100)}%
                    </span>
                 </div>
                 <h4 className="text-sm font-black text-slate-800 uppercase italic line-clamp-1">{goal.title}</h4>
                 <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(goal.current_value / goal.target_value) * 100}%` }}></div>
                 </div>
              </div>
            ))}
         </div>
      </section>

      {/* Tasks Grid */}
      <section className="px-2 space-y-4">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Задачи на сегодня</h3>
         <div className="grid grid-cols-1 gap-3">
            {todayTasks.length === 0 ? (
               <div className="p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Внимание свободно</p>
               </div>
            ) : todayTasks.map(task => (
              <div key={task.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                       <i className={`fa-solid ${task.effort_type === 'thinking' ? 'fa-brain' : task.effort_type === 'habit' ? 'fa-repeat' : 'fa-hammer'} text-xs`}></i>
                    </div>
                    <div>
                       <h5 className="font-bold text-slate-800 text-xs italic uppercase leading-none mb-1">{task.title}</h5>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{task.effort_type}</span>
                    </div>
                 </div>
                 <button 
                  onClick={() => onEnterFocus(task.id)}
                  className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all"
                 >
                    <i className="fa-solid fa-bullseye text-xs"></i>
                 </button>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};
