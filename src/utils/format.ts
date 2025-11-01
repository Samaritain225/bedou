/**
 * Format amount stored in database (base units, multiplied by 100)
 * Converts from base units to display amount and formats it
 */
export function formatAmountFromBase(
  amountBase: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number; locale?: string } = {}
): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2, locale = "en-US" } = options;
  const amount = amountBase / 100; // Convert from base units to display amount
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format amount (assumes amount is already in final format, not base units)
 * Used for currency formatting with locale support
 */
export function formatAmount(
  amountInBase: number,
  options: { currencyCode?: string; symbol?: string; locale?: string } = {}
) {
  const { currencyCode, symbol, locale = "fr-FR" } = options;
  // amounts are stored as integers (minor units) or base units? We used integers for DB amounts.
  const value = amountInBase / 1; // keep as is (assumed base units integer). Adapt if using cents.
  if (currencyCode && isIsoCurrency(currencyCode)) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
      }).format(value);
    } catch {
      // fallback to symbol
    }
  }
  const displaySymbol = symbol ?? currencyCode ?? "";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    value
  )} ${displaySymbol}`.trim();
}

function isIsoCurrency(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}
