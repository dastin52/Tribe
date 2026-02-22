
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GameState, BoardCell, GamePlayer, AccountabilityPartner, User, TAX_RATE } from '../types';
import { geminiService } from '../services/gemini';

const DISTRICT_COLORS: Record<string, string> = {
  tech: 'bg-indigo-950/80 border-indigo-500 text-indigo-300',
  realestate: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
  health: 'bg-rose-950/80 border-rose-500 text-rose-300',
  energy: 'bg-amber-950/80 border-amber-400 text-amber-300',
  web3: 'bg-violet-950/80 border-violet-400 text-violet-300',
  edu: 'bg-blue-950/80 border-blue-500 text-blue-300'
};

const BOARD: BoardCell[] = [
  { id: 0, type: 'start', title: 'СТАРТ', icon: 'fa-rocket', description: 'Получай +5000 ₽ капитала каждый раз, проходя через старт.' },
  { id: 1, type: 'asset', district: 'tech', title: 'Яндекс Лавка', cost: 8000, rent: 1200, icon: 'fa-shopping-basket', description: 'Lvl 4: ОЭЗ (0% налогов). Акции доступны всем.' },
  { id: 2, type: 'event', title: 'ИНСАЙТ', icon: 'fa-bolt', description: 'Случайное событие рынка.' },
  { id: 3, type: 'asset', district: 'tech', title: 'OpenAI', cost: 18000, rent: 3500, icon: 'fa-robot', description: 'Инвестируй в ИИ. Высокая волатильность.' },
  { id: 4, type: 'tax', title: 'НДС 20%', icon: 'fa-hand-holding-dollar', description: 'Налог на потребление.' },
  { id: 5, type: 'asset', district: 'realestate', title: 'Сколково', cost: 25000, rent: 4500, icon: 'fa-microchip', description: 'Статус резидента дает льготы.' },
  { id: 6, type: 'event', title: 'ШАНС', icon: 'fa-dice', description: 'Риск - дело благородное.' },
  { id: 7, type: 'asset', district: 'realestate', title: 'Burj Khalifa', cost: 45000, rent: 9000, icon: 'fa-hotel', description: 'Недвижимость - защитный актив.' },
  { id: 8, type: 'asset', district: 'health', title: 'Инвитро', cost: 55000, rent: 12000, icon: 'fa-vial', description: 'Медицина стабильна.' },
  { id: 9, type: 'bank', title: 'СБЕР', icon: 'fa-landmark', description: 'Депозиты под 15%.' },
  { id: 10, type: 'asset', district: 'health', title: 'Moderna', cost: 75000, rent: 18000, icon: 'fa-pills', description: 'mRNA технологии.' },
  { id: 11, type: 'prison', title: 'ВЫГОРАНИЕ', icon: 'fa-bed', description: 'Пропусти 2 хода.' },
  { id: 12, type: 'asset', district: 'energy', title: 'Tesla Giga', cost: 95000, rent: 22000, icon: 'fa-car-battery', description: 'Зеленая энергия.' },
  { id: 13, type: 'event', title: 'СОБЫТИЕ', icon: 'fa-newspaper', description: 'Новости меняют рынок.' },
  { id: 14, type: 'asset', district: 'energy', title: 'Росатом', cost: 130000, rent: 35000, icon: 'fa-atom', description: 'Мирный атом.' },
  { id: 15, type: 'tax', title: 'ГАЗПРОМ', icon: 'fa-fire', description: 'Счета за ЖКХ.' },
  { id: 16, type: 'asset', district: 'web3', title: 'TON / Telegram', cost: 160000, rent: 45000, icon: 'fa-paper-plane', description: 'Крипто-будущее.' },
  { id: 17, type: 'event', title: 'AIRDROP', icon: 'fa-parachute-box', description: 'Халява.' },
  { id: 18, type: 'asset', district: 'web3', title: 'Binance', cost: 210000, rent: 65000, icon: 'fa-bitcoin-sign', description: 'Ликвидность.' },
  { id: 19, type: 'asset', district: 'edu', title: 'Skillbox', cost: 260000, rent: 90000, icon: 'fa-chalkboard-user', description: 'Образование - лучший актив.' },
  { id: 20, type: 'event', title: 'ЛЕКЦИЯ', icon: 'fa-scroll', description: 'Учись экономить на налогах.' },
  { id: 21, type: 'asset', district: 'edu', title: 'Harvard', cost: 420000, rent: 160000, icon: 'fa-graduation-cap', description: 'Элита.' },
  { id: 22, type: 'tax', title: 'ИНФЛЯЦИЯ', icon: 'fa-arrow-trend-down', description: 'Деньги тают.' },
  { id: 23, type: 'event', title: 'УСПЕХ', icon: 'fa-trophy', description: 'Ты в Племени.' },
];

