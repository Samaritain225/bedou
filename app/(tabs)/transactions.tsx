import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function TransactionsScreen() {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600" }}>
        {t("transactions.title")}
      </Text>
      <Text style={{ marginTop: 8, color: "#666" }}>
        {t("transactions.empty")}
      </Text>
    </View>
  );
}
