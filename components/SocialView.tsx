
import React, { useState, useEffect } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

const DISTRICT_COLORS: Record<string, string> = {
  tech: 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  realestate: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  health: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  energy: 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  web3: 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
  edu: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
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
}

export const SocialView: React.FC<SocialViewProps> = ({ gameState, rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame }) => {
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showDiceEffect, setShowDiceEffect] = useState(false);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  useEffect(() => {
    if (gameState.lastRoll) {
      setShowDiceEffect(true);
      setTimeout(() => setShowDiceEffect(false), 2000);
    }
  }, [gameState.lastRoll]);

  if (gameState.status === 'lobby') {
    return (
      <div className="flex flex-col h-full animate-fade-in space-y-8 p-6 bg-slate-950 text-white rounded-[3rem] border border-white/5 mx-1 my-4">
        <div className="text-center space-y-3 pt-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(79,70,229,0.4)]">
             <i className="fa-solid fa-users"></i>
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Племя</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ожидание союзников</p>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
          {gameState.players.map(p => (
            <div key={p.id} className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col items-center gap-3 animate-scale-up relative">
               <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border-2 border-indigo-500 shadow-lg">
                  <img src={p.avatar} className="w-full h-full object-cover" />
               </div>
               <span className="font-black italic uppercase text-[10px] tracking-tight truncate w-full text-center">{p.name}</span>
               {p.isHost && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - gameState.players.length) }).map((_, i) => (
            <div key={i} className="p-5 bg-white/5 border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-2 opacity-20">
               <i className="fa-solid fa-plus text-slate-400"></i>
            </div>
          ))}
        </div>

        <div className="space-y-4 pb-10">
           <button onClick={generateInviteLink} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all">
             <i className="fa-solid fa-share-nodes"></i> Пригласить Друзей
           </button>
           <button onClick={joinFakePlayer} className="w-full py-3 bg-white/5 text-slate-500 rounded-xl font-black text-[9px] uppercase tracking-widest border border-white/5">Тестовый игрок</button>
           <button 
             disabled={gameState.players.length < 2}
             onClick={startGame}
             className="w-full py-6 bg-white text-slate-900 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-10"
           >
             В Бой
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative px-1">
      {/* Dice Animation Overlay */}
      {showDiceEffect && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
           <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-30 animate-pulse"></div>
              <div className="w-40 h-40 bg-white rounded-[3.5rem] shadow-2xl flex items-center justify-center text-8xl font-black italic text-slate-900 animate-bounce">
                {gameState.lastRoll}
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end px-3 pt-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Арена</h2>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Раунд {gameState.turnNumber}</p>
          </div>
        </div>
      </div>

      {/* Players Strip */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
        {gameState.players.map((p, idx) => (
          <div key={p.id} className={`flex-shrink-0 p-4 rounded-[2rem] border-2 transition-all min-w-[130px] ${gameState.currentPlayerIndex === idx ? 'bg-indigo-600 border-white text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 opacity-80'}`}>
            <div className="flex items-center gap-3">
              <img src={p.avatar} className="w-10 h-10 rounded-xl object-cover border-2 border-white/20" />
              <div>
                <span className="text-[10px] font-black uppercase italic block truncate w-16">{p.name}</span>
                <span className="text-[8px] font-bold opacity-60 uppercase">{Math.round(p.cash).toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Board - Futuristic Look */}
      <div className="bg-[#020617] p-4 rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden border-4 border-[#0f172a] mx-1">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="grid grid-cols-4 gap-3 relative z-10">
          {BOARD.map((cell, idx) => {
            const occupyingPlayers = gameState.players.filter(p => p.position === idx);
            const ownerId = gameState.ownedAssets[idx];
            const owner = gameState.players.find(p => p.id === ownerId);
            const isTarget = occupyingPlayers.some(p => p.id === currentPlayer.id);

            return (
              <button 
                key={cell.id} 
                onClick={() => setSelectedCell(cell)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border-2 ${
                  isTarget ? 'bg-white border-white scale-110 z-20 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 
                  ownerId ? `${DISTRICT_COLORS[cell.district || 'tech']} bg-white/5` : 'bg-slate-900/50 border-white/5'
                }`}
              >
                <i className={`fa-solid ${cell.icon} ${isTarget ? 'text-slate-900' : ownerId ? 'text-white' : 'text-slate-700'} text-xl`}></i>
                
                {/* Visual Indicators */}
                {owner && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>}
                
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {occupyingPlayers.map(p => (
                    <div key={p.id} className="w-3 h-3 rounded-full border-2 border-[#020617] shadow-sm animate-pulse" style={{ backgroundColor: p.id === gameState.players[0].id ? '#6366f1' : '#cbd5e1' }}></div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Panel */}
        <div className="mt-10 p-6 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-xl flex flex-col items-center gap-5">
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Система активна:</span>
              <span className="text-[10px] font-black text-white uppercase italic">{currentPlayer.name}</span>
           </div>
           <button 
             disabled={!!gameState.lastRoll}
             onClick={() => rollDice(BOARD)}
             className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4"
           >
             <i className="fa-solid fa-dice text-lg"></i>
             БРОСОК
           </button>
        </div>
      </div>

      {/* Selected Cell Overlay - Radar Style */}
      {selectedCell && (
        <div className="fixed inset-0 z-[600] flex items-end p-4 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCell(null)}>
           <div className="w-full p-8 bg-white rounded-[3.5rem] shadow-2xl space-y-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.8rem] flex items-center justify-center text-2xl shadow-xl">
                       <i className={`fa-solid ${selectedCell.icon}`}></i>
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 italic uppercase leading-none">{selectedCell.title}</h4>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block italic">{selectedCell.district ? `Сектор ${selectedCell.district}` : 'Системный узел'}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCell(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>
              
              {selectedCell.type === 'asset' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 italic">Капитал</span>
                        <span className="text-xl font-black italic">{selectedCell.cost?.toLocaleString()} XP</span>
                     </div>
                     <div className="p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                        <span className="text-[9px] font-black text-indigo-400 uppercase block mb-1 italic">Рента</span>
                        <span className="text-xl font-black text-indigo-700 italic">{selectedCell.rent?.toLocaleString()} XP</span>
                     </div>
                  </div>
                  {!gameState.ownedAssets[selectedCell.id] && gameState.players.find(p => p.position === selectedCell.id) ? (
                    <button 
                      onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }}
                      className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl"
                    >
                      Захватить Сектор
                    </button>
                  ) : (
                    <div className="p-5 bg-slate-50 rounded-3xl text-center">
                       <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                         {gameState.ownedAssets[selectedCell.id] ? 'Сектор уже под контролем' : 'Встань на клетку для захвата'}
                       </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                   <p className="text-sm font-bold text-slate-400 italic">Ожидание активации протокола...</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Log - Compact */}
      <div className="px-3 space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
           <i className="fa-solid fa-terminal text-[8px]"></i> ТЕРМИНАЛ
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
          {gameState.history.map((log, i) => (
            <div key={i} className={`p-4 rounded-[1.5rem] border italic text-[9px] font-bold tracking-tight transition-all ${i === 0 ? 'bg-white border-indigo-100 text-indigo-900 shadow-sm' : 'bg-slate-50 text-slate-400 border-transparent opacity-60'}`}>
              <span className="opacity-30 mr-2">{gameState.history.length - i}.</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
