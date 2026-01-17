
/**
 * Этот файл нужно деплоить как отдельный Cloudflare Worker.
 * Он обеспечивает хранение списка игроков в лобби.
 */

interface Env {
  // Fix: Use 'any' to resolve 'Cannot find name KVNamespace' error when Cloudflare Worker types are not globally available
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
      return new Response(data || JSON.stringify({ players: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Эндпоинт входа в лобби
    if (url.pathname === "/join" && request.method === "POST") {
      const { lobbyId, player } = await request.json();
      const key = `lobby:${lobbyId}`;
      
      let data = await env.TRIBE_KV.get(key);
      let lobby = data ? JSON.parse(data) : { players: [] };
      
      // Обновляем или добавляем игрока
      const idx = lobby.players.findIndex((p: any) => p.id === player.id);
      if (idx > -1) {
        lobby.players[idx] = player;
      } else {
        lobby.players.push(player);
      }

      await env.TRIBE_KV.put(key, JSON.stringify(lobby), { expirationTtl: 3600 }); // Живет 1 час
      return new Response(JSON.stringify(lobby), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
