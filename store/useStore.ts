
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction, AccountabilityPartner } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";
const BOARD_CELLS_COUNT = 24;

export function useStore() {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === 'undefined') return INITIAL_USER;
    const savedId = localStorage.getItem('tribe_user_id');
    const savedName = localStorage.getItem('tribe_user_name');
    const userId = savedId || 'u' + Math.random().toString(36).substring(2, 9);
    if (!savedId) localStorage.setItem('tribe_user_id', userId);
    return { ...INITIAL_USER, id: userId, name: savedName || 'Игрок' };
  });
  
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedLobby = typeof window !== 'undefined' ? localStorage.getItem('tribe_active_lobby') : null;
    const lobbyId = savedLobby || Math.random().toString(36).substring(2, 7).toUpperCase();
    if (typeof window !== 'undefined') localStorage.setItem('tribe_active_lobby', lobbyId);
    
    return {
      players: [{ id: user.id, name: user.name, avatar: user.photo_url || "", cash: 50000, position: 0, isReady: false, isBankrupt: false, deposits: [], ownedAssets: [], isHost: true }],
      pendingPlayers: [],
      currentPlayerIndex: 0,
      history: ["Загрузка..."],
      turnNumber: 1,
      ownedAssets: {},
      reactions: [],
      lobbyId: lobbyId,
      status: 'lobby',
      lastRoll: null
    };
  });

  const isSyncingRef = useRef(false);

  const syncWithServer = async (payload: any, priority = false) => {
    const lobbyId = payload.lobbyId || gameState.lobbyId;
    if (!lobbyId) return;
    if (!priority && isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lobbyId, 
          player: payload.player || { 
            id: user.id, 
            name: user.name, 
            avatar: user.photo_url || "",
            isReady: gameState.players.find(p => p.id === user.id)?.isReady || false
          },
          ...payload 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGameState(prev => {
          const serverPlayers = data.players || [];
          if (!serverPlayers.some((p: any) => p.id === user.id)) {
            const me = prev.players.find(p => p.id === user.id);
            if (me) serverPlayers.push(me);
          }
          return { ...prev, ...data, players: serverPlayers };
        });
      }
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setTimeout(() => { isSyncingRef.current = false; }, priority ? 100 : 3000);
    }
  };

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      const startParam = tg.initDataUnsafe?.start_param;
      if (startParam) {
        const isPartner = startParam.startsWith('P_');
        const code = startParam.replace('P_', '').replace('G_', '').toUpperCase();
        localStorage.setItem('tribe_active_lobby', code);
        setView(AppView.SOCIAL);
        syncWithServer({ lobbyId: code, action: isPartner ? 'knock' : undefined }, true);
      }
    }
  }, []);

  const startGame = () => {
    const me = gameState.players.find(p => p.id === user.id);
    const nextReady = !me?.isReady;
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === user.id ? { ...p, isReady: nextReady } : p)
    }));
    syncWithServer({ player: { id: user.id, isReady: nextReady } }, true);
  };

  const enterFocusMode = (taskId: string) => {
    setActiveTaskId(taskId);
    setView(AppView.FOCUS);
  };

  const exitFocusMode = () => {
    setActiveTaskId(null);
    setView(AppView.DASHBOARD);
  };

  const forceStartGame = () => {
    syncWithServer({ gameStateUpdate: { status: 'playing', history: ["🚀 АРЕНА ЗАПУЩЕНА!"] } }, true);
  };

  const generateInviteLink = (type: 'partner' | 'game' = 'partner') => {
    const tg = (window as any).Telegram?.WebApp;
    const lobbyCode = gameState.lobbyId;
    const prefix = type === 'partner' ? 'P_' : 'G_';
    const botLink = `https://t.me/tribe_goals_bot/app?startapp=${prefix}${lobbyCode}`;
    const text = type === 'partner' 
      ? `Присоединяйся к моему Племени! 🤝 Стань партнером.\nСсылка:` 
      : `Заходи на Арену! 🚀 Поиграем.\nСсылка:`;
      
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(text)}`);
    } else {
      navigator.clipboard.writeText(`${text}\n${botLink}`);
      alert("Ссылка скопирована!");
    }
  };

  useEffect(() => {
    if (view === AppView.SOCIAL) {
      const interval = setInterval(() => syncWithServer({}, false), 4000);
      return () => clearInterval(interval);
    }
  }, [view, gameState.lobbyId]);

  return {
    user, view, setView, goals, subgoals, activeTaskId, enterFocusMode, exitFocusMode,
    partners: (gameState.players || []).filter(p => p.id !== user.id && !p.isBot).map(p => ({ id: p.id, name: p.name, role: 'teammate', avatar: p.avatar })),
    pendingRequests: (gameState.pendingPlayers || []).map(p => ({ id: p.id, name: p.name, role: 'teammate', avatar: p.avatar })),
    transactions, gameState,
    approvePartner: (id: string) => syncWithServer({ action: 'approve', targetId: id }, true),
    forceStartGame,
    rollDice: (board: BoardCell[]) => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setGameState(p => ({ ...p, lastRoll: roll }));
      setTimeout(() => {
        setGameState(prev => {
          const cp = prev.players[prev.currentPlayerIndex];
          const nPos = ((cp?.position || 0) + roll) % BOARD_CELLS_COUNT;
          const up = {
            players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, position: nPos } : p),
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
            turnNumber: prev.turnNumber + 1,
            history: [`🎲 ${cp?.name} -> ${board[nPos].title}`, ...prev.history].slice(0, 10),
            lastRoll: null
          };
          syncWithServer({ gameStateUpdate: up }, true);
          return { ...prev, ...up };
        });
      }, 1500);
    },
    buyAsset: (cellId: number, board: BoardCell[]) => {
      setGameState(prev => {
        const cp = prev.players[prev.currentPlayerIndex];
        const cell = board[cellId];
        if (!cp || cp.cash < (cell.cost || 0)) return prev;
        const up = {
          players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, cash: p.cash - (cell.cost || 0), ownedAssets: [...p.ownedAssets, cellId] } : p),
          ownedAssets: { ...prev.ownedAssets, [cellId]: cp.id },
          history: [`🏠 ${cp.name} купил ${cell.title}`, ...prev.history].slice(0, 10)
        };
        syncWithServer({ gameStateUpdate: up }, true);
        return { ...prev, ...up };
      });
    },
    generateInviteLink,
    resetLobby: () => syncWithServer({ resetLobby: true }, true),
    kickPlayer: (id: string) => syncWithServer({ kickPlayerId: id }, true),
    createNewLobby: () => {
      const id = Math.random().toString(36).substring(2, 7).toUpperCase();
      localStorage.setItem('tribe_active_lobby', id);
      setGameState(p => ({ ...p, lobbyId: id, status: 'lobby', players: [p.players.find(x => x.id === user.id)!] }));
      syncWithServer({ lobbyId: id, resetLobby: true }, true);
    },
    joinFakePlayer: () => syncWithServer({ addBot: { name: "AI Бот", cash: 50000, position: 0 } }, true),
    joinLobbyManual: (c: string) => { const code = c.toUpperCase(); localStorage.setItem('tribe_active_lobby', code); syncWithServer({ lobbyId: code }, true); },
    startGame,
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    addTransaction: (a: number, t: any, c: string) => setTransactions(p => [...p, { id: crypto.randomUUID(), amount: a, type: t, category: c, timestamp: new Date().toISOString() }]),
    updateUserInfo: (d: any) => setUser(p => ({ ...p, ...d })),
    resetData: () => { localStorage.clear(); window.location.reload(); }
  };
}
