
import { useState, useEffect } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, GameDeposit, YearGoal, SubGoal, Transaction } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  // Using state for goals and subgoals to allow adding new ones
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [partners, setPartners] = useState(SAMPLE_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    history: ["Ожидание Племени..."],
    turnNumber: 1,
    ownedAssets: {},
    reactions: [],
    lobbyId: null,
    status: 'lobby',
    lastRoll: null
  });

  // Инициализация лобби
  useEffect(() => {
    if (gameState.players.length === 0) {
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
  }, [user]);

  const generateInviteLink = () => {
    const baseUrl = "https://t.me/tribe_bot/app";
    const link = `${baseUrl}?startapp=${gameState.lobbyId}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showPopup({
        title: 'Позвать друзей',
        message: 'Отправь эту ссылку будущим союзникам или конкурентам!',
        buttons: [{ type: 'ok', text: 'Копировать' }]
      });
      navigator.clipboard.writeText(link);
    }
    return link;
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
      history: [`👤 ${fake.name} вошел на Арену`, ...prev.history]
    }));
  };

  const startGame = () => {
    setGameState(prev => ({ ...prev, status: 'playing' }));
  };

  const rollDice = (board: BoardCell[]) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, lastRoll: roll }));

    // Задержка для анимации кубика в UI
    setTimeout(() => {
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        const newPos = (currentPlayer.position + roll) % board.length;
        const cell = board[newPos];
        let cashChange = 0;
        let historyMsg = `${currentPlayer.name} выкинул ${roll}.`;

        const rentOwnerId = prev.ownedAssets[newPos];
        if (cell.type === 'asset' && rentOwnerId && rentOwnerId !== currentPlayer.id) {
          cashChange = -(cell.rent || 0);
          historyMsg += ` Аренда: -${cell.rent} XP`;
        }

        const updatedPlayers = prev.players.map((p, idx) => {
          if (idx === prev.currentPlayerIndex) {
            return { ...p, position: newPos, cash: p.cash + cashChange };
          }
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
        history: [`💼 ${player.name} купил ${cell.title}`, ...prev.history]
      }));
    }
  };

  // Fix createDeposit implementation
  const createDeposit = (amount: number) => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      if (currentPlayer.cash < amount) return prev;
      
      const newDeposit: GameDeposit = {
        id: crypto.randomUUID(),
        amount,
        remainingTurns: 10,
        interestRate: 0.05
      };

      return {
        ...prev,
        players: prev.players.map((p, idx) => idx === prev.currentPlayerIndex ? {
          ...p, cash: p.cash - amount, deposits: [...p.deposits, newDeposit]
        } : p),
        history: [`🏦 ${currentPlayer.name} открыл депозит на ${amount} XP`, ...prev.history]
      };
    });
  };

  // Fix addGoalWithPlan implementation
  const addGoalWithPlan = (goal: YearGoal, subgoalsList: SubGoal[]) => {
    setGoals(prev => [...prev, goal]);
    setSubgoals(prev => [...prev, ...subgoalsList]);
  };

  return {
    user, view, setView, goals, subgoals, partners, transactions, gameState,
    rollDice, buyAsset, generateInviteLink, joinFakePlayer, startGame,
    createDeposit, addGoalWithPlan,
    updateSubgoalProgress: () => {},
    verifyProgress: () => {},
    addTransaction: (amount: number, type: 'income' | 'expense', category: string) => {
      setTransactions(prev => [...prev, {
        id: crypto.randomUUID(),
        amount,
        type,
        category,
        timestamp: new Date().toISOString()
      }]);
    },
    addPartner: (name: string, role: string) => {
      setPartners(p => [...p, { id: crypto.randomUUID(), name, role: role as any }]);
    },
    toggleGoalPrivacy: () => {},
    updateUserInfo: () => {},
    resetData: () => { window.location.reload(); },
    startMyOwnJourney: () => {},
    sendReaction: (emoji: string) => {
      setGameState(prev => ({ ...prev, reactions: [...prev.reactions, { playerId: user.id, emoji, timestamp: Date.now() }] }));
    }
  };
}
