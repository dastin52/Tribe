
import React, { useState, useEffect, useMemo } from 'react';
import { User, Meeting, SubGoal, YearGoal, AccountabilityPartner, AppView } from '../types';
import { geminiService } from '../services/gemini';
import { ResponsiveContainer, AreaChart, Area, XAxis, ReferenceLine, Tooltip } from 'recharts';

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
  partners: AccountabilityPartner[];
  onSetView: (view: AppView) => void;
  onSelectGoal: (goal: YearGoal) => void;
  onEnterFocus: (taskId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, todayTasks, onUpdateTask, goals, partners, onSetView, onSelectGoal, onEnterFocus 
}) => {
  const [briefing, setBriefing] = useState<string>('Загружаю твой план...');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const isPeak = user.energy_profile.peak_hours.includes(currentHour);
  const isLow = user.energy_profile.low_energy_hours?.includes(currentHour);

  useEffect(() => {
    const fetchBriefing = async () => {
      const text = await geminiService.getDailyBriefing(goals, user.financials, isPeak ? 'Пик' : 'Спад');
      setBriefing(text);
    };
    if (goals.length > 0) fetchBriefing();
  }, [goals.length, isPeak]);

  const energyChartData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, h) => {
      let level = 50;
      if (user.energy_profile.peak_hours.includes(h)) level = 90;
      if (user.energy_profile.low_energy_hours?.includes(h)) level = 20;
      return { hour: h, level, name: `${h}:00` };
    });
  }, [user.energy_profile]);

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
      <div className="flex justify-between items-center px-2">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg border-2 border-white overflow-hidden">
               {user.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user-ninja"></i>}
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 leading-none italic uppercase">{user.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded italic">УРОВЕНЬ {user.level}</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded italic ${isPeak ? 'bg-amber-100 text-amber-600' : isLow ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isPeak ? '🔥 ФОКУС' : isLow ? '💤 СПАД' : '⚙️ НОРМА'}
                  </span>
               </div>
            </div>
         </div>
         <button onClick={() => onSetView(AppView.SOCIAL)} className="bg-slate-900 px-4 py-2 rounded-2xl flex items-center gap-2 border-2 border-slate-800 shadow-xl group">
            <i className="fa-solid fa-bolt text-amber-400 animate-pulse"></i>
            <span className="text-white font-black text-xs italic">{user.game_rolls} ХОДОВ</span>
         </button>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Активные цели</h3>
          <button onClick={() => onSetView(AppView.GOALS)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest italic">Все цели</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-2">
          {activeGoals.length === 0 ? (
            <div className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Целей пока нет</p>
            </div>
          ) : activeGoals.map(goal => (
            <button key={goal.id} onClick={() => onSelectGoal(goal)} className="flex-shrink-0 w-40 p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-left active:scale-95 transition-all">
              <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest block mb-1 italic">{goal.category === 'finance' ? 'Капитал' : goal.category === 'sport' ? 'Тело' : 'Рост'}</span>
              <h4 className="font-black text-slate-800 text-[11px] leading-tight mb-3 line-clamp-2 italic uppercase">{goal.title}</h4>
              <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }}></div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Energy Profile Radar Section */}
      <section className="mx-1 p-6 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px]"></div>
         <div className="flex justify-between items-start relative z-10 mb-6">
            <div>
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Энерго-профиль</h3>
               <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Твои биоритмы на сегодня</p>
            </div>
            <div className="text-right">
               <span className="text-xl font-black italic">{currentTime.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
         </div>

         <div className="h-28 w-full relative z-10 -mx-4">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={energyChartData}>
                  <defs>
                     <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="level" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#energyGradient)" animationDuration={1500} />
                  <ReferenceLine x={currentHour} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" />
                  <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return <div className="bg-slate-800 border border-white/10 p-2 rounded-lg text-[9px] font-black italic">{payload[0].payload.name}</div>;
                      }
                      return null;
                    }}
                  />
               </AreaChart>
            </ResponsiveContainer>
         </div>

         <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isPeak ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]' : isLow ? 'bg-rose-500' : 'bg-slate-600'}`}></div>
               <span className="text-[9px] font-black uppercase tracking-widest italic text-slate-400">
                  {isPeak ? 'Время для хардкора' : isLow ? 'Заряди батарейку' : 'Штатный режим'}
               </span>
            </div>
            <i className="fa-solid fa-bolt-lightning text-indigo-500 opacity-30"></i>
         </div>
      </section>

      <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group mx-1">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
         <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-wand-magic-sparkles text-xs opacity-60"></i>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 italic">Совет Племени</span>
         </div>
         <p className="text-sm font-bold leading-relaxed italic">"{briefing}"</p>
      </div>

      <section className="px-2">
        <div className="flex justify-between overflow-x-auto no-scrollbar gap-3 py-2">
          {calendarDays.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <button key={idx} onClick={() => setSelectedDate(date)} className={`flex-shrink-0 w-12 h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg scale-110' : 'bg-white border border-slate-100 text-slate-400'}`}>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 italic">{date.toLocaleDateString('ru', { weekday: 'short' })}</span>
                <span className="text-sm font-black italic">{date.getDate()}</span>
                {isToday && !isSelected && <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1"></div>}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
         <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Задачи дня</h3>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">{selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</span>
         </div>
         <div className="space-y-3">
            {filteredTasks.length === 0 ? (
               <div className="p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 mx-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Свободный день</p>
               </div>
            ) : filteredTasks.map(sg => (
              <div key={sg.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-98 transition-all mx-1">
                <div className="flex items-center gap-4 flex-1">
                   <button onClick={() => onUpdateTask(sg.id, sg.target_value)} className={`w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm active:scale-90 transition-all`}>
                      <i className={`fa-solid fa-check-double text-sm`}></i>
                   </button>
                   <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight italic uppercase">{sg.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter italic">{sg.target_value} {sg.metric}</span>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => onEnterFocus(sg.id)}
                  className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md active:scale-90 transition-all"
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
