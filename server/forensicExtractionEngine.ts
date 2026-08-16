import {
  ExtractedFact,
  ReportingScopeType,
  PhaseH2VerificationState,
  PageClassificationType,
  PageDiagnostics,
  SixReliabilityLayersStatus
} from "../src/types.js";

/**
 * Filter out boilerplate legal, footer, or registration text from entity names.
 */
const BOILERPLATE_ENTITY_PATTERNS = [
  /register and published/i,
  /registered office/i,
  /commercial register/i,
  /all rights reserved/i,
  /page \d+ of/i,
  /court of registration/i,
  /district court/i,
  /handelsregister/i,
  /amtsgericht/i,
  /registergericht/i
];

export class ForensicEntityResolver {
  /**
   * Brand Root Dictionary mapping common file/text tokens to canonical corporate entity names.
   */
  public static readonly BRAND_ROOT_MAP: Record<string, { legalName: string; workspaceName: string; code: string; defaultCurrency: string }> = {
    unilever: { legalName: "Unilever PLC", workspaceName: "Unilever PLC", code: "UNA", defaultCurrency: "EUR" },
    vw: { legalName: "Volkswagen AG", workspaceName: "Volkswagen Group", code: "VOW", defaultCurrency: "EUR" },
    volkswagen: { legalName: "Volkswagen AG", workspaceName: "Volkswagen Group", code: "VOW", defaultCurrency: "EUR" },
    nestle: { legalName: "Nestlé S.A.", workspaceName: "Nestlé Group", code: "NESN", defaultCurrency: "CHF" },
    siemens: { legalName: "Siemens AG", workspaceName: "Siemens AG", code: "SIE", defaultCurrency: "EUR" },
    bmw: { legalName: "Bayerische Motoren Werke AG", workspaceName: "BMW Group", code: "BMW", defaultCurrency: "EUR" },
    apple: { legalName: "Apple Inc.", workspaceName: "Apple Inc.", code: "AAPL", defaultCurrency: "USD" },
    microsoft: { legalName: "Microsoft Corporation", workspaceName: "Microsoft Corporation", code: "MSFT", defaultCurrency: "USD" },
    amazon: { legalName: "Amazon.com, Inc.", workspaceName: "Amazon", code: "AMZN", defaultCurrency: "USD" },
    google: { legalName: "Alphabet Inc.", workspaceName: "Alphabet Inc.", code: "GOOGL", defaultCurrency: "USD" },
    alphabet: { legalName: "Alphabet Inc.", workspaceName: "Alphabet Inc.", code: "GOOGL", defaultCurrency: "USD" },
    meta: { legalName: "Meta Platforms, Inc.", workspaceName: "Meta Platforms", code: "META", defaultCurrency: "USD" },
    pfizer: { legalName: "Pfizer Inc.", workspaceName: "Pfizer Inc.", code: "PFE", defaultCurrency: "USD" },
    novartis: { legalName: "Novartis AG", workspaceName: "Novartis AG", code: "NOVN", defaultCurrency: "USD" },
    roche: { legalName: "Roche Holding AG", workspaceName: "Roche Group", code: "ROG", defaultCurrency: "CHF" },
    shell: { legalName: "Shell plc", workspaceName: "Shell Group", code: "SHEL", defaultCurrency: "USD" },
    bp: { legalName: "BP p.l.c.", workspaceName: "BP Group", code: "BP", defaultCurrency: "USD" },
    totalenergies: { legalName: "TotalEnergies SE", workspaceName: "TotalEnergies", code: "TTE", defaultCurrency: "EUR" },
    sony: { legalName: "Sony Group Corporation", workspaceName: "Sony Group", code: "SONY", defaultCurrency: "JPY" },
    toyota: { legalName: "Toyota Motor Corporation", workspaceName: "Toyota Motor", code: "TM", defaultCurrency: "JPY" }
  };