interface SocialViewProps {
  gameState: GameState;
  partners: AccountabilityPartner[];
  pendingRequests: AccountabilityPartner[];
  rollDice: (board: BoardCell[]) => void;
  buyAsset: (cellId: number, board: BoardCell[]) => void;
  buyStock: (cellId: number, amount: number, board: BoardCell[]) => void;
  sellStock: (cellId: number, shares: number, board: BoardCell[]) => void;
  upgradeAsset: (cellId: number, board: BoardCell[]) => void;
  makeDeposit: (cellId: number, amount: number) => void;
  generateInviteLink: (type?: 'partner' | 'game') => void;
  currentUserId: string;
}

export const SocialView: React.FC<SocialViewProps> = ({ 
  gameState, rollDice, buyAsset, buyStock, sellStock, upgradeAsset, makeDeposit, generateInviteLink, currentUserId 
}) => {
  const [activeTab, setActiveTab] = useState<'arena' | 'tribe'>('arena');
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState(5000);

  // Chat with Game Master State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const players = gameState.players || [];
  const me = players.find(p => p.id === currentUserId);
  const occupants = (cellId: number) => players.filter(p => p.position === cellId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatOpen]);

  const sendMessage = async () => {
    if (!userInput.trim() || isTyping) return;
    
    const userMsg = { role: 'user', parts: [{ text: userInput }] };
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    const response = await geminiService.chatWithGameMaster(
      userInput, 
      chatHistory, 
      { 
        cash: me?.cash || 0, 
        position: me?.position || 0, 
        ownedAssetsCount: me?.ownedAssets.length || 0,
        marketIndices: gameState.marketIndices
      }
    );

    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    setIsTyping(false);
  };

  const getStockPrice = (cell: BoardCell) => {
    const mult = gameState.marketIndices[cell.district || ''] || 1.0;
    return Math.round((cell.cost || 10000) * 0.1 * mult);
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 h-full relative overflow-hidden bg-slate-50">
      {/* AI World Event Banner */}
      {gameState.activeWorldEvent && (
        <div className="bg-indigo-600 text-white p-3 mx-3 rounded-2xl flex items-center justify-between animate-pulse shadow-lg z-50 mt-2">
           <div className="flex items-center gap-3">
              <i className="fa-solid fa-chart-line text-amber-400"></i>
              <div>
                 <span className="text-[10px] font-black uppercase block leading-none">{gameState.activeWorldEvent.title}</span>
                 <p className="text-[8px] font-bold opacity-80">{gameState.activeWorldEvent.description}</p>
              </div>
           </div>
        </div>
      )}

      {/* Market Ticker */}
      <div className="flex bg-slate-900 py-2 px-4 gap-6 overflow-x-auto no-scrollbar mx-3 rounded-2xl border border-white/5">
         {Object.entries(gameState.marketIndices).map(([sector, val]) => {
            const v = val as number;
            return (
              <div key={sector} className="flex items-center gap-2 shrink-0">
                 <span className="text-[8px] font-black text-slate-500 uppercase">{sector}</span>
                 <span className={`text-[9px] font-black ${v >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {v >= 1 ? '▲' : '▼'} {Math.abs(Math.round((v - 1) * 100))}%
                 </span>
              </div>
            );
         })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-4">
        {/* Arena View */}
        <div className="space-y-4">
           {/* My Portfolio Stats */}
           <div className="p-5 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Твой кэш</span>
                 <span className="text-xl font-black italic">{me?.cash.toLocaleString()} ₽</span>
              </div>
              <div className="text-right flex items-center gap-3">
                 <div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">Ходов</span>
                    <span className="text-xl font-black italic text-indigo-600">{(me as any)?.game_rolls || 0}</span>
                 </div>
                 <button 
                  onClick={() => setChatOpen(true)}
                  className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg animate-pulse"
                 >
                    <i className="fa-solid fa-headset"></i>
                 </button>
              </div>
           </div>

           {/* Board Grid */}
           <div className="grid grid-cols-3 gap-2">
              {BOARD.map(cell => {
                 const isMeHere = me?.position === cell.id;
                 const ownerId = gameState.ownedAssets[cell.id];
                 const owner = players.find(p => p.id === ownerId);
                 const assetLvl = owner?.assetLevels[cell.id] || 0;

                 return (
                   <button 
                     key={cell.id} 
                     onClick={() => setSelectedCell(cell)}
                     className={`relative aspect-square rounded-3xl border-2 flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${
                       cell.district ? DISTRICT_COLORS[cell.district] : 'bg-white border-slate-100 text-slate-300'
                     } ${isMeHere ? 'ring-4 ring-amber-400 ring-offset-2' : ''}`}
                   >
                      <i className={`fa-solid ${cell.icon} text-lg mb-1`}></i>
                      <span className="text-[7px] font-black uppercase text-center line-clamp-1">{cell.title}</span>
                      {assetLvl > 0 && <div className="absolute top-1 left-2 flex gap-0.5">{Array.from({ length: assetLvl }).map((_, i) => <div key={i} className="w-1 h-1 bg-amber-400 rounded-full"></div>)}</div>}
                      {owner && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-white bg-slate-800 flex items-center justify-center text-[6px]">👑</div>}
                   </button>
                 )
              })}
           </div>
        </div>
      </div>

      {/* Game Master Chat Overlay */}
      {chatOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
           <header className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                    <i className="fa-solid fa-brain"></i>
                 </div>
                 <div>
                    <h3 className="text-white font-black uppercase italic tracking-widest">Магистр Арены</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-[8px] font-black text-slate-500 uppercase">В сети / Анализ рынка</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="w-10 h-10 bg-white/5 rounded-xl text-white flex items-center justify-center">
                 <i className="fa-solid fa-times"></i>
              </button>
           </header>

           <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {chatHistory.length === 0 && (
                <div className="text-center py-10 space-y-4">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Приветствую в Племени. Есть вопросы по правилам или стратегии?</p>
                   <div className="grid grid-cols-1 gap-2">
                      <button onClick={() => { setUserInput("Как мне получить больше ходов?"); }} className="p-4 bg-white/5 rounded-2xl text-[10px] text-indigo-400 font-bold border border-white/5 text-left italic">"Как мне получить больше ходов?"</button>
                      <button onClick={() => { setUserInput("Объясни правила налогов на акции"); }} className="p-4 bg-white/5 rounded-2xl text-[10px] text-indigo-400 font-bold border border-white/5 text-left italic">"Объясни правила налогов на акции"</button>
                      <button onClick={() => { setUserInput("Что дает 4 уровень здания?"); }} className="p-4 bg-white/5 rounded-2xl text-[10px] text-indigo-400 font-bold border border-white/5 text-left italic">"Что дает 4 уровень здания?"</button>
                   </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none'}`}>
                      <p className="text-sm font-medium leading-relaxed italic">{msg.parts[0].text}</p>
                   </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-white/5 p-4 rounded-2xl animate-pulse flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
           </div>

           <footer className="p-6 bg-slate-900 border-t border-white/5">
              <div className="flex gap-3">
                 <input 
                   type="text" 
                   value={userInput}
                   onChange={e => setUserInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && sendMessage()}
                   placeholder="Задай вопрос Магистру..."
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-indigo-500 transition-all"
                 />
                 <button 
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isTyping}
                  className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50"
                 >
                    <i className="fa-solid fa-paper-plane"></i>
                 </button>
              </div>
           </footer>
        </div>
      )}

      {/* Cell Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end justify-center p-4" onClick={() => setSelectedCell(null)}>
           <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${selectedCell.district ? DISTRICT_COLORS[selectedCell.district] : 'bg-slate-100'}`}>
                       <i className={`fa-solid ${selectedCell.icon}`}></i>
                    </div>
                    <div>
                       <h4 className="text-xl font-black uppercase italic leading-none">{selectedCell.title}</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase mt-1 italic">"{selectedCell.description}"</p>
                    </div>
                 </div>
              </div>

              {selectedCell.type === 'asset' && (
                <div className="space-y-4">
                   <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                      <button onClick={() => setTradeMode('buy')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${tradeMode === 'buy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Купить</button>
                      <button onClick={() => setTradeMode('sell')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${tradeMode === 'sell' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}>Продать</button>
                   </div>

                   <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-500 uppercase">Цена акции</span>
                         <span className="text-xl font-black italic">{getStockPrice(selectedCell).toLocaleString()} ₽</span>
                      </div>
                      
                      {tradeMode === 'buy' ? (
                        <>
                          <input 
                            type="range" min="1000" max={me?.cash || 50000} step="1000" 
                            value={tradeAmount} onChange={e => setTradeAmount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                             <span>Сумма: {tradeAmount.toLocaleString()} ₽</span>
                             <span>Акций: {Math.floor(tradeAmount / getStockPrice(selectedCell))}</span>
                          </div>
                          <button 
                            onClick={() => { buyStock(selectedCell.id, tradeAmount, BOARD); setSelectedCell(null); }}
                            className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase shadow-xl"
                          >
                             Купить Акции
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-center py-2">
                             <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">У тебя в портфеле</span>
                             <span className="text-lg font-black italic">{me?.portfolio.find(s => s.cellId === selectedCell.id)?.shares || 0} шт.</span>
                          </div>
                          <button 
                            onClick={() => { sellStock(selectedCell.id, me?.portfolio.find(s => s.cellId === selectedCell.id)?.shares || 0, BOARD); setSelectedCell(null); }}
                            className="w-full py-4 bg-rose-600 rounded-2xl font-black text-xs uppercase shadow-xl"
                          >
                             Продать всё (Налог {TAX_RATE * 100}%)
                          </button>
                        </>
                      )}
                   </div>

                   {!gameState.ownedAssets[selectedCell.id] && me?.position === selectedCell.id && (
                     <button 
                       onClick={() => { buyAsset(selectedCell.id, BOARD); setSelectedCell(null); }}
                       className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase shadow-2xl border border-slate-800"
                     >
                        Выкупить компанию целиком (Налог 5%)
                     </button>
                   )}
                </div>
              )}

              {selectedCell.type === 'bank' && (
                <button onClick={() => { makeDeposit(selectedCell.id, 10000); setSelectedCell(null); }} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase shadow-xl">
                   Открыть вклад (+15%)
                </button>
              )}
           </div>
        </div>
      )}

      {/* Main Dice Action */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-50">
         <button 
           onClick={() => rollDice(BOARD)}
           disabled={!(me as any)?.game_rolls}
           className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 transition-all ${
              (me as any)?.game_rolls ? 'bg-slate-900 text-white active:scale-95' : 'bg-slate-200 text-slate-400'
           }`}
         >
            <i className="fa-solid fa-dice text-2xl"></i>
            <span>Бросить кубик</span>
            {(me as any)?.game_rolls > 0 && <span className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center font-black text-[10px] shadow-lg">{(me as any)?.game_rolls}</span>}
         </button>
      </div>
    </div>
  );
};
