import { GoogleGenAI, Type } from "@google/genai";

// Инициализация с проверкой наличия ключа
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. Check your Cloudflare environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "dummy-key" });
};

export const geminiService = {
  async validateGoal(value: string, goalTitle: string, goalMetric: string) {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Проверь цель на соответствие ценности "${value}". Цель: "${goalTitle}", Метрика: "${goalMetric}". Оцени реалистичность и дай краткий совет. Ответь в формате JSON: { "isValid": boolean, "feedback": string, "suggestedDeadlineMonths": number }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING },
              suggestedDeadlineMonths: { type: Type.NUMBER }
            },
            required: ["isValid", "feedback", "suggestedDeadlineMonths"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini API Error:", error);
      return { isValid: true, feedback: "Проверка временно недоступна, но цель выглядит достойно!", suggestedDeadlineMonths: 12 };
    }
  },

  async decomposeGoal(goalTitle: string, metric: string, target: number, category: string) {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Разложи цель "${goalTitle}" (${category}, ${metric}: ${target}) на шаги. Для каждого шага укажи реалистичную длительность в днях. Верни JSON структуру с subGoals и projects.`,
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
                    metric: { type: Type.STRING },
                    target_value: { type: Type.NUMBER },
                    weight: { type: Type.NUMBER },
                    estimated_days: { type: Type.NUMBER }
                  },
                  required: ["title", "metric", "target_value", "weight", "estimated_days"]
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    estimated_effort_hours: { type: Type.NUMBER },
                    complexity: { type: Type.NUMBER }
                  },
                  required: ["title", "estimated_effort_hours", "complexity"]
                }
              },
              suggestedHabits: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["subGoals", "projects", "suggestedHabits"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        subGoals: [{ title: "Сделать первый шаг", metric: metric, target_value: target, weight: 100, estimated_days: 30 }],
        projects: [{ title: "Подготовительный этап", estimated_effort_hours: 5, complexity: 1 }],
        suggestedHabits: ["Ежедневный прогресс"]
      };
    }
  }
};