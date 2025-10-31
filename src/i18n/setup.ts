import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./translations/fr.json";

const resources = {
  fr: { translation: fr },
};

if (!i18n.isInitialized) {
  (async () => {
    try {
      await i18n.use(initReactI18next).init({
        resources,
        lng: "fr", // Français par défaut
        fallbackLng: "fr",
        compatibilityJSON: "v4",
        interpolation: { escapeValue: false },
      });
    } catch (error) {
      console.error(error);
    }
  })();
}

// Optionnel: détecter la locale, mais rester en FR si non fr
const deviceLocales = getLocales();
const primary = deviceLocales[0]?.languageCode;
if (primary === "fr" && i18n.language !== "fr") {
  (async () => {
    try {
      await i18n.changeLanguage("fr");
    } catch (error) {
      console.error(error);
    }
  })();
}
