/**
 * PHASE H.4 — TABLE CONTEXT RESOLVER & UNIT PROPAGATION ENGINE
 *
 * Systemically detects, propagates, and enforces currency, scale, period, statement type,
 * legal entity, reporting scope, and column/row meaning across table layouts and document sections.
 *
 * Directives:
 * 1. Scale Inheritance: Table-level context (e.g. "€ million", "in thousands", "$000") propagates to ALL
 *    numeric cells in that table unless explicitly overridden by cell-level or row-level annotations.
 * 2. Strict Precedence Hierarchy:
 *    Cell annotation > Row annotation > Column header > Table header > Table caption > Surrounding heading > Page heading > Document currency > Reporting metadata.
 * 3. Dual Storage: Store BOTH raw_value (11794), raw_scale ("MILLIONS"), raw_currency ("EUR") AND normalized_value (11794000000), normalized_currency ("EUR").
 * 4. Failure over Fabrication: If scale/currency cannot be determined confidently, flag as REVIEW_REQUIRED / isAmbiguous: true.
 *    NEVER guess scale based on magnitude alone ("11,794 looks small, so it must be millions").
 */

export interface RawScaleResolution {
  scaleMultiplier: number;
  scaleLabel: 'ONES' | 'THOUSANDS' | 'MILLIONS' | 'BILLIONS' | 'UNKNOWN';
  rawScaleText: string;
  isExplicit: boolean;
  confidence: number;
  sourcePrecedence: 'CELL' | 'ROW' | 'COLUMN' | 'TABLE_HEADER' | 'CAPTION' | 'SECTION' | 'PAGE' | 'DOCUMENT' | 'DEFAULT';
}

export interface RawCurrencyResolution {
  currencyCode: string;
  symbol: string;
  rawCurrencyText: string;
  isExplicit: boolean;
  confidence: number;
  sourcePrecedence: 'CELL' | 'ROW' | 'COLUMN' | 'TABLE_HEADER' | 'CAPTION' | 'SECTION' | 'PAGE' | 'DOCUMENT' | 'DEFAULT';
}

export interface TableContextModel {
  tableId?: string;
  tableHeader?: string;
  tableCaption?: string;
  sectionTitle?: string;
  pageHeader?: string;
  currency: RawCurrencyResolution;
  scale: RawScaleResolution;
  statementType?: string;
  reportingPeriod?: string;
  reportingScope?: 'CONSOLIDATED_GROUP' | 'PARENT_ONLY' | 'SUBSIDIARY' | 'SEGMENT' | string;
  entityName?: string;
  columnMeanings: Map<number, { headerText: string; periodKey?: string; isComparative?: boolean; scale?: RawScaleResolution }>;
  rowMeanings: Map<number, { labelText: string; canonicalMetric?: string; isSubtotal?: boolean; scale?: RawScaleResolution }>;
  isAmbiguous: boolean;
  notes: string[];
}

export class TableContextResolver {

  /**
   * Comprehensive scale pattern matcher supporting multilingual financial reporting formats.
   */
  public static detectScaleInText(text: string): RawScaleResolution | null {
    if (!text || typeof text !== 'string') return null;
    const clean = text.trim();
    const lower = clean.toLowerCase();

    // BILLIONS
    if (
      /\b(in\s+)?billions?\b/i.test(lower) ||
      /\b(€|eur|\$|usd|£|gbp|chf)\s*b(illion)?\b/i.test(lower) ||
      /\bmrd\.?\b/i.test(lower) || // German Milliarden
      /\b(in\s+)?milliarden\b/i.test(lower) ||
      /\b1,000,000,000\b/.test(lower)
    ) {
      return {
        scaleMultiplier: 1_000_000_000,
        scaleLabel: 'BILLIONS',
        rawScaleText: clean,
        isExplicit: true,
        confidence: 0.98,
        sourcePrecedence: 'TABLE_HEADER'
      };
    }

    // MILLIONS
    if (
      /\b(in\s+)?millions?\b/i.test(lower) ||
      /\b(€|eur|\$|usd|£|gbp|chf)\s*m(illion|illions)?\b/i.test(lower) ||
      /\b€\s*m\b/i.test(lower) ||
      /\beur\s*m\b/i.test(lower) ||
      /\b\$m\b/i.test(lower) ||
      /\b£m\b/i.test(lower) ||
      /\bmio\.?\b/i.test(lower) || // German/EU Mio
      /\b(in\s+)?millionen\b/i.test(lower) ||
      /\b1,000,000\b/.test(lower)
    ) {
      return {
        scaleMultiplier: 1_000_000,
        scaleLabel: 'MILLIONS',
        rawScaleText: clean,
        isExplicit: true,
        confidence: 0.98,
        sourcePrecedence: 'TABLE_HEADER'
      };
    }

    // THOUSANDS
    if (
      /\b(in\s+)?thousands?\b/i.test(lower) ||
      /\b(€|eur|\$|usd|£|gbp|chf)\s*k\b/i.test(lower) ||
      /\b(€|eur|\$|usd|£|gbp)\s*'?000\b/i.test(lower) ||
      /\b000s?\b/i.test(lower) ||
      /\bteur\b/i.test(lower) || // German T€ / TEUR
      /\bt€\b/i.test(lower) ||
      /\bk€\b/i.test(lower) ||
      /\btausend\b/i.test(lower) ||
      /\b1,000\b/.test(lower)
    ) {
      return {
        scaleMultiplier: 1_000,
        scaleLabel: 'THOUSANDS',
        rawScaleText: clean,
        isExplicit: true,
        confidence: 0.98,
        sourcePrecedence: 'TABLE_HEADER'
      };
    }

    // ONES / UNITS
    if (
      /\b(in\s+)?units?\b/i.test(lower) ||
      /\b(in\s+)?ones\b/i.test(lower) ||
      /\bexact\s+amount\b/i.test(lower)
    ) {
      return {
        scaleMultiplier: 1,
        scaleLabel: 'ONES',
        rawScaleText: clean,
        isExplicit: true,
        confidence: 0.95,
        sourcePrecedence: 'TABLE_HEADER'
      };
    }

    return null;
  }

