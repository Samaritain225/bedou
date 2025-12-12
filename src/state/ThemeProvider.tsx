import type { ThemeColors as ThemeColorsType } from "@/src/constants/themeColors";
import { ThemeColors } from "@/src/constants/themeColors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, useColorScheme as useRNColorScheme } from "react-native";

type ColorScheme = "light" | "dark";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  colors: ThemeColorsType;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  toggleColorScheme: () => Promise<void>;
  fadeAnim: Animated.Value;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "@bedou_theme_scheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    (systemColorScheme ?? "light") as ColorScheme
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0.7,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // Change theme
      setColorSchemeState(scheme);
      
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  }, [fadeAnim]);

  const toggleColorScheme = useCallback(async () => {
    const newScheme = colorScheme === "light" ? "dark" : "light";
    await setColorScheme(newScheme);
  }, [colorScheme, setColorScheme]);

  const colors = useMemo(() => ThemeColors[colorScheme], [colorScheme]);

  const value: ThemeContextValue = useMemo(
    () => ({
      colorScheme,
      colors,
      setColorScheme,
      toggleColorScheme,
      fadeAnim,
    }),
    [colorScheme, colors, setColorScheme, toggleColorScheme, fadeAnim]
  );

  // Render with default theme during loading to avoid blocking navigation
  const defaultScheme = (systemColorScheme ?? "light") as ColorScheme;
  const loadingValue: ThemeContextValue = useMemo(
    () => ({
      colorScheme: defaultScheme,
      colors: ThemeColors[defaultScheme],
      setColorScheme: async () => {
        // No-op during loading
      },
      toggleColorScheme: async () => {
        // No-op during loading
      },
      fadeAnim,
    }),
    [defaultScheme, fadeAnim]
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
