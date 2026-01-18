
/**
 * Cloudflare Worker для Tribe Arena и Племени.
 * Исправлена логика синхронизации и поддержки одиночного режима.
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

    const lobbyId = url.searchParams.get("id") || (request.method === "POST" ? (await request.clone().json()).lobbyId : null);
    if (!lobbyId) return new Response("Missing Lobby ID", { status: 400, headers: corsHeaders });

    const lobbyKey = `lobby:${lobbyId}`;
    let data = await env.TRIBE_KV.get(lobbyKey);
    let state = data ? JSON.parse(data) : { 
      lobbyId, players: [], pendingPlayers: [], status: 'lobby', 
      history: ["Инициализация пространства..."], ownedAssets: {}, 
      currentPlayerIndex: 0, turnNumber: 1 
    };

    if (request.method === "GET") {
      return new Response(JSON.stringify(state), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await request.json();
    const { player, gameStateUpdate, addBot, resetLobby, kickPlayerId, action, targetId } = body;
    let changed = false;

    // 1. Сброс лобби
    if (resetLobby) {
      state.players = state.players.filter((p: any) => p.isHost || p.id === state.hostId);
      state.status = 'lobby';
      state.history.unshift("Лобби перезагружено.");
      changed = true;
    }

    // 2. Система партнеров (Knock/Approve)
    if (action === 'knock' && player) {
      if (!state.pendingPlayers) state.pendingPlayers = [];
      if (!state.pendingPlayers.some((p: any) => p.id === player.id) && !state.players.some((p: any) => p.id === player.id)) {
        state.pendingPlayers.push({ ...player, status: 'pending' });
        state.history.unshift(`🔔 ${player.name} просит доступа в Племя.`);
        changed = true;
      }
    }

    if (action === 'approve' && targetId) {
      const idx = state.pendingPlayers?.findIndex((p: any) => p.id === targetId);
      if (idx > -1) {
        const p = state.pendingPlayers.splice(idx, 1)[0];
        state.players.push({ ...p, cash: 50000, position: 0, isReady: false, status: 'accepted' });
        state.history.unshift(`✅ ${p.name} теперь ваш партнер.`);
        changed = true;
      }
    }

    // 3. Синхронизация игрока (UPSERT)
    if (player && player.id && !action) {
      const idx = state.players.findIndex((p: any) => p.id === player.id);
      if (idx > -1) {
        state.players[idx] = { ...state.players[idx], ...player };
      } else {
        const isFirst = state.players.length === 0;
        state.players.push({ 
          ...player, isHost: isFirst, cash: 50000, position: 0, 
          isReady: player.isReady || false, ownedAssets: [], deposits: [] 
        });
        if (isFirst) state.hostId = player.id;
      }
      changed = true;
    }

    // 4. Управление ботами
    if (addBot) {
      state.players.push({ ...addBot, id: 'bot-' + Math.random(), isReady: true, isBot: true });
      changed = true;
    }

    // 5. Глобальное обновление состояния (включая принудительный старт)
    if (gameStateUpdate) {
      state = { ...state, ...gameStateUpdate };
      changed = true;
    }

    // 6. Авто-старт (если все готовы и игроков > 1)
    if (state.status === 'lobby' && state.players.length >= 2) {
      const allReady = state.players.every((p: any) => p.isReady);
      if (allReady) {
        state.status = 'playing';
        state.history.unshift("🚀 Все готовы! Начинаем.");
        changed = true;
      }
    }

    if (changed) {
      await env.TRIBE_KV.put(lobbyKey, JSON.stringify(state), { expirationTtl: 86400 });
    }

    return new Response(JSON.stringify(state), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}
