import { GoogleGenAI } from '@google/genai';
import { geminiFileService } from './GeminiFileService.js';
import { extractionTaskCache } from './ExtractionTaskCache.js';
import { DOCUMENT_MAP_SCHEMA } from './schemas/documentMapSchema.js';
import { DocumentMapModel } from './types.js';
import { executeWithGeminiRetry } from './geminiRetryHelper.js';

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
   * Build Document Map for PDF document using Gemini Files API / Multimodal PDF understanding.
   */
  public async generateDocumentMap(params: {
    filePath: string;
    documentHash: string;
    model?: string;
  }): Promise<DocumentMapModel> {
    const model = params.model || process.env.DOCUMENT_MAP_MODEL || 'gemini-3.6-flash';
    const cacheKey = extractionTaskCache.computeCacheKey({
      documentHash: params.documentHash,
      taskType: 'DOCUMENT_MAP',
      model,
      promptVersion: 'v1.0'
    });

    // Check Cache
    const cached = extractionTaskCache.get(cacheKey);
    if (cached && cached.resultData) {
      return cached.resultData as DocumentMapModel;
    }

    // Get Gemini File URI
    const fileRes = await geminiFileService.getOrUploadPdfFile(params.filePath, params.documentHash);

    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) this.aiClient = new GoogleGenAI({ apiKey });
    }

    if (!this.aiClient) {
      throw new Error("Gemini API Client unavailable for Document Map generation.");
    }

    const promptText = `Analyze this financial document and build a comprehensive Document Map.
Identify:
1. Document issuer, legal entities, and reporting scopes (Consolidated vs Parent).
2. Primary financial statements (Income Statement, Balance Sheet, Cash Flow, Statement of Changes in Equity) and their physical page numbers.
3. Primary reporting currency and functional currencies.
4. Important notes and disclosures (Revenue, Segments, Debt, Tax).

Return structured output matching the JSON schema provided.`;

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

    console.log(`[DocumentMapService] Requesting DocumentMap from Gemini (${model})...`);
    
    const response = await executeWithGeminiRetry(this.aiClient, {
      model,
      taskType: 'DOCUMENT_MAP',
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: DOCUMENT_MAP_SCHEMA,
        temperature: 0.1
      }
    });

    const responseText = response.text || "{}";
    const documentMapData = JSON.parse(responseText) as DocumentMapModel;

    // Cache Result
    extractionTaskCache.set({
      cacheKey,
      documentHash: params.documentHash,
      taskType: 'DOCUMENT_MAP',
      model,
      promptVersion: 'v1.0',
      resultData: documentMapData
    });

    return documentMapData;
  }
}

export const documentMapService = new DocumentMapService();

