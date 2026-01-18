
import React, { useState, useMemo } from 'react';
import { GameState, BoardCell, GamePlayer, AccountabilityPartner } from '../types';

const EMOJI_AVATARS = ["🦁", "🦊", "🐻", "🐯", "🐺", "🐮", "🐼", "🐨", "🐸", "🐙"];

const DISTRICT_COLORS: Record<string, string> = {
  tech: 'bg-cyan-900/40 border-cyan-400 text-cyan-300',
  realestate: 'bg-amber-900/40 border-amber-400 text-amber-300',
  health: 'bg-emerald-900/40 border-emerald-400 text-emerald-300',
  energy: 'bg-rose-900/40 border-rose-400 text-rose-300',
  web3: 'bg-violet-900/40 border-violet-400 text-violet-300',
  edu: 'bg-blue-900/40 border-blue-400 text-blue-300'
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
  partners: AccountabilityPartner[];
  pendingRequests: AccountabilityPartner[];
  rollDice: (board: BoardCell[]) => void;
  buyAsset: (cellId: number, board: BoardCell[]) => void;
  generateInviteLink: (type?: 'partner' | 'game') => void;
  joinFakePlayer: () => void;
  startGame: () => void;
  forceStartGame: () => void;
  resetLobby: () => void;
  kickPlayer: (pid: string) => void;
  createNewLobby: () => void;
  approvePartner: (id: string) => void;
  currentUserId: string;
}

const PlayerAvatar: React.FC<{ p: any, size?: string }> = ({ p, size = "w-20 h-20" }) => {
  const emoji = useMemo(() => {
    const hash = (p.id || '0').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return EMOJI_AVATARS[hash % EMOJI_AVATARS.length];
  }, [p.id]);

  if (p.isBot) return <div className={`${size} rounded-[1.8rem] bg-indigo-600 flex items-center justify-center text-white border-2 border-indigo-400`}><i className="fa-solid fa-robot text-2xl"></i></div>;

  return (
    <div className={`${size} rounded-[1.8rem] bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-3xl border-2 border-white/20 shadow-xl overflow-hidden`}>
       {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : emoji}
    </div>
  );
};

export const SocialView: React.FC<SocialViewProps> = ({ 
  gameState, partners, pendingRequests, rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame, forceStartGame, resetLobby, kickPlayer, createNewLobby, approvePartner, currentUserId 
}) => {
  const [activeTab, setActiveTab] = useState<'partners' | 'arena'>('arena');
  
  const players = gameState?.players || [];
  const me = players.find(p => p.id === currentUserId);
  const isHost = gameState.hostId === currentUserId || me?.isHost;

  const ArenaContent = () => {
    if (gameState.status === 'lobby') {
      return (
        <div className="flex flex-col animate-fade-in space-y-6 px-2">
          <div className="bg-[#020617] rounded-[3rem] border-4 border-slate-800 p-8 space-y-8 flex flex-col items-center min-h-[500px] shadow-2xl relative">
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">АРЕНА</h2>
            <div className="bg-indigo-600/20 px-6 py-2 rounded-xl border border-indigo-500/30 text-white font-black">{gameState.lobbyId}</div>

            <div className="w-full grid grid-cols-2 gap-4">
              {players.map(p => (
                <div key={p.id} className={`p-4 bg-white/5 border-2 rounded-[2rem] flex flex-col items-center gap-2 relative ${p.isReady ? 'border-emerald-500' : 'border-white/10'}`}>
                  {isHost && p.id !== currentUserId && (
                    <button onClick={() => kickPlayer(p.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark text-xs"></i></button>
                  )}
                  <PlayerAvatar p={p} size="w-16 h-16" />
                  <span className="text-[10px] font-black uppercase text-white truncate w-24 text-center">{p.name}</span>
                  <span className={`text-[8px] font-black uppercase ${p.isReady ? 'text-emerald-400' : 'text-slate-500'}`}>{p.isReady ? 'ГОТОВ' : 'ЖДЕТ...'}</span>
                </div>
              ))}
              {players.length < 4 && (
                <button onClick={joinFakePlayer} className="p-4 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-slate-500 gap-1">
                  <i className="fa-solid fa-robot text-xl"></i>
                  <span className="text-[8px] font-black">+ БОТ</span>
                </button>
              )}
            </div>

            <div className="w-full space-y-3 mt-auto">
               <button onClick={() => generateInviteLink('game')} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><i className="fa-solid fa-share"></i> ПОЗВАТЬ ДРУГА</button>
               <div className="flex gap-2">
                  <button onClick={startGame} className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase border-4 transition-all ${me?.isReady ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-900 border-white'}`}>
                    {me?.isReady ? 'ОТМЕНА' : 'Я ГОТОВ'}
                  </button>
                  {isHost && (
                    <button onClick={forceStartGame} className="w-16 h-16 bg-slate-800 text-white rounded-[2rem] flex items-center justify-center shadow-lg border-2 border-slate-700 active:scale-90 transition-all">
                       <i className="fa-solid fa-play"></i>
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-6 bg-[#0f172a] rounded-[2.5rem] text-white shadow-xl border border-indigo-500/20">
           <p className="text-sm font-bold italic leading-tight">{gameState.history[0] || "Арена активна!"}</p>
        </div>
        <div className="bg-[#020617] p-4 rounded-[4rem] border-4 border-slate-800 flex flex-col items-center gap-6 py-10 shadow-inner">
           <span className="text-white/20 font-black uppercase text-xs">Игровой процесс</span>
           <button onClick={() => rollDice(BOARD)} className="w-48 h-48 bg-white text-slate-950 rounded-full font-black text-2xl uppercase shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-90 transition-all">🎲</button>
        </div>
        <button onClick={resetLobby} className="w-full py-4 text-rose-500 font-black uppercase text-[10px] tracking-widest">Завершить игру</button>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-6 pb-24">
       <div className="flex bg-slate-100 p-1 rounded-full mx-3 border border-slate-200">
         <button onClick={() => setActiveTab('arena')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'arena' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Арена</button>
         <button onClick={() => setActiveTab('partners')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'partners' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Племя</button>
       </div>
       <div className="flex-1 px-2">
         {activeTab === 'arena' ? <ArenaContent /> : (
           <div className="space-y-6 animate-fade-in">
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-rose-500 uppercase px-4">Запросы</h4>
                   {pendingRequests.map(req => (
                     <div key={req.id} className="p-4 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm">
                        <span className="font-black text-sm uppercase">{req.name}</span>
                        <button onClick={() => approvePartner(req.id)} className="w-10 h-10 bg-emerald-500 text-white rounded-xl"><i className="fa-solid fa-check"></i></button>
                     </div>
                   ))}
                </div>
              )}
              <div className="p-8 bg-white border border-slate-100 rounded-[3rem] text-center space-y-4">
                 <h3 className="text-xl font-black uppercase italic">Твоё Племя</h3>
                 <button onClick={() => generateInviteLink('partner')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Пригласить партнера</button>
              </div>
           </div>
         )}
       </div>
    </div>
  );
};
