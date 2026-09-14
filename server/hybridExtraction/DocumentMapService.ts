import { GoogleGenAI } from '@google/genai';
import { geminiFileService } from './GeminiFileService.js';
import { extractionTaskCache } from './ExtractionTaskCache.js';
import { DOCUMENT_MAP_SCHEMA } from './schemas/documentMapSchema.js';
import { DocumentMapModel } from './types.js';
import { executeWithGeminiRetry } from './geminiRetryHelper.js';

const DOCUMENT_MAP_LIMITS = {
  legalEntities: 20,
  reportingEntities: 20,
  reportingScopes: 12,
  fiscalPeriods: 12,
  currencies: 12,
  functionalCurrencies: 12,
  languages: 8,
  primaryStatements: 16,
  statementPageCandidates: 12,
  importantNotes: 48,
  notePages: 12
} as const;

function structuredOutputError(message: string): any {
  const err: any = new Error(message);
  err.isStructuredOutputError = true;
  err.errorType = 'STRUCTURED_OUTPUT_INVALID';
  err.retryAfterMs = 10000;
  err.httpCode = 200;
  return err;
}

function assertArrayBound(value: any, name: string, max: number): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw structuredOutputError(`Document Map field ${name} must be an array.`);
  if (value.length > max) throw structuredOutputError(`Document Map field ${name} exceeded bounded output limit ${max}.`);
}

/**
 * Deterministically validate a Gemini Document Map before the provider call is
 * allowed to count as a successful/committed model result.
 */
