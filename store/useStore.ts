
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
    history: ["Система Арена: Онлайн"],
    turnNumber: 1,
    ownedAssets: {},
    reactions: [],
    lobbyId: null,
    status: 'lobby',
    lastRoll: null
  });

  // Логика Telegram параметров - ловим вход по ссылке
  useEffect(() => {
    const checkStartParam = () => {
      if (window.Telegram?.WebApp) {
        const startParam = window.Telegram.WebApp.initDataUnsafe?.start_param;
        if (startParam && gameState.status === 'lobby') {
          console.log("Вход по инвайту:", startParam);
          setView(AppView.SOCIAL);
          
          const newUser: GamePlayer = { 
            id: user.id, name: user.name, avatar: user.photo_url || '', 
            position: 0, cash: 50000, isBankrupt: false, deposits: [], 
            ownedAssets: [] 
          };

          setGameState(prev => {
            // Проверяем, нет ли уже такого игрока
            if (prev.players.find(p => p.id === newUser.id)) return { ...prev, lobbyId: startParam };
            return { 
              ...prev, 
              lobbyId: startParam,
              players: [...prev.players, newUser],
              history: [`⚡ Подключено к лобби ${startParam}`, ...prev.history]
            };
          });
        }
      }
    };
    
    // Задержка, чтобы WebApp успел инициализироваться
    setTimeout(checkStartParam, 500);
  }, [user.id]);

  // Инициализация лобби для хоста (если не зашли по ссылке)
  useEffect(() => {
    if (gameState.players.length === 0 && !gameState.lobbyId) {
      const host: GamePlayer = { 
        id: user.id, name: user.name, avatar: user.photo_url || '', 
        position: 0, cash: 50000, isBankrupt: false, deposits: [], 
        ownedAssets: [], isHost: true 
      };
      setGameState(prev => ({ 
        ...prev, 
        players: [host], 
        lobbyId: Math.random().toString(36).substring(7) 
      }));
    }
  }, [user.id]);

  const generateInviteLink = () => {
    // Используем правильный адрес бота @tribe_goals_bot
    const link = `https://t.me/tribe_goals_bot/app?startapp=${gameState.lobbyId}`;
    
    if (window.Telegram?.WebApp) {
      // Открываем нативный диалог шаринга в Telegram
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Присоединяйся к моему Племени на Арене! Давай строить капитал вместе 🚀")}`;
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      navigator.clipboard.writeText(link);
      alert("Ссылка скопирована! Отправь её другу в Telegram.");
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
      history: [`👤 ${fake.name} присоединился к племени`, ...prev.history]
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
        let historyMsg = `${currentPlayer.name} передвинулся на ${roll} и попал на узел ${newPos}.`;

        const rentOwnerId = prev.ownedAssets[newPos];
        if (cell.type === 'asset' && rentOwnerId && rentOwnerId !== currentPlayer.id) {
          cashChange = -(cell.rent || 0);
          historyMsg += ` Выплачена рента: ${cell.rent} XP.`;
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
        history: [`💼 Сектор ${cell.id} теперь под управлением ${player.name}`, ...prev.history]
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
    addTransaction: (a: number, t: any, c: string) => {},
    addPartner: (n: string, r: string) => {},
    toggleGoalPrivacy: () => {},
    updateUserInfo: () => {},
    resetData: () => { window.location.reload(); },
    startMyOwnJourney: () => {},
    sendReaction: (emoji: string) => {
      setGameState(prev => ({ ...prev, reactions: [...prev.reactions, { playerId: user.id, emoji, timestamp: Date.now() }] }));
    }
  };
}
