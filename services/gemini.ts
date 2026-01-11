
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  async validateGoal(value: string, goalTitle: string, goalMetric: string) {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Проверь цель на соответствие ценности "${value}". 
        Цель: "${goalTitle}", Метрика: "${goalMetric}". 
        Оцени реалистичность по SMART и дай краткий, жесткий совет в стиле коуча. 
        Если метрика "${goalMetric}" не подходит к цели "${goalTitle}", укажи на это.
        Ответь в формате JSON: { "isValid": boolean, "feedback": string, "suggestedDeadlineMonths": number }`,
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
      return { isValid: true, feedback: "Цель принята. ИИ временно отдыхает, но я верю в тебя!", suggestedDeadlineMonths: 6 };
    }
  },

  async decomposeGoal(goalTitle: string, metric: string, target: number, category: string) {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Разложи цель "${goalTitle}" (Категория: ${category}, Цель: ${target} ${metric}) на 3-5 конкретных подцелей (subGoals). 
        ВАЖНО: Если это НЕ финансовая цель, НЕ используй денежные метрики. 
        Для спорта используй: км, тренировки, подходы. 
        Для развития: часы, книги, уроки. 
        Для работы: задачи, проекты, часы.
        Рассчитай частоту выполнения (daily, weekly, monthly). 
        Верни JSON структуру.`,
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
                    weight: { type: Type.NUMBER, description: "Процент влияния на основную цель от 1 до 100" },
                    frequency: { type: Type.STRING, description: "daily, weekly, monthly, once" }
                  },
                  required: ["title", "metric", "target_value", "weight", "frequency"]
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
        subGoals: [{ title: "Начать действовать", metric: metric, target_value: target, weight: 100, frequency: "daily" }],
        projects: [{ title: "Подготовка", estimated_effort_hours: 2, complexity: 1 }],
        suggestedHabits: ["Регулярность"]
      };
    }
  }
};
