
import React, { useMemo } from 'react';
import { AccountabilityPartner, PartnerRole, YearGoal } from '../types';

const roleMeta: Record<PartnerRole, { label: string, emoji: string, color: string, bg: string, desc: string }> = {
  accomplice: { label: 'Сообщник', emoji: '🤝', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Вместе к одной цели' },
  guardian: { label: 'Хранитель', emoji: '🛡️', color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Семья и поддержка' },
  sensei: { label: 'Сэнсэй', emoji: '🥋', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Ментор и мудрость' },
  teammate: { label: 'Тиммейт', emoji: '💼', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Профессиональный рост' },
  navigator: { label: 'Штурман', emoji: '🧭', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Стратегия и путь' },
  roaster: { label: 'Критик', emoji: '🔥', color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Честная обратная связь' },
};

interface SocialViewProps {
  partners: AccountabilityPartner[];
  goals: YearGoal[];
  onVerify: (goalId: string, logId: string) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ partners, goals, onVerify }) => {
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

  const tribeStrength = useMemo(() => {
    let total = 0;
    let verified = 0;
    goals.forEach(g => {
      if (g.logs) {
        total += g.logs.length;
        verified += g.logs.filter(l => l.is_verified).length;
      }
    });
    return total === 0 ? 100 : Math.round((verified / total) * 100);
  }, [goals]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твое окружение</p>
      </header>
      
      <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden mb-4">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
         <div className="relative z-10 flex justify-between items-center">
            <div>
               <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Сила Племени</h4>
               <div className="text-4xl font-black italic mt-1">{tribeStrength}%</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl">
               <i className="fa-solid fa-bolt-lightning"></i>
            </div>
         </div>
         <p className="text-[10px] font-bold mt-4 opacity-80 leading-relaxed uppercase tracking-widest">
           {tribeStrength > 80 ? 'Твои друзья активно верифицируют твои успехи' : 'Племени нужно больше твоих открытых достижений'}
         </p>
      </div>

      {pendingLogs.length > 0 && (
        <section className="space-y-4 px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Требует подтверждения</h3>
          <div className="space-y-3">
             {pendingLogs.map(log => (
               <div key={log.id} className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-black text-amber-900 text-xs uppercase italic truncate">{log.goalTitle}</h4>
                    <p className="text-[10px] font-bold text-amber-600 mt-1">+{log.value} ед. прогресса</p>
                  </div>
                  <button 
                    onClick={() => onVerify(log.goal_id, log.id)}
                    className="px-5 py-3 bg-amber-200 text-amber-900 font-black text-[10px] rounded-2xl uppercase italic active:scale-90 transition-all"
                  >
                    Засчитать
                  </button>
               </div>
             ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Твои партнеры</h3>
        {partners.map(partner => (
          <div key={partner.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group active:scale-98 transition-all hover:border-indigo-100">
            <div className="relative">
               <div className={`w-16 h-16 ${roleMeta[partner.role].bg} rounded-[1.8rem] flex items-center justify-center text-2xl shadow-sm overflow-hidden`}>
                 {partner.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" /> : roleMeta[partner.role].emoji}
               </div>
               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1">
               <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-800 text-sm italic uppercase">{partner.name}</h4>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${roleMeta[partner.role].bg} ${roleMeta[partner.role].color}`}>
                    {roleMeta[partner.role].label}
                  </span>
               </div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{roleMeta[partner.role].desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
