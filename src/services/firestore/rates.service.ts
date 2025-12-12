import firestore from "@react-native-firebase/firestore";

export interface CachedRates {
  base_code: string;
  rates: Record<string, number>;
  timestamp: number; // Unix timestamp
  updatedAt: string; // ISO string for readability/debugging
}

export const createRatesService = (userId: string) => {
  const collectionRef = firestore()
    .collection("users")
    .doc(userId)
    .collection("rates");

  const docRef = collectionRef.doc("latest");

  return {
    async getLatestRates(): Promise<CachedRates | null> {
      try {
        const snapshot = await docRef.get();
        if (snapshot.exists()) {
          return snapshot.data() as CachedRates;
        }
        return null;
      } catch (error) {
        console.error("RatesService getLatestRates Error:", error);
        return null;
      }
    },

    async saveRates(data: CachedRates): Promise<void> {
      try {
        await docRef.set(data);
      } catch (error) {
        console.error("RatesService saveRates Error:", error);
        throw error;
      }
    },
  };
};
