import { useSQLiteContext } from "expo-sqlite";

/**
 * Hook wrapper around useSQLiteContext for cleaner abstraction
 * Provides type-safe database access within SQLiteProvider
 *
 * @throws Error if called outside SQLiteProvider
 */
export function useDb() {
  try {
    return useSQLiteContext();
  } catch (error) {
    console.error("useDb() called outside SQLiteProvider:", error);
    throw new Error(
      "Database not available. Make sure component is inside SQLiteProvider."
    );
  }
}
