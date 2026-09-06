export interface CanonicalDocumentModel {
  document_id: string;
  project_id?: string;
  source: {
    filename: string;
    originalName?: string;
    format: string;
    hash?: string;
    original_url?: string | null;
    access_timestamp?: string;
    [key: string]: any;
  };
  metadata: {
    entityName?: string;
    language?: string;
    page_count?: number;
    pages?: number;
    detectedType?: string;
    [key: string]: any;
  };
  raw_text?: string;
  markdown?: string;
  pages?: Array<{
    page_number: number;
    text: string;
    tables?: any[];
    [key: string]: any;
  }>;
  page_count?: number;
  pageManifests?: Array<{
    page_number: number;
    native_text_available?: boolean;
    [key: string]: any;
  }>;
  tables?: Array<{
    headers?: string[];
    rows?: (string | number | null | undefined)[][];
    pageNumber?: number;
    [key: string]: any;
  }>;
  sections?: Array<{
    title?: string;
    text: string;
    page?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface FileInspectionResult {
  detectedType: string;
  mimeType: string;
  needsOCR: boolean;
  isMultimodalImage: boolean;
  requiresParser: string;
  confidence: number;
  size?: number;
  originalName?: string;
  [key: string]: any;
}
