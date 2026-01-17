
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, GameDeposit, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

// Актуальный URL вашего воркера
const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";

export function useStore() {
  // Инициализируем пользователя со случайным ID, чтобы избежать коллизий в лобби
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

  // 1. Получение данных из Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      const realUser = {
        ...user,
        id: String(u.id),
        name: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
        photo_url: u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=6366f1&color=fff`
      };
      setUser(realUser);

      // Если есть start_param, сразу ставим лобби и переходим в соц. вкладку
      const startParam = tg.initDataUnsafe.start_param;
      if (startParam) {
        setGameState(prev => ({ ...prev, lobbyId: startParam }));
        setView(AppView.SOCIAL);
      }
    }
  }, []);

  // 2. Генерация Lobby ID если его нет
  useEffect(() => {
    if (!gameState.lobbyId) {
      const newId = Math.random().toString(36).substring(2, 7);
      setGameState(prev => ({ ...prev, lobbyId: newId }));
    }
  }, [gameState.lobbyId]);

  // 3. Регистрация в лобби при изменении ID пользователя или Lobby ID
  useEffect(() => {
    if (!gameState.lobbyId || !user.id) return;

    const registerInLobby = async () => {
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

        await fetch(`${API_BASE}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lobbyId: gameState.lobbyId, player: me })
        });
      } catch (e) {
        console.error("Lobby registration failed", e);
      }
    };

    registerInLobby();
  }, [user.id, gameState.lobbyId]);

  // 4. Опрос состояния лобби (Polling)
  useEffect(() => {
    const lId = gameState.lobbyId;
    if (!lId) return;

    const interval = setInterval(async () => {
      if (document.hidden) return; // Не тратим лимиты, если приложение свернуто
      
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${lId}`);
        const data = await res.json();
        if (data && data.players) {
          setGameState(prev => {
            // Обновляем только если данные реально изменились
            if (JSON.stringify(prev.players) === JSON.stringify(data.players) && prev.status === data.status) {
              return prev;
            }
            return {
              ...prev,
              players: data.players,
              status: data.status || prev.status
            };
          });
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [gameState.lobbyId]);

  const generateInviteLink = () => {
    // ТЕПЕРЬ ТУТ ВАШ БОТ:
    const botUsername = "tribe_goals_bot"; 
    const link = `https://t.me/${botUsername}/app?startapp=${gameState.lobbyId}`;
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Вступай в моё Племя! Построим капитал вместе 🚀")}`
      );
    }
  };

  const startGame = async () => {
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
    if (player.cash >= (board[cellId].cost || 0) && !gameState.ownedAssets[cellId]) {
      setGameState(prev => ({
        ...prev,
        ownedAssets: { ...prev.ownedAssets, [cellId]: player.id },
        players: prev.players.map((p, idx) => idx === lastIdx ? { ...p, cash: p.cash - (board[cellId].cost || 0), ownedAssets: [...p.ownedAssets, cellId] } : p)
      }));
    }
  };

  return {
    user, view, setView, goals, subgoals, partners, transactions, gameState,
    rollDice, buyAsset, generateInviteLink, startGame,
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
