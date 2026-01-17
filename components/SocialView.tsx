
import React, { useState, useMemo } from 'react';
import { AccountabilityPartner, PartnerRole, YearGoal, GameState, BoardCell, GamePlayer, CellType, AssetDistrict } from '../types';

const DISTRICT_INFO: Record<string, { color: string, label: string }> = {
  tech: { color: 'border-blue-500 bg-blue-500/10', label: 'Технологии' },
  realestate: { color: 'border-amber-500 bg-amber-500/10', label: 'Недвижимость' },
  health: { color: 'border-emerald-500 bg-emerald-500/10', label: 'Биотех' },
  energy: { color: 'border-rose-500 bg-rose-500/10', label: 'Энергия' },
  web3: { color: 'border-violet-500 bg-violet-500/10', label: 'Web3' },
  edu: { color: 'border-cyan-500 bg-cyan-500/10', label: 'Образование' }
};

// Fix: Explicitly cast the board array to BoardCell[] to prevent string widening of literals like 'start', 'asset', etc.
const BOARD: BoardCell[] = ([
  { id: 0, type: 'start', title: 'Старт', icon: 'fa-rocket' },
  { id: 1, type: 'asset', district: 'tech', title: 'App Studio', cost: 10000, rent: 1500, icon: 'fa-mobile' },
  { id: 2, type: 'event', title: 'Событие', icon: 'fa-bolt' },
  { id: 3, type: 'asset', district: 'tech', title: 'AI SaaS', cost: 18000, rent: 3000, icon: 'fa-brain' },
  { id: 4, type: 'tax', title: 'Налог', icon: 'fa-hand-holding-dollar' },
  { id: 5, type: 'asset', district: 'realestate', title: 'Co-working', cost: 25000, rent: 4500, icon: 'fa-couch' },
  { id: 6, type: 'event', title: 'Шанс', icon: 'fa-dice' },
  { id: 8, type: 'asset', district: 'health', title: 'Bio-Clinic', cost: 55000, rent: 12000, icon: 'fa-dna' },
  { id: 9, type: 'event', title: 'Событие', icon: 'fa-microscope' },
  { id: 10, type: 'asset', district: 'health', title: 'Pharma', cost: 75000, rent: 18000, icon: 'fa-pills' },
  { id: 11, type: 'prison', title: 'Выгорание', icon: 'fa-bed' },
  { id: 12, type: 'asset', district: 'energy', title: 'Solar', cost: 90000, rent: 22000, icon: 'fa-sun' },
  { id: 13, type: 'event', title: 'Событие', icon: 'fa-bolt' },
  { id: 14, type: 'asset', district: 'energy', title: 'Nuclear', cost: 120000, rent: 35000, icon: 'fa-atom' },
  { id: 15, type: 'tax', title: 'Газ', icon: 'fa-fire' },
  { id: 16, type: 'asset', district: 'web3', title: 'DAO', cost: 150000, rent: 45000, icon: 'fa-users-rectangle' },
  { id: 17, type: 'event', title: 'Шанс', icon: 'fa-gem' },
  { id: 18, type: 'asset', district: 'web3', title: 'Exchange', cost: 200000, rent: 70000, icon: 'fa-chart-line' },
  { id: 19, type: 'asset', district: 'edu', title: 'Courses', cost: 250000, rent: 90000, icon: 'fa-graduation-cap' },
  { id: 20, type: 'event', title: 'Событие', icon: 'fa-scroll' },
  { id: 21, type: 'asset', district: 'edu', title: 'University', cost: 400000, rent: 150000, icon: 'fa-building-columns' },
  { id: 22, type: 'tax', title: 'Инфляция', icon: 'fa-arrow-down-wide-short' },
  { id: 23, type: 'event', title: 'Событие', icon: 'fa-star' },
  { id: 7, type: 'asset', district: 'realestate', title: 'Smart City', cost: 40000, rent: 8000, icon: 'fa-city' },
] as BoardCell[]).sort((a,b) => a.id - b.id);

