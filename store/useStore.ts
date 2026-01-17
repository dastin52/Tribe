
import { useState, useEffect } from 'react';
import { User, YearGoal, AppView, AccountabilityPartner, Transaction, SubGoal, GameState, GamePlayer, BoardCell, GameDeposit } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [partners, setPartners] = useState<AccountabilityPartner[]>(SAMPLE_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [loading, setLoading] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    history: ["Арена Племени открыта!"],
    turnNumber: 1,
    ownedAssets: {},
    reactions: []
  });

  const [isDemo, setIsDemo] = useState(true);

  // Инициализация игроков
  useEffect(() => {
    if (gameState.players.length === 0) {
      const initialPlayers: GamePlayer[] = [
        { id: user.id, name: user.name, avatar: user.photo_url || '', position: 0, cash: 50000, isBankrupt: false, deposits: [], ownedAssets: [] },
        ...partners.map(p => ({
          id: p.id, name: p.name, avatar: p.avatar || '', position: 0, cash: 50000, isBankrupt: false, deposits: [], ownedAssets: []
        }))
      ];
      setGameState(prev => ({ ...prev, players: initialPlayers }));
    }
  }, [partners, user]);

  // Система реакций (авто-очистка через 3 сек)
  const sendReaction = (emoji: string) => {
    const reaction = { playerId: user.id, emoji, timestamp: Date.now() };
    setGameState(prev => ({ ...prev, reactions: [...prev.reactions, reaction] }));
    setTimeout(() => {
      setGameState(prev => ({ ...prev, reactions: prev.reactions.filter(r => r.timestamp !== reaction.timestamp) }));
    }, 3000);
  };

  // Банковская логика
  const createDeposit = (amount: number, turns: number) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.cash < amount) return;

    const rate = turns === 5 ? 0.15 : 0.40; // 15% за 5 ходов, 40% за 10 ходов
    const newDeposit: GameDeposit = {
      id: crypto.randomUUID(),
      amount,
      remainingTurns: turns,
      interestRate: rate
    };

    setGameState(prev => ({
      ...prev,
      players: prev.players.map((p, idx) => 
        idx === prev.currentPlayerIndex 
          ? { ...p, cash: p.cash - amount, deposits: [...p.deposits, newDeposit] } 
          : p
      ),
      history: [`🏦 ${currentPlayer.name} открыл вклад на ${amount} XP`, ...prev.history].slice(0, 10)
    }));
  };

  const rollDice = (board: BoardCell[]) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const die = Math.floor(Math.random() * 6) + 1;
    const newPos = (currentPlayer.position + die) % board.length;
    const cell = board[newPos];
    
    setGameState(prev => {
      let historyMsg = `${currentPlayer.name} выбросил ${die}.`;
      let cashChange = 0;
      let rentPayeeId = prev.ownedAssets[newPos];

      // Проверка аренды
      if (cell.type === 'asset' && rentPayeeId && rentPayeeId !== currentPlayer.id) {
        cashChange = -(cell.rent || 0);
        historyMsg += ` Оплата аренды ${cell.rent} XP игроку ${prev.players.find(p => p.id === rentPayeeId)?.name}`;
      } else if (cell.type === 'tax') {
        cashChange = -3000;
        historyMsg += ` Налог штата: -3000 XP`;
      } else if (cell.type === 'start') {
        cashChange = 5000;
        historyMsg += ` Бонус за круг! +5000 XP`;
      }

      const updatedPlayers = prev.players.map((p, idx) => {
        // Обновляем текущего игрока
        if (p.id === currentPlayer.id) {
          // Обработка депозитов (уменьшаем срок)
          const updatedDeposits = p.deposits.map(d => ({ ...d, remainingTurns: d.remainingTurns - 1 }));
          
          // Выплачиваем созревшие вклады
          let bonusFromDeposits = 0;
          const matured = updatedDeposits.filter(d => d.remainingTurns <= 0);
          matured.forEach(d => {
            bonusFromDeposits += d.amount * (1 + d.interestRate);
            historyMsg += ` | 💰 Вклад на ${d.amount} закрыт с прибылью!`;
          });

          return { 
            ...p, 
            position: newPos, 
            cash: p.cash + cashChange + bonusFromDeposits,
            deposits: updatedDeposits.filter(d => d.remainingTurns > 0)
          };
        }
        // Начисляем аренду владельцу
        if (p.id === rentPayeeId) {
          return { ...p, cash: p.cash + (cell.rent || 0) };
        }
        return p;
      });

      return {
        ...prev,
        players: updatedPlayers,
        history: [historyMsg, ...prev.history].slice(0, 15),
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        turnNumber: prev.turnNumber + 1
      };
    });
  };

  const buyAsset = (cellId: number, board: BoardCell[]) => {
    const lastPlayerIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
    const currentPlayer = gameState.players[lastPlayerIdx];
    const cell = board[cellId];

    if (currentPlayer.cash >= (cell.cost || 0) && !gameState.ownedAssets[cellId]) {
      setGameState(prev => ({
        ...prev,
        ownedAssets: { ...prev.ownedAssets, [cellId]: currentPlayer.id },
        players: prev.players.map(p => p.id === currentPlayer.id ? { 
          ...p, 
          cash: p.cash - (cell.cost || 0),
          ownedAssets: [...p.ownedAssets, cellId]
        } : p),
        history: [`💼 ${currentPlayer.name} купил ${cell.title}`, ...prev.history].slice(0, 15)
      }));
    }
  };

  return {
    user, view, setView, goals, subgoals, partners, transactions, loading, gameState, isDemo,
    rollDice, buyAsset, createDeposit, sendReaction,
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    updateSubgoalProgress: (id: string, val: number) => { /* logic */ },
    verifyProgress: (gId: string, lId: string, vId: string) => { /* logic */ },
    addTransaction: (amount: number, type: any, category: string) => { /* logic */ },
    addPartner: (name: string, role: string) => { setPartners(p => [...p, { id: crypto.randomUUID(), name, role: role as any, xp: 0 }]); },
    toggleGoalPrivacy: (id: string) => { setGoals(p => p.map(g => g.id === id ? {...g, is_private: !g.is_private} : g)) },
    updateUserInfo: (d: any) => setUser(p => ({...p, ...d})),
    resetData: () => { localStorage.clear(); window.location.reload(); },
    startMyOwnJourney: () => setIsDemo(false)
  };
}
