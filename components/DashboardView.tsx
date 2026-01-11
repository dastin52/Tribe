
import React, { useState, useEffect, useMemo } from 'react';
import { User, Meeting, SubGoal, YearGoal, AccountabilityPartner, AppView } from '../types';
import { geminiService } from '../services/gemini';

interface DashboardViewProps {
  user: User;
  meetings: Meeting[];
  todayTasks: SubGoal[];
  balanceVisible: boolean;
  setBalanceVisible: (v: boolean) => void;
  netWorth: number;
  balanceHistory: any[];
  onUpdateTask: (id: string, val: number, force: boolean) => void;
  goals: YearGoal[];
  partners: AccountabilityPartner[];
  onSetView: (view: AppView) => void;
  onSelectGoal: (goal: YearGoal) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, todayTasks, onUpdateTask, goals, partners, onSetView, onSelectGoal 
}) => {
  const [briefing, setBriefing] = useState<string>('Загружаю твой план...');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentHour = new Date().getHours();
  const isPeak = user.energy_profile.peak_hours.includes(currentHour);

  useEffect(() => {
    const fetchBriefing = async () => {
      const text = await geminiService.getDailyBriefing(goals, user.financials, isPeak ? 'Пик' : 'Спад');
      setBriefing(text);
    };
    if (goals.length > 0) fetchBriefing();
  }, [goals.length]);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const filteredTasks = useMemo(() => {
    return todayTasks.filter(sg => {
      const taskDate = new Date(sg.deadline).toDateString();
      return taskDate === selectedDate.toDateString();
    });
  }, [todayTasks, selectedDate]);

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header with user info */}
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
      </div>

      {/* Quick Goals Glance */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Активные цели</h3>
          <button onClick={() => onSetView(AppView.GOALS)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Смотреть все</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-2">
          {activeGoals.length === 0 ? (
            <div className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Целей пока нет</p>
            </div>
          ) : activeGoals.map(goal => (
            <button 
              key={goal.id} 
              onClick={() => onSelectGoal(goal)}
              className="flex-shrink-0 w-40 p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-left active:scale-95 transition-all"
            >
              <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{goal.category}</span>
              <h4 className="font-black text-slate-800 text-[11px] leading-tight mb-3 line-clamp-2 italic">{goal.title}</h4>
              <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600" 
                  style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }}
                ></div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* AI Briefing */}
      <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group mx-1">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
         <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-wand-magic-sparkles text-xs opacity-60"></i>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Совет Племени</span>
         </div>
         <p className="text-sm font-bold leading-relaxed italic">"{briefing}"</p>
      </div>

      {/* Calendar */}
      <section className="px-2">
        <div className="flex justify-between overflow-x-auto no-scrollbar gap-3 py-2">
          {calendarDays.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <button 
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-12 h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg scale-110' : 'bg-white border border-slate-100 text-slate-400'}`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{date.toLocaleDateString('ru', { weekday: 'short' })}</span>
                <span className="text-sm font-black italic">{date.getDate()}</span>
                {isToday && !isSelected && <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1"></div>}
              </button>
            )
          })}
        </div>
      </section>

      {/* Tasks List */}
      <section className="space-y-4">
         <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Задачи на день</h3>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</span>
         </div>
         <div className="space-y-3">
            {filteredTasks.length === 0 ? (
               <div className="p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 mx-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Свободный день</p>
               </div>
            ) : filteredTasks.map(sg => (
              <div key={sg.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-98 transition-all mx-1">
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => onUpdateTask(sg.id, sg.target_value, partners.length === 0)} 
                    className={`w-12 h-12 rounded-2xl ${partners.length === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center shadow-sm active:scale-90 transition-all`}
                   >
                      <i className={`fa-solid ${partners.length === 0 ? 'fa-check-double' : 'fa-paper-plane'} text-sm`}></i>
                   </button>
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{sg.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{partners.length === 0 ? 'Личное подтверждение' : 'Ждет верификации'}</span>
                         <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                         <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">{sg.target_value} {sg.metric}</span>
                      </div>
                   </div>
                </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};
