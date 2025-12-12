
// In a real app, this should be in .env and accessed via Expo Config
// For now, hardcoding based on the user's provided env file context or using a placeholder
// The user provided the key in .env: EXCHANGE_RATE_API_KEY="a462703b6a82fb9664d6b92b"
const API_KEY = "a462703b6a82fb9664d6b92b";
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

export interface ExchangeRateResponse {
  result: string;
  time_last_update_unix: number;
  base_code: string;
  conversion_rates: Record<string, number>;
}

export const createExchangeRateService = () => {
  return {
    async fetchRates(baseCurrency: string = "USD"): Promise<ExchangeRateResponse> {
      try {
        const response = await fetch(`${BASE_URL}/latest/${baseCurrency}`);
        const data = await response.json();

        if (data.result !== "success") {
          throw new Error(`API Error: ${data["error-type"] || "Unknown error"}`);
        }

        return data as ExchangeRateResponse;
      } catch (error) {
        console.error("ExchangeRateService Error:", error);
        throw error;
      }
    },
  };
};
