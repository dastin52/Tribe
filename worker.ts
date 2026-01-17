
/**
 * Этот файл нужно деплоить как отдельный Cloudflare Worker.
 * Обеспечивает синхронизацию лобби и состояния игры.
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

    // Эндпоинт получения данных лобби
    if (url.pathname === "/lobby" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("No ID", { status: 400 });
      
      const data = await env.TRIBE_KV.get(`lobby:${id}`);
      return new Response(data || JSON.stringify({ players: [], status: 'lobby' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Эндпоинт входа в лобби или обновления статуса
    if (url.pathname === "/join" && request.method === "POST") {
      const body = await request.json();
      const { lobbyId, player, status } = body;
      
      if (!lobbyId) return new Response("No Lobby ID", { status: 400 });
      
      const key = `lobby:${lobbyId}`;
      let data = await env.TRIBE_KV.get(key);
      let lobby = data ? JSON.parse(data) : { players: [], status: 'lobby' };
      
      // Если передан игрок — добавляем или обновляем его
      if (player && player.id) {
        const idx = lobby.players.findIndex((p: any) => p.id === player.id);
        if (idx > -1) {
          lobby.players[idx] = { ...lobby.players[idx], ...player };
        } else {
          // Ограничиваем лобби 4 игроками
          if (lobby.players.length < 4) {
            lobby.players.push(player);
          }
        }
      }

      // Если передана смена статуса (например, старт игры)
      if (status) {
        lobby.status = status;
      }

      await env.TRIBE_KV.put(key, JSON.stringify(lobby), { expirationTtl: 3600 });
      
      return new Response(JSON.stringify(lobby), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
