import { GoogleGenAI } from '@google/genai';
import { geminiFileService } from './GeminiFileService.js';
import { extractionTaskCache } from './ExtractionTaskCache.js';
import { PRIMARY_STATEMENT_EXTRACTION_SCHEMA } from './schemas/incomeStatementSchema.js';
import { StatementFactCandidate } from './types.js';

export class StructuredStatementExtractor {
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
   * Extract complete structured line-items for a target primary statement (e.g. Income Statement or Balance Sheet).
   */
  public async extractPrimaryStatement(params: {
    filePath: string;
    documentHash: string;
    statementType: string;
    targetPhysicalPages: number[];
    reportingEntity?: string;
    reportingPeriod?: string;
    model?: string;
  }): Promise<StatementFactCandidate[]> {
    const model = params.model || process.env.PRIMARY_EXTRACTION_MODEL || 'gemini-2.5-flash';
    const period = params.reportingPeriod || 'FY2025';

    const cacheKey = extractionTaskCache.computeCacheKey({
      documentHash: params.documentHash,
      taskType: `EXTRACT_${params.statementType}`,
      period,
      model,
      promptVersion: 'v1.0'
    });

    // Check Cache
    const cached = extractionTaskCache.get(cacheKey);
    if (cached && Array.isArray(cached.resultData)) {
      return cached.resultData as StatementFactCandidate[];
    }

    const fileRes = await geminiFileService.getOrUploadPdfFile(params.filePath, params.documentHash);

    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) this.aiClient = new GoogleGenAI({ apiKey });
    }

    if (!this.aiClient) {
      throw new Error("Gemini API Client unavailable for primary statement extraction.");
    }

    const pageHintStr = params.targetPhysicalPages && params.targetPhysicalPages.length > 0
      ? `Look specifically at physical page(s): ${params.targetPhysicalPages.join(', ')}.`
      : '';

    const promptText = `Extract the complete, structured primary financial statement for: ${params.statementType}.
${pageHintStr}

Mandatory Extraction Instructions:
1. Extract ALL line items (Turnover/Revenue, Cost of Sales, Gross Profit, Operating Profit, Profit Before Tax, Net Income, Total Assets, Total Liabilities, Total Equity, Cash Flows) presented in the table.
2. For each line item, extract the numerical value for the current period (${period}) and any comparative prior periods.
3. Determine the table currency (e.g. EUR, USD, GBP) and table scale multiplier (e.g., Millions, Thousands, Units).
4. Provide a verbatim short sourceQuote from the document table row for each extracted fact.
5. Identify physical page numbers accurately.

Return output strictly formatted according to the provided JSON schema.`;

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

    console.log(`[StructuredStatementExtractor] Extracting ${params.statementType} via Gemini (${model})...`);

    const response = await this.aiClient.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: PRIMARY_STATEMENT_EXTRACTION_SCHEMA,
        temperature: 0.1
      }
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    const lineItems: StatementFactCandidate[] = (parsedData.lineItems || []).map((item: any) => ({
      metricLabel: item.metricLabel || item.rowLabel || 'Extracted Fact',
      canonicalMetricCandidate: item.canonicalMetricCandidate || item.metricLabel,
      rawValue: item.rawValue || '0',
      rawText: item.rawText || item.sourceQuote,
      currency: item.currency || parsedData.currency || 'EUR',
      scale: item.scale || parsedData.tableScale || 'Units',
      period: item.period || period,
      comparativePeriod: item.comparativePeriod,
      reportingEntity: item.reportingEntity || params.reportingEntity || parsedData.reportingEntity || 'Consolidated Group',
      reportingScope: item.reportingScope || parsedData.scope || 'CONSOLIDATED_GROUP',
      statementType: params.statementType,
      physicalPage: item.physicalPage || (params.targetPhysicalPages && params.targetPhysicalPages[0]) || 1,
      printedPage: item.printedPage,
      rowLabel: item.rowLabel || item.metricLabel || 'Line Item',
      columnLabel: item.columnLabel,
      isSubtotal: Boolean(item.isSubtotal),
      isTotal: Boolean(item.isTotal),
      isDerivedBySource: Boolean(item.isDerivedBySource),
      confidence: item.confidence || 0.98,
      sourceQuote: item.sourceQuote || item.rowLabel || ''
    }));

    // Cache Result
    extractionTaskCache.set({
      cacheKey,
      documentHash: params.documentHash,
      taskType: `EXTRACT_${params.statementType}`,
      model,
      promptVersion: 'v1.0',
      resultData: lineItems
    });

    return lineItems;
  }
}

export const structuredStatementExtractor = new StructuredStatementExtractor();
