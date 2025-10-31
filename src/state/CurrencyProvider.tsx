import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDb } from "../db/hooks";
import {
  addCurrency,
  listCurrencies,
  setBaseCurrency,
  updateCurrencyRate,
} from "../features/currency/repository";
import { Currency } from "../features/currency/types";

type CurrencyContextValue = {
  currencies: Currency[];
  baseCurrency: Currency | null;
  refresh: () => Promise<void>;
  add: (c: Currency) => Promise<void>;
  updateRate: (id: string, rate: number) => Promise<void>;
  makeBase: (id: string) => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const db = useDb(); // Use SQLiteProvider context
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const refresh = useCallback(async () => {
    try {
      const list = await listCurrencies(db);
      setCurrencies(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error refreshing currencies:", error);
      setCurrencies([]);
    }
  }, [db]);

  useEffect(() => {
    // Database initialization is handled by SQLiteProvider's onInit
    refresh();
  }, [refresh]);

  const baseCurrency = useMemo(
    () => (currencies || []).find((c) => c.isBase === 1) ?? null,
    [currencies]
  );

  const add = useCallback(
    async (c: Currency) => {
      await addCurrency(c, db);
      await refresh();
    },
    [refresh, db]
  );

  const updateRate = useCallback(
    async (id: string, rate: number) => {
      await updateCurrencyRate(id, rate, db);
      await refresh();
    },
    [refresh, db]
  );

  const makeBase = useCallback(
    async (id: string) => {
      await setBaseCurrency(id, db);
      await refresh();
    },
    [refresh, db]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currencies, baseCurrency, refresh, add, updateRate, makeBase }),
    [currencies, baseCurrency, refresh, add, updateRate, makeBase]
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