  /**
   * Deterministically resolves legal entity, brand root, and reporting scope from document text, headers, and filename.
   */
  public static resolveEntityAndScope(
    docTitle?: string,
    docContext?: string,
    fileName?: string,
    tableContext?: string
  ): {
    legalEntity: string;
    reportingEntity: string;
    parentEntity: string;
    workspaceEntity: string;
    reportingScope: ReportingScopeType;
    resolutionMethod: string;
  } {
    const textToScan = [
      docTitle,
      docContext,
      fileName,
      tableContext
    ].filter(Boolean).join(" ");

    const lower = textToScan.toLowerCase();

    // 1. Scope Determination
    let reportingScope: ReportingScopeType = "UNKNOWN";

    if (
      lower.includes("consolidated financial statements") ||
      lower.includes("group annual report") ||
      lower.includes("konzernabschluss") ||
      lower.includes("group financial statements") ||
      lower.includes("consolidated balance sheet") ||
      lower.includes("consolidated income statement") ||
      lower.includes("annual report and accounts") ||
      lower.includes("volkswagen group") ||
      lower.includes("unilever group")
    ) {
      reportingScope = "CONSOLIDATED_GROUP";
    } else if (
      lower.includes("standalone") ||
      lower.includes("parent company") ||
      lower.includes("jahresabschluss der volkswagen ag") ||
      lower.includes("volkswagen ag standalone") ||
      lower.includes("holding company") ||
      lower.includes("parent financial statements") ||
      lower.includes("ag standalone")
    ) {
      reportingScope = "PARENT_ONLY";
    } else if (lower.includes("subsidiary") || lower.includes("audi ag") || lower.includes("porsche ag")) {
      reportingScope = "SUBSIDIARY";
    } else if (lower.includes("segment") || lower.includes("passenger cars") || lower.includes("commercial vehicles") || lower.includes("beauty & wellbeing")) {
      reportingScope = "SEGMENT";
    } else {
      reportingScope = "CONSOLIDATED_GROUP";
    }

    // 2. Deterministic Brand Root Dictionary Matching
    for (const [key, meta] of Object.entries(this.BRAND_ROOT_MAP)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lower)) {
        const legalEntity = meta.legalName;
        const workspaceEntity = meta.workspaceName;
        const parentEntity = meta.legalName;
        const reportingEntity = reportingScope === "PARENT_ONLY" ? `${legalEntity} (Standalone)` : `${workspaceEntity} (Consolidated)`;
        return {
          legalEntity,
          reportingEntity,
          parentEntity,
          workspaceEntity,
          reportingScope,
          resolutionMethod: `DETERMINISTIC_BRAND_ROOT (${key.toUpperCase()})`
        };
      }
    }

    // 3. Dynamic Legal Entity Extraction via Regex
    const legalEntityPattern = /([A-Z][A-Za-z0-9\s&,.-]+?\b(PLC|P\.L\.C\.|N\.V\.|AG|GmbH|SE|Inc|Corp|Corporation|Limited|Ltd|S\.A\.|Aktiengesellschaft|Group)\b)/g;
    const matches = textToScan.match(legalEntityPattern);
    if (matches && matches.length > 0) {
      for (const rawMatch of matches) {
        const trimmed = rawMatch.trim();
        if (
          trimmed.length >= 4 &&
          trimmed.length <= 60 &&
          !BOILERPLATE_ENTITY_PATTERNS.some(p => p.test(trimmed)) &&
          !/annual report|financial statement|independent auditor|balance sheet|income statement/i.test(trimmed)
        ) {
          const legalEntity = trimmed;
          const workspaceEntity = trimmed.replace(/\b(AG|GmbH|Inc|Corp|Corporation|PLC|N\.V\.|SE|Ltd|Limited|S\.A\.)\b/gi, '').trim() || trimmed;
          return {
            legalEntity,
            reportingEntity: reportingScope === "PARENT_ONLY" ? `${legalEntity} (Standalone)` : `${workspaceEntity} (Consolidated)`,
            parentEntity: legalEntity,
            workspaceEntity,
            reportingScope,
            resolutionMethod: "DYNAMIC_REGEX_LEGAL_ENTITY"
          };
        }
      }
    }

    // Fallback default
    const fallbackEntity = docTitle && docTitle.length > 3 ? docTitle : "Corporate Entity";
    return {
      legalEntity: fallbackEntity,
      reportingEntity: `${fallbackEntity} (Consolidated)`,
      parentEntity: fallbackEntity,
      workspaceEntity: fallbackEntity,
      reportingScope,
      resolutionMethod: "GENERIC_FALLBACK"
    };
  }

  /**
   * Deterministically resolves corporate entity name from raw uploaded filename.
   * Prevents naive filename string tokenization failures like 'Unilever And Accounts' or 'Entire Ar25'.
   */
  public static resolveEntityFromFilename(filename: string): {
    name: string;
    code: string;
    currency: string;
    resolutionMethod: string;
    auditWarning?: string;
  } {
    const cleanFilename = (filename || "").toLowerCase();

    // Check Brand Root Map
    for (const [key, meta] of Object.entries(this.BRAND_ROOT_MAP)) {
      const regex = new RegExp(`\\b${key}\\b|_|-`, 'i');
      if (cleanFilename.includes(key)) {
        return {
          name: meta.workspaceName,
          code: meta.code,
          currency: meta.defaultCurrency,
          resolutionMethod: `FILENAME_BRAND_ROOT (${key.toUpperCase()})`
        };
      }
    }

    // Heuristic stripping of generic suffixes
    const noiseWords = /(readme|test|instructions|factura|invoice|statement|report|annual|accounts|consolidated|individual|presentation|results|review|overview|enterprise|q[1-4]|202[0-9]|received|pdf|doc|docx|txt|google|drive|upload|data|document|entire|ar25|ar24|ar26|fy25|fy24|fy26)/gi;
    const stripped = (filename || "")
      .replace(/\.[^/.]+$/, "")
      .replace(noiseWords, "")
      .replace(/[_.-]+/g, " ")
      .trim();

    const formattedName = stripped
      .split(" ")
      .filter(w => w.length > 2 && !/^(and|the|for|cum|zum|mit|und)$/i.test(w))
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    const finalName = formattedName.length >= 3 ? formattedName : "Corporate Entity";
    const code = (finalName.replace(/[^a-zA-Z]/g, "").substring(0, 4) || "PRJ").toUpperCase();

    return {
      name: finalName,
      code,
      currency: "EUR",
      resolutionMethod: "CLEANED_FILENAME_HEURISTIC",
      auditWarning: `Filename '${filename}' required heuristic cleaning. Resulted in '${finalName}'.`
    };
  }
}

