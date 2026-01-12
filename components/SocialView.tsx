
import React, { useState, useMemo } from 'react';
import { AccountabilityPartner, PartnerRole, YearGoal } from '../types';

const roleMeta: Record<PartnerRole, { label: string, color: string, bg: string }> = {
  accomplice: { label: 'Сообщник', color: 'text-blue-600', bg: 'bg-blue-50' },
  guardian: { label: 'Хранитель', color: 'text-rose-600', bg: 'bg-rose-50' },
  sensei: { label: 'Наставник', color: 'text-amber-600', bg: 'bg-amber-50' },
  teammate: { label: 'Коллега', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  navigator: { label: 'Навигатор', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  roaster: { label: 'Критик', color: 'text-orange-600', bg: 'bg-orange-50' },
};

interface SocialViewProps {
  partners: AccountabilityPartner[];
  goals: YearGoal[];
  onVerify: (goalId: string, logId: string, verifierId: string, rating?: number, comment?: string) => void;
  onAddPartner: (name: string, role: string) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ partners, goals, onVerify, onAddPartner }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [activeRating, setActiveRating] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const demoIncoming = useMemo(() => [
    { id: 'req-1', name: 'Иван', goal: 'Пробежать 10км', value: '10 км', avatar: 'https://i.pravatar.cc/150?u=ivan', proof: '🏃‍♂️ Сделано за 52 мин!' },
    { id: 'req-2', name: 'Анна', goal: 'Изучение React', value: '3 урока', avatar: 'https://i.pravatar.cc/150?u=anna', proof: '⚛️ Разобрала хуки и стейт' }
  ], []);

  const pendingMyLogs = useMemo(() => {
    const logs: any[] = [];
    goals.forEach(g => {
      if (g.logs) {
        g.logs.forEach(l => {
          if (!l.is_verified) logs.push({ ...l, goalTitle: g.title });
        });
      }
    });
    return logs;
  }, [goals]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Твоё социальное зеркало</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all">
           <i className="fa-solid fa-user-plus text-sm"></i>
        </button>
      </header>

      {/* Оценка действий друзей (Запросы на верификацию) */}
      <section className="space-y-4">
         <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Оцени прогресс Племени</h3>
            <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{demoIncoming.length} НОВЫХ</span>
         </div>
         <div className="space-y-3">
            {demoIncoming.map(req => (
              <div key={req.id} className="p-6 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-4">
                 <div className="flex items-center gap-3">
                    <img src={req.avatar} className="w-10 h-10 rounded-xl object-cover border-2 border-slate-50" />
                    <div className="flex-1">
                       <h4 className="font-black text-slate-800 text-xs uppercase italic">{req.name}</h4>
                       <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">Цель: {req.goal}</p>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl italic text-[11px] text-slate-600 font-medium">
                    "{req.proof}"
                 </div>
                 <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button 
                        key={star} 
                        onClick={() => setActiveRating(`${req.id}-${star}`)}
                        className={`flex-1 py-3 rounded-xl transition-all ${activeRating?.startsWith(req.id) && parseInt(activeRating.split('-')[1]) >= star ? 'bg-amber-100 text-amber-600 scale-105 shadow-inner' : 'bg-slate-50 text-slate-200'}`}
                      >
                         <i className="fa-solid fa-star text-xs"></i>
                      </button>
                    ))}
                 </div>
                 <button className="w-full py-4 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all italic">Подтвердить величие</button>
              </div>
            ))}
         </div>
      </section>

      {/* Твои запросы (ждут верификации) */}
      {pendingMyLogs.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 italic">Твои пруфы ждут подтверждения</h3>
          <div className="space-y-3">
             {pendingMyLogs.map(log => (
               <div key={log.id} className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/40 blur-2xl"></div>
                  <div className="relative z-10">
                     <h4 className="font-black text-indigo-900 text-xs uppercase italic">{log.goalTitle}</h4>
                     <p className="text-[9px] font-bold text-indigo-600 mt-1 italic">Объем: +{log.value} в общую копилку</p>
                  </div>

                  <div className="relative z-10 space-y-2">
                     <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button 
                            key={star} 
                            onClick={() => setActiveRating(`${log.id}-${star}`)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeRating?.startsWith(log.id) && parseInt(activeRating.split('-')[1]) >= star ? 'bg-indigo-600 text-white' : 'bg-white/50 text-indigo-300'}`}
                          >
                             <i className="fa-solid fa-star text-[8px]"></i>
                          </button>
                        ))}
                     </div>
                     <input 
                       type="text" 
                       placeholder="Комментарий (необязательно)" 
                       className="w-full bg-white/50 border border-indigo-100 rounded-xl p-3 text-[10px] font-bold outline-none italic"
                       value={commentText[log.id] || ''}
                       onChange={(e) => setCommentText({...commentText, [log.id]: e.target.value})}
                     />
                  </div>

                  <div className="flex gap-2 relative z-10">
                    {partners.length === 0 ? (
                      <div className="w-full text-center py-2 text-[8px] font-black text-indigo-300 uppercase italic">У тебя нет друзей в племени</div>
                    ) : partners.map(p => (
                      <button key={p.id} onClick={() => {
                        const rating = activeRating?.startsWith(log.id) ? parseInt(activeRating.split('-')[1]) : 5;
                        onVerify(log.goal_id, log.id, p.id, rating, commentText[log.id]);
                      }} className="flex-1 py-3 bg-white text-indigo-900 font-black text-[9px] rounded-xl uppercase shadow-sm italic active:scale-95 transition-all">
                        {p.name}
                      </button>
                    ))}
                  </div>
               </div>
             ))}
          </div>
        </section>
      )}

      {/* Список Племени */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 italic">Твоё Племя</h3>
        <div className="grid grid-cols-1 gap-3 px-1">
          {partners.map(partner => (
            <div key={partner.id} className="p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
              <img src={partner.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-50" />
              <div className="flex-1">
                 <div className="flex justify-between items-center">
                    <h4 className="font-black text-slate-800 text-xs uppercase italic">{partner.name}</h4>
                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${roleMeta[partner.role].bg} ${roleMeta[partner.role].color}`}>
                      {roleMeta[partner.role].label}
                    </span>
                 </div>
                 <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: '70%' }}></div>
                    </div>
                    <span className="text-[7px] font-black text-slate-400">XP {partner.xp}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showAdd && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 space-y-6">
              <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Призвать Племя</h3>
              <input type="text" placeholder="Имя друга" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" id="p_name" />
              <div className="grid grid-cols-3 gap-2">
                 {Object.entries(roleMeta).slice(0, 6).map(([key, meta]) => (
                    <button key={key} onClick={() => { 
                      const name = (document.getElementById('p_name') as HTMLInputElement).value;
                      if(name) { onAddPartner(name, key); setShowAdd(false); }
                    }} className={`p-2 rounded-xl border border-slate-50 text-[8px] font-black uppercase tracking-tighter ${meta.bg} ${meta.color}`}>
                       {meta.label}
                    </button>
                 ))}
              </div>
              <button onClick={() => setShowAdd(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Отмена</button>
           </div>
        </div>
      )}
    </div>
  );
};
