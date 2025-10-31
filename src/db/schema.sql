-- Version 1 schema
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

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
  tagsJSON TEXT
);

CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(dateISO);
CREATE INDEX IF NOT EXISTS idx_txn_cat ON transactions(categoryId);
CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);


