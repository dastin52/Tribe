
import React, { useState, useEffect, useMemo } from 'react';
import { GameState, BoardCell, GamePlayer } from '../types';

const EMOJI_AVATARS = ["🦁", "🦊", "🐻", "🐯", "🐺", "🐮", "🐼", "🐨", "🐸", "🐙"];

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
  resetLobby: () => void;
  kickPlayer: (pid: string) => void;
  createNewLobby: () => void;
  currentUserId: string;
}

const PlayerAvatar: React.FC<{ p: GamePlayer, size?: string }> = ({ p, size = "w-20 h-20" }) => {
  const [imgError, setImgError] = useState(false);
  const emoji = useMemo(() => {
    const hash = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return EMOJI_AVATARS[hash % EMOJI_AVATARS.length];
  }, [p.id]);

  if (p.isBot) {
    return <div className={`${size} rounded-[1.8rem] bg-indigo-600 flex items-center justify-center text-white border-2 border-indigo-400 shadow-lg`}><i className="fa-solid fa-robot text-2xl"></i></div>;
  }

  if (imgError || !p.avatar) {
    return (
      <div className={`${size} rounded-[1.8rem] bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-3xl border-2 border-white/20 shadow-xl`}>
         {emoji}
      </div>
    );
  }

  return (
    <div className={`${size} rounded-[1.8rem] overflow-hidden border-2 border-slate-700 shadow-xl`}>
       <img src={p.avatar} className="w-full h-full object-cover" onError={() => setImgError(true)} alt={p.name} />
    </div>
  );
};

