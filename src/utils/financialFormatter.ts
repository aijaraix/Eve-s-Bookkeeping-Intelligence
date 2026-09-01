/**
 * PHASE H.4 — CANONICAL FINANCIAL DISPLAY FORMATTER
 *
 * Single, unified display formatter for all UI layers (tables, metrics, cards, summaries).
 *
 * Directives:
 * 1. Read ONLY normalizedValue / valueFunctional for display calculations.
 * 2. Format with exact raw currency symbol and explicit scale suffix e.g. "€11,794.00M (€11,794,000,000)".
 * 3. Never render raw scaled numbers as unscaled full monetary amounts without scale suffix!
 * 4. Return "—" or "REVIEW REQUIRED" when value is null, missing, or ambiguous.
 */

export interface FormatOptions {
  currency?: string;
  scaleLabel?: 'ONES' | 'THOUSANDS' | 'MILLIONS' | 'BILLIONS' | string;
  isPercentage?: boolean;
  decimals?: number;
  showFullUnscaled?: boolean;
}

export class FinancialFormatter {

  private static getCurrencySymbol(code?: string): string {
    if (!code) return '€';
    const clean = code.trim().toUpperCase();
    switch (clean) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'CHF': return 'CHF ';
      case 'JPY': return '¥';
      default: return `${clean} `;
    }
  }

  /**
   * Formats a monetary or ratio value canonically.
   */
  public static format(
    val: number | null | undefined,
    opts: FormatOptions = {}
  ): string {
    if (val === null || val === undefined || isNaN(val)) {
      return '—';
    }

    const currencySymbol = this.getCurrencySymbol(opts.currency || 'EUR');
    const decimals = opts.decimals ?? 2;

    if (opts.isPercentage) {
      return `${val.toFixed(decimals)}%`;
    }

    const scale = opts.scaleLabel || 'ONES';
    let scaledVal = val;
    let scaleSuffix = '';

    if (scale === 'MILLIONS' && Math.abs(val) >= 1_000_000) {
      scaledVal = val / 1_000_000;
      scaleSuffix = 'M';
    } else if (scale === 'THOUSANDS' && Math.abs(val) >= 1_000) {
      scaledVal = val / 1_000;
      scaleSuffix = 'k';
    } else if (scale === 'BILLIONS' && Math.abs(val) >= 1_000_000_000) {
      scaledVal = val / 1_000_000_000;
      scaleSuffix = 'B';
    }

    const formattedScaled = scaledVal.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    if (scaleSuffix && opts.showFullUnscaled !== false) {
      const fullFormatted = val.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `${currencySymbol}${formattedScaled}${scaleSuffix} (${currencySymbol}${fullFormatted})`;
    }

    return `${currencySymbol}${formattedScaled}${scaleSuffix}`;
  }
}
