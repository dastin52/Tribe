
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  // Use gemini-3-flash-preview for basic text advice
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

  // Use gemini-3-flash-preview for conversational insights
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

  // Use gemini-3-pro-preview for advanced reasoning (goal decomposition)
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
