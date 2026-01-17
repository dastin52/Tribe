
import React, { useState, useEffect, useMemo } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

const DISTRICT_COLORS: Record<string, string> = {
  tech: 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]',
  realestate: 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
  health: 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]',
  energy: 'bg-rose-500/20 border-rose-400 text-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.4)]',
  web3: 'bg-violet-500/20 border-violet-400 text-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.4)]',
  edu: 'bg-blue-500/20 border-blue-400 text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.4)]'
};

const BOARD: BoardCell[] = ([
  { id: 0, type: 'start', title: 'Старт', icon: 'fa-rocket' },
  { id: 1, type: 'asset', district: 'tech', title: 'App Studio', cost: 8000, rent: 1200, icon: 'fa-mobile' },
  { id: 2, type: 'event', title: 'Событие', icon: 'fa-bolt' },
  { id: 3, type: 'asset', district: 'tech', title: 'AI SaaS', cost: 15000, rent: 2500, icon: 'fa-brain' },
  { id: 4, type: 'tax', title: 'Налог', icon: 'fa-hand-holding-dollar' },
  { id: 5, type: 'asset', district: 'realestate', title: 'Co-working', cost: 22000, rent: 4000, icon: 'fa-couch' },
  { id: 6, type: 'event', title: 'Шанс', icon: 'fa-dice' },
  { id: 7, type: 'asset', district: 'realestate', title: 'Smart City', cost: 35000, rent: 7000, icon: 'fa-city' },
  { id: 8, type: 'asset', district: 'health', title: 'Bio-Clinic', cost: 50000, rent: 11000, icon: 'fa-dna' },
  { id: 9, type: 'event', title: 'Событие', icon: 'fa-microscope' },
  { id: 10, type: 'asset', district: 'health', title: 'Pharma', cost: 70000, rent: 16000, icon: 'fa-pills' },
  { id: 11, type: 'prison', title: 'Выгорание', icon: 'fa-bed' },
  { id: 12, type: 'asset', district: 'energy', title: 'Solar', cost: 90000, rent: 20000, icon: 'fa-sun' },
  { id: 13, type: 'event', title: 'Событие', icon: 'fa-bolt' },
  { id: 14, type: 'asset', district: 'energy', title: 'Nuclear', cost: 120000, rent: 30000, icon: 'fa-atom' },
  { id: 15, type: 'tax', title: 'Газ', icon: 'fa-fire' },
  { id: 16, type: 'asset', district: 'web3', title: 'DAO', cost: 140000, rent: 40000, icon: 'fa-users-rectangle' },
  { id: 17, type: 'event', title: 'Шанс', icon: 'fa-gem' },
  { id: 18, type: 'asset', district: 'web3', title: 'Exchange', cost: 190000, rent: 60000, icon: 'fa-chart-line' },
  { id: 19, type: 'asset', district: 'edu', title: 'Courses', cost: 240000, rent: 85000, icon: 'fa-graduation-cap' },
  { id: 20, type: 'event', title: 'Событие', icon: 'fa-scroll' },
  { id: 21, type: 'asset', district: 'edu', title: 'University', cost: 380000, rent: 140000, icon: 'fa-building-columns' },
  { id: 22, type: 'tax', title: 'Инфляция', icon: 'fa-arrow-down-wide-short' },
  { id: 23, type: 'event', title: 'Событие', icon: 'fa-star' },
] as BoardCell[]).sort((a,b) => a.id - b.id);

interface SocialViewProps {
  gameState: GameState;
  rollDice: (board: BoardCell[]) => void;
  buyAsset: (cellId: number, board: BoardCell[]) => void;
  generateInviteLink: () => void;
  joinFakePlayer: () => void;
  startGame: () => void;
  joinLobbyManual: (code: string) => void;
  currentUserId: string;
}

