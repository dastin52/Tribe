
import React, { useState, useEffect } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

const DISTRICT_INFO: Record<string, { color: string, label: string }> = {
  tech: { color: 'border-blue-500 bg-blue-500/10', label: 'Технологии' },
  realestate: { color: 'border-amber-500 bg-amber-500/10', label: 'Недвижимость' },
  health: { color: 'border-emerald-500 bg-emerald-500/10', label: 'Биотех' },
  energy: { color: 'border-rose-500 bg-rose-500/10', label: 'Энергия' },
  web3: { color: 'border-violet-500 bg-violet-500/10', label: 'Web3' },
  edu: { color: 'border-cyan-500 bg-cyan-500/10', label: 'Образование' }
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
  createDeposit: (amount: number, turns: number) => void;
  sendReaction: (emoji: string) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ gameState, rollDice, buyAsset, createDeposit, sendReaction }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [showBank, setShowBank] = useState(false);
  const [depositAmount, setDepositAmount] = useState(5000);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const reactions = ['🔥', '💸', '🤡', '📉', '👏', '🤣'];

  const handleRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      rollDice(BOARD);
      setIsRolling(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Арена</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Покорение Капитала</p>
        </div>
        <button 
          onClick={() => setShowBank(!showBank)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${showBank ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white'}`}
        >
          <i className="fa-solid fa-building-columns"></i>
        </button>
      </header>

      {/* Реакции Племени */}
      <div className="flex justify-around bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mx-1">
        {reactions.map(emoji => (
          <button 
            key={emoji} 
            onClick={() => sendReaction(emoji)}
            className="text-xl hover:scale-125 transition-transform active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Поле и игроки */}
      <div className="relative">
        {/* Всплывающие реакции */}
        <div className="absolute inset-0 pointer-events-none z-[100]">
          {gameState.reactions.map(r => {
            const player = gameState.players.find(p => p.id === r.playerId);
            return (
              <div 
                key={r.timestamp}
                className="absolute text-2xl animate-bounce-up"
                style={{ 
                  left: `${20 + Math.random() * 60}%`, 
                  top: '40%',
                  opacity: 0.8
                }}
              >
                {r.emoji}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
          {gameState.players.map((p, idx) => (
            <div key={p.id} className={`flex-shrink-0 p-3 rounded-2xl border-2 transition-all ${gameState.currentPlayerIndex === idx ? 'bg-indigo-600 border-white text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden relative">
                   <img src={p.avatar} className="w-full h-full object-cover" />
                   {p.deposits.length > 0 && (
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white flex items-center justify-center">
                        <i className="fa-solid fa-vault text-[5px] text-white"></i>
                     </div>
                   )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter italic">{p.name}</span>
              </div>
              <div className="mt-1 text-xs font-black italic">{Math.round(p.cash).toLocaleString()} XP</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-950 p-6 rounded-[3rem] shadow-2xl relative overflow-hidden border-4 border-slate-900 mx-1">
          <div className="grid grid-cols-4 gap-2 relative z-10">
            {BOARD.map((cell, idx) => {
              const occupyingPlayers = gameState.players.filter(p => p.position === idx);
              const ownerId = gameState.ownedAssets[idx];
              const owner = gameState.players.find(p => p.id === ownerId);
              const districtStyle = cell.district ? DISTRICT_INFO[cell.district].color : 'bg-slate-800/40 border-slate-800';

              return (
                <button 
                  key={cell.id} 
                  onClick={() => setSelectedCell(cell)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border-2 ${
                    occupyingPlayers.some(p => p.id === currentPlayer.id) ? 'bg-white border-indigo-400 scale-105 z-20' : 
                    ownerId ? 'bg-white/10 border-indigo-500' : districtStyle
                  }`}
                >
                  <i className={`fa-solid ${cell.icon} ${ownerId ? 'text-indigo-400' : 'text-slate-600'} text-lg mb-1`}></i>
                  {owner && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-500 border border-white"></div>}
                  
                  <div className="absolute -top-1 -right-1 flex gap-0.5">
                    {occupyingPlayers.map(p => (
                      <div key={p.id} className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.id === gameState.players[0].id ? '#6366f1' : '#cbd5e1' }}></div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 bg-white/5 p-6 rounded-3xl border border-white/5 relative z-10 flex flex-col gap-4">
             <div className="flex justify-between items-end">
                <div>
                   <span className="text-[8px] font-black text-slate-500 uppercase block italic mb-1">Ходит: <span className="text-white">{currentPlayer.name}</span></span>
                   <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Раунд {gameState.turnNumber}</h3>
                </div>
                <button 
                  disabled={isRolling}
                  onClick={handleRoll}
                  className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                >
                  {isRolling ? '...' : 'Бросок'}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Панель Банка */}
      {showBank && (
        <div className="p-8 bg-white border-2 border-amber-100 rounded-[2.5rem] shadow-xl animate-scale-up space-y-6 mx-1">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 italic uppercase">Банк Племени</h3>
            <button onClick={() => setShowBank(false)} className="text-slate-300"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-2xl">
               <span className="text-[8px] font-black text-amber-600 uppercase block mb-1">Ваши вклады:</span>
               {currentPlayer.deposits.length === 0 ? (
                 <p className="text-[10px] text-amber-400 italic">Нет активных вкладов</p>
               ) : currentPlayer.deposits.map(d => (
                 <div key={d.id} className="flex justify-between text-xs font-bold text-amber-900">
                    <span>{d.amount} XP</span>
                    <span>через {d.remainingTurns} х.</span>
                 </div>
               ))}
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Сумма вклада</label>
               <input 
                 type="number" 
                 value={depositAmount} 
                 onChange={e => setDepositAmount(Number(e.target.value))}
                 className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-amber-500"
               />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => createDeposit(depositAmount, 5)} className="py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">+15% (5х)</button>
               <button onClick={() => createDeposit(depositAmount, 10)} className="py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">+40% (10х)</button>
            </div>
          </div>
        </div>
      )}

      {/* Информация о клетке */}
      {selectedCell && (
        <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl animate-scale-up space-y-4 mx-1">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-xl"><i className={`fa-solid ${selectedCell.icon}`}></i></div>
                <div>
                   <h4 className="text-lg font-black text-slate-900 italic uppercase leading-none">{selectedCell.title}</h4>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block italic">{selectedCell.district ? DISTRICT_INFO[selectedCell.district].label : 'Спецсектор'}</span>
                </div>
             </div>
             <button onClick={() => setSelectedCell(null)} className="text-slate-300"><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          {selectedCell.type === 'asset' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Стоимость</span>
                    <span className="text-lg font-black text-slate-900">{selectedCell.cost?.toLocaleString()}</span>
                 </div>
                 <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Аренда</span>
                    <span className="text-lg font-black text-indigo-700">{selectedCell.rent?.toLocaleString()}</span>
                 </div>
              </div>
              {!gameState.ownedAssets[selectedCell.id] && currentPlayer.position === selectedCell.id && (
                <button 
                  onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg"
                >
                  Захватить за {selectedCell.cost} XP
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* История */}
      <div className="space-y-3 px-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Лог Капитала</h3>
        <div className="max-h-40 overflow-y-auto space-y-2 no-scrollbar">
          {gameState.history.map((log, i) => (
            <div key={i} className={`p-3 rounded-2xl border italic text-[9px] font-bold ${i === 0 ? 'bg-white border-indigo-100 text-indigo-900' : 'bg-slate-50/50 text-slate-400'}`}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
