
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
      let state = data ? JSON.parse(data) : null;
      
      // Самоисцеление: если игроки есть, а хоста нет - назначаем первого
      if (state && state.players && state.players.length > 0) {
        const hasHost = state.players.some((p: any) => p.isHost === true);
        if (!hasHost) {
          state.players[0].isHost = true;
          await env.TRIBE_KV.put(`lobby:${id}`, JSON.stringify(state), { expirationTtl: 3600 });
        }
      }

      return new Response(JSON.stringify(state || { players: [], status: 'lobby', history: [] }), {
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
          // Обновляем данные, сохраняя роль
          const wasHost = state.players[idx].isHost;
          state.players[idx] = { ...player, isHost: wasHost };
        } else if (state.players.length < 4) {
          // Проверяем, есть ли уже хост в лобби
          const hasHost = state.players.some((p: any) => p.isHost === true);
          const shouldBeHost = !hasHost; // Если хоста нет, этот игрок им станет
          
          state.players.push({ ...player, isHost: shouldBeHost });
          if (!shouldBeHost) {
            state.history.unshift(`🤝 ${player.name} присоединился к походу!`);
          } else {
            state.history.unshift(`👑 ${player.name} основал новое Племя!`);
          }
        }
      }

      // Применение обновлений состояния
      if (gameStateUpdate) {
        // Если обновление содержит статус playing, фиксируем его
        state = { ...state, ...gameStateUpdate };
      }

      // Финальная проверка на наличие хоста перед сохранением
      if (state.players.length > 0 && !state.players.some((p: any) => p.isHost === true)) {
        state.players[0].isHost = true;
      }

      await env.TRIBE_KV.put(key, JSON.stringify(state), { expirationTtl: 3600 });
      
      return new Response(JSON.stringify(state), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
