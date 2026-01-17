
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, GameDeposit, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";

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
    history: ["Инициализация..."],
    turnNumber: 1,
    ownedAssets: {},
    reactions: [],
    lobbyId: null,
    status: 'lobby',
    lastRoll: null
  });

  // 1. Первичная настройка при загрузке
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    if (tg.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setUser(prev => ({
        ...prev,
        id: String(u.id),
        name: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
        photo_url: u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=6366f1&color=fff`
      }));
    }

    const startParam = tg.initDataUnsafe?.start_param;
    if (startParam) {
      setGameState(prev => ({ ...prev, lobbyId: startParam.toUpperCase() }));
      setView(AppView.SOCIAL);
    } else {
      setGameState(prev => {
        if (!prev.lobbyId) {
          return { ...prev, lobbyId: Math.random().toString(36).substring(2, 7).toUpperCase() };
        }
        return prev;
      });
    }
  }, []);

  // 2. Регистрация в лобби
  useEffect(() => {
    if (!gameState.lobbyId || !user.id || user.id.startsWith('anon-')) return;

    const register = async () => {
      try {
        const me: GamePlayer = {
          id: user.id,
          name: user.name,
          avatar: user.photo_url || '',
          position: 0,
          cash: 50000,
          isBankrupt: false,
          deposits: [],
          ownedAssets: [],
          isHost: !window.Telegram?.WebApp?.initDataUnsafe?.start_param
        };

        const res = await fetch(`${API_BASE}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lobbyId: gameState.lobbyId, player: me })
        });
        
        if (res.ok) {
          const data = await res.json();
          setGameState(prev => ({ ...prev, players: data.players, status: data.status }));
        }
      } catch (e) {
        console.error("Join error:", e);
      }
    };

    register();
  }, [user.id, gameState.lobbyId]);

  // 3. Поллинг лобби
  useEffect(() => {
    if (!gameState.lobbyId) return;

    const interval = setInterval(async () => {
      if (document.hidden) return;
      
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${gameState.lobbyId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && data.players) {
          setGameState(prev => {
            const oldIds = prev.players.map(p => p.id).join(',');
            const newIds = data.players.map((p: any) => p.id).join(',');
            
            if (oldIds === newIds && prev.status === data.status) return prev;
            
            return {
              ...prev,
              players: data.players,
              status: data.status || prev.status
            };
          });
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState.lobbyId]);

  // Функция для ручного ввода кода
  const joinLobbyManual = (code: string) => {
    const formattedCode = code.trim().toUpperCase();
    if (formattedCode.length >= 4) {
      setGameState(prev => ({ 
        ...prev, 
        lobbyId: formattedCode, 
        players: [], // Сбрасываем текущих игроков, чтобы загрузить новых из API
        status: 'lobby' 
      }));
      setView(AppView.SOCIAL);
    }
  };

  const generateInviteLink = () => {
    const botUsername = "tribe_goals_bot"; 
    const link = `https://t.me/${botUsername}/app?startapp=${gameState.lobbyId}`;
    
    if (window.Telegram?.WebApp) {
      const shareText = `Вступай в моё Племя! Мой код лобби: ${gameState.lobbyId} 🚀`;
      const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;
      window.Telegram.WebApp.openTelegramLink(fullUrl);
    }
  };

  const startGame = async () => {
    if (!gameState.lobbyId) return;
    try {
      await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId: gameState.lobbyId, status: 'playing' })
      });
      setGameState(prev => ({ ...prev, status: 'playing' }));
    } catch (e) {}
  };

  const rollDice = (board: BoardCell[]) => {
    if (gameState.lastRoll) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, lastRoll: roll }));
    setTimeout(() => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        if (!currentPlayer) return prev;
        const newPos = (currentPlayer.position + roll) % board.length;
        return {
          ...prev,
          players: prev.players.map((p, idx) => idx === prev.currentPlayerIndex ? { ...p, position: newPos } : p),
          lastRoll: null,
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          turnNumber: prev.turnNumber + 1,
          history: [`${currentPlayer.name} перешел на ${board[newPos].title}`, ...prev.history].slice(0, 10)
        };
      });
    }, 1500);
  };

  const buyAsset = (cellId: number, board: BoardCell[]) => {
    const lastIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
    const player = gameState.players[lastIdx];
    if (player && player.cash >= (board[cellId].cost || 0) && !gameState.ownedAssets[cellId]) {
      setGameState(prev => ({
        ...prev,
        ownedAssets: { ...prev.ownedAssets, [cellId]: player.id },
        players: prev.players.map((p, idx) => idx === lastIdx ? { ...p, cash: p.cash - (board[cellId].cost || 0), ownedAssets: [...p.ownedAssets, cellId] } : p)
      }));
    }
  };

  return {
    user, view, setView, goals, subgoals, partners, transactions, gameState,
    rollDice, buyAsset, generateInviteLink, startGame, joinLobbyManual,
    joinFakePlayer: () => {},
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
    sendReaction: (emoji: string) => {}
  };
}
