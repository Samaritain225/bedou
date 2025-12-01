/**
 * Get current month in YYYYMM format (e.g., "202401" for January 2024)
 */
export function getCurrentMonthYYYYMM(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

/**
 * Format Date to YYYYMM string
 */
export function dateToYYYYMM(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

/**
 * Parse YYYYMM string to Date (first day of month)
 */
export function yyyymmToDate(yyyymm: string): Date {
  const year = Number.parseInt(yyyymm.substring(0, 4), 10);
  const month = Number.parseInt(yyyymm.substring(4, 6), 10) - 1;
  return new Date(year, month, 1);
}
