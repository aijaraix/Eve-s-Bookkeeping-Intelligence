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
   * Deterministic resolution of legal entity and reporting scope without reliance on filenames alone.
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
  } {
    const textToScan = [
      docTitle,
      docContext,
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
      lower.includes("volkswagen group")
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
    } else if (lower.includes("segment") || lower.includes("passenger cars") || lower.includes("commercial vehicles")) {
      reportingScope = "SEGMENT";
    } else {
      reportingScope = "CONSOLIDATED_GROUP"; // Default primary assumption if ambiguous
    }

    // 2. Entity Identification (clean of legal boilerplate)
    let rawEntityName = "";

    if (lower.includes("volkswagen ag") || lower.includes("vw ag")) {
      rawEntityName = "Volkswagen AG";
    } else if (lower.includes("volkswagen group") || lower.includes("vw group") || lower.includes("volkswagen aktiengesellschaft")) {
      rawEntityName = "Volkswagen Group";
    } else if (docTitle && !BOILERPLATE_ENTITY_PATTERNS.some((p) => p.test(docTitle))) {
      rawEntityName = docTitle.replace(/[\d\-_]+/g, " ").trim();
    } else {
      rawEntityName = "Volkswagen Group";
    }

    // Check if extracted entity is infected by legal boilerplate
    for (const pattern of BOILERPLATE_ENTITY_PATTERNS) {
      if (pattern.test(rawEntityName)) {
        rawEntityName = "Volkswagen Group";
        break;
      }
    }

    const legalEntity = rawEntityName.includes("AG") ? "Volkswagen AG" : "Volkswagen Aktiengesellschaft";
    const reportingEntity = reportingScope === "PARENT_ONLY" ? "Volkswagen AG (Standalone)" : "Volkswagen Group (Consolidated)";
    const parentEntity = "Volkswagen AG";
    const workspaceEntity = "Volkswagen Group";

    return {
      legalEntity,
      reportingEntity,
      parentEntity,
      workspaceEntity,
      reportingScope
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
