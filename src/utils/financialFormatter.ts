export class FinancialFormatter {
  static format(
    val: number | null | undefined,
    options?: {
      currency?: string;
      scaleLabel?: string;
      decimals?: number;
    }
  ): string {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const currency = options?.currency || 'USD';
    const scale = (options?.scaleLabel || '').toLowerCase();
    const decimals = options?.decimals ?? 2;

    const symbolMap: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CHF: 'CHF '
    };
    const sym = symbolMap[currency] || (currency ? `${currency} ` : '');

    let scaledVal = val;
    let suffix = '';

    if (scale === 'billions' || scale === 'billion') {
      scaledVal = val / 1_000_000_000;
      suffix = 'B';
    } else if (scale === 'millions' || scale === 'million') {
      scaledVal = val / 1_000_000;
      suffix = 'M';
    } else if (scale === 'thousands' || scale === 'thousand') {
      scaledVal = val / 1_000;
      suffix = 'k';
    } else if (scale === 'ones' || scale === 'units') {
      scaledVal = val;
      suffix = '';
    } else if (!scale || scale === 'auto') {
      const abs = Math.abs(val);
      if (abs >= 1_000_000_000) {
        scaledVal = val / 1_000_000_000;
        suffix = 'B';
      } else if (abs >= 1_000_000) {
        scaledVal = val / 1_000_000;
        suffix = 'M';
      } else if (abs >= 1_000) {
        scaledVal = val / 1_000;
        suffix = 'k';
      }
    }

    const absVal = Math.abs(scaledVal);
    const formattedNum = absVal.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    let result = `${sym}${formattedNum}${suffix}`;
    if (val < 0) {
      result = `(${sym}${formattedNum}${suffix})`;
    }

    if (suffix && scaledVal !== val && options?.scaleLabel) {
      const baseAbs = Math.abs(val).toLocaleString('en-US');
      const baseFormatted = val < 0 ? `(${sym}${baseAbs})` : `${sym}${baseAbs}`;
      return `${result} (${baseFormatted})`;
    }

    return result;
  }
}

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

  const formatted = absVal.toLocaleString('en-US', {
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
