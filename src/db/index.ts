import * as SQLite from "expo-sqlite";

type SQLiteDB = any;

let dbPromise: Promise<SQLiteDB> | null = null;

export async function getDb(): Promise<SQLiteDB> {
  if (!dbPromise) {
    if (SQLite.openDatabaseAsync) {
      dbPromise = SQLite.openDatabaseAsync("bedou.db");
    } else if (SQLite.openDatabase) {
      dbPromise = Promise.resolve(SQLite.openDatabase("bedou.db"));
    } else {
      throw new Error("expo-sqlite: no openDatabase API available");
    }
  }
  return dbPromise as Promise<SQLiteDB>;
}

// Refactored to accept SQLiteDatabase parameter (for SQLiteProvider onInit)
export async function initDatabase(db?: any): Promise<void> {
  try {
    const database = db || (await getDb());

    // PRAGMA statements must be executed outside of transactions
    // They need to run directly on the database connection
    await database.execAsync("PRAGMA journal_mode = WAL;");
    await database.execAsync("PRAGMA foreign_keys = ON;");

    // Schema creation, version check, and seeding can run in a transaction
    await database.withExclusiveTransactionAsync(async (tx: any) => {
      await execSchema(tx);
      const currentVersion = await getMeta(tx, "db_version");
      const currentNum = currentVersion ? Number(currentVersion) : 0;
      
      // Run migrations if needed
      if (currentNum < 2) {
        await migrateToV2(tx);
      }
      if (currentNum < 3) {
        await migrateToV3(tx);
      }
      if (currentNum < 4) {
        await migrateToV4(tx);
      }
      
      const finalVersion = Math.max(3, currentNum < 4 ? 4 : currentNum);
      await ensureVersion(tx, finalVersion);
      await seedDefaults(tx);
    });

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error; // Re-throw to let SQLiteProvider handle it
  }
}

