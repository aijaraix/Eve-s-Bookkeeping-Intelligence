export interface FileInput {
  buffer?: Buffer;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface FileInspectionResult {
  mimeType: string;
  detectedType: string;
  signature: string;
  size: number;
  hash: string;
  isDuplicate: boolean;
  isEncrypted: boolean;
  isCorrupted: boolean;
  hasNativeText: boolean;
  needsOCR: boolean;
  requiresSpreadsheetPath: boolean;
  isMultimodalImage: boolean;
  isSupported: boolean;
  unsupportedReason?: string;
}

export interface CellModel {
  coordinate: string; // e.g. "F121"
  sheetName: string;
  rawValue: string | number;
  displayedValue: string;
  formula?: string;
  format?: string;
  currency?: string;
  isMerged?: boolean;
}

export interface SectionModel {
  id: string;
  title: string;
  level: number;
  text: string;
  pageNumber?: number;
  sheetName?: string;
  slideNumber?: number;
}

export interface TableModel {
  table_id: string;
  name: string;
  pageNumber?: number;
  sheetName?: string;
  headers: string[];
  rows: string[][];
  cells?: CellModel[];
  currency?: string;
  scale?: string;
  isContinuation?: boolean;
  parentTableId?: string;
}

export interface AssetModel {
  id: string;
  type: 'image' | 'chart' | 'diagram' | 'logo';
  url?: string;
  description: string;
  pageNumber?: number;
  sheetName?: string;
}

export interface CanonicalDocumentModel {
  document_id: string;
  project_id: string;
  source: {
    filename: string;
    originalName: string;
    format: string;
    hash: string;
    original_url: string | null;
    access_timestamp: string;
  };
  parser: {
    engine: 'anydoc' | 'spreadsheet' | 'ocr_fallback' | 'web_firecrawl';
    version: string;
    ocr_used: boolean;
    confidence: number;
  };
  metadata: {
    pages: number;
    language: string;
    currency: string;
    entityName: string;
    period?: string;
    language_confidence?: number;
    language_detection_method?: string;
    totalWords: number;
  };
  sections: SectionModel[];
  tables: TableModel[];
  assets: AssetModel[];
  pageManifests?: any[];
  sourceBlocks?: any[];
  markdown: string;
  warnings: string[];
  confidence: number;
}

export interface DocumentParser {
  canHandle(file: FileInput): boolean;
  inspect(file: FileInput): Promise<FileInspectionResult>;
  parse(file: FileInput, inspection: FileInspectionResult): Promise<CanonicalDocumentModel>;
  extractAssets(file: FileInput): Promise<AssetModel[]>;
  healthCheck(): Promise<boolean>;
}

export function detectLanguageFromText(text: string): { language: string; confidence: number; method: string } {
  if (!text || text.trim().length < 10) {
    return { language: "UNKNOWN", confidence: 0, method: "insufficient_text" };
  }

  const sample = text.slice(0, 50000).toLowerCase();

  const plChars = (sample.match(/[ąćęłńóśźż]/g) || []).length;
  const deChars = (sample.match(/[äöüß]/g) || []).length;
  const esChars = (sample.match(/[ñáéíóú¿]/g) || []).length;
  const frChars = (sample.match(/[éèêàçâùîï]/g) || []).length;
  const itChars = (sample.match(/[àèéìòù]/g) || []).length;
  const jaChars = (sample.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g) || []).length;

  if (jaChars > 10) {
    return { language: "ja", confidence: 0.95, method: "script_character_match" };
  }

  const plWords = (sample.match(/\b(i|w|z|na|do|się|ze|przychody|sprzedaży|bilans|spółka|zarządu|złotych|pln|rok|okres|sprawozdanie|finansowe|razem|aktywa|pasywa)\b/g) || []).length;
  const deWords = (sample.match(/\b(der|die|das|und|in|von|mit|umsatzerlöse|bilanz|gewinn|verlust|jahresabschluss|aktiva|passiva|gesellschaft|euro|geschäftsjahr)\b/g) || []).length;
  const esWords = (sample.match(/\b(el|la|en|de|y|con|por|ingresos|ventas|balance|consolidado|ejercicio|euros|sociedad|cuentas|anuales|estados|financieros)\b/g) || []).length;
  const frWords = (sample.match(/\b(le|la|les|des|en|et|chiffre|d'affaires|bilan|compte|résultat|exercice|société|euros|rapport|financier)\b/g) || []).length;
  const itWords = (sample.match(/\b(il|la|di|e|in|ricavi|vendite|bilancio|società|esercizio|euro|conto|economico|stato|patrimoniale)\b/g) || []).length;
  const enWords = (sample.match(/\b(the|and|of|to|in|revenue|income|assets|liabilities|statement|year|ended|december|financial|report|consolidated|sheet|balance)\b/g) || []).length;

  const scorePl = plChars * 5 + plWords * 3;
  const scoreDe = deChars * 5 + deWords * 3;
  const scoreEs = esChars * 5 + esWords * 3;
  const scoreFr = frChars * 5 + frWords * 3;
  const scoreIt = itChars * 5 + itWords * 3;
  const scoreEn = enWords * 2;

  const scores = [
    { lang: "pl", score: scorePl },
    { lang: "de", score: scoreDe },
    { lang: "es", score: scoreEs },
    { lang: "fr", score: scoreFr },
    { lang: "it", score: scoreIt },
    { lang: "en", score: scoreEn }
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  if (best && best.score > 5) {
    return { language: best.lang, confidence: Math.min(0.99, 0.5 + best.score / 100), method: "text_keyword_character_match" };
  }

  return { language: "UNKNOWN", confidence: 0, method: "text_analysis_threshold_unmet" };
}

export function detectPeriodFromText(text: string): string | null {
  if (!text) return null;
  const sample = text.slice(0, 15000);

  const yearEndedMatch = sample.match(/(?:for the|three|six|nine|twelve)?\s*(?:months?|period)?\s*ended\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i)
    || sample.match(/(?:rok zakończony|okres zakończony)\s+(\d{1,2}\s+[a-zżółćęśąźń]+\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})/i)
    || sample.match(/(?:zum|für das Geschäftsjahr zum)\s+(\d{1,2}\.\s*[A-Za-zäöüÄÖÜ]+\s*\d{4}|\d{1,2}\.\d{1,2}\.\d{4})/i)
    || sample.match(/(?:as at|as of|stan na)\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[a-zżółćęśąźń]+\s+\d{4}|\d{2}\.\d{2}\.\d{4})/i);

  if (yearEndedMatch && yearEndedMatch[1]) {
    return yearEndedMatch[1].trim();
  }

  const fyMatch = sample.match(/\b(FY\s*20\d{2}|FY\s*19\d{2})\b/i);
  if (fyMatch && fyMatch[1]) {
    return fyMatch[1].trim().toUpperCase();
  }

  const yearMatch = sample.match(/\b(20\d{2})\b/);
  if (yearMatch && yearMatch[1]) {
    return `FY ${yearMatch[1]}`;
  }

  return null;
}

