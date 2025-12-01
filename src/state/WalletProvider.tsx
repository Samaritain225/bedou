import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
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
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const refresh = useCallback(async () => {
    console.log('Wallet refresh - using default wallet until Firestore migration');
  }, []);

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
      // TODO: Implement with Firestore
      console.log('Update wallet - not implemented yet');
      return 'temp-id';
    },
    [refresh]
  );

  const handleSetWalletBalance = useCallback(
    async (amountBase: number, currencyCode: string) => {
      // TODO: Implement with Firestore
      console.log('Set wallet balance - not implemented yet');
    },
    [refresh]
  );

  const handleAdjustWalletBalance = useCallback(
    async (amountDelta: number, currencyCode: string) => {
      // TODO: Implement with Firestore
      console.log('Adjust wallet balance - not implemented yet');
    },
    [refresh]
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