export const SocialView: React.FC<SocialViewProps & { currentUserId: string }> = ({ 
  gameState, rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame, joinLobbyManual, currentUserId 
}) => {
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [showDiceEffect, setShowDiceEffect] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === currentUserId;
  const isMeHost = gameState.players.length > 0 && gameState.players[0].isHost;

  useEffect(() => {
    if (gameState.lastRoll) {
      setShowDiceEffect(true);
      setTimeout(() => setShowDiceEffect(false), 2000);
    }
  }, [gameState.lastRoll]);

  const narratorMessage = useMemo(() => {
    return gameState.history[0] || "Ожидание хода...";
  }, [gameState.history]);

  if (gameState.status === 'lobby') {
    return (
      <div className="flex flex-col min-h-full animate-fade-in p-2 space-y-4">
        <div className="bg-[#020617] rounded-[3.5rem] border-4 border-[#1e293b] p-8 space-y-8 relative overflow-hidden shadow-2xl flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.15),transparent)]"></div>
          <div className="relative z-10 text-center space-y-4 w-full">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.2rem] flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(99,102,241,0.3)] mx-auto border-4 border-white/10">
              <i className="fa-solid fa-users-rays text-white"></i>
            </div>
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">ПЛЕМЯ</h2>
            <div className="bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 flex items-center gap-2 mx-auto w-fit">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">ID: {gameState.lobbyId}</span>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 gap-4 relative z-10">
            {gameState.players.map(p => (
              <div key={p.id} className={`p-5 bg-white/5 backdrop-blur-xl border rounded-[2.2rem] flex flex-col items-center gap-3 animate-scale-up shadow-xl transition-all ${p.isHost ? 'border-indigo-500/50' : 'border-white/10'}`}>
                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-slate-700">
                  <img src={p.avatar} className="w-full h-full object-cover" onError={e => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} />
                </div>
                <span className="font-black italic uppercase text-[10px] text-white block truncate">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="w-full space-y-3 pt-2 relative z-10">
            <button onClick={generateInviteLink} className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">ПОЗВАТЬ СВОИХ</button>
            {isMeHost && <button disabled={gameState.players.length < 2} onClick={startGame} className="w-full py-5 bg-white text-slate-900 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-20">В БОЙ!</button>}
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 space-y-4">
           <input type="text" placeholder="ВВЕДИ КОД ЛОББИ..." maxLength={6} value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-sm uppercase tracking-widest outline-none focus:border-indigo-500 transition-all" />
           <button onClick={() => { joinLobbyManual(manualCode); setManualCode(''); }} disabled={manualCode.length < 4} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">ПРИСОЕДИНИТЬСЯ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative px-1 bg-slate-50 min-h-full">
      {/* DICE ANIMATION */}
      {showDiceEffect && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="w-48 h-48 bg-white rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center text-slate-900 animate-bounce border-8 border-indigo-100">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">ВЫПАЛО</span>
             <span className="text-9xl font-black italic">{gameState.lastRoll}</span>
          </div>
        </div>
      )}

      {/* AI NARRATOR / ВЕДУЩИЙ */}
      <div className="mx-2 p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-2 border-indigo-500/30">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center animate-pulse">
            <i className="fa-solid fa-headset text-white text-xs"></i>
          </div>
          <div>
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] block italic">ГОЛОС ПЛЕМЕНИ</span>
            <p className="text-xs font-bold leading-tight italic mt-1 text-slate-200">"{narratorMessage}"</p>
          </div>
        </div>
      </div>

      {/* PLAYERS STRIP */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-3 py-2">
        {gameState.players.map((p, idx) => (
          <div key={p.id} className={`flex-shrink-0 p-4 rounded-[2rem] border-2 transition-all duration-500 min-w-[140px] ${gameState.currentPlayerIndex === idx ? 'bg-white border-indigo-600 shadow-[0_15px_30px_rgba(79,70,229,0.2)] scale-105' : 'bg-white/50 border-slate-200 text-slate-400'}`}>
            <div className="flex items-center gap-3">
              <img src={p.avatar} className={`w-10 h-10 rounded-xl object-cover border-2 ${gameState.currentPlayerIndex === idx ? 'border-indigo-400' : 'border-slate-200 opacity-40'}`} onError={e => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase italic block truncate w-16">{p.name}</span>
                <span className={`text-[8px] font-black ${gameState.currentPlayerIndex === idx ? 'text-indigo-600' : 'text-slate-400'}`}>{Math.round(p.cash).toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NEON BOARD */}
      <div className="bg-[#020617] p-4 rounded-[4rem] shadow-[0_30px_80px_rgba(0,0,0,0.6)] relative overflow-hidden border-8 border-[#0f172a] mx-1">
        <div className="grid grid-cols-4 gap-3 relative z-10">
          {BOARD.map((cell, idx) => {
            const occupiers = gameState.players.filter(p => p.position === idx);
            const ownerId = gameState.ownedAssets[idx];
            const isTarget = occupiers.some(p => p.id === currentPlayer?.id);
            const districtStyle = cell.district ? DISTRICT_COLORS[cell.district] : 'bg-slate-900 border-white/5 text-slate-500';

            return (
              <button key={cell.id} onClick={() => setSelectedCell(cell)} className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center relative transition-all duration-300 border-2 ${isTarget ? 'bg-white border-white scale-110 z-20 shadow-[0_0_40px_rgba(255,255,255,0.5)]' : ownerId ? DISTRICT_COLORS[cell.district || 'tech'] : districtStyle}`}>
                <i className={`fa-solid ${cell.icon} ${isTarget ? 'text-slate-900' : 'text-inherit'} text-2xl`}></i>
                {occupiers.length > 0 && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5">
                    {occupiers.map(p => (
                      <div key={p.id} className="w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-lg" style={{ backgroundColor: p.isHost ? '#6366f1' : '#cbd5e1' }}></div>
                    ))}
                  </div>
                )}
                {ownerId && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse"></div>}
              </button>
            );
          })}
        </div>

        {/* CONTROLS */}
        <div className="mt-8 p-6 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl flex flex-col items-center gap-4">
           <div className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${isMyTurn ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`}>
             {isMyTurn ? 'ТВОЙ ХОД!' : `ЖДЕМ ${currentPlayer?.name.toUpperCase()}`}
           </div>
           <button disabled={!isMyTurn || !!gameState.lastRoll} onClick={() => rollDice(BOARD)} className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all disabled:opacity-10 flex items-center justify-center gap-4">
             <i className="fa-solid fa-dice text-xl"></i> БРОСОК
           </button>
        </div>
      </div>

      {/* CELL MODAL */}
      {selectedCell && (
        <div className="fixed inset-0 z-[1500] flex items-end p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in" onClick={() => setSelectedCell(null)}>
           <div className="w-full p-8 bg-white rounded-[3.5rem] shadow-2xl space-y-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center text-2xl shadow-xl"><i className={`fa-solid ${selectedCell.icon}`}></i></div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedCell.title}</h4>
                       <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mt-1">{selectedCell.district || 'Событие'}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCell(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
              </div>
              
              {selectedCell.type === 'asset' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">ЦЕНА</span>
                        <span className="text-xl font-black italic">{selectedCell.cost?.toLocaleString()} XP</span>
                     </div>
                     <div className="p-5 bg-indigo-50 rounded-[1.8rem] border border-indigo-100">
                        <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">ДОХОД</span>
                        <span className="text-xl font-black text-indigo-700 italic">{selectedCell.rent?.toLocaleString()} XP</span>
                     </div>
                  </div>
                  {!gameState.ownedAssets[selectedCell.id] && currentPlayer?.id === currentUserId && currentPlayer.position === selectedCell.id ? (
                    <button onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">ЗАХВАТИТЬ СЕКТОР</button>
                  ) : (
                    <div className="p-5 bg-slate-50 rounded-[1.8rem] text-center italic text-[10px] font-bold text-slate-400 uppercase">
                      {gameState.ownedAssets[selectedCell.id] ? 'СЕКТОР ЗАХВАЧЕН' : 'ВСТАНЬТЕ НА СЕКТОР ДЛЯ ПОКУПКИ'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 bg-slate-50 rounded-[2.5rem] text-center italic text-slate-400 text-xs">Активируется при попадании игрока...</div>
              )}
           </div>
        </div>
      )}

      {/* ARENA LOG */}
      <div className="px-4 space-y-3 pb-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic px-2">Журнал Арены</h3>
        <div className="space-y-2">
          {gameState.history.map((log, i) => (
            <div key={i} className={`p-4 rounded-[1.5rem] border text-[9px] font-bold italic transition-all ${i === 0 ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' : 'bg-white text-slate-400 border-slate-100 opacity-60'}`}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
