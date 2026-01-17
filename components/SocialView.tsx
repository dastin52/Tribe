
import React, { useState, useEffect } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

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
  createDeposit: (amount: number) => void;
  sendReaction: (emoji: string) => void;
  generateInviteLink: () => void;
  joinFakePlayer: () => void;
  startGame: () => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ gameState, rollDice, buyAsset, createDeposit, sendReaction, generateInviteLink, joinFakePlayer, startGame }) => {
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  if (gameState.status === 'lobby') {
    return (
      <div className="flex flex-col h-full animate-fade-in space-y-8 p-4">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Лобби Племени</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ждем твоих союзников</p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {gameState.players.map(p => (
              <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-3 shadow-sm animate-scale-up">
                 <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden">
                    <img src={p.avatar} className="w-full h-full object-cover" />
                 </div>
                 <span className="font-black italic uppercase text-[10px]">{p.name}</span>
                 {p.isHost && <span className="text-[7px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">HOST</span>}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - gameState.players.length) }).map((_, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 opacity-40">
                 <i className="fa-solid fa-user-plus text-slate-300"></i>
                 <span className="text-[7px] font-black uppercase tracking-widest">Слот свободен</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pb-8">
           <button onClick={generateInviteLink} className="w-full py-5 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
             <i className="fa-solid fa-link"></i> Позвать в Племя
           </button>
           <button onClick={joinFakePlayer} className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest">Добавить бота для теста</button>
           <button 
             disabled={gameState.players.length < 2}
             onClick={startGame}
             className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-20"
           >
             Начать Игру
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative">
      {/* Tutorial Overlay */}
      {tutorialStep < 3 && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-white rounded-[3rem] p-10 space-y-6 max-w-sm w-full text-center shadow-2xl border-4 border-indigo-500">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg">
                <i className={`fa-solid ${tutorialStep === 0 ? 'fa-graduation-cap' : tutorialStep === 1 ? 'fa-building-columns' : 'fa-hand-holding-dollar'}`}></i>
              </div>
              <h3 className="text-2xl font-black italic uppercase">{tutorialStep === 0 ? 'Добро пожаловать!' : tutorialStep === 1 ? 'Активы и Рента' : 'Победа'}</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                {tutorialStep === 0 && 'Арена - это место, где твой XP превращается в Капитал. Бросай кубик и захватывай сектора.'}
                {tutorialStep === 1 && 'Когда другие игроки наступают на твою клетку, они платят тебе аренду. Накопи больше всех XP.'}
                {tutorialStep === 2 && 'Игра закончится, когда все кроме одного обанкротятся или раунды достигнут финала.'}
              </p>
              <button onClick={() => setTutorialStep(tutorialStep + 1)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Понятно</button>
           </div>
        </div>
      )}

      {/* Dice Overlay */}
      {gameState.lastRoll && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
           <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.5)] border-4 border-indigo-600 flex items-center justify-center text-6xl font-black italic text-indigo-600 animate-bounce animate-scale-up">
              {gameState.lastRoll}
           </div>
        </div>
      )}

      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Арена</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Раунд {gameState.turnNumber}</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
        {gameState.players.map((p, idx) => (
          <div key={p.id} className={`flex-shrink-0 p-3 rounded-2xl border-2 transition-all ${gameState.currentPlayerIndex === idx ? 'bg-indigo-600 border-white text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
            <div className="flex items-center gap-2">
              <img src={p.avatar} className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-[9px] font-black uppercase italic">{p.name}</span>
            </div>
            <div className="mt-1 text-xs font-black">{Math.round(p.cash).toLocaleString()} XP</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 p-6 rounded-[3rem] shadow-2xl relative overflow-hidden border-4 border-slate-900 mx-1">
        <div className="grid grid-cols-4 gap-2 relative z-10">
          {BOARD.map((cell, idx) => {
            const occupyingPlayers = gameState.players.filter(p => p.position === idx);
            const ownerId = gameState.ownedAssets[idx];
            const owner = gameState.players.find(p => p.id === ownerId);

            return (
              <button 
                key={cell.id} 
                onClick={() => setSelectedCell(cell)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border-2 ${
                  occupyingPlayers.some(p => p.id === currentPlayer.id) ? 'bg-white border-indigo-400 scale-105 z-20' : 
                  ownerId ? 'bg-white/10 border-indigo-500' : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <i className={`fa-solid ${cell.icon} ${ownerId ? 'text-indigo-400' : 'text-slate-600'} text-lg`}></i>
                {/* No text title here for "Clean" look */}
                
                {owner && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 border border-white"></div>}
                
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {occupyingPlayers.map(p => (
                    <div key={p.id} className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.id === gameState.players[0].id ? '#6366f1' : '#cbd5e1' }}></div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-4">
           <span className="text-[9px] font-black text-slate-500 uppercase italic">Ход: <span className="text-white">{currentPlayer.name}</span></span>
           <button 
             disabled={!!gameState.lastRoll}
             onClick={() => rollDice(BOARD)}
             className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
           >
             Бросок
           </button>
        </div>
      </div>

      {selectedCell && (
        <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl animate-scale-up space-y-4 mx-1">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-xl"><i className={`fa-solid ${selectedCell.icon}`}></i></div>
                <div>
                   <h4 className="text-lg font-black text-slate-900 italic uppercase leading-none">{selectedCell.title}</h4>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block italic">{selectedCell.district || 'Спецсектор'}</span>
                </div>
             </div>
             <button onClick={() => setSelectedCell(null)} className="text-slate-300"><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          {selectedCell.type === 'asset' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Стоимость</span>
                    <span className="text-lg font-black">{selectedCell.cost?.toLocaleString()}</span>
                 </div>
                 <div className="p-4 bg-indigo-50 rounded-2xl">
                    <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Аренда</span>
                    <span className="text-lg font-black text-indigo-700">{selectedCell.rent?.toLocaleString()}</span>
                 </div>
              </div>
              {!gameState.ownedAssets[selectedCell.id] && gameState.players.find(p => p.position === selectedCell.id) && (
                <button 
                  onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Захватить за {selectedCell.cost} XP
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="px-2 space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Лог Капитала</h3>
        <div className="space-y-2">
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
