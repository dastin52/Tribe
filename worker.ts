
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
      const { lobbyId, player, gameStateUpdate } = body;
      
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
      
      // Если это вход нового игрока
      if (player && player.id) {
        const idx = state.players.findIndex((p: any) => p.id === player.id);
        if (idx > -1) {
          // Важно: если пришло обновление только одного игрока, мы не должны сбрасывать isReady других
          const oldReady = state.players[idx].isReady;
          state.players[idx] = { 
            ...state.players[idx],
            ...player, 
            isReady: player.isReady !== undefined ? player.isReady : oldReady 
          };
        } else if (state.players.length < 4) {
          state.players.push({ ...player, isReady: player.isBot || false });
          state.history.unshift(`🤝 ${player.name} вошел в лобби.`);
        }
      }

      // Если передано обновление (например, кто-то нажал "Готов" или добавил бота)
      if (gameStateUpdate) {
        // Чтобы не потерять игроков при частичном обновлении
        if (gameStateUpdate.players) {
           // Объединяем существующих игроков с обновленными данными готовности
           state.players = gameStateUpdate.players;
        }
        // Другие поля состояния
        const { players, ...otherUpdates } = gameStateUpdate;
        state = { ...state, ...otherUpdates };
      }

      // КРИТИЧЕСКАЯ ЛОГИКА: Автозапуск
      if (state.status === 'lobby' && state.players.length >= 2) {
        const allReady = state.players.every((p: any) => p.isReady);
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
