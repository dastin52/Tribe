
import React, { useState } from 'react';
import { User } from '../types';

interface SettingsViewProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
  onReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdate, onReset }) => {
  const [dailyXPGoal, setDailyXPGoal] = useState(500);

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      <header className="px-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Профиль</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Твои биоритмы и настройки</p>
      </header>

      <div className="space-y-6">
         {/* Profile Card */}
         <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex flex-col items-center gap-4 py-2">
               <div className="w-28 h-28 rounded-[3rem] bg-slate-900 overflow-hidden border-4 border-white shadow-2xl relative group rotate-2">
                  {user.photo_url ? (
                    <img src={user.photo_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                       <i className="fa-solid fa-user-ninja"></i>
                    </div>
                  )}
               </div>
               <div className="text-center mt-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">{user.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-full tracking-widest">LVL {user.level}</span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-full tracking-widest">EXP {user.xp}</span>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Позывной</label>
                  <input 
                    type="text" 
                    className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-50 focus:ring-indigo-500 transition-all"
                    value={user.name}
                    onChange={e => onUpdate({ name: e.target.value })}
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Основная валюта</label>
                  <div className="flex gap-2">
                     {['₽', '$', '€', '₿'].map(cur => (
                       <button 
                         key={cur}
                         onClick={() => onUpdate({ financials: { ...user.financials!, currency: cur } })}
                         className={`flex-1 py-4 rounded-2xl font-black transition-all border ${user.financials?.currency === cur ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`}
                       >
                         {cur}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Energy Profile */}
         <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]"></div>
            <div className="flex items-center gap-3 relative z-10">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-bolt-lightning text-white"></i>
               </div>
               <h4 className="text-[10px] font-black uppercase tracking-widest">Биоритмы и XP</h4>
            </div>

            <div className="space-y-6 relative z-10">
               <div className="space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                     <span>Цель по XP в день</span>
                     <span className="text-indigo-400">{dailyXPGoal} XP</span>
                  </div>
                  <input 
                    type="range" min="100" max="2000" step="50" value={dailyXPGoal} 
                    onChange={e => setDailyXPGoal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Пик энергии (Peak Hours)</label>
                  <div className="flex gap-2">
                     {[9, 14, 19, 23].map(h => (
                       <button 
                         key={h}
                         className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${user.energy_profile.peak_hours.includes(h) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                         onClick={() => {
                            const peaks = user.energy_profile.peak_hours.includes(h) 
                               ? user.energy_profile.peak_hours.filter(x => x !== h)
                               : [...user.energy_profile.peak_hours, h];
                            onUpdate({ energy_profile: { ...user.energy_profile, peak_hours: peaks } });
                         }}
                       >
                         {h}:00
                       </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Dangerous Area */}
         <div className="space-y-3 px-2 pt-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Системные действия</h3>
            <button 
              onClick={() => { if(confirm('Это удалит все твои данные. Уверен?')) onReset(); }}
              className="w-full p-6 bg-rose-50 text-rose-600 rounded-[2rem] font-black text-xs uppercase tracking-widest border border-rose-100 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <i className="fa-solid fa-skull-crossbones"></i>
              Сбросить все данные
            </button>
         </div>
      </div>

      <div className="p-8 text-center opacity-40">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
           Tribe Social OS v1.1.2 <br/> 
           "Твое окружение определяет твой доход и уровень счастья"
         </p>
      </div>
    </div>
  );
};