export function parseAndValidateDocumentMapResponse(response: any): DocumentMapModel {
  const finishReason = response?.candidates?.[0]?.finishReason;
  if (finishReason && !['STOP', 'FINISH_REASON_UNSPECIFIED'].includes(String(finishReason))) {
    throw structuredOutputError(`Gemini Document Map response was incomplete (finishReason=${String(finishReason)}).`);
  }

  const responseText = typeof response?.text === 'string' ? response.text.trim() : '';
  if (!responseText) {
    throw structuredOutputError('Gemini Document Map response was empty.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch (err: any) {
    // Never repair, close, or salvage malformed JSON into canonical truth.
    throw structuredOutputError(`Gemini Document Map returned invalid JSON (${err?.message || 'parse error'}).`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw structuredOutputError('Gemini Document Map root must be an object.');
  }
  if (typeof parsed.documentTitle !== 'string' || !parsed.documentTitle.trim()) {
    throw structuredOutputError('Gemini Document Map missing documentTitle.');
  }
  if (typeof parsed.documentIssuer !== 'string' || !parsed.documentIssuer.trim()) {
    throw structuredOutputError('Gemini Document Map missing documentIssuer.');
  }
  if (typeof parsed.primaryReportingCurrency !== 'string' || !parsed.primaryReportingCurrency.trim()) {
    throw structuredOutputError('Gemini Document Map missing primaryReportingCurrency.');
  }
  if (!Array.isArray(parsed.primaryStatements)) {
    throw structuredOutputError('Gemini Document Map missing primaryStatements array.');
  }

  assertArrayBound(parsed.legalEntities, 'legalEntities', DOCUMENT_MAP_LIMITS.legalEntities);
  assertArrayBound(parsed.reportingEntities, 'reportingEntities', DOCUMENT_MAP_LIMITS.reportingEntities);
  assertArrayBound(parsed.reportingScopes, 'reportingScopes', DOCUMENT_MAP_LIMITS.reportingScopes);
  assertArrayBound(parsed.fiscalPeriods, 'fiscalPeriods', DOCUMENT_MAP_LIMITS.fiscalPeriods);
  assertArrayBound(parsed.currencies, 'currencies', DOCUMENT_MAP_LIMITS.currencies);
  assertArrayBound(parsed.functionalCurrencies, 'functionalCurrencies', DOCUMENT_MAP_LIMITS.functionalCurrencies);
  assertArrayBound(parsed.languages, 'languages', DOCUMENT_MAP_LIMITS.languages);
  assertArrayBound(parsed.primaryStatements, 'primaryStatements', DOCUMENT_MAP_LIMITS.primaryStatements);
  assertArrayBound(parsed.importantNotes, 'importantNotes', DOCUMENT_MAP_LIMITS.importantNotes);

  for (const [index, statement] of parsed.primaryStatements.entries()) {
    if (!statement || typeof statement !== 'object') {
      throw structuredOutputError(`Document Map primaryStatements[${index}] must be an object.`);
    }
    if (typeof statement.statementType !== 'string' || typeof statement.statementTitle !== 'string') {
      throw structuredOutputError(`Document Map primaryStatements[${index}] missing statement type/title.`);
    }
    assertArrayBound(statement.physicalPageCandidates, `primaryStatements[${index}].physicalPageCandidates`, DOCUMENT_MAP_LIMITS.statementPageCandidates);
    assertArrayBound(statement.printedPageCandidates, `primaryStatements[${index}].printedPageCandidates`, DOCUMENT_MAP_LIMITS.statementPageCandidates);
  }

  for (const [index, note] of (parsed.importantNotes || []).entries()) {
    if (!note || typeof note !== 'object' || typeof note.title !== 'string' || typeof note.category !== 'string') {
      throw structuredOutputError(`Document Map importantNotes[${index}] is invalid.`);
    }
    assertArrayBound(note.physicalPages, `importantNotes[${index}].physicalPages`, DOCUMENT_MAP_LIMITS.notePages);
  }

  return parsed as DocumentMapModel;
}

export class DocumentMapService {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
      } catch (e) {}
    }
  }

  /**
   * Build a bounded Document Map using Gemini Files API / multimodal document understanding.
   */
  public async generateDocumentMap(params: {
    filePath: string;
    documentHash: string;
    model?: string;
  }): Promise<DocumentMapModel> {
    const model = params.model || process.env.DOCUMENT_MAP_MODEL || 'gemini-3.6-flash';
    const promptVersion = 'v1.1-bounded';
    const cacheKey = extractionTaskCache.computeCacheKey({
      documentHash: params.documentHash,
      taskType: 'DOCUMENT_MAP',
      model,
      promptVersion
    });

    const cached = extractionTaskCache.get(cacheKey);
    if (cached && cached.resultData) {
      return cached.resultData as DocumentMapModel;
    }

    const fileRes = await geminiFileService.getOrUploadPdfFile(params.filePath, params.documentHash);

    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) this.aiClient = new GoogleGenAI({ apiKey });
    }

    if (!this.aiClient) {
      throw new Error("Gemini API Client unavailable for Document Map generation.");
    }

    const promptText = `Analyze this financial document and build a concise Document Map.
Identify the issuer, reporting scopes, primary financial statements, primary reporting currency, functional currencies, and material notes.

STRICT OUTPUT BOUNDS:
- At most 20 legalEntities and 20 reportingEntities.
- At most 12 reportingScopes, fiscalPeriods, currencies, or functionalCurrencies.
- At most 8 languages.
- At most 16 primaryStatements. Include only actual primary statements, not individual XBRL facts or table rows.
- At most 12 page candidates per statement.
- At most 48 importantNotes, limited to material financial disclosures (Revenue, Segments, Debt, Tax, Acquisitions, Goodwill, Pensions, Contingencies and similar material notes).
- At most 12 physical pages per note.
- Keep titles and labels concise. Do not copy filing text, XBRL tags, table contents, or note prose into the map.

Return only structured output matching the JSON schema provided.`;

    const contents: any[] = [];
    if (fileRes.fileUri) {
      contents.push({
        fileData: {
          fileUri: fileRes.fileUri,
          mimeType: fileRes.mimeType
        }
      });
    } else if (fileRes.inlineBase64) {
      contents.push({
        inlineData: {
          data: fileRes.inlineBase64,
          mimeType: fileRes.mimeType
        }
      });
    }
    contents.push(promptText);

    console.log(`[DocumentMapService] Requesting bounded DocumentMap from Gemini (${model})...`);

    let validatedDocumentMap: DocumentMapModel | null = null;
    const response = await executeWithGeminiRetry(this.aiClient, {
      model,
      taskType: 'DOCUMENT_MAP',
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: DOCUMENT_MAP_SCHEMA,
        temperature: 0.1,
        maxOutputTokens: 16384
      },
      validateResponse: (candidateResponse) => {
        validatedDocumentMap = parseAndValidateDocumentMapResponse(candidateResponse);
      }
    });

    const documentMapData = validatedDocumentMap || parseAndValidateDocumentMapResponse(response);

    extractionTaskCache.set({
      cacheKey,
      documentHash: params.documentHash,
      taskType: 'DOCUMENT_MAP',
      model,
      promptVersion,
      resultData: documentMapData
    });

    return documentMapData;
  }
}

export const documentMapService = new DocumentMapService();