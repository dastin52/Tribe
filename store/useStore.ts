
import { useState, useEffect, useCallback } from 'react';
import { User, Value, YearGoal, AppView, AccountabilityPartner, Debt, Subscription, Transaction, SubGoal, ProgressLog, Meeting, PartnerRole, GameState, GameOffer } from '../types';
import { geminiService } from '../services/gemini';
import { INITIAL_USER, INITIAL_VALUES, SAMPLE_GOALS, SAMPLE_SUBGOALS, SAMPLE_PARTNERS, SAMPLE_MEETINGS, SAMPLE_TRANSACTIONS } from './initialData';
import { GoogleGenAI } from "@google/genai";

const STORE_VERSION = '2.4.0';

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
    playerPosition: 0,
    cash: 50000,
    ownedAssets: [],
    history: ["Добро пожаловать! Бросайте кубик, чтобы начать."],
    cards: [],
    activeOffers: [],
    turn: 1,
    isTutorialComplete: false
  });

  const [isDemo, setIsDemo] = useState(true);
  const [showRegPrompt, setShowRegPrompt] = useState(false);

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
      playerPosition: 0,
      cash: 50000,
      ownedAssets: [],
      history: ["Добро пожаловать! Бросайте кубик, чтобы начать."],
      cards: [],
      activeOffers: [],
      turn: 1,
      isTutorialComplete: false
    }));

    setLoading(false);
  }, []);

  useEffect(() => { if (!loading && !isDemo) localStorage.setItem('tribe_user', JSON.stringify(user)); }, [user, loading, isDemo]);
  useEffect(() => { if (!loading && !isDemo) localStorage.setItem('tribe_gamestate', JSON.stringify(gameState)); }, [gameState, loading, isDemo]);

  const checkDemo = (action: () => void) => {
    if (isDemo) {
      setShowRegPrompt(true);
    } else {
      action();
    }
  };

  const startMyOwnJourney = () => {
    setUser({ ...INITIAL_USER, id: crypto.randomUUID(), xp: 0, level: 1, streak: 0, financials: { ...INITIAL_USER.financials!, total_assets: 0, total_debts: 0 } });
    setGoals([]);
    setSubgoals([]);
    setPartners([]);
    setTransactions([]);
    setDebts([]);
    setSubscriptions([]);
    setMeetings([]);
    setIsDemo(false);
    setShowRegPrompt(false);
  };

  // Механика: получение карты за реальное достижение
  const awardGameCard = (type: string) => {
    setGameState(prev => ({
      ...prev,
      cards: [...prev.cards, type],
      history: [`🎉 За реальный успех вы получили карту: ${type}!`, ...prev.history].slice(0, 5)
    }));
  };

  const rollDice = async (board: any[]) => {
    const die = Math.floor(Math.random() * 6) + 1;
    const newPos = (gameState.playerPosition + die) % board.length;
    const cell = board[newPos];
    
    let message = `Ход ${gameState.turn}: Выброшено ${die}. Сектор "${cell.title}".`;
    let cashChange = 0;

    if (cell.type === 'event') {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Ты - Банкир Племени. Игрок на клетке события. 
          Придумай ОДНО короткое ироничное событие (10 слов). 
          Обязательно начни с суммы изменения: +5000 или -3000.`,
        });
        const text = response.text;
        const match = text.match(/([+-]\d+)/);
        if (match) cashChange = parseInt(match[1]);
        message = `ИИ-Банкир: ${text}`;
      } catch (e) {
        cashChange = 1000;
        message = "Банкир: Вы получили бонус за активность! +1000";
      }
    } else if (cell.type === 'start') {
        cashChange = 5000;
        message = "Проход через старт! +5000 капитала.";
    }

    setGameState(prev => ({
      ...prev,
      playerPosition: newPos,
      cash: prev.cash + cashChange,
      turn: prev.turn + 1,
      history: [message, ...prev.history].slice(0, 5)
    }));
  };

  const buyAsset = (cellId: number, cost: number) => {
    if (gameState.cash >= cost && !gameState.ownedAssets.includes(cellId)) {
      setGameState(prev => ({
        ...prev,
        cash: prev.cash - cost,
        ownedAssets: [...prev.ownedAssets, cellId],
        history: [`💼 Вы купили "${cellId}" за ${cost}. Теперь это ваш актив!`, ...prev.history].slice(0, 5)
      }));
    }
  };

  const createOffer = (assetId: number, price: number) => {
    const newOffer: GameOffer = {
      id: crypto.randomUUID(),
      fromPlayer: 'Оппонент Племени',
      assetId,
      price,
      status: 'pending'
    };
    setGameState(prev => ({
      ...prev,
      activeOffers: [...prev.activeOffers, newOffer]
    }));
  };

  const respondToOffer = (offerId: string, accept: boolean) => {
    setGameState(prev => {
      const offer = prev.activeOffers.find(o => o.id === offerId);
      if (!offer) return prev;

      if (accept) {
        return {
          ...prev,
          cash: prev.cash + offer.price,
          ownedAssets: prev.ownedAssets.filter(id => id !== offer.assetId),
          activeOffers: prev.activeOffers.filter(o => o.id !== offerId),
          history: [`🤝 Сделка закрыта! Вы продали актив за ${offer.price}`, ...prev.history].slice(0, 5)
        };
      }
      return {
        ...prev,
        activeOffers: prev.activeOffers.filter(o => o.id !== offerId),
        history: [`🚫 Вы отклонили предложение о покупке.`, ...prev.history].slice(0, 5)
      };
    });
  };

  const completeTutorial = () => {
    setGameState(prev => ({ ...prev, isTutorialComplete: true }));
  };

  return {
    user, view, setView, goals, subgoals, transactions, debts, subscriptions, partners, loading, meetings, values, isDemo, showRegPrompt, setShowRegPrompt, startMyOwnJourney,
    gameState, rollDice, buyAsset, createOffer, respondToOffer, completeTutorial,
    
    addGoalWithPlan: (g: YearGoal, s: SubGoal[]) => checkDemo(() => {
      setGoals(p => [...p, g]);
      setSubgoals(p => [...p, ...s]);
      setTimeout(() => geminiService.generateGoalVision(g.id, g.description || ""), 1000);
    }),
    
    updateSubgoalProgress: (sgId: string, value: number, forceVerify: boolean = false) => checkDemo(() => {
      setSubgoals(prev => prev.map(sg => {
        if (sg.id === sgId) {
          const log: ProgressLog = { id: crypto.randomUUID(), goal_id: sg.year_goal_id, subgoal_id: sg.id, timestamp: new Date().toISOString(), value, confidence: 5, is_verified: forceVerify, verified_by: forceVerify ? 'self' : undefined, user_id: user.id };
          setGoals(gPrev => gPrev.map(g => {
            if (g.id === sg.year_goal_id) {
              const updatedLogs = [...(g.logs || []), log];
              const totalValue = updatedLogs.reduce((acc, l) => acc + (l.is_verified ? l.value : 0), 0);
              // Если цель завершена — даем карту!
              if (totalValue >= g.target_value && g.status !== 'completed') awardGameCard("Супер-прыжок");
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
      setUser(prev => ({ ...prev, financials: { ...prev.financials!, total_assets: type === 'income' ? prev.financials!.total_assets + amount : prev.financials!.total_assets - amount } }));
    }),
    
    addPartner: (name: string, role: string) => checkDemo(() => setPartners(p => [...p, { id: crypto.randomUUID(), name, role: role as PartnerRole, avatar: `https://i.pravatar.cc/150?u=${name}`, xp: 0 }])),
    addDebt: (d: any) => checkDemo(() => setDebts(prev => [...prev, { ...d, id: crypto.randomUUID() }])),
    addSubscription: (s: any) => checkDemo(() => setSubscriptions(prev => [...prev, { ...s, id: crypto.randomUUID() }])),
    toggleGoalPrivacy: (id: string) => checkDemo(() => setGoals(p => p.map(g => g.id === id ? {...g, is_private: !g.is_private} : g))),
    updateUserInfo: (d: any) => checkDemo(() => setUser(p => ({...p, ...d}))),
    resetData: () => { localStorage.clear(); window.location.reload(); },
  };
}
