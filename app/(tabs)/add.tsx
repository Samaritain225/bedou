import { View } from "react-native";
import { AddExpenseForm } from "../../src/components/forms/AddExpenseForm";

export default function AddScreen() {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <AddExpenseForm />
    </View>
  );
}
