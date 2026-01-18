
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";
const BOARD_CELLS_COUNT = 24;

export function useStore() {
  // Инициализация пользователя с проверкой localStorage СРАЗУ
  const [user, setUser] = useState<User>(() => {
    if (typeof window === 'undefined') return INITIAL_USER;
    let userId = localStorage.getItem('tribe_user_id');
    if (!userId) {
      userId = 'u' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('tribe_user_id', userId);
    }
    return { ...INITIAL_USER, id: userId, name: localStorage.getItem('tribe_user_name') || 'Игрок' };
  });
  
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [partners, setPartners] = useState(SAMPLE_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window === 'undefined') return { players: [], currentPlayerIndex: 0, history: [], turnNumber: 1, ownedAssets: {}, reactions: [], lobbyId: 'DEMO', status: 'lobby', lastRoll: null };
    const lobbyId = localStorage.getItem('tribe_active_lobby') || Math.random().toString(36).substring(2, 7).toUpperCase();
    localStorage.setItem('tribe_active_lobby', lobbyId);
    
    return {
      players: [],
      currentPlayerIndex: 0,
      history: ["Инициализация..."],
      turnNumber: 1,
      ownedAssets: {},
      reactions: [],
      lobbyId: lobbyId,
      status: 'lobby',
      lastRoll: null
    };
  });

  const isSyncingRef = useRef(false);

  // Улучшенная функция синхронизации: ручные действия (isManual) игнорируют блокировку
  const syncWithServer = async (payload: any, isManual = false) => {
    if (!gameState.lobbyId) return;
    if (!isManual && isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId: gameState.lobbyId, ...payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.lobbyId) {
          setGameState(prev => ({ ...data, lastRoll: prev.lastRoll }));
        }
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      // Короткая задержка для предотвращения дребезга
      setTimeout(() => { isSyncingRef.current = false; }, isManual ? 100 : 500);
    }
  };

  // Получение данных из Telegram WebApp
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      const fullName = u.first_name + (u.last_name ? ` ${u.last_name}` : '');
      setUser(prev => ({
        ...prev,
        id: String(u.id),
        name: fullName,
        photo_url: u.photo_url || ""
      }));
      localStorage.setItem('tribe_user_id', String(u.id));
      localStorage.setItem('tribe_user_name', fullName);
    }
  }, []);

  // Авто-вход в лобби при изменении данных или ID лобби
  useEffect(() => {
    if (!gameState.lobbyId || !user.id) return;
    const me: GamePlayer = {
      id: user.id,
      name: user.name,
      avatar: user.photo_url || "",
      position: 0,
      cash: 50000,
      isBankrupt: false,
      isReady: gameState.players.find(p => p.id === user.id)?.isReady || false,
      deposits: [],
      ownedAssets: [],
    };
    syncWithServer({ player: me });
  }, [user.id, user.name, gameState.lobbyId]);

  // Фоновое обновление (polling) только когда мы во вкладке Социум
  useEffect(() => {
    if (!gameState.lobbyId || view !== AppView.SOCIAL) return;
    const fetchLobby = async () => {
      if (document.hidden || isSyncingRef.current) return;
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${gameState.lobbyId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.lobbyId) setGameState(prev => ({ ...data, lastRoll: prev.lastRoll }));
        }
      } catch (e) {}
    };
    const interval = setInterval(fetchLobby, 4000);
    return () => clearInterval(interval);
  }, [gameState.lobbyId, view]);

  return {
    user, view, setView, goals, subgoals, partners, transactions, gameState,
    rollDice: (board: BoardCell[]) => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setGameState(p => ({...p, lastRoll: roll}));
      setTimeout(() => {
        setGameState(prev => {
          const cp = prev.players[prev.currentPlayerIndex];
          if (!cp) return {...prev, lastRoll: null};
          const nPos = (cp.position + roll) % BOARD_CELLS_COUNT;
          const up = {
            players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? {...p, position: nPos} : p),
            lastRoll: null,
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
            turnNumber: prev.turnNumber + 1,
            history: [`🎲 ${cp.name} на ${board[nPos].title}`, ...prev.history].slice(0, 10)
          };
          syncWithServer({ gameStateUpdate: up }, true);
          return {...prev, ...up};
        });
      }, 2000);
    },
    buyAsset: (cellId: number, board: BoardCell[]) => {
      setGameState(prev => {
        const cp = prev.players[prev.currentPlayerIndex];
        const cell = board[cellId];
        if (!cp || !cell || cell.type !== 'asset' || !cell.cost || cp.cash < cell.cost || prev.ownedAssets[cellId]) return prev;
        const up = {
          players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, cash: p.cash - (cell.cost || 0), ownedAssets: [...p.ownedAssets, cellId] } : p),
          ownedAssets: { ...prev.ownedAssets, [cellId]: cp.id },
          history: [`🏠 ${cp.name} купил ${cell.title}`, ...prev.history].slice(0, 10)
        };
        syncWithServer({ gameStateUpdate: up }, true);
        return { ...prev, ...up };
      });
    },
    generateInviteLink: () => {
      const tg = (window as any).Telegram?.WebApp;
      const inviteUrl = `https://t.me/tribe_goals_bot?start=${gameState.lobbyId}`;
      if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent("Входи в моё племя! 🚀")}`);
      } else {
        navigator.clipboard.writeText(inviteUrl);
        alert("Ссылка скопирована!");
      }
    },
    resetLobby: () => {
      const me: GamePlayer = { id: user.id, name: user.name, avatar: user.photo_url || "", position: 0, cash: 50000, isBankrupt: false, isReady: false, deposits: [], ownedAssets: [] };
      syncWithServer({ resetLobby: true, player: me }, true);
    },
    kickPlayer: (pid: string) => syncWithServer({ kickPlayerId: pid }, true),
    createNewLobby: () => {
      const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
      localStorage.setItem('tribe_active_lobby', newId);
      setGameState(p => ({ ...p, lobbyId: newId, players: [], status: 'lobby' }));
    },
    joinFakePlayer: () => syncWithServer({ addBot: { name: "AI Бот", position: 0, cash: 50000, isBankrupt: false, isReady: true, isBot: true, ownedAssets: [] } }, true),
    joinLobbyManual: (code: string) => { 
      const c = code.toUpperCase().trim();
      localStorage.setItem('tribe_active_lobby', c);
      setGameState(p => ({ ...p, lobbyId: c, players: [] })); 
    },
    startGame: () => {
      const isReady = !gameState.players.find(p => p.id === user.id)?.isReady;
      syncWithServer({ player: { id: user.id, isReady } }, true);
    },
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    addTransaction: (a: number, t: any, c: string) => { setTransactions(p => [...p, { id: crypto.randomUUID(), amount: a, type: t, category: c, timestamp: new Date().toISOString() }]); },
    updateUserInfo: (data: Partial<User>) => { setUser(p => ({ ...p, ...data })); },
    resetData: () => { localStorage.clear(); window.location.reload(); }
  };
}
