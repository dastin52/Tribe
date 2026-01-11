
import React, { useState, useMemo } from 'react';
import { AccountabilityPartner, PartnerRole, YearGoal } from '../types';

const roleMeta: Record<PartnerRole, { label: string, emoji: string, color: string, bg: string, desc: string }> = {
  accomplice: { label: 'Сообщник', emoji: '🤝', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Вместе к одной цели' },
  guardian: { label: 'Хранитель', emoji: '🛡️', color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Семья и поддержка' },
  sensei: { label: 'Наставник', emoji: '🥋', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Мудрость и опыт' },
  teammate: { label: 'Коллега', emoji: '💼', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Профессиональный рост' },
  navigator: { label: 'Навигатор', emoji: '🧭', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Стратегия пути' },
  roaster: { label: 'Критик', emoji: '🔥', color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Честный разбор' },
};

interface SocialViewProps {
  partners: AccountabilityPartner[];
  goals: YearGoal[];
  onVerify: (goalId: string, logId: string, verifierId: string) => void;
  onAddPartner: (name: string, role: string) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ partners, goals, onVerify, onAddPartner }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [activeRating, setActiveRating] = useState<string | null>(null);

  // Имитация запросов от друзей для наглядности
  const demoRequests = useMemo(() => [
    { id: 'req-1', name: 'Иван', goal: 'Пробежать 10км', value: '10 км', avatar: 'https://i.pravatar.cc/150?u=ivan' },
    { id: 'req-2', name: 'Анна', goal: 'Отложить на отпуск', value: '15,000 ₽', avatar: 'https://i.pravatar.cc/150?u=anna' }
  ], []);

  const pendingLogs = useMemo(() => {
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Взаимная поддержка</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all">
           <i className="fa-solid fa-user-plus text-sm"></i>
        </button>
      </header>

      {/* Оценка действий друзей */}
      <section className="space-y-4">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Оцени прогресс Племени</h3>
         <div className="space-y-3">
            {demoRequests.map(req => (
              <div key={req.id} className="p-6 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-4">
                 <div className="flex items-center gap-3">
                    <img src={req.avatar} className="w-10 h-10 rounded-xl object-cover border-2 border-slate-50" />
                    <div className="flex-1">
                       <h4 className="font-black text-slate-800 text-xs uppercase italic">{req.name}: {req.goal}</h4>
                       <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase italic">Пруф: {req.value}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button 
                        key={star} 
                        onClick={() => setActiveRating(`${req.id}-${star}`)}
                        className={`flex-1 py-3 rounded-xl transition-all ${activeRating?.startsWith(req.id) && parseInt(activeRating.split('-')[1]) >= star ? 'bg-amber-100 text-amber-600 scale-105' : 'bg-slate-50 text-slate-300'}`}
                      >
                         <i className="fa-solid fa-star text-xs"></i>
                      </button>
                    ))}
                 </div>
                 <button className="w-full py-4 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all italic">Подтвердить уровень</button>
              </div>
            ))}
         </div>
      </section>

      {/* Твои запросы (ждут верификации) */}
      {pendingLogs.length > 0 && (
        <section className="space-y-4 px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 italic">Ждут твоего Племени</h3>
          <div className="space-y-3">
             {pendingLogs.map(log => (
               <div key={log.id} className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                  <div className="flex justify-between items-center mb-4">
                     <div>
                        <h4 className="font-black text-indigo-900 text-xs uppercase italic">{log.goalTitle}</h4>
                        <p className="text-[9px] font-bold text-indigo-600 mt-1 italic">+{log.value} в общую копилку</p>
                     </div>
                     <span className="text-[8px] font-black text-indigo-400 uppercase italic animate-pulse">Ищут куратора...</span>
                  </div>
                  <div className="flex gap-2">
                    {partners.map(p => (
                      <button key={p.id} onClick={() => onVerify(log.goal_id, log.id, p.id)} className="flex-1 py-3 bg-white text-indigo-900 font-black text-[9px] rounded-xl uppercase shadow-sm italic active:scale-95 transition-all">
                        {p.name} ({roleMeta[p.role].label})
                      </button>
                    ))}
                  </div>
               </div>
             ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 italic">Состав Племени</h3>
        {partners.map(partner => (
          <div key={partner.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <img src={partner.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />
            <div className="flex-1">
               <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-800 text-sm uppercase italic">{partner.name}</h4>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full italic ${roleMeta[partner.role].bg} ${roleMeta[partner.role].color}`}>
                    {roleMeta[partner.role].label}
                  </span>
               </div>
               <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-400" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-[7px] font-black text-slate-400 uppercase italic">Доверие: 92%</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
