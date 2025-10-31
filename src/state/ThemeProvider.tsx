import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

type ColorScheme = "light" | "dark";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  toggleColorScheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "@bedou_theme_scheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    (systemColorScheme ?? "light") as ColorScheme
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved: string | null) => {
        if (saved && (saved === "light" || saved === "dark")) {
          setColorSchemeState(saved as ColorScheme);
        }
      })
      .catch((error: unknown) => {
        console.error("Error loading theme preference:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  }, []);

  const toggleColorScheme = useCallback(async () => {
    const newScheme = colorScheme === "light" ? "dark" : "light";
    await setColorScheme(newScheme);
  }, [colorScheme, setColorScheme]);

  const value: ThemeContextValue = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      toggleColorScheme,
    }),
    [colorScheme, setColorScheme, toggleColorScheme]
  );

  // Render with default theme during loading to avoid blocking navigation
  const loadingValue: ThemeContextValue = useMemo(
    () => ({
      colorScheme: (systemColorScheme ?? "light") as ColorScheme,
      setColorScheme: async () => {
        // No-op during loading
      },
      toggleColorScheme: async () => {
        // No-op during loading
      },
    }),
    [systemColorScheme]
  );

  const contextValue = isLoading ? loadingValue : value;

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
