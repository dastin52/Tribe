
import { GoogleGenAI, Type } from "@google/genai";

const NAVIGATOR_SYSTEM_PROMPT = `
Ты — Tribe AI, Навигатор Жизни.
Твоя цель: помогать пользователю двигаться устойчиво, а не быстро.

ФИЛОСОФИЯ:
- Энергия важнее мотивации.
- Осознанный пропуск лучше выгорания.
- 1 точный шаг лучше 10 хаотичных.

СТИЛЬ:
- Кратко, тепло, спокойно.
- Без пафоса и клише.
- Честно, иногда с мягкой иронией.
- Ты не приказываешь и не стыдишь.

ТВОЯ ЗАДАЧА ПРИ ПОСТАНОВКЕ ЦЕЛИ:
1. Выявить core_intent (истинный смысл).
2. Определить constraints (реальные ограничения ресурсов).
3. Сформулировать success_definition (что есть успех).
4. Создать MOS (Minimum Operational Step) — микро-действие на "плохой день".

ТВОЯ ЗАДАЧА ПРИ ДЕКОМПОЗИЦИИ:
Разбей цель на Milestones (этапы смысла), а затем на Tasks.
Каждая задача должна иметь тип: мышление, действие или привычка.
Не планируй более 1-2 задач в день.
`;

export const geminiService = {
  async getNavigatorInsight(step: number, data: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let prompt = "";
      
      if (step === 1) { // Слой: Смысл
        prompt = `Пользователь хочет: "${data.title}" (${data.category}). 
        Задай ОДИН точный вопрос, чтобы выявить истинный смысл (core_intent). Почему это важно сейчас?`;
      } else if (step === 2) { // Слой: Реальность
        prompt = `Цель: "${data.title}". Смысл: "${data.motivation}". 
        Спроси об одном главном ограничении (время/энергия) или риске, который обычно мешает пользователю.`;
      } else if (step === 3) { // Слой: Контракт
        prompt = `Цель: "${data.title}". Контекст: ${JSON.stringify(data)}.
        Предложи ОДИН вариант MOS (минимальный шаг) и ОДИН вариант критерия успеха. 
        Верни JSON: { "mos": string, "success": string, "insight": string }`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: NAVIGATOR_SYSTEM_PROMPT + "\n" + prompt,
        config: {
          responseMimeType: step === 3 ? "application/json" : "text/plain"
        }
      });

      return step === 3 ? JSON.parse(response.text || '{}') : response.text;
    } catch (e) {
      return step === 3 ? { mos: "Просто открыть приложение", success: "Регулярность", insight: "Главное - начать." } : "Что для тебя будет самым сложным в этом пути?";
    }
  },

  async decomposeGoalNavigator(goal: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: NAVIGATOR_SYSTEM_PROMPT + `\nДекомпозируй цель: "${goal.title}". 
        Тип: ${goal.goal_type}. Смысл: ${goal.core_intent}. Ограничения: ${goal.constraints}.
        Создай 3 Milestone и для первого Milestone предложи 2 атомарные задачи.
        Верни JSON с четкой структурой.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          effort_type: { type: Type.STRING, description: "thinking | action | habit" },
                          weight: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { milestones: [] };
    }
  },

  async getMOSAdvice(goal: any, energyStatus: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: NAVIGATOR_SYSTEM_PROMPT + `\nУ пользователя статус энергии: ${energyStatus}. 
        Цель: ${goal.title}. Актуализируй MOS (минимальный шаг) на сегодня. Максимум 5 слов.`
      });
      return response.text;
    } catch (e) {
      return "Сделай один маленький шаг.";
    }
  },

  // Added method for Game Master interaction in Arena
  async chatWithGameMaster(message: string, history: any[], context: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: `Контекст игрока: ${JSON.stringify(context)}. Сообщение: ${message}` }] }
        ],
        config: {
          systemInstruction: "Ты - Магистр Арены, мудрый гейм-мастер финансовой игры Tribe. Отвечай кратко, с легкой иронией, помогай советами по стратегии и правилам. Твой стиль: загадочный, но поддерживающий."
        }
      });
      return response.text || "Магистр временно недоступен.";
    } catch (e) {
      return "Энергия Арены нестабильна. Попробуй задать вопрос позже.";
    }
  },

  // Added method for Focus Mode mantras
  async getFocusMantra(taskTitle: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Сформулируй короткую (до 7 слов) глубокую мантру для полного погружения в задачу: "${taskTitle}".`,
        config: {
          systemInstruction: "Ты - Tribe AI. Создаешь вдохновляющие, но приземленные мантры для глубокого фокуса и работы в потоке."
        }
      });
      return response.text || "Фокус - твое единственное оружие.";
    } catch (e) {
      return "Будь здесь и сейчас.";
    }
  }
};
