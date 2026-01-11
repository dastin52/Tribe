
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  // Шаг коучинга: Задает один острый вопрос "Зачем?" или дает краткую пометку
  async getCoachingInsight(category: string, title: string, userMessage?: string) {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
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
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
