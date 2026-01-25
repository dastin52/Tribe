
import { GoogleGenAI, Type } from "@google/genai";

const GAME_RULES_KNOWLEDGE = `
Ты - Магистр Игры Tribe Arena. Твоя задача - вести игрока, обучать его финансовой грамотности и объяснять правила.
ПРАВИЛА ИГРЫ:
1. ХОДЫ: Игрок получает ходы (Dice Rolls), только выполняя свои РЕАЛЬНЫЕ цели в приложении Tribe. 1 выполненная подцель = 1 ход.
2. ПОЛЕ: 24 клетки. Есть Активы (бизнесы), Банк (депозиты), Налоги и События.
3. АКТИВЫ: Можно купить (налог 5% от цены). Можно улучшать (Lvl 1-5). 
   - Lvl 4 дает статус "ОЭЗ" (Особая Экономическая Зона) -> 0% налога на ренту с этого актива.
4. АКЦИИ: Можно покупать доли в компаниях. Цена зависит от индекса сектора (Tech, Web3 и т.д.).
5. НАЛОГИ: 
   - Налог на покупку актива: 5%.
   - Налог на прибыль с продажи акций (НДФЛ): 13%.
6. ОПТИМИЗАЦИЯ НАЛОГОВ: 
   - Реинвестирование (покупка нового актива сразу после продажи) снижает налог.
   - Благотворительность (вклад в Племя) списывает налоги.
   - Достижение Lvl 4 актива обнуляет его налоги.
7. РИСКИ: ИИ-события могут обрушить сектор. Диверсифицируй портфель.
8. БАНК: Вклад под 15% на 5 ходов. Защита от инфляции.

Твой стиль: Мудрый наставник, лаконичный, используешь финансовые термины, мотивируешь достигать реальных целей для продвижения в игре.
`;

export const geminiService = {
  async chatWithGameMaster(userMessage: string, history: {role: string, parts: any[]}[], gameState: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `Текущее состояние игрока: Капитал ${gameState.cash} руб, Позиция ${gameState.position}, Активов ${gameState.ownedAssetsCount}. 
      Рынок: ${JSON.stringify(gameState.marketIndices)}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: GAME_RULES_KNOWLEDGE + "\n" + context }] },
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 250,
        }
      });
      return response.text;
    } catch (e) {
      return "Связь с Магистром прервана. Проверь свои активы и попробуй позже.";
    }
  },

  async getDailyBriefing(goals: any[], financials: any, energyStatus: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Ты - ИИ-советник системы Tribe. 
        Цели: ${JSON.stringify(goals.map(g => g.title))}. 
        Финансы: ${JSON.stringify(financials)}. 
        Статус энергии: ${energyStatus}.
        Дай ОДИН короткий совет (до 20 слов) на сегодня. 
        Сфокусируйся на связи финансов и главной цели.`,
      });
      return response.text;
    } catch (e) {
      return "Сегодня отличный день, чтобы закрыть одну маленькую задачу.";
    }
  },

  async getGameMasterEvent(players: any[], history: string[]) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Ты - Магистр Игры "Tribe Arena". 
        Игроки: ${JSON.stringify(players.map(p => ({ name: p.name, cash: p.cash })))}.
        История: ${JSON.stringify(history.slice(0, 5))}.
        Придумай случайное событие (кризис, хайп, налоги, подарок).
        Оно должно влиять на определенный сектор (tech, realestate, health, energy, web3, edu).
        Верни JSON: { "title": string, "description": string, "sector": string, "multiplier": number, "duration": number }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              sector: { type: Type.STRING },
              multiplier: { type: Type.NUMBER },
              duration: { type: Type.NUMBER }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { title: "Стабильность", description: "На рынке без перемен.", sector: "tech", multiplier: 1, duration: 1 };
    }
  },

  async getFocusMantra(taskTitle: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Сгенерируй одну мощную, короткую мантру (до 7 слов) для глубокой концентрации на задаче: "${taskTitle}". 
        Стиль: Стоицизм или Киберпанк. Без знаков препинания в конце.`,
      });
      return response.text;
    } catch (e) {
      return "Твое внимание — твой главный актив";
    }
  },

  async getFinanceAdvice(txs: any[], goals: any[]) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Проанализируй транзакции: ${JSON.stringify(txs.slice(-10))}. 
        Учитывая финансовые цели: ${JSON.stringify(goals.filter(g => g.category === 'finance'))}.
        Дай ОДИН конкретный совет по оптимизации бюджета для достижения этих целей (до 25 слов).`,
      });
      return response.text;
    } catch (e) {
      return "Следи за мелкими расходами, они крадут твое будущее.";
    }
  },

  async generateGoalVision(title: string, description: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A cinematic, highly detailed, inspiring 4k image representing the successful achievement of the goal: "${title}". Context: ${description}. Digital art style, vibrant colors, epic composition, motivation theme.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Image generation failed", e);
      return null;
    }
  },

  async getCoachingInsight(category: string, title: string, userMessage?: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = userMessage 
        ? `Пользователь хочет: "${title}" (${category}). Его мотивация: "${userMessage}". 
           Дай ОДНУ короткую пометку (до 15 слов) и предложи идеальный срок (в месяцах) для этой цели. 
           Ответь строго в JSON: { "insight": string, "suggestedMonths": number }`
        : `Пользователь хочет: "${title}" (${category}). 
           Задай ОДИН короткий, бьющий в цель вопрос, чтобы он понял истинную причину этой цели (до 10 слов).
           Ответь строго в JSON: { "question": string }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insight: { type: Type.STRING },
              question: { type: Type.STRING },
              suggestedMonths: { type: Type.NUMBER }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      return { insight: "Действуй решительно.", suggestedMonths: 6, question: "Каков твой первый шаг?" };
    }
  },

  async decomposeGoal(goalTitle: string, metric: string, target: number, category: string, description: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Декомпозируй цель "${goalTitle}" (${target} ${metric}). 
        Контекст: ${description}. Категория: ${category}.
        Разбей на 3 конкретных подцели (milestones). Без воды. 
        Верни JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subGoals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    target_value: { type: Type.NUMBER },
                    weight: { type: Type.NUMBER }
                  },
                  required: ["title", "target_value", "weight"]
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      return { subGoals: [{ title: "Начать реализацию", target_value: target, weight: 100 }] };
    }
  }
};
