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
    period: string;
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