export class LocaleAwareNumberParser {
  /**
   * Locale-aware number parser supporting German/EU (1.234,56 / 97.968) and US/UK (1,234.56 / 97,968).
   */
  public static parseLocaleAwareValue(
    rawStr: string,
    docLanguage?: string,
    contextText?: string,
    scaleHint: number = 1
  ): {
    normalizedValue: number | null;
    rawValue: string;
    isAmbiguous: boolean;
    scaleMultiplier: number;
    rawScaleLabel: 'ONES' | 'THOUSANDS' | 'MILLIONS' | 'BILLIONS' | 'UNKNOWN';
    parsingNotes: string[];
  } {
    const parsingNotes: string[] = [];
    if (!rawStr) {
      return {
        normalizedValue: null,
        rawValue: "",
        isAmbiguous: false,
        scaleMultiplier: scaleHint,
        rawScaleLabel: "UNKNOWN",
        parsingNotes: ["Empty string provided"]
      };
    }

    const trimmed = rawStr.trim();

    // STAGE 6: Year-As-Value Protection Guard
    const hasMonetaryContext = /[\$€£¥]|billion|million|thousand|mio|mrd|teur|t€|\b[mbk]\b/i.test(rawStr) || /[\$€£¥]|billion|million|thousand|mio|mrd|teur|t€|\b[mbk]\b/i.test(contextText || "");
    if (!hasMonetaryContext && /\b(19|20)\d\d\b/.test(rawStr)) {
      return {
        normalizedValue: null,
        rawValue: trimmed,
        isAmbiguous: true,
        scaleMultiplier: scaleHint,
        rawScaleLabel: "UNKNOWN",
        parsingNotes: ["Rejected isolated year string without monetary context"]
      };
    }
    let isNegative = false;
    if ((trimmed.startsWith("(") && trimmed.endsWith(")")) || trimmed.startsWith("-") || trimmed.includes("–")) {
      isNegative = true;
    }

    let clean = trimmed.replace(/[^0-9.,]/g, "");
    if (!clean) {
      return {
        normalizedValue: null,
        rawValue: trimmed,
        isAmbiguous: true,
        scaleMultiplier: scaleHint,
        rawScaleLabel: "UNKNOWN",
        parsingNotes: ["No numeric characters found"]
      };
    }

    // Detect language context
    const fullText = (contextText || "").toLowerCase();
    const isGerman = (docLanguage || "").toLowerCase().startsWith("de") ||
      fullText.includes("mio") ||
      fullText.includes("eur") ||
      fullText.includes("t€") ||
      fullText.includes("umsatzerlöse") ||
      fullText.includes("jahresabschluss") ||
      fullText.includes("bilanzsumme");

    // Detect Scale Label
    let rawScaleLabel: 'ONES' | 'THOUSANDS' | 'MILLIONS' | 'BILLIONS' | 'UNKNOWN' = "ONES";
    let scaleMultiplier = scaleHint;

    if (fullText.includes("billion") || fullText.includes("mrd") || fullText.includes("€b")) {
      rawScaleLabel = "BILLIONS";
      scaleMultiplier = 1_000_000_000;
    } else if (fullText.includes("million") || fullText.includes("mio") || fullText.includes("€m")) {
      rawScaleLabel = "MILLIONS";
      scaleMultiplier = 1_000_000;
    } else if (fullText.includes("thousand") || fullText.includes("t€") || fullText.includes("teur") || fullText.includes("€k") || fullText.includes("in thousands")) {
      rawScaleLabel = "THOUSANDS";
      scaleMultiplier = 1_000;
    }

    let isAmbiguous = false;

    // German / EU separator handling
    if (clean.includes(",") && clean.includes(".")) {
      if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
        // German style: 1.234,56 -> 1234.56
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else {
        // US style: 1,234.56 -> 1234.56
        clean = clean.replace(/,/g, "");
      }
    } else if (clean.includes(".")) {
      const parts = clean.split(".");
      if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
        if (isGerman || scaleMultiplier >= 1_000_000) {
          // In German reports (e.g. 97.968 Mio €), 97.968 means 97,968 units of Mio € = 97.968 Billion €
          clean = clean.replace(".", "");
          parsingNotes.push("Parsed German thousands separator in Mio EUR table (e.g. 97.968 -> 97968)");
        } else {
          // Standard float e.g. 97.968
          clean = clean; 
        }
      } else if (parts.length > 2) {
        clean = clean.replace(/\./g, "");
      }
    } else if (clean.includes(",")) {
      const parts = clean.split(",");
      if (parts.length === 2 && parts[1].length <= 2) {
        clean = clean.replace(",", ".");
      } else {
        clean = clean.replace(/,/g, "");
      }
    }

