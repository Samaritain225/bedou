/**
 * Utility functions for form handling
 */

/**
 * Validates and sanitizes amount input
 * Allows only numbers and a single decimal point
 */
export function handleAmountChange(
  text: string,
  onChange: (text: string) => void,
  clearError?: () => void
): void {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 2) {
    onChange(cleaned);
  }
  if (clearError) {
    clearError();
  }
}