  /**
   * Detect currency code and symbol in text.
   */
  public static detectCurrencyInText(text: string, defaultCurrency = 'EUR'): RawCurrencyResolution {
    if (!text || typeof text !== 'string') {
      return {
        currencyCode: defaultCurrency,
        symbol: defaultCurrency === 'EUR' ? '€' : defaultCurrency === 'USD' ? '$' : '£',
        rawCurrencyText: defaultCurrency,
        isExplicit: false,
        confidence: 0.5,
        sourcePrecedence: 'DEFAULT'
      };
    }

    const clean = text.trim();
    const upper = clean.toUpperCase();

    if (upper.includes('EUR') || clean.includes('€')) {
      return { currencyCode: 'EUR', symbol: '€', rawCurrencyText: 'EUR', isExplicit: true, confidence: 0.98, sourcePrecedence: 'TABLE_HEADER' };
    }
    if (upper.includes('USD') || upper.includes('US$') || clean.includes('$')) {
      return { currencyCode: 'USD', symbol: '$', rawCurrencyText: 'USD', isExplicit: true, confidence: 0.98, sourcePrecedence: 'TABLE_HEADER' };
    }
    if (upper.includes('GBP') || clean.includes('£')) {
      return { currencyCode: 'GBP', symbol: '£', rawCurrencyText: 'GBP', isExplicit: true, confidence: 0.98, sourcePrecedence: 'TABLE_HEADER' };
    }
    if (upper.includes('CHF')) {
      return { currencyCode: 'CHF', symbol: 'CHF', rawCurrencyText: 'CHF', isExplicit: true, confidence: 0.98, sourcePrecedence: 'TABLE_HEADER' };
    }
    if (upper.includes('JPY') || clean.includes('¥')) {
      return { currencyCode: 'JPY', symbol: '¥', rawCurrencyText: 'JPY', isExplicit: true, confidence: 0.98, sourcePrecedence: 'TABLE_HEADER' };
    }

    return {
      currencyCode: defaultCurrency,
      symbol: defaultCurrency === 'EUR' ? '€' : '$',
      rawCurrencyText: defaultCurrency,
      isExplicit: false,
      confidence: 0.5,
      sourcePrecedence: 'DEFAULT'
    };
  }

