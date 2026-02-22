
export interface GlobalQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
}

export interface HistoricalDataPoint {
  date: string;
  close: number;
}

const BASE_URL = '/api/alpha-vantage';

export const alphaVantageService = {
  async getGlobalQuote(symbol: string): Promise<GlobalQuote | null> {
    try {
      const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}`);
      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) return null;

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
      };
    } catch (error) {
      console.error('Alpha Vantage Quote Error:', error);
      return null;
    }
  },

  async getHistoricalData(symbol: string): Promise<HistoricalDataPoint[]> {
    try {
      const response = await fetch(`${BASE_URL}?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${symbol}`);
      const data = await response.json();
      const timeSeries = data['Monthly Adjusted Time Series'];
      
      if (!timeSeries) return [];

      return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date,
        close: parseFloat(values['5. adjusted close']),
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Alpha Vantage Historical Error:', error);
      return [];
    }
  }
};
