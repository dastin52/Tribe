
import React from 'react';
import { AccountabilityPartner, PartnerRole } from '../types';

const roleMeta: Record<PartnerRole, { label: string, emoji: string, color: string, bg: string }> = {
  accomplice: { label: 'Сообщник', emoji: '🤝', color: 'text-blue-600', bg: 'bg-blue-50' },
  guardian: { label: 'Хранитель', emoji: '🛡️', color: 'text-rose-600', bg: 'bg-rose-50' },
  sensei: { label: 'Сэнсэй', emoji: '🥋', color: 'text-amber-600', bg: 'bg-amber-50' },
  teammate: { label: 'Тиммейт', emoji: '💼', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  navigator: { label: 'Штурман', emoji: '🧭', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  roaster: { label: 'Критик', emoji: '🔥', color: 'text-orange-600', bg: 'bg-orange-50' },
};

interface SocialViewProps {
  partners: AccountabilityPartner[];
}

export const SocialView: React.FC<SocialViewProps> = ({ partners }) => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="px-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Племя</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твое окружение</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {partners.map(partner => (
          <div key={partner.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group active:scale-95 transition-all">
            <div className={`w-20 h-20 ${roleMeta[partner.role].bg} rounded-[2.5rem] flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
              {roleMeta[partner.role].emoji}
            </div>
            <h4 className="font-black text-slate-800 text-sm mb-1">{partner.name}</h4>
            <span className={`text-[9px] font-black uppercase tracking-widest ${roleMeta[partner.role].color}`}>
              {roleMeta[partner.role].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
