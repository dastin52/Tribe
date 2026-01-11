
import React, { useState, useMemo } from 'react';
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
  onVerify: (goalId: string, logId: string, verifierId: string) => void;
  onAddPartner: (name: string, role: string) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ partners, goals, onVerify, onAddPartner }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<PartnerRole>('guardian');

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

  const sharedGoals = useMemo(() => goals.filter(g => g.is_shared), [goals]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твое окружение</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all">
           <i className="fa-solid fa-user-plus text-sm"></i>
        </button>
      </header>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-end animate-fade-in p-4 backdrop-blur-sm">
           <div className="w-full bg-white rounded-[3rem] p-8 space-y-6 animate-slide-up">
              <h3 className="text-2xl font-black text-slate-900 italic uppercase">Пригласить</h3>
              <input type="text" placeholder="Имя друга..." className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100" value={newName} onChange={e => setNewName(e.target.value)} />
              <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100" value={newRole} onChange={e => setNewRole(e.target.value as any)}>
                 {Object.entries(roleMeta).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
              <div className="flex gap-2">
                 <button onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px]">Отмена</button>
                 <button onClick={() => { onAddPartner(newName, newRole); setNewName(''); setShowAdd(false); }} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px]">Пригласить</button>
              </div>
           </div>
        </div>
      )}

      {pendingLogs.length > 0 && (
        <section className="space-y-4 px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Верификация (Для Племени)</h3>
          <div className="space-y-3">
             {pendingLogs.map(log => (
               <div key={log.id} className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                  <div className="flex justify-between items-center mb-4">
                     <div>
                        <h4 className="font-black text-amber-900 text-xs uppercase italic">{log.goalTitle}</h4>
                        <p className="text-[9px] font-bold text-amber-600 mt-1">+{log.value} ед. прогресса</p>
                     </div>
                     <div className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Ждет Пруф</div>
                  </div>
                  <div className="flex gap-2">
                    {partners.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => onVerify(log.goal_id, log.id, p.id)}
                        className="flex-1 py-3 bg-white border border-amber-200 text-amber-900 font-black text-[9px] rounded-xl uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                      >
                        Как {roleMeta[p.role].label}
                      </button>
                    ))}
                  </div>
               </div>
             ))}
          </div>
        </section>
      )}

      {sharedGoals.length > 0 && (
        <section className="space-y-4 px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Совместные цели</h3>
          <div className="space-y-3">
             {sharedGoals.map(goal => (
               <div key={goal.id} className="p-6 bg-emerald-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Совместная: {goal.category}</span>
                        <h4 className="text-xl font-black italic uppercase leading-tight mt-1">{goal.title}</h4>
                     </div>
                     <div className="flex -space-x-3">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-900 bg-white/20 flex items-center justify-center text-[8px] font-black">Я</div>
                        {partners.slice(0, 2).map(p => <div key={p.id} className="w-8 h-8 rounded-full border-2 border-emerald-900 bg-emerald-500 flex items-center justify-center text-[8px] font-black">{p.name[0]}</div>)}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-emerald-300">
                        <span>Общий вклад</span>
                        <span>{Math.round((goal.current_value / goal.target_value) * 100)}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${(goal.current_value / goal.target_value) * 100}%` }}></div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Твои Хранители ({partners.length})</h3>
        {partners.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem]">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Племя пока пусто. Начни с добавления Хранителя.</p>
          </div>
        ) : partners.map(partner => (
          <div key={partner.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm">
               <img src={partner.avatar} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
               <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-800 text-sm uppercase italic">{partner.name}</h4>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${roleMeta[partner.role].bg} ${roleMeta[partner.role].color}`}>
                    {roleMeta[partner.role].label}
                  </span>
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Опыт: {partner.xp} XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