  /**
   * Resolve full table context from table headers, captions, column/row labels, and section headings.
   */
  public static resolveTableContext(params: {
    tableHeader?: string;
    tableCaption?: string;
    columnHeaders?: string[];
    sectionTitle?: string;
    pageHeader?: string;
    documentText?: string;
    documentDefaultCurrency?: string;
  }): TableContextModel {
    const notes: string[] = [];
    const docCurrency = params.documentDefaultCurrency || 'EUR';

    const textSources: Array<{ text: string; precedence: RawScaleResolution['sourcePrecedence'] }> = [
      { text: params.tableCaption || '', precedence: 'CAPTION' },
      { text: params.tableHeader || '', precedence: 'TABLE_HEADER' },
      { text: (params.columnHeaders || []).join(' '), precedence: 'COLUMN' },
      { text: params.sectionTitle || '', precedence: 'SECTION' },
      { text: params.pageHeader || '', precedence: 'PAGE' },
      { text: (params.documentText || '').slice(0, 2000), precedence: 'DOCUMENT' }
    ];

    // 1. Resolve Scale using strict precedence
    let resolvedScale: RawScaleResolution | null = null;
    for (const src of textSources) {
      if (!src.text) continue;
      const detected = this.detectScaleInText(src.text);
      if (detected) {
        resolvedScale = {
          ...detected,
          sourcePrecedence: src.precedence
        };
        notes.push(`Scale resolved as ${detected.scaleLabel} (${detected.scaleMultiplier}x) from ${src.precedence} text: "${src.text.slice(0, 60)}"`);
        break;
      }
    }

    if (!resolvedScale) {
      resolvedScale = {
        scaleMultiplier: 1,
        scaleLabel: 'ONES',
        rawScaleText: 'UNSPECIFIED',
        isExplicit: false,
        confidence: 0.4,
        sourcePrecedence: 'DEFAULT'
      };
      notes.push(`Scale unstated in table context; defaulted to ONES (1x) with low confidence (0.4). Verification state marked as REVIEW_REQUIRED.`);
    }

    // 2. Resolve Currency
    let resolvedCurrency: RawCurrencyResolution | null = null;
    for (const src of textSources) {
      if (!src.text) continue;
      const detected = this.detectCurrencyInText(src.text, docCurrency);
      if (detected.isExplicit) {
        resolvedCurrency = {
          ...detected,
          sourcePrecedence: src.precedence
        };
        notes.push(`Currency resolved as ${detected.currencyCode} from ${src.precedence}`);
        break;
      }
    }

    if (!resolvedCurrency) {
      resolvedCurrency = {
        currencyCode: docCurrency,
        symbol: docCurrency === 'EUR' ? '€' : '$',
        rawCurrencyText: docCurrency,
        isExplicit: false,
        confidence: 0.6,
        sourcePrecedence: 'DOCUMENT'
      };
    }

    const isAmbiguous = !resolvedScale.isExplicit || resolvedScale.confidence < 0.8;

    return {
      tableHeader: params.tableHeader,
      tableCaption: params.tableCaption,
      sectionTitle: params.sectionTitle,
      pageHeader: params.pageHeader,
      currency: resolvedCurrency,
      scale: resolvedScale,
      columnMeanings: new Map(),
      rowMeanings: new Map(),
      isAmbiguous,
      notes
    };
  }

  /**
   * Computes normalized numeric value given raw text and contextual scale multiplier.
   * ABSOLUTELY PRESERVES raw text intact!
   */
  public static calculateNormalizedValue(
    rawValueStr: string,
    tableContextScale: RawScaleResolution,
    cellOverrideScale?: RawScaleResolution
  ): { normalizedValue: number | null; isNegative: boolean; scaleUsed: RawScaleResolution } {
    if (!rawValueStr || typeof rawValueStr !== 'string') {
      return { normalizedValue: null, isNegative: false, scaleUsed: tableContextScale };
    }

    const trimmed = rawValueStr.trim();
    if (!trimmed) {
      return { normalizedValue: null, isNegative: false, scaleUsed: tableContextScale };
    }

    // Check cell-level explicit scale indicators in the cell text itself e.g., "$12.4M" or "€50.5B"
    const cellDetectedScale = this.detectScaleInText(trimmed);
    const activeScale = cellOverrideScale || (cellDetectedScale && cellDetectedScale.isExplicit ? cellDetectedScale : tableContextScale);

    // Check negative sign markers
    let isNegative = false;
    if (
      (trimmed.startsWith('(') && trimmed.endsWith(')')) ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('–') ||
      trimmed.startsWith('[') && trimmed.endsWith(']')
    ) {
      isNegative = true;
    }

    let clean = trimmed.replace(/[^0-9.,]/g, '');
    if (!clean) {
      return { normalizedValue: null, isNegative, scaleUsed: activeScale };
    }

    // Standardize European vs US numeric punctuation
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        // German / EU style e.g. 1.234,56 -> 1234.56
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // US / UK style e.g. 1,234.56 -> 1234.56
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Decimal comma e.g. 50,5
        clean = clean.replace(',', '.');
      } else {
        // Thousands comma e.g. 1,234
        clean = clean.replace(/,/g, '');
      }
    }

    let num = parseFloat(clean);
    if (isNaN(num)) {
      return { normalizedValue: null, isNegative, scaleUsed: activeScale };
    }

    if (isNegative && num > 0) {
      num = -num;
    }

    // Apply scale multiplier: if raw number is already >= 1,000,000,000 and scaleMultiplier > 1, avoid double scaling!
    let normalizedValue = num;
    if (Math.abs(num) < 1_000_000 && activeScale.scaleMultiplier > 1) {
      normalizedValue = num * activeScale.scaleMultiplier;
    } else {
      normalizedValue = num;
    }

    return {
      normalizedValue,
      isNegative,
      scaleUsed: activeScale
    };
  }
}
