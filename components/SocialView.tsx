
import React, { useState, useEffect } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

const DISTRICT_COLORS: Record<string, string> = {
  tech: 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] text-cyan-400',
  realestate: 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] text-amber-400',
  health: 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] text-emerald-400',
  energy: 'border-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.3)] text-rose-400',
  web3: 'border-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.3)] text-violet-400',
  edu: 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)] text-blue-400'
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
}

export const SocialView: React.FC<SocialViewProps> = ({ 
  gameState, rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame, joinLobbyManual 
}) => {
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [showDiceEffect, setShowDiceEffect] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const isMeHost = gameState.players.length > 0 && gameState.players[0].isHost;

  useEffect(() => {
    if (gameState.lastRoll) {
      setShowDiceEffect(true);
      setTimeout(() => setShowDiceEffect(false), 2000);
    }
  }, [gameState.lastRoll]);

  const handleManualJoin = () => {
    if (manualCode.length >= 4) {
      joinLobbyManual(manualCode);
      setManualCode('');
    }
  };

  const copyLobbyId = () => {
    if (gameState.lobbyId) {
      navigator.clipboard.writeText(gameState.lobbyId);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  if (gameState.status === 'lobby') {
    return (
      <div className="flex flex-col min-h-full animate-fade-in p-2 space-y-4">
        {/* Лобби Блок */}
        <div className="bg-[#020617] rounded-[3.5rem] border-4 border-[#1e293b] p-8 space-y-8 relative overflow-hidden shadow-2xl flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.15),transparent)]"></div>
          
          <div className="relative z-10 text-center space-y-4 w-full">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.2rem] flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(99,102,241,0.3)] mx-auto border-4 border-white/10">
              <i className="fa-solid fa-users-rays text-white"></i>
            </div>
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">ПЛЕМЯ</h2>
            
            <button 
              onClick={copyLobbyId}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-all mx-auto"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">СИНХРОНИЗАЦИЯ...</span>
              </div>
              <div className="bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">ID: {gameState.lobbyId}</span>
                <i className="fa-solid fa-copy text-indigo-400/50 text-[10px]"></i>
              </div>
            </button>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 relative z-10">
            {gameState.players.map(p => (
              <div key={p.id} className={`p-5 bg-white/5 backdrop-blur-xl border rounded-[2.2rem] flex flex-col items-center gap-3 animate-scale-up shadow-xl transition-all ${p.isHost ? 'border-indigo-500/50 shadow-indigo-500/10' : 'border-white/10'}`}>
                <div className={`w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 ${p.isHost ? 'border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.4)]' : 'border-slate-700'}`}>
                  <img src={p.avatar} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`; }} />
                </div>
                <div className="text-center w-full px-2">
                  <span className="font-black italic uppercase text-[10px] text-white block truncate">{p.name}</span>
                  <span className={`text-[7px] font-black uppercase tracking-widest block mt-0.5 ${p.isHost ? 'text-indigo-400' : 'text-slate-500'}`}>{p.isHost ? 'ВОЖДЬ' : 'СОЮЗНИК'}</span>
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - gameState.players.length) }).map((_, i) => (
              <div key={i} className="p-5 bg-white/5 border border-dashed border-white/10 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 opacity-10">
                <i className="fa-solid fa-user-plus text-slate-400 text-lg"></i>
              </div>
            ))}
          </div>

          <div className="w-full space-y-3 pt-2 relative z-10">
            <button 
              onClick={generateInviteLink}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-share-nodes"></i> ПОЗВАТЬ СВОИХ
            </button>
            
            {isMeHost ? (
               <button 
                disabled={gameState.players.length < 2}
                onClick={startGame}
                className="w-full py-5 bg-white text-slate-900 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-20"
              >
                В БОЙ!
              </button>
            ) : (
               <div className="w-full py-5 bg-white/5 border border-white/10 rounded-[1.8rem] text-slate-400 font-black text-[9px] uppercase tracking-[0.25em] text-center italic">
                 Ждем команды Вождя...
               </div>
            )}
          </div>
        </div>

        {/* Ручной ввод кода - План Б */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs">
                 <i className="fa-solid fa-key"></i>
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Вступить в Племя по коду</h3>
           </div>
           
           <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Введи ID..."
                maxLength={6}
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-sm uppercase tracking-widest outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
              />
              <button 
                onClick={handleManualJoin}
                disabled={manualCode.length < 4}
                className="px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-10 active:scale-95 transition-all"
              >
                ВСТУПИТЬ
              </button>
           </div>
           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight text-center italic">
             Используй этот способ, если ссылка открыла только чат с ботом
           </p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex] || gameState.players[0];

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative px-1">
      {/* DICE EFFECT */}
      {showDiceEffect && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 backdrop-blur-xl animate-fade-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-white blur-[100px] opacity-20 animate-pulse"></div>
            <div className="w-48 h-48 bg-white rounded-[4rem] shadow-2xl flex flex-col items-center justify-center text-slate-900 animate-bounce border-8 border-indigo-100">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-30 italic">ВЫПАЛО</span>
              <span className="text-9xl font-black italic leading-none">{gameState.lastRoll}</span>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end px-4 pt-4">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">АРЕНА</h2>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)] animate-pulse"></div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Раунд {gameState.turnNumber}</p>
          </div>
        </div>
      </div>

      {/* PLAYERS STRIP */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-3">
        {gameState.players.map((p, idx) => (
          <div key={p.id} className={`flex-shrink-0 p-5 rounded-[2.5rem] border-2 transition-all duration-500 min-w-[160px] ${gameState.currentPlayerIndex === idx ? 'bg-indigo-600 border-white text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 ${gameState.currentPlayerIndex === idx ? 'border-white/40 shadow-lg' : 'border-slate-100'}`}>
                <img src={p.avatar} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`; }} />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-black uppercase italic block truncate w-20">{p.name}</span>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${gameState.currentPlayerIndex === idx ? 'text-indigo-200' : 'text-slate-400'}`}>{Math.round(p.cash).toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* THE BOARD */}
      <div className="bg-[#020617] p-5 rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden border-8 border-[#0f172a] mx-1">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.1),transparent)] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(167,139,250,0.1),transparent)] pointer-events-none"></div>

        <div className="grid grid-cols-4 gap-4 relative z-10">
          {BOARD.map((cell, idx) => {
            const occupyingPlayers = gameState.players.filter(p => p.position === idx);
            const ownerId = gameState.ownedAssets[idx];
            const owner = gameState.players.find(p => p.id === ownerId);
            const isTarget = occupyingPlayers.some(p => p.id === currentPlayer?.id);

            return (
              <button 
                key={cell.id} 
                onClick={() => setSelectedCell(cell)}
                className={`aspect-square rounded-[1.8rem] flex flex-col items-center justify-center relative transition-all duration-300 border-2 ${
                  isTarget ? 'bg-white border-white scale-115 z-20 shadow-[0_0_30px_rgba(255,255,255,0.6)]' : 
                  ownerId ? `${DISTRICT_COLORS[cell.district || 'tech']} bg-white/10` : 'bg-slate-900/60 border-white/5'
                }`}
              >
                <i className={`fa-solid ${cell.icon} ${isTarget ? 'text-slate-900' : ownerId ? 'text-inherit' : 'text-slate-700'} text-2xl`}></i>
                {owner && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse"></div>}
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {occupyingPlayers.map(p => (
                    <div key={p.id} className="w-3.5 h-3.5 rounded-full border-2 border-[#020617] shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: p.isHost ? '#6366f1' : '#cbd5e1' }}></div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* CONTROLS */}
        <div className="mt-12 p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl flex flex-col items-center gap-6 shadow-2xl">
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">ХОД: <span className="text-white text-[11px]">{currentPlayer?.name}</span></span>
           </div>
           <button 
             disabled={!!gameState.lastRoll}
             onClick={() => rollDice(BOARD)}
             className="w-full py-7 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-10 flex items-center justify-center gap-5"
           >
             <i className="fa-solid fa-dice text-2xl"></i>
             БРОСОК
           </button>
        </div>
      </div>

      {/* CELL DETAILS MODAL */}
      {selectedCell && (
        <div className="fixed inset-0 z-[1500] flex items-end p-4 animate-fade-in bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedCell(null)}>
           <div className="w-full p-10 bg-white rounded-[4rem] shadow-2xl space-y-8 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl">
                       <i className={`fa-solid ${selectedCell.icon}`}></i>
                    </div>
                    <div>
                       <h4 className="text-3xl font-black text-slate-900 italic uppercase leading-none tracking-tighter">{selectedCell.title}</h4>
                       <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-3 block italic">{selectedCell.district ? `СЕКТОР: ${selectedCell.district}` : 'УЗЕЛ'}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCell(null)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <i className="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>
              
              {selectedCell.type === 'asset' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-5">
                     <div className="p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-2 italic">СТОИМОСТЬ</span>
                        <span className="text-2xl font-black italic">{selectedCell.cost?.toLocaleString()} XP</span>
                     </div>
                     <div className="p-7 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-400 uppercase block mb-2 italic">РЕНТА</span>
                        <span className="text-2xl font-black text-indigo-700 italic">{selectedCell.rent?.toLocaleString()} XP</span>
                     </div>
                  </div>
                  {!gameState.ownedAssets[selectedCell.id] && gameState.players.find(p => p.position === selectedCell.id) ? (
                    <button 
                      onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }}
                      className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
                    >
                      ЗАХВАТИТЬ СЕКТОР
                    </button>
                  ) : (
                    <div className="p-7 bg-slate-50 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
                       <p className="text-[11px] font-bold text-slate-400 uppercase italic">
                         {gameState.ownedAssets[selectedCell.id] ? 'СЕКТОР ПОД КОНТРОЛЕМ' : 'ВСТАНЬТЕ НА КЛЕТКУ ДЛЯ ЗАХВАТА'}
                       </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 bg-slate-50 rounded-[3rem] text-center italic text-slate-400">
                   Сектор событий. Ожидайте активации...
                </div>
              )}
           </div>
        </div>
      )}

      {/* LOG */}
      <div className="px-4 space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">ЖУРНАЛ АРЕНЫ</h3>
        <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pb-10">
          {gameState.history.map((log, i) => (
            <div key={i} className={`p-5 rounded-[1.8rem] border italic text-[10px] font-bold tracking-tight transition-all shadow-sm ${i === 0 ? 'bg-white border-indigo-100 text-indigo-900' : 'bg-slate-50 text-slate-400 opacity-60'}`}>
              <span className="opacity-20 mr-3 text-[8px]">{gameState.history.length - i}</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
