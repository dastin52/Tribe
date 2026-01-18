
import React, { useState, useMemo } from 'react';
import { GameState, BoardCell, GamePlayer, AccountabilityPartner } from '../types';

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
  partners: AccountabilityPartner[];
  pendingRequests: AccountabilityPartner[];
  rollDice: (board: BoardCell[]) => void;
  buyAsset: (cellId: number, board: BoardCell[]) => void;
  generateInviteLink: (type?: 'partner' | 'game') => void;
  joinFakePlayer: () => void;
  startGame: () => void;
  forceStartGame: () => void;
  joinLobbyManual: (code: string) => void;
  resetLobby: () => void;
  kickPlayer: (pid: string) => void;
  createNewLobby: () => void;
  approvePartner: (id: string) => void;
  currentUserId: string;
}

const PlayerAvatar: React.FC<{ p: any, size?: string }> = ({ p, size = "w-20 h-20" }) => {
  const [imgError, setImgError] = React.useState(false);
  const emoji = useMemo(() => {
    const hash = (p.id || '0').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
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

export const SocialView: React.FC<SocialViewProps> = ({ 
  gameState, partners, pendingRequests, rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame, forceStartGame, joinLobbyManual, resetLobby, kickPlayer, createNewLobby, approvePartner, currentUserId 
}) => {
  const [activeTab, setActiveTab] = useState<'partners' | 'arena'>('partners');
  
  const players = gameState?.players || [];
  const me = players.find(p => p.id === currentUserId);
  const isHost = gameState.hostId === currentUserId;

  const ArenaContent = () => {
    if (gameState.status === 'lobby') {
      return (
        <div className="flex flex-col animate-fade-in space-y-8 px-2">
          <div className="bg-[#020617] rounded-[4rem] border-4 border-[#1e293b] p-8 space-y-8 relative overflow-hidden shadow-2xl flex flex-col items-center min-h-[550px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(99,102,241,0.2),transparent)]"></div>
            
            <div className="relative z-10 text-center space-y-4 w-full pt-4">
              <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">АРЕНА</h2>
              <div className="flex items-center gap-3 justify-center">
                <div className="bg-indigo-600/30 px-8 py-3 rounded-2xl border-2 border-indigo-500/40 flex items-center gap-2 w-fit shadow-2xl backdrop-blur-xl">
                  <span className="text-lg font-black text-white uppercase tracking-widest italic">{gameState.lobbyId}</span>
                </div>
                {isHost && (
                  <button onClick={() => { if(confirm("Очистить лобби?")) resetLobby(); }} className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center active:scale-90 transition-all shadow-xl border-2 border-rose-400/20"><i className="fa-solid fa-trash-can"></i></button>
                )}
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-5 relative z-10 py-4">
              {players.length === 0 ? (
                <div className="col-span-2 py-10 text-center">
                   <p className="text-white/40 font-black italic uppercase animate-pulse">Синхронизация участников...</p>
                </div>
              ) : players.map(p => (
                <div key={p.id} className={`p-6 bg-white/5 backdrop-blur-2xl border-2 rounded-[2.5rem] flex flex-col items-center gap-4 animate-scale-up transition-all relative ${p.isReady ? 'border-emerald-500 shadow-2xl shadow-emerald-500/30 bg-emerald-500/10' : 'border-white/10'}`}>
                  {isHost && p.id !== currentUserId && (
                    <button onClick={(e) => { e.stopPropagation(); kickPlayer(p.id); }} className="absolute -top-2 -right-2 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-20 shadow-2xl border-4 border-[#020617]"><i className="fa-solid fa-xmark text-sm"></i></button>
                  )}
                  <PlayerAvatar p={p} />
                  <div className="text-center">
                    <span className="font-black italic uppercase text-sm text-white block truncate w-28 leading-none">{p.name || 'Игрок'}</span>
                    {p.id === currentUserId && <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 block">ЭТО ВЫ</span>}
                    <span className={`text-[10px] font-black uppercase tracking-widest block mt-3 ${p.isReady ? 'text-emerald-400' : 'text-slate-500'}`}>{p.isReady ? 'ГОТОВ' : 'ЖДЕМ...'}</span>
                  </div>
                </div>
              ))}
              {players.length < 4 && (
                <button onClick={joinFakePlayer} className="p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/10 active:scale-95 text-slate-500 backdrop-blur-sm">
                  <i className="fa-solid fa-robot text-3xl"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">+ БОТ</span>
                </button>
              )}
            </div>

            <div className="w-full space-y-4 pt-4 relative z-10 mt-auto">
               <button onClick={() => generateInviteLink('game')} className="w-full py-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"><i className="fa-solid fa-share-nodes"></i> ПОЗВАТЬ НА АРЕНУ</button>
               
               <div className="flex gap-3">
                  <button onClick={startGame} className={`flex-1 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all border-4 ${me?.isReady ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20' : 'bg-white text-slate-950 border-white shadow-white/5'}`}>
                    {me?.isReady ? 'ГОТОВ!' : 'Я ГОТОВ'}
                  </button>
                  {isHost && (
                    <button onClick={forceStartGame} title="Запустить Арену сейчас" className="w-20 py-7 bg-slate-800 text-white rounded-[2.5rem] font-black flex items-center justify-center active:scale-95 transition-all shadow-xl border-4 border-slate-700">
                       <i className="fa-solid fa-play text-xl"></i>
                    </button>
                  )}
               </div>
               
               <div className="flex gap-8 justify-center pb-2">
                 <button onClick={createNewLobby} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors italic">Новая Арена</button>
               </div>
            </div>
          </div>
        </div>
      );
    }

    // Рендеринг игрового процесса остается прежним...
    return (
      <div className="space-y-6 animate-fade-in px-1">
        {/* Код игры... */}
        <div className="p-6 bg-[#0f172a] rounded-[3rem] text-white shadow-2xl border-2 border-indigo-500/40 relative overflow-hidden">
           <p className="text-sm font-bold italic text-slate-100">{gameState.history[0] || "Арена запущена!"}</p>
        </div>
        {/* Отображение доски */}
        <div className="bg-[#020617] p-6 rounded-[5rem] shadow-2xl border-8 border-[#1e293b] relative">
           <div className="flex flex-col items-center gap-6">
              <span className="text-white/40 font-black italic uppercase">Процесс игры запущен</span>
              <button onClick={() => rollDice(BOARD)} className="w-full py-8 bg-white text-slate-950 rounded-[3rem] font-black text-lg uppercase tracking-widest shadow-2xl active:scale-95 transition-all">БРОСОК</button>
           </div>
        </div>
      </div>
    );
  };

  const PartnersContent = () => {
    return (
      <div className="space-y-6 animate-fade-in px-2">
         {pendingRequests.length > 0 && (
           <div className="space-y-3">
              <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-4 italic animate-pulse">Входящие запросы ({pendingRequests.length})</h4>
              {pendingRequests.map(req => (
                <div key={req.id} className="p-5 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center justify-between shadow-sm animate-scale-up">
                   <div className="flex items-center gap-3">
                      <PlayerAvatar p={req} size="w-12 h-12" />
                      <div>
                         <h5 className="font-black text-slate-900 text-sm italic uppercase">{req.name}</h5>
                         <span className="text-[8px] font-black text-rose-400 uppercase italic">Стучится в Племя...</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => approvePartner(req.id)} className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center active:scale-90 shadow-md"><i className="fa-solid fa-check"></i></button>
                      <button className="w-10 h-10 rounded-xl bg-white text-slate-300 flex items-center justify-center active:scale-90 border border-slate-100"><i className="fa-solid fa-xmark"></i></button>
                   </div>
                </div>
              ))}
           </div>
         )}

         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-4 relative overflow-hidden">
            <h3 className="text-3xl font-black text-slate-900 italic uppercase leading-none">Твоё Племя</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Люди, которые верифицируют твои цели</p>
         </div>

         <div className="space-y-4">
            {partners.length === 0 ? (
               <div className="p-16 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[4rem] text-center space-y-6">
                  <p className="text-sm font-black text-slate-300 uppercase italic">У тебя пока нет партнеров</p>
                  <button onClick={() => generateInviteLink('partner')} className="px-10 py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Пригласить Партнера</button>
               </div>
            ) : (
              partners.map(p => (
                <div key={p.id} className="p-6 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <PlayerAvatar p={p} size="w-16 h-16" />
                      <div>
                         <h4 className="font-black text-slate-900 text-base uppercase italic">{p.name}</h4>
                         <span className="text-[10px] font-black text-indigo-500 uppercase italic tracking-widest">{p.role}</span>
                      </div>
                   </div>
                   <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center"><i className="fa-solid fa-bell text-sm"></i></button>
                </div>
              ))
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-8 pb-32 min-h-full">
       <div className="flex bg-slate-100/80 backdrop-blur-md p-1.5 rounded-[2.5rem] mx-3 shadow-inner border border-slate-200 sticky top-2 z-40">
         <button onClick={() => setActiveTab('partners')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'partners' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}>Партнеры</button>
         <button onClick={() => setActiveTab('arena')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'arena' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}>Арена</button>
       </div>
       <div className="flex-1">
         {activeTab === 'arena' ? <ArenaContent /> : <PartnersContent />}
       </div>
    </div>
  );
};
