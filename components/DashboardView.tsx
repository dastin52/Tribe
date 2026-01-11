
import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { User, Meeting, SubGoal } from '../types';

interface DashboardViewProps {
  user: User;
  meetings: Meeting[];
  todayTasks: SubGoal[];
  balanceVisible: boolean;
  setBalanceVisible: (v: boolean) => void;
  netWorth: number;
  balanceHistory: any[];
  onUpdateTask: (id: string, val: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, meetings, todayTasks, balanceVisible, setBalanceVisible, netWorth, balanceHistory, onUpdateTask 
}) => {
  const financials = user.financials || { total_assets: 0, total_debts: 0, monthly_income: 0, monthly_expenses: 0, currency: '₽' };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center px-2">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg overflow-hidden border-2 border-white">
               {user.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user"></i>}
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 leading-none">{user.name}</h2>
               <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">EXP: {user.xp} • LVL {user.level}</span>
            </div>
         </div>
         <button onClick={() => setBalanceVisible(!balanceVisible)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm active:scale-95">
            <i className={`fa-solid ${balanceVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
         </button>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="space-y-1 mb-6 relative z-10">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Твой капитал</span>
          <div className="text-4xl font-black tracking-tighter">
            {balanceVisible ? netWorth.toLocaleString() : '∗∗∗∗∗∗'} <span className="text-indigo-400">{financials.currency}</span>
          </div>
          {!balanceVisible && <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Наклони телефон для просмотра</p>}
        </div>
        <div className="h-16 w-full opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceHistory}>
              <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="space-y-4">
         <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Повестка дня</h3>
            <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded-md tracking-tighter">Live</span>
         </div>
         <div className="space-y-3">
            {meetings.map(m => (
              <div key={m.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-98 transition-transform">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs">
                      {m.time}
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{m.title}</h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.category}</span>
                   </div>
                </div>
                <i className="fa-solid fa-video text-slate-200 text-sm"></i>
              </div>
            ))}
            {todayTasks.map(sg => (
              <div key={sg.id} className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                   <button onClick={() => onUpdateTask(sg.id, 1)} className="w-10 h-10 rounded-2xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm active:scale-90 transition-all">
                      <i className="fa-solid fa-check"></i>
                   </button>
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{sg.title}</h4>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Цель: {sg.target_value} {sg.metric}</span>
                   </div>
                </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};