interface SocialViewProps {
  partners: AccountabilityPartner[];
  goals: YearGoal[];
  onVerify: (goalId: string, logId: string, verifierId: string, rating?: number, comment?: string) => void;
  onAddPartner: (name: string, role: string) => void;
  gameState: GameState;
  rollDice: (board: BoardCell[]) => void;
  buyAsset: (cellId: number, board: BoardCell[]) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ partners, goals, onVerify, onAddPartner, gameState, rollDice, buyAsset }) => {
  const [activeMode, setActiveMode] = useState<'feed' | 'arena'>('feed');
  const [isRolling, setIsRolling] = useState(false);
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [showRules, setShowRules] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const handleRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      rollDice(BOARD);
      setIsRolling(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Племя</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Арена Капитала</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowRules(true)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm"><i className="fa-solid fa-circle-info"></i></button>
           <button onClick={() => setActiveMode(activeMode === 'feed' ? 'arena' : 'feed')} className={`w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm transition-all ${activeMode === 'arena' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-indigo-600'}`}>
              <i className={`fa-solid ${activeMode === 'arena' ? 'fa-rss' : 'fa-chess-board'}`}></i>
           </button>
        </div>
      </header>

      {activeMode === 'arena' ? (
        <div className="space-y-6 animate-fade-in px-1">
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {gameState.players.map((p, idx) => (
                <div key={p.id} className={`flex-shrink-0 p-3 rounded-2xl border-2 transition-all ${gameState.currentPlayerIndex === idx ? 'bg-indigo-600 border-white text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 overflow-hidden">
                        {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-[8px] text-indigo-400 font-bold">{p.name[0]}</div>}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tighter italic">{p.name}</span>
                   </div>
                   <div className="mt-1 text-xs font-black italic">{p.cash.toLocaleString()} XP</div>
                </div>
              ))}
           </div>

           <div className="bg-slate-950 p-6 rounded-[3rem] shadow-2xl relative overflow-hidden border-4 border-slate-900">
              <div className="grid grid-cols-4 gap-2 relative z-10">
                 {BOARD.map((cell, idx) => {
                   const occupyingPlayers = gameState.players.filter(p => p.position === idx);
                   const isOccupied = occupyingPlayers.length > 0;
                   const isCurrentPlayerHere = currentPlayer?.position === idx;
                   const ownerId = gameState.ownedAssets[idx];
                   const owner = gameState.players.find(p => p.id === ownerId);
                   const districtStyle = cell.district ? DISTRICT_INFO[cell.district as string].color : 'bg-slate-800/40 border-slate-800';

                   return (
                     <button 
                      key={cell.id} 
                      onClick={() => setSelectedCell(cell)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border-2 ${
                        isCurrentPlayerHere ? 'bg-white border-indigo-400 scale-105 z-20 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 
                        ownerId ? 'bg-emerald-500/20 border-emerald-500/50' : districtStyle
                      }`}
                     >
                        <i className={`fa-solid ${cell.icon} ${isCurrentPlayerHere ? 'text-indigo-600' : ownerId ? 'text-emerald-400' : 'text-slate-600'} text-lg mb-1`}></i>
                        <span className="text-[5px] font-black uppercase text-slate-400 tracking-tighter text-center leading-none">{cell.title}</span>
                        
                        {ownerId && (
                           <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-emerald-500 shadow-sm border border-white"></div>
                        )}

                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                           {occupyingPlayers.map(p => (
                             <div key={p.id} className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.id === currentPlayer?.id ? '#6366f1' : '#cbd5e1' }}></div>
                           ))}
                        </div>
                     </button>
                   );
                 })}
              </div>

              <div className="mt-8 bg-white/5 p-6 rounded-3xl border border-white/5 relative z-10 flex flex-col gap-4">
                 <div className="flex justify-between items-end">
                    <div>
                       <span className="text-[8px] font-black text-slate-500 uppercase block italic mb-1">Ход игрока</span>
                       <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{currentPlayer?.name || "..."}</h3>
                    </div>
                    <button 
                      disabled={isRolling}
                      onClick={handleRoll}
                      className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                    >
                       {isRolling ? '...' : 'Бросить Кубик'}
                    </button>
                 </div>
              </div>
           </div>

           {selectedCell && (
             <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl animate-scale-up space-y-4">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-xl"><i className={`fa-solid ${selectedCell.icon}`}></i></div>
                      <div>
                         <h4 className="text-lg font-black text-slate-900 italic uppercase leading-none">{selectedCell.title}</h4>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block italic">{selectedCell.district ? DISTRICT_INFO[selectedCell.district as string].label : 'Специальный сектор'}</span>
                      </div>
                   </div>
                   <button onClick={() => setSelectedCell(null)} className="text-slate-300"><i className="fa-solid fa-xmark"></i></button>
                </div>
                
                {selectedCell.type === 'asset' && (
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Стоимость актива</span>
                        <span className="text-lg font-black text-slate-900">{selectedCell.cost?.toLocaleString()} XP</span>
                     </div>
                     <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1 italic">Аренда (Доход)</span>
                        <span className="text-lg font-black text-indigo-700">{selectedCell.rent?.toLocaleString()} XP</span>
                     </div>
                  </div>
                )}

                {selectedCell.type === 'asset' && !gameState.ownedAssets[selectedCell.id] && currentPlayer?.position === selectedCell.id && (
                  <button 
                    onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95"
                  >
                    Захватить Актив за {selectedCell.cost} XP
                  </button>
                )}

                {gameState.ownedAssets[selectedCell.id] && (
                   <div className="p-4 bg-emerald-50 rounded-2xl text-center border border-emerald-100">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">
                        Владелец: {gameState.players.find(p => p.id === gameState.ownedAssets[selectedCell.id])?.name}
                      </span>
                   </div>
                )}
             </div>
           )}

           <div className="space-y-3 px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">События Арены</h3>
              {gameState.history.map((log, i) => (
                <div key={i} className={`p-4 rounded-3xl border italic text-[10px] font-bold ${i === 0 ? 'bg-white border-indigo-100 text-indigo-900 shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'}`}>
                   {log}
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 mx-1">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Лента событий Племени временно пуста</p>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] p-8 overflow-y-auto animate-fade-in flex items-center justify-center">
           <div className="max-w-sm w-full bg-white rounded-[3rem] p-10 space-y-6">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Манифест Арены</h3>
              <div className="space-y-4 text-slate-500 text-xs font-bold leading-relaxed italic">
                 <p>1. <span className="text-indigo-600">Цель:</span> Накопить максимальный XP-капитал и обанкротить Племя.</p>
                 <p>2. <span className="text-indigo-600">Активы:</span> Покупай активы, чтобы другие платили тебе аренду. Каждый район имеет свои бонусы.</p>
                 <p>3. <span className="text-indigo-600">Аренда:</span> Если ты владеешь всеми активами района, аренда удваивается!</p>
                 <p>4. <span className="text-indigo-600">События:</span> Клетки событий могут дать буст или отобрать ресурсы. Слушай ИИ-Банкира.</p>
              </div>
              <button onClick={() => setShowRules(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Понятно</button>
           </div>
        </div>
      )}
    </div>
  );
};
