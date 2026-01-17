
import { useState, useEffect, useCallback } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, GameDeposit, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

// URL вашего развернутого Cloudflare Worker (замените после деплоя)
const API_BASE = "https://tribe-backend.your-subdomain.workers.dev";

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
    history: ["Инициализация Племени..."],
    turnNumber: 1,
    ownedAssets: {},
    reactions: [],
    lobbyId: null,
    status: 'lobby',
    lastRoll: null
  });

  // 1. Инициализация реального пользователя из Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      const realUser: User = {
        ...INITIAL_USER,
        id: String(u.id),
        name: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
        photo_url: u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name)}&background=6366f1&color=fff`
      };
      setUser(realUser);
      console.log("Telegram Identity Loaded:", realUser.name);
    }
  }, []);

  // 2. Логика лобби и синхронизации
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

    // Функция регистрации себя в лобби на сервере
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

        // Отправляем свои данные на сервер (Cloudflare Worker)
        await fetch(`${API_BASE}/join`, {
          method: 'POST',
          body: JSON.stringify({ lobbyId: currentLobbyId, player: me })
        });
      } catch (e) {
        console.warn("Backend not found, running in local-only mode");
        // Если сервера нет, просто добавляем себя локально
        setGameState(prev => {
          if (prev.players.find(p => p.id === user.id)) return prev;
          return { ...prev, players: [{
            id: user.id, name: user.name, avatar: user.photo_url || '', 
            position: 0, cash: 50000, isBankrupt: false, deposits: [], ownedAssets: [], isHost: !startParam
          }] };
        });
      }
    };

    registerInLobby();

    // 3. Polling: раз в 3 секунды проверяем, кто еще в лобби
    const interval = setInterval(async () => {
      if (gameState.status !== 'lobby') return;
      try {
        const res = await fetch(`${API_BASE}/lobby?id=${currentLobbyId}`);
        const data = await res.json();
        if (data.players) {
          setGameState(prev => ({ ...prev, players: data.players }));
        }
      } catch (e) {
        // Ошибка синхронизации - игнорируем в демо-режиме
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user.id, gameState.lobbyId, gameState.status]);

  const generateInviteLink = () => {
    const botUsername = "tribe_goals_bot";
    const link = `https://t.me/${botUsername}/app?startapp=${gameState.lobbyId}`;
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Вступай в моё Племя на Арене! Построим капитал вместе 🚀")}`);
    } else {
      navigator.clipboard.writeText(link);
      alert("Ссылка скопирована!");
    }
  };

  const joinFakePlayer = () => {
    const fakeId = `bot-${Math.random().toString(36).substring(5)}`;
    const fake: GamePlayer = {
      id: fakeId,
      name: `Союзник ${gameState.players.length}`,
      avatar: `https://i.pravatar.cc/150?u=${fakeId}`,
      position: 0,
      cash: 50000,
      isBankrupt: false,
      deposits: [],
      ownedAssets: []
    };
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, fake],
      history: ["👤 Бот-союзник вошел в игру", ...prev.history]
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
        const cell = board[newPos];
        let cashChange = 0;
        let historyMsg = `${currentPlayer.name} выкинул ${roll} и попал на ${cell.title}.`;

        const ownerId = prev.ownedAssets[newPos];
        if (cell.type === 'asset' && ownerId && ownerId !== currentPlayer.id) {
          cashChange = -(cell.rent || 0);
          historyMsg += ` Рента: -${cell.rent} XP.`;
        }

        const updatedPlayers = prev.players.map((p, idx) => {
          if (idx === prev.currentPlayerIndex) return { ...p, position: newPos, cash: p.cash + cashChange };
          if (p.id === ownerId) return { ...p, cash: p.cash + (cell.rent || 0) };
          return p;
        });

        return {
          ...prev,
          players: updatedPlayers,
          lastRoll: null,
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          turnNumber: prev.turnNumber + 1,
          history: [historyMsg, ...prev.history].slice(0, 10)
        };
      });
    }, 1500);
  };

  const buyAsset = (cellId: number, board: BoardCell[]) => {
    const lastIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
    const player = gameState.players[lastIdx];
    const cell = board[cellId];
    if (player.cash >= (cell.cost || 0) && !gameState.ownedAssets[cellId]) {
      setGameState(prev => ({
        ...prev,
        ownedAssets: { ...prev.ownedAssets, [cellId]: player.id },
        players: prev.players.map((p, idx) => idx === lastIdx ? {
          ...p, cash: p.cash - (cell.cost || 0), ownedAssets: [...p.ownedAssets, cellId]
        } : p),
        history: [`💼 ${player.name} приватизировал ${cell.title}`, ...prev.history]
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
    sendReaction: (emoji: string) => {
      setGameState(prev => ({ ...prev, reactions: [...prev.reactions, { playerId: user.id, emoji, timestamp: Date.now() }] }));
    }
  };
}
