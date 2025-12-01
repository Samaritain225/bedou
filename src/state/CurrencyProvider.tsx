import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

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
  
  // Default currency (XOF - Franc CFA)
  const defaultCurrency: Currency = {
    id: 'default-xof',
    code: 'XOF',
    label: 'Franc CFA',
    symbol: 'F CFA',
    rateToBase: 1,
    isBase: 1,
    updatedAt: new Date().toISOString(),
  };
  
  const [currencies, setCurrencies] = useState<Currency[]>([defaultCurrency]);

  const refresh = useCallback(async () => {
    console.log('Currency refresh - using default currency until Firestore migration');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const baseCurrency = useMemo(
    () => (currencies || []).find((c) => c.isBase === 1) ?? null,
    [currencies]
  );

  const add = useCallback(
    async (c: Currency) => {
      console.log('Add currency - not implemented yet');
    },
    [refresh]
  );

  const updateRate = useCallback(
    async (id: string, rate: number) => {
      // TODO: Implement with Firestore
      console.log('Update rate - not implemented yet');
    },
    [refresh]
  );

  const makeBase = useCallback(
    async (id: string) => {
      // TODO: Implement with Firestore
      console.log('Make base currency - not implemented yet');
    },
    [refresh]
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
