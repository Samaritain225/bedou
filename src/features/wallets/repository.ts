import { generateUuid, withTransaction } from "@/src/db";
import { Wallet } from "./types";

const DEFAULT_WALLET_ID = "default-wallet";
const DEFAULT_WALLET_NAME = "Budget";

export async function getWallet(db?: any): Promise<Wallet | null> {
  try {
    if (db) {
      const row = await db.getFirstAsync(
        "SELECT * FROM wallets WHERE id = ?",
        DEFAULT_WALLET_ID
      );
      return row || null;
    }
    const result = await withTransaction(async (tx) => {
      return await tx.getFirstAsync(
        "SELECT * FROM wallets WHERE id = ?",
        DEFAULT_WALLET_ID
      );
    });
    return result || null;
  } catch (error) {
    console.error("Error getting wallet:", error);
    return null;
  }
}

export async function upsertWallet(
  wallet: Omit<Wallet, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
  db?: any
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const walletId = wallet.id || DEFAULT_WALLET_ID;
    
    if (db) {
      const existing = await db.getFirstAsync(
        "SELECT id FROM wallets WHERE id = ?",
        walletId
      );
      
      if (existing) {
        // Update existing wallet
        await db.runAsync(
          "UPDATE wallets SET name=?, amountBase=?, currencyCode=?, updatedAt=? WHERE id=?",
          wallet.name,
          wallet.amountBase,
          wallet.currencyCode,
          now,
          walletId
        );
      } else {
        // Insert new wallet
        await db.runAsync(
          "INSERT INTO wallets (id, name, amountBase, currencyCode, updatedAt, createdAt) VALUES (?,?,?,?,?,?)",
          walletId,
          wallet.name || DEFAULT_WALLET_NAME,
          wallet.amountBase,
          wallet.currencyCode,
          now,
          now
        );
      }
    } else {
      await withTransaction(async (tx) => {
        const existing = await tx.getFirstAsync(
          "SELECT id FROM wallets WHERE id = ?",
          walletId
        );
        
        if (existing) {
          // Update existing wallet
          await tx.runAsync(
            "UPDATE wallets SET name=?, amountBase=?, currencyCode=?, updatedAt=? WHERE id=?",
            wallet.name,
            wallet.amountBase,
            wallet.currencyCode,
            now,
            walletId
          );
        } else {
          // Insert new wallet
          await tx.runAsync(
            "INSERT INTO wallets (id, name, amountBase, currencyCode, updatedAt, createdAt) VALUES (?,?,?,?,?,?)",
            walletId,
            wallet.name || DEFAULT_WALLET_NAME,
            wallet.amountBase,
            wallet.currencyCode,
            now,
            now
          );
        }
      });
    }
    
    return walletId;
  } catch (error) {
    console.error("Error upserting wallet:", error);
    throw error;
  }
}

export async function updateBalance(
  amountDelta: number, // Positive for increase, negative for decrease
  currencyCode: string,
  db?: any
): Promise<void> {
  try {
    if (db) {
      const wallet = await getWallet(db);
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        await upsertWallet(
          {
            name: DEFAULT_WALLET_NAME,
            amountBase: Math.max(0, amountDelta), // Start with positive balance
            currencyCode,
          },
          db
        );
      } else {
        // Update existing wallet balance
        const newBalance = Math.max(0, wallet.amountBase + amountDelta);
        await db.runAsync(
          "UPDATE wallets SET amountBase=?, currencyCode=?, updatedAt=? WHERE id=?",
          newBalance,
          currencyCode,
          new Date().toISOString(),
          DEFAULT_WALLET_ID
        );
      }
    } else {
      await withTransaction(async (tx) => {
        const wallet = await getWallet(tx);
        
        if (!wallet) {
          // Create wallet if it doesn't exist
          await upsertWallet(
            {
              name: DEFAULT_WALLET_NAME,
              amountBase: Math.max(0, amountDelta), // Start with positive balance
              currencyCode,
            },
            tx
          );
        } else {
          // Update existing wallet balance
          const newBalance = Math.max(0, wallet.amountBase + amountDelta);
          await tx.runAsync(
            "UPDATE wallets SET amountBase=?, currencyCode=?, updatedAt=? WHERE id=?",
            newBalance,
            currencyCode,
            new Date().toISOString(),
            DEFAULT_WALLET_ID
          );
        }
      });
    }
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    throw error;
  }
}

export async function setBalance(
  amountBase: number,
  currencyCode: string,
  db?: any
): Promise<void> {
  try {
    await upsertWallet(
      {
        name: DEFAULT_WALLET_NAME,
        amountBase: Math.max(0, amountBase),
        currencyCode,
      },
      db
    );
  } catch (error) {
    console.error("Error setting wallet balance:", error);
    throw error;
  }
}

