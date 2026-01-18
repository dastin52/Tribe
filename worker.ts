
/**
 * Cloudflare Worker для Tribe Arena.
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

    if (url.pathname === "/lobby" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("No ID", { status: 400 });
      const data = await env.TRIBE_KV.get(`lobby:${id}`);
      return new Response(data || JSON.stringify({ lobbyId: id, players: [], status: 'lobby', history: ["Создание лобби..."] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/join" && request.method === "POST") {
      const body = await request.json();
      const { lobbyId, player, gameStateUpdate, addBot, resetLobby, kickPlayerId } = body;
      
      if (!lobbyId) return new Response("No Lobby ID", { status: 400 });
      
      const lobbyKey = `lobby:${lobbyId}`;
      let data = await env.TRIBE_KV.get(lobbyKey);
      
      let state = data ? JSON.parse(data) : { 
        lobbyId: lobbyId,
        players: [], 
        status: 'lobby', 
        currentPlayerIndex: 0, 
        history: ["Племя собирается..."], 
        ownedAssets: {},
        turnNumber: 1
      };

      // КОМАНДА СБРОСА: Очищаем всех кроме текущего
      if (resetLobby) {
        state.players = [];
        state.status = 'lobby';
        state.history = ["Лобби очищено."];
        if (player) state.players.push({ ...player, isReady: false });
        await env.TRIBE_KV.put(lobbyKey, JSON.stringify(state), { expirationTtl: 3600 });
        return new Response(JSON.stringify(state), { headers: corsHeaders });
      }

      // КОМАНДА УДАЛЕНИЯ КОНКРЕТНОГО ИГРОКА
      if (kickPlayerId) {
        state.players = state.players.filter((p: any) => p.id !== kickPlayerId);
        state.history.unshift(`🚫 Игрок был удален из лобби.`);
        await env.TRIBE_KV.put(lobbyKey, JSON.stringify(state), { expirationTtl: 3600 });
        return new Response(JSON.stringify(state), { headers: corsHeaders });
      }
      
      let changed = false;

      if (player && player.id) {
        const idx = state.players.findIndex((p: any) => p.id === player.id);
        if (idx > -1) {
          state.players[idx] = { ...state.players[idx], ...player };
          changed = true;
        } else if (state.players.length < 4) {
          state.players.push(player);
          state.history.unshift(`🤝 ${player.name} вошел в лобби.`);
          changed = true;
        }
      }

      if (addBot) {
        const botId = 'bot-' + Math.random().toString(36).substring(2, 7);
        state.players.push({ ...addBot, id: botId, isReady: true, isBot: true });
        state.history.unshift(`🤖 Бот ${addBot.name} присоединился!`);
        changed = true;
      }

      if (gameStateUpdate) {
        state = { ...state, ...gameStateUpdate };
        changed = true;
      }

      if (state.status === 'lobby' && state.players.length >= 2) {
        const allReady = state.players.every((p: any) => p.isReady === true);
        if (allReady) {
          state.status = 'playing';
          state.currentPlayerIndex = 0;
          state.history.unshift("🚀 Племя начинает путь!");
          changed = true;
        }
      }

      if (changed || !data) {
        await env.TRIBE_KV.put(lobbyKey, JSON.stringify(state), { expirationTtl: 3600 });
      }
      
      return new Response(JSON.stringify(state), { headers: corsHeaders });
    }

    return new Response("Not Found", { status: 404 });
  },
};
