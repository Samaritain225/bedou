import { View, ViewProps } from "react-native";

export function Card({
  className,
  style,
  ...rest
}: ViewProps & { className?: string }) {
  return (
    <View
      className={[
        "bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl",
        className as string,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      {...rest}
    />
  );
}
