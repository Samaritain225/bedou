import { ComponentProps } from "react";
import { Pressable, Text } from "react-native";

type Props = ComponentProps<typeof Pressable> & {
  title: string;
  variant?: "primary" | "danger" | "success";
};

export function Button({
  title,
  variant = "primary",
  className,
  ...rest
}: Props) {
  const bg =
    variant === "primary"
      ? "bg-primary dark:bg-primary-dark active:bg-primary-hover dark:active:bg-primary-hover-dark"
      : variant === "danger"
      ? "bg-danger dark:bg-danger-dark"
      : "bg-success dark:bg-success-dark";
  return (
    <Pressable
      className={["px-4 py-2 rounded-md", bg, className as string]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <Text className="text-white font-medium">{title}</Text>
    </Pressable>
  );
}
