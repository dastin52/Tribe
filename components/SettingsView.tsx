
import React from 'react';
import { User } from '../types';

interface SettingsViewProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
  onReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdate, onReset }) => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Профиль</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твои настройки</p>
      </header>

      <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
         <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 overflow-hidden border-4 border-slate-50 shadow-xl relative group">
               {user.photo_url ? (
                 <img src={user.photo_url} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-white text-3xl">
                    <i className="fa-solid fa-user"></i>
                 </div>
               )}
            </div>
            <div className="text-center">
               <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">LVL {user.level} • EXP {user.xp}</span>
            </div>
         </div>

         <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Твое имя</label>
               <input 
                 type="text" 
                 className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all"
                 value={user.name}
                 onChange={e => onUpdate({ name: e.target.value })}
               />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Валюта</label>
               <div className="flex gap-2">
                  {['₽', '$', '€', '₸'].map(cur => (
                    <button 
                      key={cur}
                      onClick={() => onUpdate({ financials: { ...user.financials!, currency: cur } })}
                      className={`flex-1 py-4 rounded-2xl font-black transition-all border ${user.financials?.currency === cur ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
                    >
                      {cur}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="space-y-3 px-2">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Опасная зона</h3>
         <button 
           onClick={() => { if(confirm('Это удалит все твои цели и транзакции. Уверен?')) onReset(); }}
           className="w-full p-6 bg-rose-50 text-rose-600 rounded-[2rem] font-black text-xs uppercase tracking-widest border border-rose-100 active:scale-95 transition-all flex items-center justify-center gap-3"
         >
           <i className="fa-solid fa-trash-can"></i>
           Сбросить все данные
         </button>
      </div>

      <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center border border-dashed border-slate-200">
         <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">
           Tribe v1.0.4 <br/> 
           Сделано для тех, кто строит свое будущее сегодня
         </p>
      </div>
    </div>
  );
};
