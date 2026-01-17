
import React, { useState, useEffect } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

const DISTRICT_COLORS: Record<string, string> = {
  tech: 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] text-cyan-400',
  realestate: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] text-amber-400',
  health: 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] text-emerald-400',
  energy: 'border-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.4)] text-rose-400',
  web3: 'border-violet-400 shadow-[0_0_20_rgba(167,139,250,0.4)] text-violet-400',
  edu: 'border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.4)] text-blue-400'
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
      <div className="flex flex-col h-full animate-fade-in space-y-8 p-6 bg-[#020617] text-white rounded-[3.5rem] border-4 border-[#1e293b] mx-1 my-4 relative overflow-hidden shadow-2xl">
        {/* Анимированный фон лобби */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent)] animate-pulse"></div>
        
        <div className="text-center space-y-4 pt-4 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(79,70,229,0.5)] border-2 border-white/20">
             <i className="fa-solid fa-crown text-white"></i>
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">ПЛЕМЯ</h2>
          <div className="flex items-center justify-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Зал ожидания активен</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 relative z-10">
          {gameState.players.map(p => (
            <div key={p.id} className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 animate-scale-up shadow-xl">
               <div className="w-20 h-20 rounded-[1.8rem] bg-slate-800 overflow-hidden border-2 border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.3)]">
                  <img src={p.avatar} className="w-full h-full object-cover" />
               </div>
               <div className="text-center">
                  <span className="font-black italic uppercase text-[11px] tracking-tight truncate w-full block text-indigo-200">{p.name}</span>
                  {p.isHost && <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-1 block">Вождь</span>}
               </div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - gameState.players.length) }).map((_, i) => (
            <div key={i} className="p-6 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 opacity-30">
               <i className="fa-solid fa-user-plus text-slate-500 text-xl"></i>
            </div>
          ))}
        </div>

        <div className="space-y-4 pb-12 relative z-10">
           <button onClick={generateInviteLink} className="w-full py-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(79,70,229,0.4)] flex items-center justify-center gap-4 active:scale-95 transition-all">
             <i className="fa-solid fa-paper-plane"></i> ПРИГЛАСИТЬ СВОИХ
           </button>
           <button onClick={joinFakePlayer} className="w-full py-3 bg-white/5 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-colors">Добавить союзника-бота</button>
           <button 
             disabled={gameState.players.length < 2}
             onClick={startGame}
             className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-5 disabled:grayscale"
           >
             В ПУТЬ
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative px-1">
      {/* Эффект Броска Кубика */}
      {showDiceEffect && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-fade-in">
           <div className="relative group">
              <div className="absolute inset-0 bg-white blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="w-48 h-48 bg-white rounded-[4rem] shadow-[0_0_80px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center text-slate-900 animate-bounce border-8 border-indigo-100">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-30 italic">Результат</span>
                 <span className="text-9xl font-black italic leading-none">{gameState.lastRoll}</span>
              </div>
           </div>
        </div>
      )}

      {/* Верхняя панель Арены */}
      <div className="flex justify-between items-end px-4 pt-4">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">АРЕНА</h2>
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.8)] animate-pulse"></div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Раунд {gameState.turnNumber}</p>
          </div>
        </div>
      </div>

      {/* Лента игроков */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-3">
        {gameState.players.map((p, idx) => (
          <div key={p.id} className={`flex-shrink-0 p-5 rounded-[2.5rem] border-2 transition-all duration-500 min-w-[150px] ${gameState.currentPlayerIndex === idx ? 'bg-indigo-600 border-white text-white shadow-2xl scale-105 -rotate-1' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 ${gameState.currentPlayerIndex === idx ? 'border-white/40 shadow-lg' : 'border-slate-100'}`}>
                 <img src={p.avatar} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase italic block truncate w-20">{p.name}</span>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${gameState.currentPlayerIndex === idx ? 'text-indigo-200' : 'text-slate-400'}`}>{Math.round(p.cash).toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Игровое Поле - Новая Эстетика */}
      <div className="bg-[#020617] p-5 rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden border-8 border-[#0f172a] mx-1">
        {/* Живые градиенты */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.1),transparent)] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(167,139,250,0.1),transparent)] pointer-events-none"></div>

        <div className="grid grid-cols-4 gap-4 relative z-10">
          {BOARD.map((cell, idx) => {
            const occupyingPlayers = gameState.players.filter(p => p.position === idx);
            const ownerId = gameState.ownedAssets[idx];
            const owner = gameState.players.find(p => p.id === ownerId);
            const isTarget = occupyingPlayers.some(p => p.id === currentPlayer.id);

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
                
                {/* Индикаторы владения */}
                {owner && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse"></div>}
                
                {/* Фишки игроков */}
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {occupyingPlayers.map(p => (
                    <div key={p.id} className="w-3.5 h-3.5 rounded-full border-2 border-[#020617] shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: p.id === gameState.players[0].id ? '#6366f1' : '#cbd5e1' }}></div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Панель Управления */}
        <div className="mt-12 p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl flex flex-col items-center gap-6 shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="h-[1px] w-8 bg-white/20"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">АКТИВЕН: <span className="text-white text-[11px]">{currentPlayer.name}</span></span>
              <div className="h-[1px] w-8 bg-white/20"></div>
           </div>
           <button 
             disabled={!!gameState.lastRoll}
             onClick={() => rollDice(BOARD)}
             className="w-full py-7 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-10 flex items-center justify-center gap-5"
           >
             <i className="fa-solid fa-dice-six text-2xl"></i>
             БРОСОК
           </button>
        </div>
      </div>

      {/* Оверлей клетки - Радарный стиль */}
      {selectedCell && (
        <div className="fixed inset-0 z-[1500] flex items-end p-4 animate-fade-in bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedCell(null)}>
           <div className="w-full p-10 bg-white rounded-[4rem] shadow-2xl space-y-8 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl border-2 border-indigo-500/20">
                       <i className={`fa-solid ${selectedCell.icon}`}></i>
                    </div>
                    <div>
                       <h4 className="text-3xl font-black text-slate-900 italic uppercase leading-none tracking-tighter">{selectedCell.title}</h4>
                       <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-3 block italic">{selectedCell.district ? `СЕКТОР: ${selectedCell.district}` : 'ТЕХНИЧЕСКИЙ УЗЕЛ'}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCell(null)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors">
                    <i className="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>
              
              {selectedCell.type === 'asset' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-5">
                     <div className="p-7 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-2 italic tracking-widest">ЦЕНА ЗАХВАТА</span>
                        <span className="text-2xl font-black italic text-slate-900">{selectedCell.cost?.toLocaleString()} XP</span>
                     </div>
                     <div className="p-7 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-indigo-400 uppercase block mb-2 italic tracking-widest">РЕНТА</span>
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
                       <p className="text-[11px] font-bold text-slate-400 uppercase italic tracking-widest leading-loose">
                         {gameState.ownedAssets[selectedCell.id] ? 'СЕКТОР НАХОДИТСЯ ПОД КОНТРОЛЕМ' : 'ДЛЯ ЗАХВАТА НУЖНО ВСТАТЬ НА КЛЕТКУ'}
                       </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center gap-3">
                   <i className="fa-solid fa-bolt text-indigo-200 text-4xl"></i>
                   <p className="text-sm font-bold text-slate-400 italic">Сектор требует подтверждения доступа...</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Лог событий */}
      <div className="px-4 space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic flex items-center gap-3">
           <div className="w-8 h-[1px] bg-slate-200"></div> СОБЫТИЯ СИСТЕМЫ
        </h3>
        <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pb-10">
          {gameState.history.map((log, i) => (
            <div key={i} className={`p-5 rounded-[1.8rem] border italic text-[10px] font-bold tracking-tight transition-all shadow-sm ${i === 0 ? 'bg-white border-indigo-100 text-indigo-900 shadow-indigo-100/50' : 'bg-slate-50/50 text-slate-400 border-transparent opacity-50'}`}>
              <span className="opacity-20 mr-3 text-[8px]">{gameState.history.length - i}</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
