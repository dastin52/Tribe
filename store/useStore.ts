
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";

const EVENTS = [
  { title: "Грант от Племени", text: "Твой проект заметили! Получи +15,000 XP", effect: (p: GamePlayer) => ({ ...p, cash: p.cash + 15000 }) },
  { title: "Технический сбой", text: "Сервер упал в неподходящий момент. Потеря -8,000 XP", effect: (p: GamePlayer) => ({ ...p, cash: Math.max(0, p.cash - 8000) }) },
  { title: "Бычий рынок", text: "Активы растут! Все владельцы получают по +5,000 XP", effect: (p: GamePlayer) => ({ ...p, cash: p.cash + 5000 }) },
  { title: "Налоговая проверка", text: "Нужно заплатить за прозрачность. -10,000 XP", effect: (p: GamePlayer) => ({ ...p, cash: Math.max(0, p.cash - 10000) }) },
  { title: "Инсайд", text: "Ты узнал секрет рынка. Получи +12,000 XP", effect: (p: GamePlayer) => ({ ...p, cash: p.cash + 12000 }) }
];

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

  // Синхронизация с сервером (Push)
  const syncWithServer = async (update: Partial<GameState>) => {
    if (!gameState.lobbyId) return;
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId: gameState.lobbyId, gameStateUpdate: update })
      });
      if (res.ok) {
        const data = await res.json();
        setGameState(prev => ({ ...prev, ...data }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
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

    const startParam = tg.initDataUnsafe?.start_param;
    if (startParam) {
      setGameState(prev => ({ ...prev, lobbyId: startParam.toUpperCase() }));
      setView(AppView.SOCIAL);
    } else {
      setGameState(prev => {
        if (!prev.lobbyId) return { ...prev, lobbyId: Math.random().toString(36).substring(2, 7).toUpperCase() };
        return prev;
      });
    }
  }, []);

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
          setGameState(prev => ({ ...prev, ...data }));
        }
      } catch (e) {}
    };
    register();
  }, [user.id, gameState.lobbyId]);

  useEffect(() => {
    if (!gameState.lobbyId) return;
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${gameState.lobbyId}`);
        if (!res.ok) return;
        const data = await res.json();
        setGameState(prev => {
          if (JSON.stringify(prev) === JSON.stringify({ ...prev, ...data })) return prev;
          return { ...prev, ...data };
        });
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [gameState.lobbyId]);

  const rollDice = async (board: BoardCell[]) => {
    if (gameState.lastRoll) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    
    // Сначала локальная анимация для отзывчивости
    setGameState(prev => ({ ...prev, lastRoll: roll }));

    setTimeout(async () => {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const newPos = (currentPlayer.position + roll) % board.length;
      const cell = board[newPos];
      
      let newPlayers = [...gameState.players];
      let newHistory = [`${currentPlayer.name} выбросил ${roll} и перешел на ${cell.title}`, ...gameState.history];
      
      // Логика событий
      if (cell.type === 'event' || cell.type === 'tax') {
        const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        newPlayers = newPlayers.map((p, i) => i === gameState.currentPlayerIndex ? event.effect(p) : p);
        newHistory.unshift(`СОБЫТИЕ: ${event.title}! ${event.text}`);
      }

      const update = {
        players: newPlayers.map((p, i) => i === gameState.currentPlayerIndex ? { ...p, position: newPos } : p),
        lastRoll: null,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
        turnNumber: gameState.turnNumber + 1,
        history: newHistory.slice(0, 15)
      };

      await syncWithServer(update);
    }, 2000);
  };

  const buyAsset = async (cellId: number, board: BoardCell[]) => {
    const playerIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
    const player = gameState.players[playerIdx];
    const cell = board[cellId];

    if (player && player.cash >= (cell.cost || 0) && !gameState.ownedAssets[cellId]) {
      const update = {
        ownedAssets: { ...gameState.ownedAssets, [cellId]: player.id },
        players: gameState.players.map((p, idx) => idx === playerIdx ? { 
          ...p, 
          cash: p.cash - (cell.cost || 0), 
          ownedAssets: [...p.ownedAssets, cellId] 
        } : p),
        history: [`${player.name} захватил сектор ${cell.title}!`, ...gameState.history].slice(0, 15)
      };
      await syncWithServer(update);
    }
  };

  const joinLobbyManual = (code: string) => {
    const formattedCode = code.trim().toUpperCase();
    if (formattedCode.length >= 4) {
      setGameState(prev => ({ ...prev, lobbyId: formattedCode, players: [], status: 'lobby' }));
      setView(AppView.SOCIAL);
    }
  };

  const generateInviteLink = () => {
    const botUsername = "tribe_goals_bot"; 
    const link = `https://t.me/${botUsername}/app?startapp=${gameState.lobbyId}`;
    if (window.Telegram?.WebApp) {
      const shareText = `Вступай в моё Племя! Код лобби: ${gameState.lobbyId} 🚀`;
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`);
    }
  };

  const startGame = async () => {
    if (!gameState.lobbyId) return;
    await syncWithServer({ status: 'playing', turnNumber: 1, currentPlayerIndex: 0 });
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
