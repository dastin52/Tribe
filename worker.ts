
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
      return new Response(data || JSON.stringify({ players: [], status: 'lobby', currentPlayerIndex: 0, history: [], ownedAssets: {} }), {
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
          // Обновляем данные существующего игрока, но сохраняем его роль Хоста если она была
          const existingHostStatus = state.players[idx].isHost;
          state.players[idx] = { ...player, isHost: existingHostStatus };
        } else if (state.players.length < 4) {
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Первый игрок — Хост, остальные — нет.
          const isFirstPlayer = state.players.length === 0;
          const newPlayer = { ...player, isHost: isFirstPlayer };
          state.players.push(newPlayer);
          
          if (!isFirstPlayer) {
            state.history.unshift(`🤝 ${player.name} присоединился к походу!`);
          }
        }
      }

      // Если это игровое действие (старт, бросок, покупка)
      if (gameStateUpdate) {
        state = { ...state, ...gameStateUpdate };
      }

      await env.TRIBE_KV.put(key, JSON.stringify(state), { expirationTtl: 3600 });
      
      return new Response(JSON.stringify(state), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
