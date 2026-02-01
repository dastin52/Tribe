
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction, AccountabilityPartner, TAX_RATE, PURCHASE_TAX } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';
import { geminiService } from '../services/gemini';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";
const BOARD_CELLS_COUNT = 24;

export function useStore() {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === 'undefined') return INITIAL_USER;
    const saved = localStorage.getItem('tribe_user_data');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });
  
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(() => ({
    players: [],
    lobbyId: Math.random().toString(36).substring(2, 7).toUpperCase(),
    status: 'playing',
    marketIndices: { tech: 1.0, realestate: 1.0, health: 1.0, energy: 1.0, web3: 1.0, edu: 1.0 },
    activeWorldEvent: null,
    ownedAssets: {},
    history: [],
    turnNumber: 1
  }));

  useEffect(() => {
    localStorage.setItem('tribe_user_data', JSON.stringify(user));
  }, [user]);

  const onCompleteMOS = (goalId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId && g.mos) {
        return { ...g, mos: { ...g.mos, is_completed: true }, current_value: g.current_value + (g.target_value * 0.01) };
      }
      return g;
    }));
    setUser(prev => ({ ...prev, xp: prev.xp + 50, game_rolls: prev.game_rolls + 1 }));
  };

  const addGoalWithPlan = (goal: YearGoal, sub: SubGoal[]) => {
    setGoals(prev => [...prev, goal]);
    setSubgoals(prev => [...prev, ...sub]);
  };

  return {
    user, view, setView, goals, subgoals, transactions, activeTaskId, gameState,
    enterFocusMode: (id: string) => { setActiveTaskId(id); setView(AppView.FOCUS); },
    exitFocusMode: () => { setActiveTaskId(null); setView(AppView.DASHBOARD); },
    addGoalWithPlan,
    onCompleteMOS,
    updateUserInfo: (d: any) => setUser(p => ({ ...p, ...d })),
    resetData: () => { localStorage.clear(); window.location.reload(); },
    rollDice: (board: BoardCell[]) => {
      if (user.game_rolls <= 0) return alert("Выполни шаг цели для получения ходов!");
      setUser(p => ({ ...p, game_rolls: p.game_rolls - 1 }));
      // Game logic...
    },
    // Mock implementations for other required props in views
    partners: [],
    pendingRequests: [],
    buyAsset: () => {},
    generateInviteLink: () => {},
    joinFakePlayer: () => {},
    startGame: () => {},
    forceStartGame: () => {},
    joinLobbyManual: () => {},
    resetLobby: () => {},
    kickPlayer: () => {},
    createNewLobby: () => {},
    approvePartner: () => {},
    addTransaction: () => {},
    buyStock: () => {},
    sellStock: () => {},
    upgradeAsset: () => {},
    makeDeposit: () => {}
  };
}
