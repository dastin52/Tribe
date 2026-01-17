
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";
const BOARD_CELLS_COUNT = 24;

export function useStore() {
  // Гарантируем уникальный ID игрока, который не меняется при перезагрузке
  const [user, setUser] = useState<User>(() => {
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('tribe_user_id') : null;
    const userId = savedId || 'u' + Math.random().toString(36).substring(2, 9);
    if (typeof window !== 'undefined' && !savedId) localStorage.setItem('tribe_user_id', userId);
    
    return {
      ...INITIAL_USER,
      id: userId,
      photo_url: "" // Очищаем моковые фото
    };
  });
  
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [partners, setPartners] = useState(SAMPLE_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedLobby = typeof window !== 'undefined' ? localStorage.getItem('tribe_active_lobby') : null;
    const lobbyId = savedLobby || Math.random().toString(36).substring(2, 7).toUpperCase();
    if (typeof window !== 'undefined' && !savedLobby) localStorage.setItem('tribe_active_lobby', lobbyId);
    
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
  const lastStateHash = useRef("");

  const syncWithServer = async (payload: any) => {
    if (!gameState.lobbyId || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId: gameState.lobbyId, ...payload })
      });
      if (res.ok) {
        const data = await res.json();
        const cleanData = { ...data, lobbyId: data.lobbyId || gameState.lobbyId };
        const hash = JSON.stringify(cleanData);
        if (hash !== lastStateHash.current) {
          lastStateHash.current = hash;
          setGameState(cleanData);
        }
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setTimeout(() => { isSyncingRef.current = false; }, 800);
    }
  };

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
          photo_url: u.photo_url || ""
        }));
        localStorage.setItem('tribe_user_id', String(u.id));
      }
      const startParam = tg.initDataUnsafe?.start_param;
      if (startParam) {
        const newId = startParam.toUpperCase();
        localStorage.setItem('tribe_active_lobby', newId);
        setGameState(prev => ({ ...prev, lobbyId: newId }));
        setView(AppView.SOCIAL);
      }
    }
  }, []);

  useEffect(() => {
    if (!gameState.lobbyId || !user.id) return;
    const me: GamePlayer = {
      id: user.id,
      name: user.name,
      avatar: user.photo_url || "",
      position: 0,
      cash: 50000,
      isBankrupt: false,
      isReady: false,
      deposits: [],
      ownedAssets: [],
    };
    syncWithServer({ player: me });
  }, [user.id, gameState.lobbyId]);

  useEffect(() => {
    if (!gameState.lobbyId || view !== AppView.SOCIAL) return;
    
    const fetchLobby = async () => {
      if (document.hidden || isSyncingRef.current) return;
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${gameState.lobbyId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.lobbyId) {
          const hash = JSON.stringify(data);
          if (hash !== lastStateHash.current) {
            lastStateHash.current = hash;
            setGameState(prev => ({ ...data, lastRoll: prev.lastRoll }));
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(fetchLobby, 5000);
    fetchLobby();
    return () => clearInterval(interval);
  }, [gameState.lobbyId, view]);

  const generateInviteLink = useCallback(() => {
    const tg = (window as any).Telegram?.WebApp;
    const lid = gameState.lobbyId;
    if (!lid) return;

    const botUser = "tribe_goals_bot"; 
    const inviteUrl = `https://t.me/${botUser}?start=${lid}`;
    const shareText = `Входи в моё племя! 🚀 Код: ${lid}`;
    
    if (tg && tg.openTelegramLink) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
      tg.HapticFeedback?.impactOccurred('medium');
      tg.openTelegramLink(shareUrl);
    } else {
      navigator.clipboard.writeText(inviteUrl);
      alert("Ссылка скопирована!");
    }
  }, [gameState.lobbyId]);

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
          syncWithServer({ gameStateUpdate: up });
          return {...prev, ...up};
        });
      }, 2000);
    },
    generateInviteLink,
    buyAsset: async (cid: number, b: BoardCell[]) => {
      const pIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
      const p = gameState.players[pIdx];
      if (p && p.cash >= (b[cid].cost || 0)) {
        await syncWithServer({ gameStateUpdate: {
          ownedAssets: { ...gameState.ownedAssets, [cid]: p.id },
          players: gameState.players.map((pl, i) => i === pIdx ? { ...pl, cash: pl.cash - (b[cid].cost || 0) } : pl)
        }});
      }
    },
    joinFakePlayer: () => syncWithServer({ addBot: { name: "AI Бот", position: 0, cash: 50000, isBankrupt: false, isReady: true, isBot: true, ownedAssets: [] } }),
    joinLobbyManual: (code: string) => { 
      const c = code.toUpperCase().trim();
      if (!c) return;
      localStorage.setItem('tribe_active_lobby', c);
      setGameState(p => ({ ...p, lobbyId: c, players: [] })); 
      // Принудительно запускаем синхронизацию для нового ID
      isSyncingRef.current = false;
    },
    startGame: () => syncWithServer({ player: { id: user.id, isReady: !gameState.players.find(p=>p.id===user.id)?.isReady } }),
    updateSubgoalProgress: () => {},
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    addTransaction: (a: number, t: any, c: string) => { setTransactions(p => [...p, { id: crypto.randomUUID(), amount: a, type: t, category: c, timestamp: new Date().toISOString() }]); },
    addPartner: (n: string, r: string) => { setPartners(p => [...p, { id: crypto.randomUUID(), name: n, role: r as any }]); },
    toggleGoalPrivacy: (id: string) => { setGoals(p => p.map(g => g.id === id ? { ...g, is_shared: !g.is_shared } : g)); },
    updateUserInfo: (data: Partial<User>) => { setUser(p => ({ ...p, ...data })); },
    resetData: () => { localStorage.clear(); window.location.reload(); }
  };
}
