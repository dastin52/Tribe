


import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, AppView, GameState, GamePlayer, BoardCell, YearGoal, SubGoal, Transaction, AccountabilityPartner, TAX_RATE, PURCHASE_TAX } from '../types';
import { INITIAL_USER, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_TRANSACTIONS } from './initialData';
import { geminiService } from '../services/gemini';

const API_BASE = "https://tribe-api.serzh-karimov-97.workers.dev";
const BOARD_CELLS_COUNT = 24;

export function useStore() {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === 'undefined') return INITIAL_USER;
    const savedId = localStorage.getItem('tribe_user_id');
    const savedName = localStorage.getItem('tribe_user_name');
    const savedRolls = localStorage.getItem('tribe_game_rolls');
    const userId = savedId || 'u' + Math.random().toString(36).substring(2, 9);
    if (!savedId) localStorage.setItem('tribe_user_id', userId);
    return { 
      ...INITIAL_USER, 
      id: userId, 
      name: savedName || 'Игрок',
      game_rolls: savedRolls ? parseInt(savedRolls) : 0
    };
  });
  
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>(SAMPLE_GOALS);
  const [subgoals, setSubgoals] = useState<SubGoal[]>(SAMPLE_SUBGOALS);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedLobby = typeof window !== 'undefined' ? localStorage.getItem('tribe_active_lobby') : null;
    const lobbyId = savedLobby || Math.random().toString(36).substring(2, 7).toUpperCase();
    if (typeof window !== 'undefined') localStorage.setItem('tribe_active_lobby', lobbyId);
    
    return {
      players: [{ id: user.id, name: user.name, avatar: user.photo_url || "", cash: 50000, position: 0, isReady: true, isBankrupt: false, deposits: [], ownedAssets: [], assetLevels: {}, portfolio: [], taxCredits: 0, isHost: true }],
      pendingPlayers: [],
      currentPlayerIndex: 0,
      history: ["Мир загружается..."],
      turnNumber: 1,
      ownedAssets: {},
      reactions: [],
      lobbyId: lobbyId,
      status: 'playing',
      lastRoll: null,
      marketIndices: { tech: 1.0, realestate: 1.0, health: 1.0, energy: 1.0, web3: 1.0, edu: 1.0 },
      activeWorldEvent: null
    };
  });

  const isSyncingRef = useRef(false);

  const syncWithServer = async (payload: any, priority = false) => {
    const lobbyId = payload.lobbyId || gameState.lobbyId;
    if (!lobbyId) return;
    if (!priority && isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lobbyId, 
          player: payload.player || { 
            id: user.id, 
            name: user.name, 
            avatar: user.photo_url || "",
            position: gameState.players.find(p => p.id === user.id)?.position || 0,
            cash: gameState.players.find(p => p.id === user.id)?.cash || 50000
          },
          ...payload 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGameState(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setTimeout(() => { isSyncingRef.current = false; }, priority ? 100 : 3000);
    }
  };

  const rollDice = async (board: BoardCell[]) => {
    if (user.game_rolls <= 0) {
      alert("Сначала выполни цели, чтобы получить ходы!");
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    setUser(u => ({ ...u, game_rolls: u.game_rolls - 1 }));

    setGameState(p => ({ ...p, lastRoll: roll }));
    
    setTimeout(async () => {
      const prevPlayers = [...gameState.players];
      const meIdx = prevPlayers.findIndex(p => p.id === user.id);
      const me = prevPlayers[meIdx];
      const nPos = ((me?.position || 0) + roll) % BOARD_CELLS_COUNT;
      const cell = board[nPos];

      let newHistory = [`🎲 ${user.name} продвинулся на ${roll} шагов к ${cell.title}`];
      let newCash = me.cash;

      // Logic: Rent collection
      const ownerId = gameState.ownedAssets[nPos];
      if (ownerId && ownerId !== user.id) {
        const ownerIdx = prevPlayers.findIndex(p => p.id === ownerId);
        const owner = prevPlayers[ownerIdx];
        const isOptimized = owner.assetLevels[nPos] >= 4; // Lvl 4+ - налоговая льгота
        const level = owner.assetLevels[nPos] || 1;
        const multiplier = gameState.marketIndices[cell.district || ''] || 1.0;
        const totalRent = Math.round((cell.rent || 0) * level * multiplier);
        
        newCash -= totalRent;
        prevPlayers[ownerIdx].cash += totalRent;
        newHistory.unshift(`💸 ${user.name} заплатил ${totalRent} ₽ ренты ${owner.name}`);
      }

      const updatedPlayers = prevPlayers.map((p, i) => {
        const isMe = i === meIdx;
        let pCash = isMe ? newCash : p.cash;
        
        // Passive Deposit Income logic
        const pDeposits = p.deposits.map(d => ({ ...d, remainingTurns: d.remainingTurns - 1 }));
        pDeposits.forEach(d => {
          if (d.remainingTurns === 0) {
             pCash += Math.round(d.amount * (1 + d.interestRate));
             if (isMe) newHistory.unshift(`🏦 Депозит завершен: +${Math.round(d.amount * d.interestRate)} ₽`);
          }
        });

        return { 
          ...p, 
          cash: pCash, 
          position: isMe ? nPos : p.position,
          deposits: pDeposits.filter(d => d.remainingTurns >= 0)
        };
      });

      let newWorldEvent = gameState.activeWorldEvent;
      if (gameState.turnNumber % 5 === 0) {
        const eventData = await geminiService.getGameMasterEvent(updatedPlayers, gameState.history);
        newWorldEvent = {
          title: eventData.title,
          description: eventData.description,
          effect: { sector: eventData.sector, multiplier: eventData.multiplier, duration: eventData.duration }
        };
        newHistory.unshift(`🔮 Магистр: ${eventData.title}`);
      }

      const up = {
        players: updatedPlayers,
        history: [...newHistory, ...gameState.history].slice(0, 15),
        lastRoll: null,
        turnNumber: gameState.turnNumber + 1,
        activeWorldEvent: newWorldEvent,
        marketIndices: newWorldEvent ? { ...gameState.marketIndices, [newWorldEvent.effect.sector || '']: newWorldEvent.effect.multiplier } : gameState.marketIndices
      };

      setGameState(prev => ({ ...prev, ...up }));
      syncWithServer({ gameStateUpdate: up }, true);
    }, 1500);
  };

  return {
    user, view, setView, goals, subgoals, transactions, activeTaskId, gameState,
    enterFocusMode: (id: string) => { setActiveTaskId(id); setView(AppView.FOCUS); },
    exitFocusMode: () => { setActiveTaskId(null); setView(AppView.DASHBOARD); },
    rollDice,
    buyAsset: (cellId: number, board: BoardCell[]) => {
      setGameState(prev => {
        const meIdx = prev.players.findIndex(p => p.id === user.id);
        const me = prev.players[meIdx];
        const cell = board[cellId];
        const tax = Math.round((cell.cost || 0) * PURCHASE_TAX);
        const totalCost = (cell.cost || 0) + tax;
        
        if (!me || me.cash < totalCost) {
          alert("Недостаточно капитала (учитывая налог 5%)");
          return prev;
        }

        const up = {
          players: prev.players.map((p, i) => i === meIdx ? { ...p, cash: p.cash - totalCost, ownedAssets: [...p.ownedAssets, cellId], assetLevels: { ...p.assetLevels, [cellId]: 1 } } : p),
          ownedAssets: { ...prev.ownedAssets, [cellId]: user.id },
          history: [`🏠 ${user.name} купил ${cell.title} (Налог: ${tax} ₽)`, ...prev.history].slice(0, 10)
        };
        syncWithServer({ gameStateUpdate: up }, true);
        return { ...prev, ...up };
      });
    },
    buyStock: (cellId: number, amount: number, board: BoardCell[]) => {
      setGameState(prev => {
        const meIdx = prev.players.findIndex(p => p.id === user.id);
        const me = prev.players[meIdx];
        const cell = board[cellId];
        const sectorMult = prev.marketIndices[cell.district || ''] || 1.0;
        const stockPrice = Math.round((cell.cost || 10000) * 0.1 * sectorMult);
        const shares = Math.floor(amount / stockPrice);
        const totalCost = shares * stockPrice;

        if (me.cash < totalCost || shares <= 0) return prev;

        const existingStock = me.portfolio.find(s => s.cellId === cellId);
        const newPortfolio = existingStock 
          ? me.portfolio.map(s => s.cellId === cellId ? { ...s, shares: s.shares + shares, avgPurchasePrice: (s.avgPurchasePrice * s.shares + totalCost) / (s.shares + shares) } : s)
          : [...me.portfolio, { cellId, shares, avgPurchasePrice: stockPrice }];

        const up = {
          players: prev.players.map((p, i) => i === meIdx ? { ...p, cash: p.cash - totalCost, portfolio: newPortfolio } : p),
          history: [`📈 ${user.name} купил ${shares} акций ${cell.title}`, ...prev.history].slice(0, 10)
        };
        syncWithServer({ gameStateUpdate: up }, true);
        return { ...prev, ...up };
      });
    },
    sellStock: (cellId: number, shares: number, board: BoardCell[]) => {
      setGameState(prev => {
        const meIdx = prev.players.findIndex(p => p.id === user.id);
        const me = prev.players[meIdx];
        const holding = me.portfolio.find(s => s.cellId === cellId);
        if (!holding || holding.shares < shares) return prev;

        const cell = board[cellId];
        const currentPrice = Math.round((cell.cost || 10000) * 0.1 * (prev.marketIndices[cell.district || ''] || 1.0));
        const totalRevenue = shares * currentPrice;
        const profit = Math.max(0, totalRevenue - (shares * holding.avgPurchasePrice));
        
        // Налоговая оптимизация: если есть льготы или реинвест
        const tax = Math.round(profit * TAX_RATE);
        const netRevenue = totalRevenue - tax;

        const newPortfolio = me.portfolio.map(s => s.cellId === cellId ? { ...s, shares: s.shares - shares } : s).filter(s => s.shares > 0);

        const up = {
          players: prev.players.map((p, i) => i === meIdx ? { ...p, cash: p.cash + netRevenue, portfolio: newPortfolio } : p),
          history: [`📉 ${user.name} продал акции ${cell.title}. Налог: ${tax} ₽`, ...prev.history].slice(0, 10)
        };
        syncWithServer({ gameStateUpdate: up }, true);
        return { ...prev, ...up };
      });
    },
    upgradeAsset: (cellId: number, board: BoardCell[]) => {
      setGameState(prev => {
        const meIdx = prev.players.findIndex(p => p.id === user.id);
        const me = prev.players[meIdx];
        const cell = board[cellId];
        const currentLevel = me.assetLevels[cellId] || 0;
        const upgradeCost = Math.round((cell.cost || 0) * 0.6 * currentLevel);
        if (me.cash < upgradeCost) return prev;

        const up = {
          players: prev.players.map((p, i) => i === meIdx ? { ...p, cash: p.cash - upgradeCost, assetLevels: { ...p.assetLevels, [cellId]: currentLevel + 1 } } : p),
          history: [`⭐ ${cell.title} теперь Lvl ${currentLevel + 1}${currentLevel + 1 === 4 ? ' (ОЭЗ - 0% налогов)' : ''}`, ...prev.history].slice(0, 10)
        };
        syncWithServer({ gameStateUpdate: up }, true);
        return { ...prev, ...up };
      });
    },
    makeDeposit: (cellId: number, amount: number) => {
      setGameState(prev => {
        const meIdx = prev.players.findIndex(p => p.id === user.id);
        const me = prev.players[meIdx];
        if (me.cash < amount) return prev;
        const newDeposit = { id: crypto.randomUUID(), amount, remainingTurns: 5, interestRate: 0.15, cellId };
        const up = {
          players: prev.players.map((p, i) => i === meIdx ? { ...p, cash: p.cash - amount, deposits: [...p.deposits, newDeposit] } : p),
          history: [`🏦 ${user.name} открыл вклад на ${amount} ₽`, ...prev.history].slice(0, 10)
        };
        syncWithServer({ gameStateUpdate: up }, true);
        return { ...prev, ...up };
      });
    },
    generateInviteLink: (type: 'partner' | 'game' = 'partner') => {
      const lobbyCode = gameState.lobbyId;
      const botLink = `https://t.me/tribe_goals_bot/app?startapp=G_${lobbyCode}`;
      navigator.clipboard.writeText(botLink);
      alert("Ссылка скопирована!");
    },
    updateTask: (taskId: string, newValue: number) => {
      setSubgoals(prev => prev.map(sg => sg.id === taskId ? { ...sg, current_value: newValue, is_completed: newValue >= sg.target_value } : sg));
    },
    addGoalWithPlan: (g: any, s: any) => { setGoals(p => [...p, g]); setSubgoals(p => [...p, ...s]); },
    addTransaction: (a: number, t: any, c: string) => setTransactions(p => [...p, { id: crypto.randomUUID(), amount: a, type: t, category: c, timestamp: new Date().toISOString() }]),
    updateUserInfo: (d: any) => setUser(p => ({ ...p, ...d })),
    resetData: () => { localStorage.clear(); window.location.reload(); },
    joinFakePlayer: () => syncWithServer({ addBot: { name: "Бот", avatar: "", position: 0, cash: 50000 } }, true),
    startGame: () => syncWithServer({ gameStateUpdate: { status: 'playing' } }, true),
    forceStartGame: () => syncWithServer({ gameStateUpdate: { status: 'playing' } }, true),
    joinLobbyManual: (code: string) => { localStorage.setItem('tribe_active_lobby', code); syncWithServer({ lobbyId: code }, true); },
    resetLobby: () => syncWithServer({ resetLobby: true }, true),
    kickPlayer: (pid: string) => syncWithServer({ kickPlayerId: pid }, true),
    createNewLobby: () => {
      const nid = Math.random().toString(36).substring(2, 7).toUpperCase();
      localStorage.setItem('tribe_active_lobby', nid);
      syncWithServer({ lobbyId: nid }, true);
    },
    approvePartner: (id: string) => syncWithServer({ action: 'approve', targetId: id }, true),
    partners: (gameState.players || []).filter(p => p.id !== user.id).map(p => ({ id: p.id, name: p.name, role: 'teammate' as any })),
    pendingRequests: []
  };
}