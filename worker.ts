
/**
 * Cloudflare Worker для Tribe Arena и Племени.
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
      return new Response(data || JSON.stringify({ lobbyId: id, players: [], status: 'lobby' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/join" && request.method === "POST") {
      const body = await request.json();
      const { lobbyId, player, gameStateUpdate, addBot, resetLobby, kickPlayerId, action, targetId } = body;
      
      if (!lobbyId) return new Response("No Lobby ID", { status: 400 });
      
      const lobbyKey = `lobby:${lobbyId}`;
      let data = await env.TRIBE_KV.get(lobbyKey);
      
      let state = data ? JSON.parse(data) : { 
        lobbyId: lobbyId,
        players: [], 
        pendingPlayers: [],
        status: 'lobby', 
        currentPlayerIndex: 0, 
        history: ["Создано новое пространство..."], 
        ownedAssets: {},
        turnNumber: 1,
        hostId: player?.id
      };

      let changed = false;

      if (resetLobby) {
        // Очищаем всех кроме хоста и ботов
        state.players = state.players.filter((p: any) => p.id === state.hostId || p.isBot);
        state.status = 'lobby';
        state.history = ["Лобби обновлено."];
        changed = true;
      }

      // 1. Обработка действий (Стук/Одобрение)
      if (action === 'knock' && player) {
        const alreadyPending = (state.pendingPlayers || []).some((p: any) => p.id === player.id);
        const alreadyIn = state.players.some((p: any) => p.id === player.id);
        if (!alreadyPending && !alreadyIn) {
          if (!state.pendingPlayers) state.pendingPlayers = [];
          state.pendingPlayers.push({ ...player, status: 'pending' });
          state.history.unshift(`🔔 ${player.name} хочет в Племя!`);
          changed = true;
        }
      }

      if (action === 'approve' && targetId) {
        const idx = state.pendingPlayers.findIndex((p: any) => p.id === targetId);
        if (idx > -1) {
          const newPartner = state.pendingPlayers.splice(idx, 1)[0];
          state.players.push({ ...newPartner, status: 'accepted', position: 0, cash: 50000, isReady: false });
          state.history.unshift(`✅ ${newPartner.name} принят в Племя!`);
          changed = true;
        }
      }

      // 2. Добавление/Обновление игрока (КРИТИЧЕСКИЙ ФИКС)
      if (player && player.id && !action) {
        const idx = state.players.findIndex((p: any) => p.id === player.id);
        if (idx > -1) {
          // Обновляем существующего
          state.players[idx] = { ...state.players[idx], ...player };
          changed = true;
        } else {
          // Добавляем НОВОГО игрока
          const isFirst = state.players.length === 0;
          state.players.push({ 
            ...player, 
            isHost: isFirst, 
            position: 0, 
            cash: 50000, 
            isReady: player.isReady || false,
            deposits: [],
            ownedAssets: []
          });
          if (isFirst) state.hostId = player.id;
          state.history.unshift(`🤝 ${player.name} вошел в лобби.`);
          changed = true;
        }
      }

      if (kickPlayerId) {
        state.players = state.players.filter((p: any) => p.id !== kickPlayerId);
        state.history.unshift(`🚫 Участник удален.`);
        changed = true;
      }

      if (addBot) {
        state.players.push({ ...addBot, id: 'bot-' + Date.now(), isReady: true, isBot: true });
        state.history.unshift(`🤖 Бот ${addBot.name} в деле!`);
        changed = true;
      }

      if (gameStateUpdate) {
        state = { ...state, ...gameStateUpdate };
        changed = true;
      }

      // Авто-старт если все готовы (минимум 2)
      if (state.status === 'lobby') {
        const readyCount = state.players.filter((p: any) => p.isReady === true).length;
        if (readyCount >= 2 && state.players.length >= 2) {
          state.status = 'playing';
          state.history.unshift("🚀 ИГРА НАЧАЛАСЬ!");
          changed = true;
        }
      }

      if (changed || !data) {
        await env.TRIBE_KV.put(lobbyKey, JSON.stringify(state), { expirationTtl: 86400 });
      }
      
      return new Response(JSON.stringify(state), { headers: corsHeaders });
    }

    return new Response("Not Found", { status: 404 });
  }
};
