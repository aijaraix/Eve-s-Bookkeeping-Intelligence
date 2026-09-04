export function formatCurrency(
  val: number | null | undefined,
  currency = 'USD',
  scale: 'units' | 'thousands' | 'millions' | 'billions' = 'millions',
  decimals = 1
): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CHF: 'CHF ',
  };

  const sym = symbolMap[currency] || `${currency} `;
  const absVal = Math.abs(val);

  let formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (val < 0) {
    return `(${sym}${formatted})`;
  }
  return `${sym}${formatted}`;
}

export function formatPercent(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}

export function formatNumber(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
