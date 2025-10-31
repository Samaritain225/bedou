import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function AddScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center p-4 bg-background dark:bg-background-dark">
      <Text className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
        {t("add.title")}
      </Text>
      <Text className="mt-2 text-text-secondary dark:text-text-secondary-dark">
        {t("add.subtitle")}
      </Text>
    </View>
  );
}
