import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import fr from "./translations/fr.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

// Detect device language
const deviceLocales = getLocales();
const deviceLanguage = deviceLocales[0]?.languageCode || "en";
// Support English and French, default to English for unsupported languages
const supportedLanguages = ["en", "fr"];
const detectedLanguage = supportedLanguages.includes(deviceLanguage)
  ? deviceLanguage
  : "en";

if (!i18n.isInitialized) {
  (async () => {
    try {
      await i18n.use(initReactI18next).init({
        resources,
        lng: detectedLanguage,
        fallbackLng: "en",
        compatibilityJSON: "v4",
        interpolation: { escapeValue: false },
      });
    } catch (error) {
      console.error("Error initializing i18n:", error);
    }
  })();
}
