
import { useState, useEffect, useCallback } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, Debt, Subscription, Transaction, SubGoal, ProgressLog, Meeting, PartnerRole, GameState, GamePlayer, GameOffer } from '../types';
import { geminiService } from '../services/gemini';
import { INITIAL_USER, INITIAL_VALUES, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_MEETINGS, SAMPLE_TRANSACTIONS } from './initialData';
import { GoogleGenAI } from "@google/genai";

const STORE_VERSION = '3.0.0';

export function useStore() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [subgoals, setSubgoals] = useState<SubGoal[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [values, setValues] = useState<Value[]>(INITIAL_VALUES);
  const [loading, setLoading] = useState(true);
  
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    history: ["Ожидание начала игры..."],
    activeOffers: [],
    turnNumber: 1,
    isTutorialComplete: false
  });

  const [isDemo, setIsDemo] = useState(true);
  const [showRegPrompt, setShowRegPrompt] = useState(false);

  // Инициализация игроков при смене партнеров или загрузке
  useEffect(() => {
    if (gameState.players.length === 0 && user.id !== 'demo-user') {
      const initialPlayers: GamePlayer[] = [
        { id: user.id, name: user.name, avatar: user.photo_url || '', position: 0, cash: 100000, isBankrupt: false, cards: [] },
        ...partners.slice(0, 6).map(p => ({
          id: p.id, name: p.name, avatar: p.avatar || '', position: 0, cash: 100000, isBankrupt: false, cards: []
        }))
      ];
      setGameState(prev => ({ ...prev, players: initialPlayers }));
    }
  }, [partners, user]);

  useEffect(() => {
    const safeLoad = (key: string, fallback: any) => {
      try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        if (key === 'tribe_user' && parsed.id !== 'demo-user') setIsDemo(false);
        return parsed;
      } catch (e) { return fallback; }
    };

    setUser(safeLoad('tribe_user', INITIAL_USER));
    setGoals(safeLoad('tribe_goals', SAMPLE_GOALS));
    setSubgoals(safeLoad('tribe_subgoals', SAMPLE_SUBGOALS));
    setPartners(safeLoad('tribe_partners', SAMPLE_PARTNERS));
    setTransactions(safeLoad('tribe_txs', SAMPLE_TRANSACTIONS));
    setMeetings(safeLoad('tribe_meetings', SAMPLE_MEETINGS));
    setValues(safeLoad('tribe_values', INITIAL_VALUES));
    setDebts(safeLoad('tribe_debts', []));
    setSubscriptions(safeLoad('tribe_subs', []));
    setGameState(safeLoad('tribe_gamestate', {
      players: [],
      currentPlayerIndex: 0,
      history: ["Арена готова к бою!"],
      activeOffers: [],
      turnNumber: 1,
      isTutorialComplete: false
    }));

    setLoading(false);
  }, []);

  useEffect(() => { if (!loading && !isDemo) localStorage.setItem('tribe_user', JSON.stringify(user)); }, [user, loading, isDemo]);
  useEffect(() => { if (!loading && !isDemo) localStorage.setItem('tribe_gamestate', JSON.stringify(gameState)); }, [gameState, loading, isDemo]);

  const checkDemo = (action: () => void) => {
    if (isDemo) setShowRegPrompt(true);
    else action();
  };

  const startMyOwnJourney = () => {
    const newUserId = crypto.randomUUID();
    setUser({ ...INITIAL_USER, id: newUserId, xp: 0, level: 1, streak: 0 });
    setGameState({
      players: [{ id: newUserId, name: INITIAL_USER.name, avatar: '', position: 0, cash: 100000, isBankrupt: false, cards: [] }],
      currentPlayerIndex: 0,
      history: ["Ваша история начинается здесь."],
      activeOffers: [],
      turnNumber: 1,
      isTutorialComplete: false
    });
    setIsDemo(false);
    setShowRegPrompt(false);
  };

  const rollDice = async (board: any[]) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isBankrupt) {
      setGameState(prev => ({ ...prev, currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length }));
      return;
    }

    const die = Math.floor(Math.random() * 6) + 1;
    const newPos = (currentPlayer.position + die) % board.length;
    const cell = board[newPos];
    
    let historyMsg = `${currentPlayer.name}: Выпало ${die}. Сектор "${cell.title}".`;
    let cashChange = 0;
    let rentPayeeId: string | null = null;

    // Логика клетки
    if (cell.type === 'start') cashChange = 10000;
    else if (cell.type === 'tax') cashChange = -5000;
    else if (cell.type === 'asset' && cell.ownerId && cell.ownerId !== currentPlayer.id) {
        cashChange = -(cell.rent || 0);
        rentPayeeId = cell.ownerId;
        historyMsg += ` Оплата аренды: ${cell.rent} XP игроку ${gameState.players.find(p => p.id === cell.ownerId)?.name}`;
    } else if (cell.type === 'event') {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: `Игрок ${currentPlayer.name} на клетке события. Придумай ироничное событие на 10 слов. Начни с суммы (+2000 или -1500).`
        });
        const match = res.text.match(/([+-]\d+)/);
        if (match) cashChange = parseInt(match[1]);
        historyMsg = `Событие: ${res.text}`;
    }

    setGameState(prev => {
      const updatedPlayers = prev.players.map(p => {
        if (p.id === currentPlayer.id) return { ...p, position: newPos, cash: p.cash + cashChange };
        if (p.id === rentPayeeId) return { ...p, cash: p.cash + (cell.rent || 0) };
        return p;
      });

      return {
        ...prev,
        players: updatedPlayers,
        history: [historyMsg, ...prev.history].slice(0, 10),
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        turnNumber: prev.turnNumber + 1
      };
    });
  };

  const buyAsset = (cellId: number, board: any[]) => {
    const lastPlayerIdx = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
    const currentPlayer = gameState.players[lastPlayerIdx];
    const cell = board[cellId];

    if (currentPlayer.cash >= (cell.cost || 0) && !cell.ownerId) {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, cash: p.cash - (cell.cost || 0) } : p),
        history: [`💼 ${currentPlayer.name} купил ${cell.title} за ${cell.cost}`, ...prev.history].slice(0, 10)
      }));
      // В реальном приложении здесь бы обновлялся BOARD в стейте, 
      // но так как BOARD константа, мы эмулируем владение через GameState.
      // Добавим в GameState список купленных активов:
    }
  };

  return {
    user, view, setView, goals, subgoals, transactions, debts, subscriptions, partners, loading, meetings, values, isDemo, showRegPrompt, setShowRegPrompt, startMyOwnJourney,
    gameState, rollDice, buyAsset,
    
    addGoalWithPlan: (g: YearGoal, s: SubGoal[]) => checkDemo(() => {
      setGoals(p => [...p, g]);
      setSubgoals(p => [...p, ...s]);
    }),
    
    updateSubgoalProgress: (sgId: string, value: number, forceVerify: boolean = false) => checkDemo(() => {
      setSubgoals(prev => prev.map(sg => {
        if (sg.id === sgId) {
          const log: ProgressLog = { id: crypto.randomUUID(), goal_id: sg.year_goal_id, subgoal_id: sg.id, timestamp: new Date().toISOString(), value, confidence: 5, is_verified: forceVerify, verified_by: forceVerify ? 'self' : undefined, user_id: user.id };
          setGoals(gPrev => gPrev.map(g => {
            if (g.id === sg.year_goal_id) {
              const updatedLogs = [...(g.logs || []), log];
              const totalValue = updatedLogs.reduce((acc, l) => acc + (l.is_verified ? l.value : 0), 0);
              return { ...g, logs: updatedLogs, current_value: totalValue, status: totalValue >= g.target_value ? 'completed' : 'active' };
            }
            return g;
          }));
          return { ...sg, current_value: sg.current_value + value, is_completed: (sg.current_value + value) >= sg.target_value };
        }
        return sg;
      }));
    }),
    
    verifyProgress: (gId: string, lId: string, vId: string, rating?: number, comment?: string) => checkDemo(() => {
       setGoals(prev => prev.map(g => {
         if (g.id === gId) {
           const updatedLogs = (g.logs || []).map(l => l.id === lId ? { ...l, is_verified: true, verified_by: vId, rating, comment } : l);
           const totalValue = updatedLogs.reduce((acc, l) => acc + (l.is_verified ? l.value : 0), 0);
           return { ...g, logs: updatedLogs, current_value: totalValue, status: totalValue >= g.target_value ? 'completed' : 'active' };
         }
         return g;
       }));
    }),
    
    addTransaction: (amount: number, type: 'income' | 'expense', category: string, note?: string) => checkDemo(() => {
      const newTx: Transaction = { id: crypto.randomUUID(), amount, type, category, note, timestamp: new Date().toISOString() };
      setTransactions(p => [...p, newTx]);
    }),
    
    addPartner: (name: string, role: string) => checkDemo(() => setPartners(p => [...p, { id: crypto.randomUUID(), name, role: role as PartnerRole, avatar: `https://i.pravatar.cc/150?u=${name}`, xp: 0 }])),
    addDebt: (d: any) => checkDemo(() => setDebts(prev => [...prev, { ...d, id: crypto.randomUUID() }])),
    addSubscription: (s: any) => checkDemo(() => setSubscriptions(prev => [...prev, { ...s, id: crypto.randomUUID() }])),
    toggleGoalPrivacy: (id: string) => checkDemo(() => setGoals(p => p.map(g => g.id === id ? {...g, is_private: !g.is_private} : g))),
    updateUserInfo: (d: any) => checkDemo(() => setUser(p => ({...p, ...d}))),
    resetData: () => { localStorage.clear(); window.location.reload(); },
  };
}