const PlayerCard: React.FC<{ p: GamePlayer, isMe: boolean, onKick: () => void }> = ({ p, isMe, onKick }) => (
  <div className={`p-5 bg-white/5 backdrop-blur-xl border-2 rounded-[2.2rem] flex flex-col items-center gap-3 animate-scale-up transition-all relative ${p.isReady ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white/10'}`}>
    {!isMe && (
      <button onClick={onKick} className="absolute top-2 right-2 w-6 h-6 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors">
        <i className="fa-solid fa-xmark text-[10px]"></i>
      </button>
    )}
    <PlayerAvatar p={p} />
    <div className="text-center">
      <div className="flex flex-col items-center">
        <span className="font-black italic uppercase text-[12px] text-white block truncate w-24 leading-none">{p.name}</span>
        {isMe && <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-1">ЭТО ВЫ</span>}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-widest block mt-2 ${p.isReady ? 'text-emerald-400' : 'text-slate-500'}`}>{p.isReady ? 'ГОТОВ' : 'ЖДЕМ...'}</span>
    </div>
  </div>
);

export const SocialView: React.FC<SocialViewProps> = ({ 
  gameState, rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame, joinLobbyManual, resetLobby, kickPlayer, createNewLobby, currentUserId 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const players = gameState?.players || [];
  const currentPlayer = players[gameState?.currentPlayerIndex || 0];
  const isMyTurn = currentPlayer?.id === currentUserId;
  const me = players.find(p => p.id === currentUserId);

  const handleJoin = () => {
    if (manualCode.length > 3) {
      joinLobbyManual(manualCode);
      setShowInput(false);
      setManualCode('');
    }
  };

  if (gameState.status === 'lobby') {
    return (
      <div className="flex flex-col min-h-full animate-fade-in p-4 pb-24">
        <div className="bg-[#020617] rounded-[3.5rem] border-4 border-[#1e293b] p-8 space-y-8 relative overflow-hidden shadow-2xl flex flex-col items-center min-h-[500px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(99,102,241,0.15),transparent)]"></div>
          
          <div className="relative z-10 text-center space-y-4 w-full">
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none pt-4">ЗАЛ<br/>ОЖИДАНИЯ</h2>
            <div className="flex items-center gap-2 justify-center">
              <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 flex items-center gap-2 w-fit">
                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">LOBBY: {gameState.lobbyId}</span>
              </div>
              <button onClick={() => { if(confirm("Полностью очистить лобби и оставить только вас?")) resetLobby(); }} className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center active:scale-90 transition-all" title="Очистить лобби">
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 relative z-10">
            {players.map(p => <PlayerCard key={p.id} p={p} isMe={p.id === currentUserId} onKick={() => kickPlayer(p.id)} />)}
            {players.length < 4 && (
              <button onClick={() => { setIsSyncing(true); joinFakePlayer(); setTimeout(() => setIsSyncing(false), 800); }} className="p-5 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/10 text-slate-500">
                <i className="fa-solid fa-robot text-xl"></i>
                <span className="text-[8px] font-black uppercase tracking-widest italic">+ БОТ</span>
              </button>
            )}
          </div>

          <div className="w-full space-y-4 pt-4 relative z-10 mt-auto">
            {showInput ? (
               <div className="space-y-3 animate-scale-up">
                  <input 
                    type="text" 
                    placeholder="КОД ЛОББИ" 
                    className="w-full py-4 bg-white/10 border-2 border-white/20 rounded-[1.5rem] text-center font-black text-white outline-none focus:border-indigo-500 uppercase"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleJoin} className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">ВОЙТИ</button>
                    <button onClick={() => setShowInput(false)} className="px-6 py-4 bg-white/10 text-white rounded-[1.5rem] font-black"><i className="fa-solid fa-xmark"></i></button>
                  </div>
               </div>
            ) : (
               <>
                <button onClick={generateInviteLink} className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"><i className="fa-solid fa-share-nodes"></i> ПОЗВАТЬ СВОИХ</button>
                <button onClick={() => { setIsSyncing(true); startGame(); setTimeout(() => setIsSyncing(false), 800); }} className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 ${me?.isReady ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>
                   {me?.isReady ? 'ОЖИДАНИЕ ИГРОКОВ' : 'Я ГОТОВ'}
                </button>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setShowInput(true)} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Войти по коду</button>
                  <button onClick={createNewLobby} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Новое лобби</button>
                </div>
               </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative px-1 bg-slate-50 min-h-full">
      <div className="mx-2 p-6 bg-[#0f172a] rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-2 border-indigo-500/50">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg"><i className="fa-solid fa-microphone-lines text-white text-lg"></i></div>
          <div><span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block italic mb-1">ГОЛОС ПЛЕМЕНИ</span><p className="text-sm font-bold leading-tight italic text-slate-100">{gameState.history[0] || "Начинаем путь!"}</p></div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-2">
        {players.map((p, idx) => (
          <div key={p.id} className={`flex-shrink-0 p-5 rounded-[2.5rem] border-2 transition-all duration-500 min-w-[150px] ${gameState.currentPlayerIndex === idx ? 'bg-white border-indigo-600 shadow-xl' : 'bg-white/40 border-slate-100 text-slate-400 opacity-60'}`}>
            <div className="flex items-center gap-4">
              <PlayerAvatar p={p} size="w-12 h-12" />
              <div className="text-left">
                <span className="text-[11px] font-black uppercase italic block truncate w-16">{p.id === currentUserId ? 'ВЫ' : p.name}</span>
                <span className="text-[9px] font-black text-indigo-600">{p.cash.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#020617] p-5 rounded-[4.5rem] shadow-2xl border-8 border-[#1e293b] mx-2">
        <div className="grid grid-cols-4 gap-4 relative z-10">
          {BOARD.map((cell, idx) => {
            const occupiers = players.filter(p => p.position === idx);
            const ownerId = gameState.ownedAssets[idx];
            const isTarget = occupiers.some(p => p.id === currentPlayer?.id);
            return (
              <div key={idx} className={`aspect-square rounded-[1.8rem] flex flex-col items-center justify-center relative border-2 ${isTarget ? 'bg-white border-white scale-110 z-20 text-slate-900' : ownerId ? DISTRICT_COLORS[cell.district || 'tech'] : 'bg-[#0f172a] border-white/5 text-slate-600'}`}>
                <i className={`fa-solid ${cell.icon} text-2xl`}></i>
                {occupiers.length > 0 && <div className="absolute -top-1 -right-1 flex -space-x-2">{occupiers.map(p => <div key={p.id} className="w-4 h-4 rounded-full border-2 border-slate-900 overflow-hidden"><PlayerAvatar p={p} size="w-full h-full" /></div>)}</div>}
              </div>
            );
          })}
        </div>
        <div className="mt-10 p-8 bg-white/5 rounded-[3rem] border border-white/10 flex flex-col items-center gap-5">
           <div className={`text-[11px] font-black uppercase tracking-widest italic ${isMyTurn ? 'text-indigo-400 animate-bounce' : 'text-slate-600'}`}>{isMyTurn ? 'ТВОЙ ХОД!' : `ЖДЕМ ${currentPlayer?.name.toUpperCase()}`}</div>
           <button disabled={!isMyTurn} onClick={() => rollDice(BOARD)} className="w-full py-7 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-5 flex items-center justify-center gap-5"><i className="fa-solid fa-dice text-2xl"></i> БРОСОК</button>
        </div>
      </div>
    </div>
  );
};
