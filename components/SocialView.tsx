
import React, { useState, useEffect, useMemo } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

const DISTRICT_COLORS: Record<string, string> = {
  tech: 'bg-cyan-900/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
  realestate: 'bg-amber-900/40 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
  health: 'bg-emerald-900/40 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]',
  energy: 'bg-rose-900/40 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(251,113,133,0.3)]',
  web3: 'bg-violet-900/40 border-violet-400 text-violet-300 shadow-[0_0_15px_rgba(167,139,250,0.3)]',
  edu: 'bg-blue-900/40 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(96,165,250,0.3)]'
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

export const SocialView: React.FC<SocialViewProps> = ({ 
  gameState, rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame, joinLobbyManual, currentUserId 
}) => {
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [showDiceEffect, setShowDiceEffect] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === currentUserId;
  // Поиск себя в списке игроков и проверка флага Хоста
  const me = gameState.players.find(p => p.id === currentUserId);
  const isMeHost = me?.isHost;

  useEffect(() => {
    if (gameState.lastRoll) {
      setShowDiceEffect(true);
      setTimeout(() => setShowDiceEffect(false), 2000);
    }
  }, [gameState.lastRoll]);

  const narratorMessage = useMemo(() => {
    return gameState.history[0] || "Племя готово к вызову...";
  }, [gameState.history]);

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      await startGame();
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  if (gameState.status === 'lobby') {
    return (
      <div className="flex flex-col min-h-full animate-fade-in p-4 space-y-4">
        <div className="bg-[#020617] rounded-[3.5rem] border-4 border-[#1e293b] p-8 space-y-8 relative overflow-hidden shadow-2xl flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.2),transparent)]"></div>
          
          <div className="relative z-10 text-center space-y-4 w-full">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(99,102,241,0.4)] mx-auto border-4 border-white/10 animate-pulse">
              <i className="fa-solid fa-users-rays text-white"></i>
            </div>
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">ЗАЛ ОЖИДАНИЯ</h2>
            <div className="bg-indigo-500/10 px-6 py-2 rounded-full border border-indigo-500/30 flex items-center gap-2 mx-auto w-fit">
              <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">LOBBY: {gameState.lobbyId}</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 relative z-10">
            {gameState.players.map(p => (
              <div key={p.id} className={`p-5 bg-white/5 backdrop-blur-xl border-2 rounded-[2.2rem] flex flex-col items-center gap-3 animate-scale-up shadow-xl transition-all ${p.isHost ? 'border-indigo-500 shadow-indigo-500/20' : 'border-white/10'}`}>
                <div className={`w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 ${p.isHost ? 'border-indigo-400' : 'border-slate-700'}`}>
                  <img src={p.avatar} className="w-full h-full object-cover" onError={e => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} />
                </div>
                <div className="text-center">
                  <span className="font-black italic uppercase text-[10px] text-white block truncate w-24">{p.name}</span>
                  <span className={`text-[7px] font-black uppercase tracking-widest block mt-1 ${p.isHost ? 'text-indigo-400' : 'text-slate-500'}`}>{p.isHost ? 'ВОЖДЬ' : 'СОЮЗНИК'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full space-y-4 pt-4 relative z-10">
            <button onClick={generateInviteLink} className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              <i className="fa-solid fa-share-nodes"></i> ПОЗВАТЬ СВОИХ
            </button>
            
            {isMeHost ? (
               <button 
                disabled={gameState.players.length < 2 || isStarting}
                onClick={handleStartGame}
                className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
              >
                {isStarting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-play"></i>}
                {isStarting ? 'ЗАГРУЗКА...' : 'В БОЙ!'}
              </button>
            ) : (
               <div className="w-full py-6 bg-white/5 border border-white/10 rounded-[2rem] text-slate-400 font-black text-[10px] uppercase tracking-widest text-center italic animate-pulse">
                 Ждем команды Вождя...
               </div>
            )}
          </div>
        </div>
        
        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic px-2">Если ссылка не сработала:</h3>
           <div className="flex gap-2">
              <input type="text" placeholder="КОД ЛОББИ..." maxLength={6} value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-sm uppercase tracking-widest outline-none focus:border-indigo-500 transition-all" />
              <button onClick={() => { joinLobbyManual(manualCode); setManualCode(''); }} disabled={manualCode.length < 4} className="px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-20">ВХОД</button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative px-1 bg-slate-50 min-h-full">
      {/* DICE EFFECT */}
      {showDiceEffect && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl animate-fade-in">
          <div className="w-56 h-56 bg-white rounded-[4rem] shadow-[0_0_80px_rgba(99,102,241,0.5)] flex flex-col items-center justify-center text-slate-900 animate-bounce border-8 border-indigo-100">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">ВЫПАЛО</span>
             <span className="text-[10rem] font-black italic leading-none">{gameState.lastRoll}</span>
          </div>
        </div>
      )}

      {/* AI NARRATOR / ВЕДУЩИЙ */}
      <div className="mx-2 p-6 bg-[#0f172a] rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-2 border-indigo-500/50 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 animate-pulse">
            <i className="fa-solid fa-microphone-lines text-white text-lg"></i>
          </div>
          <div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] block italic mb-1">ГОЛОС ПЛЕМЕНИ</span>
            <p className="text-sm font-bold leading-tight italic text-slate-100 line-clamp-2">"{narratorMessage}"</p>
          </div>
        </div>
      </div>

      {/* PLAYERS STRIP */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-2">
        {gameState.players.map((p, idx) => (
          <div key={p.id} className={`flex-shrink-0 p-5 rounded-[2.5rem] border-2 transition-all duration-500 min-w-[150px] ${gameState.currentPlayerIndex === idx ? 'bg-white border-indigo-600 shadow-2xl scale-105' : 'bg-white/40 border-slate-100 text-slate-400'}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={p.avatar} className={`w-12 h-12 rounded-2xl object-cover border-2 ${gameState.currentPlayerIndex === idx ? 'border-indigo-400 shadow-md' : 'border-slate-200 grayscale opacity-60'}`} onError={e => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} />
                {gameState.currentPlayerIndex === idx && <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white animate-ping"></div>}
              </div>
              <div className="text-left">
                <span className="text-[11px] font-black uppercase italic block truncate w-16">{p.name}</span>
                <span className={`text-[9px] font-black ${gameState.currentPlayerIndex === idx ? 'text-indigo-600' : 'text-slate-400'}`}>{Math.round(p.cash).toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NEON BOARD */}
      <div className="bg-[#020617] p-5 rounded-[4.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative overflow-hidden border-8 border-[#1e293b] mx-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)] pointer-events-none"></div>
        <div className="grid grid-cols-4 gap-4 relative z-10">
          {BOARD.map((cell, idx) => {
            const occupiers = gameState.players.filter(p => p.position === idx);
            const ownerId = gameState.ownedAssets[idx];
            const isTarget = occupiers.some(p => p.id === currentUserId);
            const isTurnOwnerAt = occupiers.some(p => p.id === currentPlayer?.id);
            const districtStyle = cell.district ? DISTRICT_COLORS[cell.district] : 'bg-[#0f172a] border-white/5 text-slate-600';

            return (
              <button 
                key={cell.id} 
                onClick={() => setSelectedCell(cell)} 
                className={`aspect-square rounded-[1.8rem] flex flex-col items-center justify-center relative transition-all duration-300 border-2 ${
                  isTurnOwnerAt ? 'bg-white border-white scale-110 z-20 shadow-[0_0_40px_rgba(255,255,255,0.6)] text-slate-900' : 
                  ownerId ? DISTRICT_COLORS[cell.district || 'tech'] : districtStyle
                }`}
              >
                <i className={`fa-solid ${cell.icon} text-2xl ${isTurnOwnerAt ? 'text-slate-900' : 'text-inherit'}`}></i>
                
                {/* Аватары игроков на клетке */}
                {occupiers.length > 0 && (
                  <div className="absolute -top-1 -right-1 flex -space-x-2">
                    {occupiers.map(p => (
                      <div key={p.id} className="w-4 h-4 rounded-full border-2 border-[#020617] shadow-lg overflow-hidden">
                        <img src={p.avatar} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                
                {ownerId && (
                  <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTROLS */}
        <div className="mt-10 p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl flex flex-col items-center gap-5">
           <div className={`text-[11px] font-black uppercase tracking-[0.4em] italic transition-all ${isMyTurn ? 'text-indigo-400 animate-bounce' : 'text-slate-600'}`}>
             {isMyTurn ? 'ТВОЙ ВЫХОД!' : `ЖДЕМ ${currentPlayer?.name.toUpperCase()}`}
           </div>
           <button 
             disabled={!isMyTurn || !!gameState.lastRoll} 
             onClick={() => rollDice(BOARD)} 
             className="w-full py-7 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-5 flex items-center justify-center gap-5"
           >
             <i className="fa-solid fa-dice text-2xl"></i> БРОСОК
           </button>
        </div>
      </div>

      {/* ARENA LOG */}
      <div className="px-5 space-y-4 pb-12">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic px-2">Хроника Племени</h3>
        <div className="space-y-3">
          {gameState.history.map((log, i) => (
            <div key={i} className={`p-5 rounded-[1.8rem] border-2 text-[10px] font-bold italic transition-all ${
              i === 0 ? 'bg-indigo-600 text-white shadow-xl border-indigo-400 scale-[1.02]' : 
              log.includes('⚡️') ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-white text-slate-400 border-slate-100 opacity-70'
            }`}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* CELL MODAL (Enhanced) */}
      {selectedCell && (
        <div className="fixed inset-0 z-[1500] flex items-end p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedCell(null)}>
           <div className="w-full p-10 bg-white rounded-[4rem] shadow-2xl space-y-8 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl">
                       <i className={`fa-solid ${selectedCell.icon}`}></i>
                    </div>
                    <div>
                       <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedCell.title}</h4>
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mt-3 italic">{selectedCell.district || 'Узел событий'}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCell(null)} className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center transition-colors hover:bg-slate-100">
                    <i className="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>
              
              {selectedCell.type === 'asset' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-5">
                     <div className="p-7 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-2 italic tracking-widest">СТОИМОСТЬ</span>
                        <span className="text-2xl font-black italic">{selectedCell.cost?.toLocaleString()} XP</span>
                     </div>
                     <div className="p-7 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100">
                        <span className="text-[9px] font-black text-indigo-400 uppercase block mb-2 italic tracking-widest">ДОХОД</span>
                        <span className="text-2xl font-black text-indigo-700 italic">{selectedCell.rent?.toLocaleString()} XP</span>
                     </div>
                  </div>
                  
                  {isMyTurn && currentPlayer?.position === selectedCell.id && !gameState.ownedAssets[selectedCell.id] ? (
                    <button onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
                       ЗАХВАТИТЬ СЕКТОР
                    </button>
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center italic text-[11px] font-black text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-200">
                      {gameState.ownedAssets[selectedCell.id] ? 'СЕКТОР ПОД КОНТРОЛЕМ' : 'НУЖЕН ТВОЙ ХОД НА ЭТУ КЛЕТКУ'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 bg-slate-50 rounded-[3rem] text-center italic text-slate-400 text-sm border-2 border-dashed border-slate-100">
                   Узел активностей. Активируется при попадании игрока...
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
