
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async validateGoal(value: string, goalTitle: string, goalMetric: string) {
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
  },

  async decomposeGoal(goalTitle: string, metric: string, target: number, category: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
  },

  async analyzeCrossSphereSynergy(goals: any[]) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Проанализируй список целей пользователя: ${JSON.stringify(goals)}. Найди неочевидные связи и синергии между разными сферами (например, как спорт помогает карьере). Выдели 2-3 ключевые связки. Ответ в JSON: { "synergies": [ { "spheres": [string, string], "reason": string, "impactScore": number } ] }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synergies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  spheres: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reason: { type: Type.STRING },
                  impactScore: { type: Type.NUMBER }
                },
                required: ["spheres", "reason", "impactScore"]
              }
            }
          },
          required: ["synergies"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async synthesizeSocialFeedback(reviews: any[]) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Проанализируй отзывы кураторов о прогрессе пользователя: ${JSON.stringify(reviews)}. Сделай краткое резюме того, как окружение оценивает его работу и дай совет, как улучшить доверие или дисциплину.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            socialCredibilityScore: { type: Type.NUMBER, description: "0-100" },
            advice: { type: Type.STRING }
          },
          required: ["summary", "socialCredibilityScore", "advice"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
};
