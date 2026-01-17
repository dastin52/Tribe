
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";
const BOARD_CELLS_COUNT = 24;

export function useStore() {
  const [user, setUser] = useState<User>(() => ({
    ...INITIAL_USER,
    id: 'anon-' + Math.random().toString(36).substring(2, 9)
  }));
  
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [partners, setPartners] = useState(SAMPLE_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    history: ["Синхронизация..."],
    turnNumber: 1,
    ownedAssets: {},
    reactions: [],
    lobbyId: null,
    status: 'lobby',
    lastRoll: null
  });

  const isSyncingRef = useRef(false);

  // Универсальный метод синхронизации
  const syncWithServer = async (payload: any) => {
    if (!gameState.lobbyId) return;
    isSyncingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId: gameState.lobbyId, ...payload })
      });
      if (res.ok) {
        const data = await res.json();
        setGameState(data);
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      // Даем небольшую паузу серверу на запись в KV
      setTimeout(() => { isSyncingRef.current = false; }, 800);
    }
  };

  // Инициализация Telegram и получение лобби
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setUser(prev => ({
          ...prev,
          id: String(u.id),
          name: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
          photo_url: u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=6366f1&color=fff`
        }));
      }
      const startParam = tg.initDataUnsafe?.start_param || tg.initDataUnsafe?.start_query;
      if (startParam) {
        setGameState(prev => ({ ...prev, lobbyId: startParam.toUpperCase() }));
        setView(AppView.SOCIAL);
      }
    }
    
    setGameState(prev => {
      if (!prev.lobbyId) return { ...prev, lobbyId: Math.random().toString(36).substring(2, 7).toUpperCase() };
      return prev;
    });
  }, []);

  // Регистрация игрока (срабатывает всегда при наличии ID и лобби)
  useEffect(() => {
    if (!gameState.lobbyId || !user.id || user.id.startsWith('anon-')) return;
    
    const me: GamePlayer = {
      id: user.id,
      name: user.name,
      avatar: user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      position: 0,
      cash: 50000,
      isBankrupt: false,
      isReady: false,
      deposits: [],
      ownedAssets: [],
    };
    
    syncWithServer({ player: me });
  }, [user.id, gameState.lobbyId]);

  // Фоновый поллинг обновлений
  useEffect(() => {
    if (!gameState.lobbyId) return;
    const interval = setInterval(async () => {
      if (document.hidden || isSyncingRef.current) return;
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${gameState.lobbyId}`);
        if (!res.ok) return;
        const data = await res.json();
        setGameState(prev => {
          // Если мы уже в игре, а сервер прислал лобби (баг KV), игнорируем
          if (prev.status === 'playing' && data.status === 'lobby') return prev;
          // Если бросаем кубик, не перебиваем анимацию
          if (prev.lastRoll) return prev;
          return data;
        });
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [gameState.lobbyId]);

  const toggleReady = async () => {
    const me = gameState.players.find(p => p.id === user.id);
    if (!me) return;
    
    const newReady = !me.isReady;
    
    // Оптимистичный UI: ставим галочку сразу
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === user.id ? { ...p, isReady: newReady } : p)
    }));

    // Отправляем актуальное состояние своего игрока
    await syncWithServer({ 
      player: { 
        id: user.id, 
        isReady: newReady,
        avatar: user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
      } 
    });
  };

  const addBot = async () => {
    if (gameState.players.length >= 4) return;
    const botNames = ["Крипто-Волк", "Инвестор-Тень", "Машина-Роста", "Бот-Аскет"];
    const name = botNames[Math.floor(Math.random() * botNames.length)];
    
    const botData = {
      name: name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
      position: 0,
      cash: 50000,
      isBankrupt: false,
      isReady: true,
      isBot: true,
      deposits: [],
      ownedAssets: [],
    };

    await syncWithServer({ addBot: botData });
  };

  const rollDice = async (board: BoardCell[]) => {
    if (gameState.lastRoll) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, lastRoll: roll }));
    
    setTimeout(async () => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        const newPos = (currentPlayer.position + roll) % BOARD_CELLS_COUNT;
        const cell = board[newPos];
        let newPlayers = [...prev.players];
        let newHistory = [`${currentPlayer.name} выбросил ${roll} и зашел на ${cell.title}`, ...prev.history];
        
        const standardUpdate = {
          players: newPlayers.map((p, i) => i === prev.currentPlayerIndex ? { ...p, position: newPos } : p),
          lastRoll: null,
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          turnNumber: prev.turnNumber + 1,
          history: newHistory.slice(0, 20)
        };
        syncWithServer({ gameStateUpdate: standardUpdate });
        return { ...prev, ...standardUpdate };
      });
    }, 2000);
  };

  const buyAsset = async (cellId: number, board: BoardCell[]) => {
    const playerIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
    const player = gameState.players[playerIdx];
    const cell = board[cellId];
    if (player && player.cash >= (cell.cost || 0) && !gameState.ownedAssets[cellId]) {
      const update = {
        ownedAssets: { ...gameState.ownedAssets, [cellId]: player.id },
        players: gameState.players.map((p, idx) => idx === playerIdx ? { ...p, cash: p.cash - (cell.cost || 0), ownedAssets: [...p.ownedAssets, cellId] } : p),
        history: [`💎 ${player.name} инвестировал в ${cell.title}!`, ...gameState.history].slice(0, 20)
      };
      await syncWithServer({ gameStateUpdate: update });
    }
  };

  const joinLobbyManual = (code: string) => {
    const formattedCode = code.trim().toUpperCase();
    if (formattedCode.length >= 4) {
      setGameState(prev => ({ ...prev, lobbyId: formattedCode, players: [], status: 'lobby' }));
      setView(AppView.SOCIAL);
    }
  };

  const generateInviteLink = useCallback(() => {
    const tg = (window as any).Telegram?.WebApp;
    const lobbyId = gameState.lobbyId;
    if (!lobbyId) return;
    const botUser = "tribe_goals_bot"; 
    const inviteUrl = `https://t.me/${botUser}?start=${lobbyId}`;
    const shareText = `Присоединяйся к моей игре в Tribe Arena! 🚀\nКод лобби: ${lobbyId}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
    
    if (tg && tg.openTelegramLink) tg.openTelegramLink(shareUrl);
    else {
      navigator.clipboard.writeText(inviteUrl);
      alert(`Ссылка скопирована!`);
    }
  }, [gameState.lobbyId]);

  return {
    user, view, setView, goals, subgoals, partners, transactions, gameState,
    rollDice, buyAsset, generateInviteLink, toggleReady, joinLobbyManual, addBot,
    joinFakePlayer: addBot,
    createDeposit: () => {}, 
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    updateSubgoalProgress: () => {},
    verifyProgress: () => {},
    addTransaction: (a: number, t: any, c: string) => { setTransactions(p => [...p, { id: crypto.randomUUID(), amount: a, type: t, category: c, timestamp: new Date().toISOString() }]); },
    addPartner: (n: string, r: string) => { setPartners(p => [...p, { id: crypto.randomUUID(), name: n, role: r as any }]); },
    toggleGoalPrivacy: (id: string) => { setGoals(p => p.map(g => g.id === id ? { ...g, is_shared: !g.is_shared } : g)); },
    updateUserInfo: (data: Partial<User>) => { setUser(p => ({ ...p, ...data })); },
    resetData: () => { window.location.reload(); },
    startMyOwnJourney: () => {},
    sendReaction: (emoji: string) => {},
    startGame: toggleReady
  };
}
