
import { useState, useEffect } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, GameDeposit, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

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
    history: ["Ожидание синхронизации..."],
    turnNumber: 1,
    ownedAssets: {},
    reactions: [],
    lobbyId: null,
    status: 'lobby',
    lastRoll: null
  });

  // Инициализация данных пользователя из Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (tgUser) {
        const realUser: User = {
          ...INITIAL_USER,
          id: tgUser.id.toString(),
          name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
          photo_url: tgUser.photo_url || INITIAL_USER.photo_url
        };
        setUser(realUser);
      }
    }
  }, []);

  // Логика лобби и входа по ссылке
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param;

    // Создаем профиль текущего (реального) игрока
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

    if (startParam) {
      // Пользователь зашел по ссылке - он гость
      console.log("Joined lobby:", startParam);
      setView(AppView.SOCIAL);
      
      // Симулируем наличие Хоста (пригласившего), так как нет бэкенда для реального коннекта
      const host: GamePlayer = {
        id: 'host-id',
        name: 'Вождь Племени',
        avatar: 'https://i.pravatar.cc/150?u=host',
        position: 0,
        cash: 50000,
        isBankrupt: false,
        deposits: [],
        ownedAssets: [],
        isHost: true
      };

      setGameState(prev => ({
        ...prev,
        lobbyId: startParam,
        players: [host, me], // Хост + Реальный юзер
        history: [`⚡ Вы вступили в лобби ${startParam}`, ...prev.history],
        status: 'lobby'
      }));
    } else {
      // Пользователь сам создал лобби
      if (gameState.players.length === 0) {
        setGameState(prev => ({
          ...prev,
          players: [me],
          lobbyId: prev.lobbyId || Math.random().toString(36).substring(7),
          status: 'lobby'
        }));
      }
    }
  }, [user]);

  const generateInviteLink = () => {
    // Явно указываем ваш бот
    const botUsername = "tribe_goals_bot";
    const link = `https://t.me/${botUsername}/app?startapp=${gameState.lobbyId}`;
    
    if (window.Telegram?.WebApp) {
      const text = "Вступай в моё Племя на Арене! Давай строить капитал вместе 🚀";
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      navigator.clipboard.writeText(link);
      alert("Ссылка для приглашения скопирована!");
    }
  };

  const joinFakePlayer = () => {
    const fake = SAMPLE_PARTNERS[Math.floor(Math.random() * SAMPLE_PARTNERS.length)];
    if (gameState.players.find(p => p.id === fake.id)) return;
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, {
        id: fake.id, name: fake.name, avatar: fake.avatar || '',
        position: 0, cash: 50000, isBankrupt: false, deposits: [], ownedAssets: []
      }],
      history: [`👤 ${fake.name} присоединился к вашему Племени`, ...prev.history]
    }));
  };

  const rollDice = (board: BoardCell[]) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, lastRoll: roll }));

    setTimeout(() => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        const newPos = (currentPlayer.position + roll) % board.length;
        const cell = board[newPos];
        let cashChange = 0;
        let historyMsg = `${currentPlayer.name} передвинулся на ${roll}.`;

        const rentOwnerId = prev.ownedAssets[newPos];
        if (cell.type === 'asset' && rentOwnerId && rentOwnerId !== currentPlayer.id) {
          cashChange = -(cell.rent || 0);
          historyMsg += ` Аренда: -${cell.rent} XP.`;
        }

        const updatedPlayers = prev.players.map((p, idx) => {
          if (idx === prev.currentPlayerIndex) return { ...p, position: newPos, cash: p.cash + cashChange };
          if (p.id === rentOwnerId) return { ...p, cash: p.cash + (cell.rent || 0) };
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
        history: [`💼 ${player.name} взял под контроль ${cell.title}`, ...prev.history]
      }));
    }
  };

  return {
    user, view, setView, goals, subgoals, partners, transactions, gameState,
    rollDice, buyAsset, generateInviteLink, joinFakePlayer,
    startGame: () => setGameState(prev => ({ ...prev, status: 'playing' })),
    createDeposit: (amount: number) => {}, 
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
