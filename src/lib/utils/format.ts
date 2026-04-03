/**
 * Format a number with commas — deterministic across server and client.
 * Avoids .toLocaleString() which causes React hydration mismatches.
 */
export function formatNumber(n: number): string {
  const str = Math.round(n).toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a currency amount like $49,995 */
export function formatPrice(n: number): string {
  return `$${formatNumber(n)}`;
}