    let num = parseFloat(clean);
    if (isNaN(num)) {
      return {
        normalizedValue: null,
        rawValue: trimmed,
        isAmbiguous: true,
        scaleMultiplier,
        rawScaleLabel,
        parsingNotes: ["Failed parseFloat on clean string"]
      };
    }

    if (isNegative && num > 0) {
      num = -num;
    }

    // Protection against double scale multiplication
    let finalNormalizedValue = num;
    if (Math.abs(num) < 1_000_000 && scaleMultiplier > 1) {
      finalNormalizedValue = num * scaleMultiplier;
    } else {
      finalNormalizedValue = num;
    }

    return {
      normalizedValue: finalNormalizedValue,
      rawValue: trimmed,
      isAmbiguous,
      scaleMultiplier,
      rawScaleLabel,
      parsingNotes
    };
  }
}

export class AccountingSignResolver {
  /**
   * Enforces natural accounting signs for Balance Sheet & Income Statement items.
   * Total Assets, Total Liabilities, Total Equity, and Revenue must maintain positive natural sign
   * unless explicitly accompanied by loss or deficit language.
   */
  public static enforceNaturalAccountingSign(
    canonicalMetric: string,
    normalizedValue: number | null,
    sourceText: string = ""
  ): number | null {
    if (normalizedValue === null || isNaN(normalizedValue)) return null;

    const lowerText = sourceText.toLowerCase();
    const isExplicitLoss = lowerText.includes("loss") || lowerText.includes("fehlbetrag") || lowerText.includes("deficit") || lowerText.includes("negative");

    const positiveNaturalMetrics = [
      "total_assets",
      "revenue",
      "total_liabilities",
      "cash",
      "cost_of_sales"
    ];

    if (positiveNaturalMetrics.includes(canonicalMetric.toLowerCase())) {
      if (!isExplicitLoss && normalizedValue < 0) {
        return Math.abs(normalizedValue);
      }
    }

    return normalizedValue;
  }
}

