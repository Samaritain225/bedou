import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { createExchangeRateService } from "../services/api/exchange-rate.service";
import { createRatesService } from "../services/firestore/rates.service";
import { useAuth } from "./AuthProvider";

import { Currency } from "../features/currency/types";

type CurrencyContextValue = {
  currencies: Currency[];
  baseCurrency: Currency | null;
  rates: Record<string, number>;
  lastUpdated: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  add: (c: Currency) => Promise<void>;
  updateRate: (id: string, rate: number) => Promise<void>;
  makeBase: (id: string) => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

// We'll stick to a static list of "Known" currencies we want to display/support in the UI for now,
// but populate their rates dynamically.
const KNOWN_CURRENCIES: Partial<Currency>[] = [
    { id: 'default-xof', code: 'XOF', label: 'Franc CFA', symbol: 'XOF' },
    { id: 'usd', code: 'USD', label: 'US Dollar', symbol: '$' },
    { id: 'eur', code: 'EUR', label: 'Euro', symbol: '€' },
    { id: 'ngn', code: 'NGN', label: 'Naira', symbol: '₦' },
    { id: 'gbp', code: 'GBP', label: 'British Pound', symbol: '£' },
    { id: 'cad', code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
    { id: 'jpy', code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { id: 'cny', code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
    { id: 'ghs', code: 'GHS', label: 'Ghanaian Cedi', symbol: 'GH₵' },
    { id: 'zar', code: 'ZAR', label: 'South African Rand', symbol: 'R' },
];

const CACHE_DURATION_HOURS = 24; // Update rates once daily

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with defaults if offline/loading
  useEffect(() => {
    const defaults = KNOWN_CURRENCIES.map(c => ({
        ...c,
        rateToBase: 1, // Placeholder
        isBase: c.code === 'XOF' ? 1 : 0,
        updatedAt: new Date().toISOString()
    } as Currency));
    setCurrencies(defaults);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
        const ratesService = createRatesService(user.uid);
        const apiService = createExchangeRateService();

        // 1. Try to load from Cache
        const cached = await ratesService.getLatestRates();
        let currentRates = cached?.rates || {};
        let timestamp = cached?.timestamp || 0;
        let baseCode = cached?.base_code || "USD"; // API uses USD default often

        const now = Date.now() / 1000;
        const isStale = (now - timestamp) > (CACHE_DURATION_HOURS * 3600);

        if (!cached || isStale) {
            console.log("Currency rates stale or missing, fetching from API...");
            try {
                 // For simpler logic, we'll fetch rates against USD as a stable base for the app's internal logic if needed,
                 // OR fetch against XOF if that's our primary. Let's fetch against USD to be safe and standard.
                 // Actually, if our default is XOF, let's try to fetch against XOF if the API supports it freely.
                 // ExchangeRate-API supports any base.
                 const response = await apiService.fetchRates("XOF");
                 currentRates = response.conversion_rates;
                 timestamp = response.time_last_update_unix;
                 baseCode = response.base_code;

                 await ratesService.saveRates({
                     base_code: baseCode,
                     rates: currentRates,
                     timestamp: timestamp,
                     updatedAt: new Date().toISOString()
                 });

            } catch (err) {
                console.error("Failed to fetch fresh rates, using cache if available", err);
                // If api fails, we keep using cache even if stale
            }
        } else {
             console.log("Using cached currency rates");
        }
        
        setRates(currentRates);
        setLastUpdated(timestamp);

        // Update the currency objects with new rates
        // Note: The API returns rates where Base = 1. 
        // If we fetched with Base=XOF, then rateToBase for USD is how many USD you get for 1 XOF.
        // Wait, usually rateToBase in this app context implies "Worth in Base"?
        // Let's check previous implementation:
        // USD rateToBase: 620 (meaning 1 USD = 620 XOF? Or 1 XOF = 620 USD?)
        // The mock said: USD rateToBase 620. XOF is Base.
        // Logic was: valueInBase = val * from.rateToBase.
        // If 1 USD = 620 XOF. Then 10 USD = 6200 XOF. Correct.
        // So rateToBase means "Exchange Rate to Base Currency".
        // i.e. 1 Unit of this Currency = X Units of Base Currency.
        
        // The API returns: "USD": 1, "EUR": 0.95... (If Base is USD).
        // If we fetch Base=XOF. API returns: "XOF": 1, "USD": 0.0016...
        // meaning 1 XOF = 0.0016 USD.
        // But our app likely wants 1 USD = 620 XOF.
        
        // So we actually need the INVERSE if we want to store "How much XOF is 1 USD".
        // If API Base = XOF.
        // USD = 0.0016. (1 XOF = 0.0016 USD).
        // Then 1 USD = 1 / 0.0016 XOF = 625 XOF.
        
        // So: rate = 1 / api_rate (if api_base == app_base).
        
        const updatedCurrencies = KNOWN_CURRENCIES.map(c => {
             const code = c.code || "USD"; // shouldn't happen
             const apiRate = currentRates[code];
             
             // If apiRate is missing, keep 1 or old
             if (!apiRate) return {
                 ...c,
                 rateToBase: 1,
                 isBase: code === 'XOF' ? 1 : 0, 
                 updatedAt: new Date().toISOString()
             } as Currency;

             // Calculate rate to XOF (Base)
             // If standard is XOF.
             // API says 1 XOF = apiRate [CURRENCY]
             // We want: 1 [CURRENCY] = X [XOF]
             // So X = 1 / apiRate
             
             const val = code === 'XOF' ? 1 : (1 / apiRate);

             return {
                 ...c,
                 rateToBase: val,
                 isBase: code === 'XOF' ? 1 : 0,
                 updatedAt: new Date(timestamp * 1000).toISOString()
             } as Currency;
        });
        
        setCurrencies(updatedCurrencies);

    } catch (error) {
        console.error("CurrencyProvider refresh error", error);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const baseCurrency = useMemo(
    () => (currencies || []).find((c) => c.isBase === 1) ?? currencies[0],
    [currencies]
  );

  const add = useCallback(async (c: Currency) => { console.log('Not impl'); }, []);
  const updateRate = useCallback(async (id: string, rate: number) => { console.log('Not impl'); }, []);
  const makeBase = useCallback(async (id: string) => { console.log('Not impl'); }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({ currencies, baseCurrency, rates, lastUpdated, isLoading, refresh, add, updateRate, makeBase }),
    [currencies, baseCurrency, rates, lastUpdated, isLoading, refresh, add, updateRate, makeBase]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
