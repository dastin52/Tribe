
/**
 * Cloudflare Worker для Tribe Arena.
 * Обеспечивает синхронизацию всех аспектов игры между игроками.
 */

interface Env {
  TRIBE_KV: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // Получение полного состояния игры
    if (url.pathname === "/lobby" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("No ID", { status: 400 });
      
      const data = await env.TRIBE_KV.get(`lobby:${id}`);
      return new Response(data || JSON.stringify({ players: [], status: 'lobby', history: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Обновление состояния или вход
    if (url.pathname === "/join" && request.method === "POST") {
      const body = await request.json();
      const { lobbyId, player, gameStateUpdate, addBot } = body;
      
      if (!lobbyId) return new Response("No Lobby ID", { status: 400 });
      
      const key = `lobby:${lobbyId}`;
      let data = await env.TRIBE_KV.get(key);
      let state = data ? JSON.parse(data) : { 
        players: [], 
        status: 'lobby', 
        currentPlayerIndex: 0, 
        history: ["Племя собирается..."], 
        ownedAssets: {},
        turnNumber: 1
      };
      
      // 1. Обработка конкретного игрока (вход или смена статуса готовности)
      if (player && player.id) {
        const idx = state.players.findIndex((p: any) => p.id === player.id);
        if (idx > -1) {
          // Обновляем существующего игрока, сохраняя поля, которые не прислали
          state.players[idx] = { ...state.players[idx], ...player };
        } else if (state.players.length < 4) {
          // Новый игрок
          state.players.push(player);
          state.history.unshift(`🤝 ${player.name} вошел в лобби.`);
        }
      }

      // 2. Добавление бота сервером
      if (addBot) {
        const botId = 'bot-' + Math.random().toString(36).substring(2, 7);
        const newBot = {
          ...addBot,
          id: botId,
          isReady: true,
          isBot: true
        };
        state.players.push(newBot);
        state.history.unshift(`🤖 Бот ${newBot.name} присоединился!`);
      }

      // 3. Общие обновления состояния (ходы, покупки)
      if (gameStateUpdate) {
        // Если прислали массив игроков целиком, мержим его аккуратно (не рекомендуется, но для совместимости оставим)
        if (gameStateUpdate.players) {
           gameStateUpdate.players.forEach((p: any) => {
             const i = state.players.findIndex((sp: any) => sp.id === p.id);
             if (i > -1) state.players[i] = { ...state.players[i], ...p };
             else state.players.push(p);
           });
           delete gameStateUpdate.players;
        }
        state = { ...state, ...gameStateUpdate };
      }

      // 4. КРИТИЧЕСКАЯ ЛОГИКА: Автозапуск
      if (state.status === 'lobby' && state.players.length >= 2) {
        const allReady = state.players.every((p: any) => p.isReady === true);
        if (allReady) {
          state.status = 'playing';
          state.currentPlayerIndex = 0;
          state.history.unshift("🚀 Все готовы! Начинаем битву за капитал!");
        }
      }

      await env.TRIBE_KV.put(key, JSON.stringify(state), { expirationTtl: 3600 });
      
      return new Response(JSON.stringify(state), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
