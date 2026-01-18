
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
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedLobby = typeof window !== 'undefined' ? localStorage.getItem('tribe_active_lobby') : null;
    const lobbyId = savedLobby || Math.random().toString(36).substring(2, 7).toUpperCase();
    if (typeof window !== 'undefined') localStorage.setItem('tribe_active_lobby', lobbyId);
    
    return {
      players: [],
      pendingPlayers: [],
      currentPlayerIndex: 0,
      history: ["Синхронизация..."],
      turnNumber: 1,
      ownedAssets: {},
      reactions: [],
      lobbyId: lobbyId,
      status: 'lobby',
      lastRoll: null
    };
  });

  const isSyncingRef = useRef(false);

  // Синхронизация
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
          player: { 
            id: user.id, 
            name: user.name, 
            avatar: user.photo_url || "",
            isReady: payload.player?.isReady ?? gameState.players.find(p => p.id === user.id)?.isReady ?? false
          },
          ...payload 
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.lobbyId) {
          setGameState(prev => {
            const serverPlayers = data.players || [];
            // Гарантируем присутствие себя в списке
            if (!serverPlayers.some((p: any) => p.id === user.id)) {
              serverPlayers.push({ id: user.id, name: user.name, avatar: user.photo_url, isReady: false, position: 0, cash: 50000 });
            }
            return { ...prev, ...data, players: serverPlayers };
          });
        }
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setTimeout(() => { isSyncingRef.current = false; }, priority ? 100 : 3000);
    }
  };

  // Обработка Deep Links
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      
      // Параметры могут быть в start_param или в startapp
      const startParam = tg.initDataUnsafe?.start_param || new URLSearchParams(window.location.search).get('startapp');
      
      if (startParam) {
        const isPartnerRequest = startParam.startsWith('P_');
        const code = startParam.replace('P_', '').replace('G_', '').toUpperCase();
        
        localStorage.setItem('tribe_active_lobby', code);
        setView(AppView.SOCIAL);
        
        if (isPartnerRequest) {
           syncWithServer({ lobbyId: code, action: 'knock' }, true);
        } else {
           syncWithServer({ lobbyId: code }, true);
        }
      }
    }
  }, []);

  // Одобрение партнера
  const approvePartner = (partnerId: string) => {
    syncWithServer({ action: 'approve', targetId: partnerId }, true);
  };

  // Принудительный старт
  const forceStartGame = () => {
    syncWithServer({ gameStateUpdate: { status: 'playing', history: ["🚀 АРЕНА ЗАПУЩЕНА ХОЗЯИНОМ!"] } }, true);
  };

  const partners = useMemo(() => {
    return (gameState.players || [])
      .filter(p => p.id !== user.id && !p.isBot)
      .map(p => ({
        id: p.id, name: p.name, avatar: p.avatar,
        role: 'teammate' as const, xp: p.cash, status: 'accepted' as const
      }));
  }, [gameState.players, user.id]);

  const pendingRequests = useMemo(() => {
    return (gameState.pendingPlayers || []).map(p => ({
      id: p.id, name: p.name, avatar: p.avatar,
      role: 'teammate' as const, xp: 0, status: 'pending' as const
    }));
  }, [gameState.pendingPlayers]);

  // Фоновый опрос
  useEffect(() => {
    if (!gameState.lobbyId || view !== AppView.SOCIAL) return;
    const interval = setInterval(() => syncWithServer({}, false), 4000);
    return () => clearInterval(interval);
  }, [gameState.lobbyId, view]);

  return {
    user, view, setView, goals, subgoals, partners, pendingRequests, transactions, gameState,
    approvePartner,
    forceStartGame,
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
    generateInviteLink: (type: 'partner' | 'game' = 'partner') => {
      const tg = (window as any).Telegram?.WebApp;
      const lobbyCode = gameState.lobbyId;
      const prefix = type === 'partner' ? 'P_' : 'G_';
      
      // ВАЖНО: Используем формат /app?startapp для Mini Apps
      const botLink = `https://t.me/tribe_goals_bot/app?startapp=${prefix}${lobbyCode}`;
      
      const description = type === 'partner' 
        ? `Присоединяйся к моему Племени! 🤝 Стань моим партнером по целям.\nЖми ссылку, чтобы постучаться:` 
        : `Заходи на Арену! 🚀 Пора проверить наш капитал в игре.\nЖми ссылку, чтобы войти в лобби:`;
      
      if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(description)}`);
      } else {
        navigator.clipboard.writeText(`${description}\n${botLink}`);
        alert(`Приглашение скопировано!`);
      }
    },
    resetLobby: () => {
      syncWithServer({ resetLobby: true }, true);
    },
    kickPlayer: (pid: string) => syncWithServer({ kickPlayerId: pid }, true),
    createNewLobby: () => {
      const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
      localStorage.setItem('tribe_active_lobby', newId);
      setGameState(prev => ({ ...prev, lobbyId: newId, players: [], status: 'lobby' }));
      syncWithServer({ lobbyId: newId, resetLobby: true }, true);
    },
    joinFakePlayer: () => syncWithServer({ addBot: { name: "AI Бот", position: 0, cash: 50000, isBankrupt: false, isReady: true, isBot: true, ownedAssets: [] } }, true),
    joinLobbyManual: (code: string) => { 
      const c = code.toUpperCase().trim();
      localStorage.setItem('tribe_active_lobby', c);
      syncWithServer({ lobbyId: c }, true);
    },
    startGame: () => {
      const me = gameState.players.find(p => p.id === user.id);
      const nextReady = !(me?.isReady || false);
      syncWithServer({ player: { id: user.id, isReady: nextReady } }, true);
    },
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    addTransaction: (a: number, t: any, c: string) => { setTransactions(p => [...p, { id: crypto.randomUUID(), amount: a, type: t, category: c, timestamp: new Date().toISOString() }]); },
    updateUserInfo: (data: Partial<User>) => { setUser(p => ({ ...p, ...data })); },
    resetData: () => { localStorage.clear(); window.location.reload(); }
  };
}
