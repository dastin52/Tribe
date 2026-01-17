
import { useState, useEffect, useCallback } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, GameDeposit, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

// Актуальный URL вашего воркера со скриншота
const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
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

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setUser(prev => ({
        ...prev,
        id: String(u.id),
        name: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
        photo_url: u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=6366f1&color=fff`
      }));
    }
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param;
    const currentLobbyId = startParam || gameState.lobbyId || Math.random().toString(36).substring(7);

    if (startParam && !gameState.lobbyId) {
      setGameState(prev => ({ ...prev, lobbyId: startParam }));
      setView(AppView.SOCIAL);
    } else if (!gameState.lobbyId) {
      setGameState(prev => ({ ...prev, lobbyId: currentLobbyId }));
    }

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
          isHost: !startParam
        };

        await fetch(`${API_BASE}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lobbyId: currentLobbyId, player: me })
        });
      } catch (e) {
        console.warn("API Offline");
      }
    };

    registerInLobby();

    // Проверка лобби раз в 5 секунд для экономии лимитов Cloudflare
    const interval = setInterval(async () => {
      if (gameState.status !== 'lobby' || document.hidden) return;
      
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${currentLobbyId}`);
        const data = await res.json();
        if (data.players) {
          setGameState(prev => {
            if (prev.players.length === data.players.length) return prev;
            return { ...prev, players: data.players };
          });
        }
      } catch (e) {}
    }, 5000); 

    return () => clearInterval(interval);
  }, [user.id, gameState.lobbyId, gameState.status]);

  const generateInviteLink = () => {
    const botUsername = "tribe_goals_bot"; // Убедитесь, что это имя вашего бота
    const link = `https://t.me/${botUsername}/app?startapp=${gameState.lobbyId}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Вступай в моё Племя! Построим капитал вместе 🚀")}`);
    }
  };

  const joinFakePlayer = () => {
    const fakeId = `bot-${Math.random().toString(36).substring(5)}`;
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, {
        id: fakeId, name: `Бот ${prev.players.length}`, avatar: `https://i.pravatar.cc/150?u=${fakeId}`,
        position: 0, cash: 50000, isBankrupt: false, deposits: [], ownedAssets: []
      }]
    }));
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
    rollDice, buyAsset, generateInviteLink, joinFakePlayer,
    startGame: () => setGameState(prev => ({ ...prev, status: 'playing' })),
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