export function generateUuid(): string {
  const g: any = globalThis as any;
  if (g?.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  // Fallback RFC4122 v4-ish
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replaceAll(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function execSchema(dbOrTxn: any) {
  // Note: PRAGMA statements are executed in initDatabase() before transaction
  // Only schema creation runs here
  const schema = await loadSchema();
  await dbOrTxn.execAsync(schema);
}

async function loadSchema(): Promise<string> {
  // Static import not supported for .sql, keeping inline fallback
  // Kept in sync with src/db/schema.sql
  return `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS currencies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  symbol TEXT NOT NULL,
  rateToBase REAL NOT NULL,
  isBase INTEGER NOT NULL DEFAULT 0,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense','income'))
);
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  categoryId TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  monthYYYYMM TEXT NOT NULL,
  amountBase INTEGER NOT NULL,
  UNIQUE(categoryId, monthYYYYMM)
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  dateISO TEXT NOT NULL,
  amountOriginal INTEGER NOT NULL,
  currencyCode TEXT NOT NULL,
  amountBase INTEGER NOT NULL,
  categoryId TEXT REFERENCES categories(id),
  note TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense','income')),
  tagsJSON TEXT,
  paymentMethod TEXT
);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(dateISO);
CREATE INDEX IF NOT EXISTS idx_txn_cat ON transactions(categoryId);
CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amountBase INTEGER NOT NULL,
  currencyCode TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS planned_purchases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amountBase INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high','medium','low')),
  categoryId TEXT REFERENCES categories(id),
  note TEXT,
  isPurchased INTEGER NOT NULL DEFAULT 0,
  purchasedAt TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pp_priority ON planned_purchases(priority);
CREATE INDEX IF NOT EXISTS idx_pp_purchased ON planned_purchases(isPurchased);
CREATE INDEX IF NOT EXISTS idx_pp_cat ON planned_purchases(categoryId);
CREATE TABLE IF NOT EXISTS recurring_bills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amountBase INTEGER NOT NULL,
  currencyCode TEXT NOT NULL,
  categoryId TEXT REFERENCES categories(id),
  paymentMethod TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  nextDueDate TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rb_active ON recurring_bills(isActive);
CREATE INDEX IF NOT EXISTS idx_rb_due_date ON recurring_bills(nextDueDate);
CREATE INDEX IF NOT EXISTS idx_rb_category ON recurring_bills(categoryId);
`;
}

async function ensureVersion(tx: any, required: number) {
  const current = await getMeta(tx, "db_version");
  const currentNum = current ? Number(current) : 0;
  if (currentNum < required) {
    await setMeta(tx, "db_version", String(required));
  }
}

async function migrateToV2(tx: any) {
  // Migration to version 2: Add wallets and planned_purchases tables
  try {
    await tx.execAsync(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amountBase INTEGER NOT NULL,
        currencyCode TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS planned_purchases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amountBase INTEGER NOT NULL,
        priority TEXT NOT NULL CHECK (priority IN ('high','medium','low')),
        categoryId TEXT REFERENCES categories(id),
        note TEXT,
        isPurchased INTEGER NOT NULL DEFAULT 0,
        purchasedAt TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pp_priority ON planned_purchases(priority);
      CREATE INDEX IF NOT EXISTS idx_pp_purchased ON planned_purchases(isPurchased);
      CREATE INDEX IF NOT EXISTS idx_pp_cat ON planned_purchases(categoryId);
    `);
  } catch (error) {
    console.error("Error during migration to v2:", error);
    throw error;
  }
}

async function migrateToV3(tx: any) {
  // Migration to version 3: Add paymentMethod to transactions and create monthly_budgets table
  try {
    // Add paymentMethod column to transactions table (if not exists)
    try {
      await tx.execAsync("ALTER TABLE transactions ADD COLUMN paymentMethod TEXT");
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error?.message?.includes("duplicate column")) {
        console.warn("Note: paymentMethod column may already exist:", error);
      }
    }

    // Create monthly_budgets table
    await tx.execAsync(`
      CREATE TABLE IF NOT EXISTS monthly_budgets (
        id TEXT PRIMARY KEY,
        monthYYYYMM TEXT NOT NULL UNIQUE,
        amountBase INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error("Error during migration to v3:", error);
    throw error;
  }
}

async function migrateToV4(tx: any) {
  // Migration to version 4: Create recurring_bills table
  try {
    await tx.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amountBase INTEGER NOT NULL,
        currencyCode TEXT NOT NULL,
        categoryId TEXT REFERENCES categories(id),
        paymentMethod TEXT,
        frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
        nextDueDate TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        note TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_rb_active ON recurring_bills(isActive);
      CREATE INDEX IF NOT EXISTS idx_rb_due_date ON recurring_bills(nextDueDate);
      CREATE INDEX IF NOT EXISTS idx_rb_category ON recurring_bills(categoryId);
    `);
  } catch (error) {
    console.error("Error during migration to v4:", error);
    throw error;
  }
}

async function seedDefaults(tx: any) {
  // Seed base currency XOF (FCFA) if none exists
  const curCount = await single(tx, "SELECT COUNT(1) as c FROM currencies");
  if (curCount?.c === 0 || curCount === 0) {
    const now = new Date().toISOString();
    await tx.runAsync(
      "INSERT INTO currencies (id, code, label, symbol, rateToBase, isBase, updatedAt) VALUES (?,?,?,?,?,?,?)",
      generateUuid(),
      "XOF",
      "Franc CFA",
      "F CFA",
      1,
      1,
      now
    );
  }

  // Seed default categories (add missing ones)
  const defaults: Array<[string, string, string, "expense" | "income"]> = [
    ["Alimentation", "#FF7043", "cart", "expense"],
    ["Transport", "#42A5F5", "car", "expense"],
    ["Mobile", "#EC407A", "phone-portrait", "expense"],
    ["Clothes", "#AB47BC", "shirt", "expense"],
    ["Salaire", "#66BB6A", "wallet", "income"],
  ];
  for (const [name, color, icon, type] of defaults) {
    const existing = await single(
      tx,
      "SELECT id FROM categories WHERE name = ?",
      name
    );
    if (!existing) {
      await tx.runAsync(
        "INSERT INTO categories (id, name, color, icon, type) VALUES (?,?,?,?,?)",
        generateUuid(),
        name,
        color,
        icon,
        type
      );
    }
  }
}

export async function withTransaction<T = void>(
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const db = await getDb();
  // Prefer withExclusiveTransactionAsync which provides a txn object parameter
  if (db.withExclusiveTransactionAsync) {
    return await db.withExclusiveTransactionAsync(async (tx: any) => {
      return await fn(tx);
    });
  }
  // Fallback: withTransactionAsync wraps queries on db itself (no txn param)
  if (db.withTransactionAsync) {
    return await db.withTransactionAsync(async () => {
      // Pass db as the "transaction" object since all queries will be wrapped
      return await fn(db);
    });
  }
  // Legacy fallback using callback API
  return await new Promise<T>((resolve, reject) => {
    try {
      db.transaction(
        (tx: any) => {
          const txShim = {
            executeSqlAsync: (sql: string, args: any[] = []) =>
              new Promise((res, rej) =>
                tx.executeSql(
                  sql,
                  args,
                  (_t: any, result: any) => res(result),
                  (_t: any, err: any) => rej(err)
                )
              ),
            // Emulate modern helpers on legacy transaction
            execAsync: async (sqlBatch: string) => {
              const statements = sqlBatch
                .split(";\n")
                .flatMap((s) => s.split(";"))
                .map((s) => s.trim())
                .filter(Boolean);
              for (const stmt of statements) {
                // ignore PRAGMA without params handling here; fine for our schema
                // eslint-disable-next-line no-await-in-loop
                await new Promise((res, rej) =>
                  tx.executeSql(
                    stmt,
                    [],
                    () => res(null),
                    (_t: any, err: any) => rej(err)
                  )
                );
              }
            },
            runAsync: (sql: string, ...args: any[]) =>
              new Promise((res, rej) =>
                tx.executeSql(
                  sql,
                  args,
                  (_t: any, result: any) =>
                    res({
                      lastInsertRowId: result.insertId,
                      changes: result.rowsAffected,
                    }),
                  (_t: any, err: any) => rej(err)
                )
              ),
            getFirstAsync: (sql: string, ...args: any[]) =>
              new Promise((res, rej) =>
                tx.executeSql(
                  sql,
                  args,
                  (_t: any, result: any) => {
                    const rows = result.rows;
                    // RN SQLite has ._array and .item()
                    const first =
                      rows?._array?.[0] ??
                      (rows && rows.length > 0 ? rows.item(0) : undefined);
                    res(first);
                  },
                  (_t: any, err: any) => rej(err)
                )
              ),
            getAllAsync: (sql: string, ...args: any[]) =>
              new Promise((res, rej) =>
                tx.executeSql(
                  sql,
                  args,
                  (_t: any, result: any) => {
                    const rows = result.rows;
                    const arr =
                      rows?._array ??
                      Array.from({ length: rows.length }, (_, i) =>
                        rows.item(i)
                      );
                    res(arr);
                  },
                  (_t: any, err: any) => rej(err)
                )
              ),
          };
          Promise.resolve(fn(txShim)).then(resolve).catch(reject);
        },
        (err: any) => reject(err)
      );
    } catch (e) {
      reject(e);
    }
  });
}

async function getMeta(dbOrTxn: any, key: string): Promise<string | null> {
  const row = await dbOrTxn.getFirstAsync(
    "SELECT value FROM meta WHERE key = ?",
    key
  );
  return row ? String(row.value) : null;
}

async function setMeta(
  dbOrTxn: any,
  key: string,
  value: string
): Promise<void> {
  await dbOrTxn.runAsync(
    "INSERT OR REPLACE INTO meta (key, value) VALUES (?,?)",
    key,
    value
  );
}

async function single(dbOrTxn: any, sql: string, ...args: any[]): Promise<any> {
  const row = await dbOrTxn.getFirstAsync(sql, ...args);
  return row;
}
