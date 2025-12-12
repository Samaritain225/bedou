import { Wallet } from "@/src/features/wallets/types";
import { createWalletsService } from "@/src/services/firestore/wallets.service";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useAuth } from "./AuthProvider";

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
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (!user) {
        setWallet(null);
        return;
    }

    const walletsService = createWalletsService(user.uid);
    
    // Subscribe to wallets
    const unsubscribe = walletsService.onWalletsSnapshot(async (wallets) => {
        if (wallets.length > 0) {
            // Use the first wallet for now
            // In the future we supports multiple wallets
            setWallet(wallets[0] as Wallet);
        } else {
            // Create default wallet if none exists
            try {
                const defaultWallet = {
                    name: "Main Wallet",
                    amountBase: 0,
                    currencyCode: "XOF",
                    type: "cash" as const,
                    color: "#10B981", // Emerald-500
                    icon: "wallet"
                };
                await walletsService.create(defaultWallet);
                // Snapshot will trigger again with the new wallet
            } catch (error) {
                console.error("Error creating default wallet:", error);
            }
        }
    });

    return () => unsubscribe();
  }, [user]);

  const refresh = useCallback(async () => {
     // No-op for real-time listener, but useful interface compliance
  }, []);

  const handleUpdateWallet = useCallback(
    async (
      walletData: Omit<Wallet, "id" | "createdAt" | "updatedAt"> & {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
      }
    ) => {
      if (!user || !wallet) throw new Error("No user or wallet");
      const walletsService = createWalletsService(user.uid);
      
      if (walletData.id) {
          await walletsService.update(walletData.id, walletData);
          return walletData.id;
      } else {
          // Should not happen in update context usually, but handled
           return await walletsService.create(walletData);
      }
    },
    [user, wallet]
  );

  const handleSetWalletBalance = useCallback(
    async (amountBase: number, currencyCode: string) => {
      if (!user || !wallet) return;
      
      const walletsService = createWalletsService(user.uid);
      await walletsService.update(wallet.id, {
          amountBase,
          currencyCode
      });
    },
    [user, wallet]
  );

  const handleAdjustWalletBalance = useCallback(
    async (amountDelta: number, currencyCode: string) => {
       if (!user || !wallet) return;
       
       // Note: This needs proper transaction support for concurrency safe updates
       // For now simple delta application
       const newAmount = wallet.amountBase + amountDelta;
       
       const walletsService = createWalletsService(user.uid);
       await walletsService.update(wallet.id, {
           amountBase: newAmount
       });
    },
    [user, wallet]
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

