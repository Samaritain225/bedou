import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDb } from "@/src/db/hooks";
import {
  getWallet,
  setBalance,
  updateBalance,
  upsertWallet,
} from "@/src/features/wallets/repository";
import { Wallet } from "@/src/features/wallets/types";

type WalletContextValue = {
  wallet: Wallet | null;
  refresh: () => Promise<void>;
  updateWallet: (
    wallet: Omit<Wallet, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  ) => Promise<string>;
  setWalletBalance: (amountBase: number, currencyCode: string) => Promise<void>;
  adjustWalletBalance: (amountDelta: number, currencyCode: string) => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = useDb();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const refresh = useCallback(async () => {
    try {
      const walletData = await getWallet(db);
      setWallet(walletData);
    } catch (error) {
      console.error("Error refreshing wallet:", error);
      setWallet(null);
    }
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpdateWallet = useCallback(
    async (
      walletData: Omit<Wallet, "id" | "createdAt" | "updatedAt"> & {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
      }
    ) => {
      const id = await upsertWallet(walletData, db);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const handleSetWalletBalance = useCallback(
    async (amountBase: number, currencyCode: string) => {
      await setBalance(amountBase, currencyCode, db);
      await refresh();
    },
    [db, refresh]
  );

  const handleAdjustWalletBalance = useCallback(
    async (amountDelta: number, currencyCode: string) => {
      await updateBalance(amountDelta, currencyCode, db);
      await refresh();
    },
    [db, refresh]
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      refresh,
      updateWallet: handleUpdateWallet,
      setWalletBalance: handleSetWalletBalance,
      adjustWalletBalance: handleAdjustWalletBalance,
    }),
    [
      wallet,
      refresh,
      handleUpdateWallet,
      handleSetWalletBalance,
      handleAdjustWalletBalance,
    ]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx)
    throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

