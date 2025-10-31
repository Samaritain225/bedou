import { Text, TextProps } from "react-native";
import { formatAmount } from "../../utils/format";

type Props = TextProps & {
  amountBase: number;
  currencyCode?: string;
  symbol?: string;
  tone?: "default" | "success" | "danger";
};

export function AmountText({
  amountBase,
  currencyCode,
  symbol,
  tone = "default",
  className,
  ...rest
}: Props) {
  const formatted = formatAmount(amountBase, { currencyCode, symbol });
  const toneClass =
    tone === "success"
      ? "text-success dark:text-success-dark"
      : tone === "danger"
      ? "text-danger dark:text-danger-dark"
      : "text-text-primary dark:text-text-primary-dark";
  return (
    <Text
      className={[toneClass, className as string].filter(Boolean).join(" ")}
      {...rest}
    >
      {formatted}
    </Text>
  );
}