export class PageClassifier {
  public static classifyPage(
    pageNumber: number,
    text: string,
    tablesDetectedCount: number
  ): PageClassificationType {
    const lower = (text || "").toLowerCase();

    if (pageNumber === 1 || lower.includes("annual report") || lower.includes("jahresabschluss") || lower.includes("interim report")) {
      return "COVER";
    }
    if (lower.includes("table of contents") || lower.includes("inhaltsverzeichnis") || lower.includes("index")) {
      return "INDEX";
    }
    if (
      lower.includes("consolidated balance sheet") ||
      lower.includes("bilanz zum") ||
      lower.includes("consolidated income statement") ||
      lower.includes("gewinn- und verlustrechnung") ||
      lower.includes("statement of cash flows")
    ) {
      return "FINANCIAL_STATEMENT";
    }
    if (tablesDetectedCount > 0 && (lower.includes("€") || lower.includes("EUR") || lower.includes("$") || lower.includes("million"))) {
      return "FINANCIAL_TABLE";
    }
    if (lower.includes("note") || lower.includes("anhang") || lower.includes("notes to the")) {
      return "NOTE_DISCLOSURE";
    }
    if (lower.includes("independent auditor's report") || lower.includes("bestätigungsvermerk")) {
      return "AUDITOR_REPORT";
    }
    if (lower.includes("management report") || lower.includes("lagebericht")) {
      return "MANAGEMENT_REPORT";
    }

    return "NARRATIVE";
  }
}

export class PresentationIntegrityGate {
  /**
   * Asserts that formatted metric strings maintain magnitude integrity without invalid scale jumps (e.g. B -> K).
   */
  public static verifyPresentationIntegrity(
    rawScalar: number | null,
    formattedString: string,
    metricName: string
  ): { isVerified: boolean; errorMessage?: string } {
    if (rawScalar === null || isNaN(rawScalar) || rawScalar === 0) {
      return { isVerified: true };
    }

    const absVal = Math.abs(rawScalar);
    const lowerFormatted = (formattedString || "").toLowerCase();

    if (absVal >= 1_000_000_000) {
      if (lowerFormatted.includes("k") && !lowerFormatted.includes("b")) {
        return {
          isVerified: false,
          errorMessage: `Presentation Integrity Gate Failure for ${metricName}: Scalar ${rawScalar} (€${(absVal/1e9).toFixed(2)}B) was improperly rendered as ${formattedString}`
        };
      }
    }

    return { isVerified: true };
  }
}
