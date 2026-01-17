
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";
const BOARD_CELLS_COUNT = 24;

export function useStore() {
  const [user, setUser] = useState<User>(() => ({
    ...INITIAL_USER,
    id: 'id' + Math.random().toString(36).substring(2, 9)
  }));
  
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [partners, setPartners] = useState(SAMPLE_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    // Пытаемся восстановить ID лобби из памяти, чтобы избежать '---'
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('tribe_active_lobby') : null;
    const initialId = savedId || Math.random().toString(36).substring(2, 7).toUpperCase();
    if (typeof window !== 'undefined' && !savedId) localStorage.setItem('tribe_active_lobby', initialId);
    
    return {
      players: [],
      currentPlayerIndex: 0,
      history: ["Инициализация..."],
      turnNumber: 1,
      ownedAssets: {},
      reactions: [],
      lobbyId: initialId,
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
        // Важно: если сервер вернул пустые поля, сохраняем наш текущий ID лобби
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
      setTimeout(() => { isSyncingRef.current = false; }, 1000);
    }
  };

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        const photo = u.photo_url || "";
        setUser(prev => ({
          ...prev,
          id: String(u.id),
          name: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
          photo_url: photo
        }));
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
    
    if (!lid) {
      alert("Ошибка: Лобби еще не создано. Пожалуйста, подождите.");
      return;
    }

    const botUser = "tribe_goals_bot"; 
    const inviteUrl = `https://t.me/${botUser}?start=${lid}`;
    const shareText = `Присоединяйся к моей игре в Tribe! 🚀\nКод лобби: ${lid}`;
    
    if (tg && tg.openTelegramLink) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
      tg.HapticFeedback?.impactOccurred('medium');
      tg.openTelegramLink(shareUrl);
    } else if (navigator.share) {
      navigator.share({ title: 'Tribe Arena', text: shareText, url: inviteUrl }).catch(() => {
        navigator.clipboard.writeText(inviteUrl);
        alert("Ссылка скопирована!");
      });
    } else {
      navigator.clipboard.writeText(inviteUrl);
      alert("Ссылка скопирована в буфер обмена!");
    }
  }, [gameState.lobbyId]);

  const rollDice = async (board: BoardCell[]) => {
    if (gameState.lastRoll || gameState.status !== 'playing') return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, lastRoll: roll }));
    
    setTimeout(async () => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        if (!currentPlayer) return { ...prev, lastRoll: null };
        const newPos = (currentPlayer.position + roll) % BOARD_CELLS_COUNT;
        const update = {
          players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, position: newPos } : p),
          lastRoll: null,
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          turnNumber: prev.turnNumber + 1,
          history: [`🎲 ${currentPlayer.name} перешел на ${board[newPos].title}`, ...prev.history].slice(0, 15)
        };
        syncWithServer({ gameStateUpdate: update });
        return { ...prev, ...update };
      });
    }, 2000);
  };

  return {
    user, view, setView, goals, subgoals, partners, transactions, gameState,
    rollDice, generateInviteLink, 
    toggleReady: () => syncWithServer({ player: { id: user.id, isReady: true } }),
    buyAsset: async (cellId: number, board: BoardCell[]) => {
      const pIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
      const player = gameState.players[pIdx];
      if (player && player.cash >= (board[cellId].cost || 0) && !gameState.ownedAssets[cellId]) {
        await syncWithServer({ gameStateUpdate: {
          ownedAssets: { ...gameState.ownedAssets, [cellId]: player.id },
          players: gameState.players.map((p, i) => i === pIdx ? { ...p, cash: p.cash - (board[cellId].cost || 0) } : p),
          history: [`💎 ${player.name} купил ${board[cellId].title}`, ...gameState.history].slice(0, 15)
        }});
      }
    },
    joinFakePlayer: () => syncWithServer({ addBot: { name: "AI Инвестор", position: 0, cash: 50000, isBankrupt: false, isReady: true, isBot: true, ownedAssets: [] } }),
    joinLobbyManual: (code: string) => { 
      const clean = code.toUpperCase();
      localStorage.setItem('tribe_active_lobby', clean);
      setGameState(p => ({ ...p, lobbyId: clean })); 
      setView(AppView.SOCIAL); 
    },
    startGame: () => syncWithServer({ player: { id: user.id, isReady: !gameState.players.find(p=>p.id===user.id)?.isReady } }),
    updateSubgoalProgress: () => {},
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    addTransaction: (a: number, t: any, c: string) => { setTransactions(p => [...p, { id: crypto.randomUUID(), amount: a, type: t, category: c, timestamp: new Date().toISOString() }]); },
    addPartner: (n: string, r: string) => { setPartners(p => [...p, { id: crypto.randomUUID(), name: n, role: r as any }]); },
    toggleGoalPrivacy: (id: string) => { setGoals(p => p.map(g => g.id === id ? { ...g, is_shared: !g.is_shared } : g)); },
    updateUserInfo: (data: Partial<User>) => { setUser(p => ({ ...p, ...data })); },
    resetData: () => { localStorage.removeItem('tribe_active_lobby'); window.location.reload(); }
  };
}
