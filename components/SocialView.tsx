
import React, { useState, useMemo, useEffect } from 'react';
import { AccountabilityPartner, PartnerRole, YearGoal, GameState, BoardCell, GameOffer } from '../types';

const roleMeta: Record<PartnerRole, { label: string, color: string, bg: string }> = {
  accomplice: { label: 'Сообщник', color: 'text-blue-600', bg: 'bg-blue-50' },
  guardian: { label: 'Хранитель', color: 'text-rose-600', bg: 'bg-rose-50' },
  sensei: { label: 'Наставник', color: 'text-amber-600', bg: 'bg-amber-50' },
  teammate: { label: 'Коллега', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  navigator: { label: 'Навигатор', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  roaster: { label: 'Критик', color: 'text-orange-600', bg: 'bg-orange-50' },
};

const DISTRICT_COLORS = {
  tech: 'border-blue-500 bg-blue-500/10',
  realestate: 'border-amber-500 bg-amber-500/10',
  energy: 'border-emerald-500 bg-emerald-500/10',
  crypto: 'border-violet-500 bg-violet-500/10'
};

const BOARD: BoardCell[] = [
  { id: 0, type: 'start', title: 'Старт', icon: 'fa-rocket' },
  { id: 1, type: 'asset', district: 'tech', title: 'IT Студия', cost: 8000, rent: 1000, icon: 'fa-code' },
  { id: 2, type: 'event', title: 'Событие', icon: 'fa-bolt' },
  { id: 3, type: 'asset', district: 'tech', title: 'AI Лаба', cost: 15000, rent: 2500, icon: 'fa-brain' },
  { id: 4, type: 'tax', title: 'Налог', icon: 'fa-hand-holding-dollar' },
  { id: 5, type: 'asset', district: 'realestate', title: 'Лофт', cost: 25000, rent: 4000, icon: 'fa-building' },
  { id: 6, type: 'event', title: 'Шанс', icon: 'fa-wand-magic-sparkles' },
  { id: 7, type: 'asset', district: 'realestate', title: 'Отель', cost: 45000, rent: 8000, icon: 'fa-hotel' },
  { id: 8, type: 'asset', district: 'crypto', title: 'Ферма', cost: 80000, rent: 15000, icon: 'fa-microchip' },
  { id: 9, type: 'event', title: 'Событие', icon: 'fa-dice' },
  { id: 10, type: 'asset', district: 'crypto', title: 'Биржа', cost: 150000, rent: 30000, icon: 'fa-chart-pie' },
  { id: 11, type: 'tax', title: 'Инфляция', icon: 'fa-arrow-down' },
];

interface SocialViewProps {
  partners: AccountabilityPartner[];
  goals: YearGoal[];
  onVerify: (goalId: string, logId: string, verifierId: string, rating?: number, comment?: string) => void;
  onAddPartner: (name: string, role: string) => void;
  gameState: GameState;
  rollDice: (board: BoardCell[]) => void;
  buyAsset: (cellId: number, cost: number) => void;
  respondToOffer: (offerId: string, accept: boolean) => void;
  completeTutorial: () => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ partners, goals, onVerify, onAddPartner, gameState, rollDice, buyAsset, respondToOffer, completeTutorial }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [activeMode, setActiveMode] = useState<'feed' | 'arena'>('feed');
  const [activeRating, setActiveRating] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!gameState.isTutorialComplete);

  const handleRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      rollDice(BOARD);
      setIsRolling(false);
    }, 800);
  };

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
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Племя</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Твоё социальное зеркало</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveMode(activeMode === 'feed' ? 'arena' : 'feed')} className={`w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm transition-all ${activeMode === 'arena' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-indigo-600'}`}>
              <i className={`fa-solid ${activeMode === 'arena' ? 'fa-users-viewfinder' : 'fa-chess-board'}`}></i>
           </button>
           <button onClick={() => setShowAdd(true)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all">
              <i className="fa-solid fa-user-plus text-sm"></i>
           </button>
        </div>
      </header>

      {activeMode === 'arena' ? (
        <div className="space-y-8 animate-fade-in px-1">
           {/* AI Tutorial Overlay */}
           {showTutorial && (
             <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl space-y-4 animate-scale-up border-4 border-white">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><i className="fa-solid fa-graduation-cap"></i></div>
                   <h3 className="font-black text-xs uppercase italic tracking-widest">Гайд по Арене</h3>
                </div>
                <p className="text-[11px] font-bold leading-relaxed italic">
                  "Привет! Это Арена. Бросай кубик, захватывай районы. Выполняй реальные цели, чтобы получать Карты Влияния. Племя будет предлагать сделки — умей торговаться!"
                </p>
                <button onClick={() => { setShowTutorial(false); completeTutorial(); }} className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase shadow-lg">Погнали!</button>
             </div>
           )}

           {/* Game Board */}
           <div className="bg-slate-950 p-6 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-4 border-slate-900">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-50"></div>
              
              <div className="grid grid-cols-4 gap-2 relative z-10">
                 {BOARD.map((cell, idx) => {
                   const isPlayerHere = gameState.playerPosition === idx;
                   const isOwned = gameState.ownedAssets.includes(idx);
                   const districtColor = cell.district ? DISTRICT_COLORS[cell.district] : 'bg-slate-800/40 border-slate-800';
                   
                   return (
                     <div 
                      key={cell.id} 
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-500 border-2 ${
                        isPlayerHere ? 'bg-white border-indigo-400 scale-110 z-20 shadow-[0_0_25px_rgba(99,102,241,0.6)]' : 
                        isOwned ? 'bg-emerald-500/20 border-emerald-500/50' :
                        districtColor
                      }`}
                     >
                        <i className={`fa-solid ${cell.icon} ${isPlayerHere ? 'text-indigo-600 animate-pulse' : isOwned ? 'text-emerald-400' : 'text-slate-600'} text-lg mb-1`}></i>
                        <span className={`text-[5.5px] font-black uppercase text-center leading-none tracking-tighter ${isPlayerHere ? 'text-indigo-900' : 'text-slate-400'}`}>{cell.title}</span>
                        {isPlayerHere && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
                        )}
                        {cell.cost && !isOwned && (
                           <div className="absolute bottom-1 right-1 px-1 bg-black/40 rounded text-[5px] text-slate-500 font-black">{cell.cost}</div>
                        )}
                     </div>
                   );
                 })}
              </div>

              <div className="mt-8 flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/5 relative z-10">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase block italic mb-1">Капитал Арены</span>
                    <span className="text-2xl font-black text-emerald-400 italic tracking-tighter leading-none">{gameState.cash.toLocaleString()} XP</span>
                    <div className="mt-2 flex gap-1">
                       {gameState.cards.map((c, i) => (
                         <div key={i} className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-[6px] text-white shadow-sm" title={c}>
                            <i className="fa-solid fa-bolt-lightning"></i>
                         </div>
                       ))}
                    </div>
                 </div>
                 <button 
                  disabled={isRolling}
                  onClick={handleRoll}
                  className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all ${isRolling ? 'bg-slate-800 text-slate-600 animate-pulse cursor-wait' : 'bg-white text-slate-900 active:scale-95 active:shadow-inner'}`}
                 >
                    {isRolling ? 'Движение...' : 'Бросок'}
                 </button>
              </div>
           </div>

           {/* Offers Panel */}
           {gameState.activeOffers.length > 0 && (
             <div className="space-y-3 animate-fade-in">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-4 italic animate-pulse">Предложение о сделке!</h3>
                {gameState.activeOffers.map(offer => (
                  <div key={offer.id} className="p-6 bg-amber-50 border border-amber-200 rounded-[2.5rem] flex items-center justify-between shadow-lg">
                     <div className="flex-1">
                        <span className="text-[8px] font-black text-amber-600 uppercase block mb-1">Оффер от: {offer.fromPlayer}</span>
                        <h4 className="text-xs font-black text-slate-900 italic uppercase leading-none">Куплю актив #{offer.assetId}</h4>
                        <span className="text-sm font-black text-indigo-600 block mt-2">Цена: {offer.price} XP</span>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => respondToOffer(offer.id, true)} className="w-10 h-10 bg-emerald-500 text-white rounded-xl shadow-md active:scale-90"><i className="fa-solid fa-check"></i></button>
                        <button onClick={() => respondToOffer(offer.id, false)} className="w-10 h-10 bg-rose-500 text-white rounded-xl shadow-md active:scale-90"><i className="fa-solid fa-xmark"></i></button>
                     </div>
                  </div>
                ))}
             </div>
           )}

           {/* Asset Action */}
           {BOARD[gameState.playerPosition].type === 'asset' && !gameState.ownedAssets.includes(gameState.playerPosition) && (
             <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex justify-between items-center shadow-xl animate-bounce-subtle">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><i className={`fa-solid ${BOARD[gameState.playerPosition].icon}`}></i></div>
                   <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase italic leading-none">Свободный сектор</h4>
                      <p className="text-[10px] font-black text-indigo-600 uppercase mt-2">{BOARD[gameState.playerPosition].cost} XP</p>
                   </div>
                </div>
                <button 
                  onClick={() => buyAsset(gameState.playerPosition, BOARD[gameState.playerPosition].cost || 0)}
                  disabled={gameState.cash < (BOARD[gameState.playerPosition].cost || 0)}
                  className="px-6 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 disabled:opacity-20 transition-all"
                >
                  Купить
                </button>
             </div>
           )}

           {/* History Logs */}
           <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic px-2">Лог Арены</h3>
              {gameState.history.map((log, i) => (
                <div key={i} className={`p-4 rounded-3xl border shadow-sm italic text-[10px] font-bold ${i === 0 ? 'bg-white border-indigo-100 text-indigo-900' : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'}`}>
                   {log}
                </div>
              ))}
           </div>
        </div>
      ) : (
        <>
          {/* Стандартный фид как в предыдущей версии */}
          <section className="space-y-4 px-1">
             <div className="flex justify-between items-center px-4">
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
                     <div className="p-4 bg-slate-50 rounded-2xl italic text-[11px] text-slate-600 font-medium italic">
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
            <section className="space-y-4 px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Твои пруфы ждут подтверждения</h3>
              <div className="space-y-3">
                 {pendingMyLogs.map(log => (
                   <div key={log.id} className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden space-y-4">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/40 blur-2xl"></div>
                      <div className="relative z-10">
                         <h4 className="font-black text-indigo-900 text-xs uppercase italic">{log.goalTitle}</h4>
                         <p className="text-[9px] font-bold text-indigo-600 mt-1 italic">Объем: +{log.value} в общую копилку</p>
                      </div>

                      <div className="flex gap-2 relative z-10">
                        {partners.length === 0 ? (
                          <div className="w-full text-center py-2 text-[8px] font-black text-indigo-300 uppercase italic">У тебя нет друзей в племени</div>
                        ) : partners.map(p => (
                          <button key={p.id} onClick={() => onVerify(log.goal_id, log.id, p.id, 5)} className="flex-1 py-3 bg-white text-indigo-900 font-black text-[9px] rounded-xl uppercase shadow-sm italic active:scale-95 transition-all">
                            {p.name}
                          </button>
                        ))}
                      </div>
                   </div>
                 ))}
              </div>
            </section>
          )}
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-w-sm bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 space-y-6">
              <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Призвать Племя</h3>
              <input type="text" placeholder="Имя друга" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" id="p_name" />
              <div className="grid grid-cols-3 gap-2">
                 {Object.entries(roleMeta).map(([key, meta]) => (
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
