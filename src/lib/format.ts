/** Formats a score to one decimal place. */
export function formatScore(value: number): string {
  return value.toFixed(1);
}

/** Formats a 0..1 ratio as a percentage string. */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Formats an integer count with locale grouping. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('en').format(value);
}

/** Shortens a hash for display, e.g. 8 leading characters. */
export function shortHash(hash: string, length = 8): string {
  return hash.slice(0, length);
}
