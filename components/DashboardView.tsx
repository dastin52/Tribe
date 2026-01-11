
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { User, Meeting, SubGoal, YearGoal } from '../types';
import { geminiService } from '../services/gemini';

interface DashboardViewProps {
  user: User;
  meetings: Meeting[];
  todayTasks: SubGoal[];
  balanceVisible: boolean;
  setBalanceVisible: (v: boolean) => void;
  netWorth: number;
  balanceHistory: any[];
  onUpdateTask: (id: string, val: number) => void;
  goals: YearGoal[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, meetings, todayTasks, balanceVisible, setBalanceVisible, netWorth, balanceHistory, onUpdateTask, goals 
}) => {
  const [briefing, setBriefing] = useState<string>('Загружаю твой план...');
  const currentHour = new Date().getHours();
  const isPeak = user.energy_profile.peak_hours.includes(currentHour);

  useEffect(() => {
    const fetchBriefing = async () => {
      const text = await geminiService.getDailyBriefing(goals, user.financials, isPeak ? 'Пик' : 'Спад');
      setBriefing(text);
    };
    if (goals.length > 0) fetchBriefing();
  }, [goals.length]);

  const sortedTasks = useMemo(() => {
    return [...todayTasks].sort((a, b) => {
      if (isPeak) return (b.difficulty || 0) - (a.difficulty || 0);
      return (a.difficulty || 0) - (b.difficulty || 0);
    });
  }, [todayTasks, isPeak]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center px-2">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg border-2 border-white">
               {user.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user-ninja"></i>}
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 leading-none">{user.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">LVL {user.level}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isPeak ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isPeak ? '🔥 Фокус' : '💤 Рекавери'}
                  </span>
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
               <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </button>
         </div>
      </div>

      <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
         <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-wand-magic-sparkles text-xs opacity-60"></i>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Твое племя советует</span>
         </div>
         <p className="text-sm font-bold leading-relaxed italic">"{briefing}"</p>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="space-y-1 mb-6 relative z-10 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Твой капитал</span>
            <div className="text-4xl font-black tracking-tighter">
              {balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-indigo-400">{user.financials?.currency || '₽'}</span>
            </div>
          </div>
          <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-slate-500 mb-1 active:scale-90 transition-all">
             <i className={`fa-solid ${balanceVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <div className="h-16 w-full opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceHistory}>
              <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {meetings.length > 0 && (
        <section className="space-y-3">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Синхронизация</h3>
           <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
              {meetings.map(m => (
                <div key={m.id} className="min-w-[140px] p-4 bg-white border border-slate-100 rounded-[1.8rem] shadow-sm flex flex-col gap-1">
                   <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">{m.time}</span>
                   <h4 className="text-[10px] font-black text-slate-800 uppercase italic leading-tight truncate">{m.title}</h4>
                   <span className="text-[8px] font-black text-slate-300 uppercase mt-1">{m.category}</span>
                </div>
              ))}
           </div>
        </section>
      )}

      <section className="space-y-4">
         <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">План на {isPeak ? 'рывок' : 'отдых'}</h3>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Смарт-сортировка</span>
         </div>
         <div className="space-y-3">
            {sortedTasks.length === 0 ? (
               <div className="p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Все цели в безопасности</p>
               </div>
            ) : sortedTasks.map(sg => (
              <div key={sg.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-98 transition-all">
                <div className="flex items-center gap-4">
                   <button onClick={() => onUpdateTask(sg.id, 1)} className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm active:scale-90 transition-all">
                      <i className="fa-solid fa-check"></i>
                   </button>
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{sg.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Сложность: {sg.difficulty || 1}</span>
                         <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                         <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">{sg.target_value} {sg.metric}</span>
                      </div>
                   </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${isPeak && (sg.difficulty || 0) > 6 ? 'bg-amber-400 animate-pulse' : 'bg-slate-100'}`}></div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};
