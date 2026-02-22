
import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// In-memory cache
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ALPHA_VANTAGE_KEY = process.env.VITE_ALPHA_VANTAGE_API_KEY || '3TMBA60FRVITMZ6J';

app.get("/api/alpha-vantage", async (req: Request, res: Response) => {
  const { function: func, symbol } = req.query;
  if (!func || !symbol) {
    return res.status(400).json({ error: "Missing function or symbol" });
  }

  const cacheKey = `${func}-${symbol}`;
  const now = Date.now();

  if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_DURATION)) {
    console.log(`[Cache Hit] ${cacheKey}`);
    return res.json(cache[cacheKey].data);
  }

  try {
    console.log(`[API Fetch] ${cacheKey}`);
    const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    // Basic error check for Alpha Vantage
    if (data.Note || data["Error Message"]) {
      console.warn(`[API Warning] ${cacheKey}:`, data.Note || data["Error Message"]);
      // If we have stale data, return it instead of error
      if (cache[cacheKey]) return res.json(cache[cacheKey].data);
    }

    cache[cacheKey] = { data, timestamp: now };
    res.json(data);
  } catch (error) {
    console.error(`[API Error] ${cacheKey}:`, error);
    if (cache[cacheKey]) return res.json(cache[cacheKey].data);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
