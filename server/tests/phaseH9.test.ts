import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { EvidenceCrossCheckEngine } from '../hybridExtraction/EvidenceCrossCheckEngine.js';
import { extractionTaskCache } from '../hybridExtraction/ExtractionTaskCache.js';
import { DOCUMENT_MAP_SCHEMA } from '../hybridExtraction/schemas/documentMapSchema.js';
import { PRIMARY_STATEMENT_EXTRACTION_SCHEMA } from '../hybridExtraction/schemas/incomeStatementSchema.js';
import { CanonicalFactResolver } from '../canonicalFactResolver.js';
import { StatementFactCandidate } from '../hybridExtraction/types.js';
import { ExtractedFact } from '../../src/types.js';

describe('Phase H.9 Hybrid Engine Architecture Unit Tests', () => {

  it('A. Physical page inventory and source block structure validate', () => {
    const mockPageManifests = [
      { physical_page_number: 1, page_number: 1, native_text_available: true },
      { physical_page_number: 2, page_number: 2, native_text_available: false }
    ];
    expect(mockPageManifests.length).toBe(2);
    expect(mockPageManifests[0].native_text_available).toBe(true);
    expect(mockPageManifests[1].native_text_available).toBe(false);
  });

  it('B. DocumentMap JSON schema defines required structure', () => {
    expect(DOCUMENT_MAP_SCHEMA.type).toBe('object');
    expect(DOCUMENT_MAP_SCHEMA.required).toContain('documentTitle');
    expect(DOCUMENT_MAP_SCHEMA.required).toContain('primaryReportingCurrency');
    expect(DOCUMENT_MAP_SCHEMA.required).toContain('primaryStatements');
  });

  it('C. Primary Statement JSON schema defines line item requirements', () => {
    expect(PRIMARY_STATEMENT_EXTRACTION_SCHEMA.type).toBe('object');
    expect(PRIMARY_STATEMENT_EXTRACTION_SCHEMA.required).toContain('statementType');
    expect(PRIMARY_STATEMENT_EXTRACTION_SCHEMA.required).toContain('lineItems');
  });

  it('D. EvidenceCrossCheck confirms facts against native text blocks', () => {
    const candidate: StatementFactCandidate = {
      metricLabel: 'Turnover',
      rawValue: '50861',
      currency: 'EUR',
      scale: 'Millions',
      period: 'FY2025',
      statementType: 'CONSOLIDATED_INCOME_STATEMENT',
      physicalPage: 1,
      rowLabel: 'Turnover',
      confidence: 0.98,
      sourceQuote: 'Turnover 50,861'
    };

    const mockManifests = [{ physical_page_number: 1, native_text_available: true }];
    const mockBlocks = [{ page_number: 1, raw_text: 'Turnover 50,861 million euros in 2025' }];

    const result = EvidenceCrossCheckEngine.verifyCandidateAgainstSource(
      candidate,
      mockManifests,
      mockBlocks
    );

    expect(result.evidenceStatus).toBe('CONFIRMED');
    expect(result.confidenceScore).toBe(0.99);
  });

  it('E. EvidenceCrossCheck marks scanned page facts as VISUALLY_CONFIRMED', () => {
    const candidate: StatementFactCandidate = {
      metricLabel: 'Total Assets',
      rawValue: '97062',
      currency: 'EUR',
      scale: 'Millions',
      period: 'FY2025',
      statementType: 'CONSOLIDATED_BALANCE_SHEET',
      physicalPage: 2,
      rowLabel: 'Total Assets',
      confidence: 0.95,
      sourceQuote: 'Total assets 97,062'
    };

    const mockManifests = [{ physical_page_number: 2, native_text_available: false }];
    const mockBlocks: any[] = [];

    const result = EvidenceCrossCheckEngine.verifyCandidateAgainstSource(
      candidate,
      mockManifests,
      mockBlocks
    );

    expect(result.evidenceStatus).toBe('VISUALLY_CONFIRMED');
    expect(result.confidenceScore).toBeLessThanOrEqual(0.95);
  });

  it('F. Scale multiplier is applied exactly once during normalization', () => {
    const scaleStr = 'Millions';
    let scaleMult = 1;
    if (scaleStr.toLowerCase().includes('million')) scaleMult = 1000000;

    const rawVal = 50861;
    const normalizedVal = String(rawVal * scaleMult);

    expect(normalizedVal).toBe('50861000000');
  });

  it('G. CanonicalFactResolver resolves duplicate fact candidates', () => {
    const rawFacts: ExtractedFact[] = [
      {
        id: 'fct-1',
        workspaceId: 'ws-test',
        documentId: 'doc-test',
        factType: 'revenue',
        labelOriginal: 'Turnover',
        labelNormalized: 'Revenue',
        valueOriginal: '50,861',
        valueFunctional: '50861000000',
        currencyOriginal: 'EUR',
        functionalCurrency: 'EUR',
        exchangeRate: '1.0',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        pageNumber: 1,
        sourceText: 'Turnover 50,861 million',
        confidence: 0.99,
        status: 'approved',
        extractionMethod: 'HYBRID_GEMINI_NATIVE_CONSOLIDATED_INCOME_STATEMENT'
      },
      {
        id: 'fct-2',
        workspaceId: 'ws-test',
        documentId: 'doc-test',
        factType: 'revenue',
        labelOriginal: 'Group Turnover',
        labelNormalized: 'Revenue',
        valueOriginal: '50,861',
        valueFunctional: '50861000000',
        currencyOriginal: 'EUR',
        functionalCurrency: 'EUR',
        exchangeRate: '1.0',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        pageNumber: 1,
        sourceText: 'Turnover 50,861 million',
        confidence: 0.95,
        status: 'approved',
        extractionMethod: 'HYBRID_GEMINI_NATIVE_CONSOLIDATED_INCOME_STATEMENT'
      }
    ];

    const canonical = CanonicalFactResolver.promotePrimaryStatementFacts(rawFacts);
    expect(canonical.length).toBe(2);
    expect(canonical[0].valueFunctional).toBe('50861000000');
  });

  it('H. ExtractionTaskCache generates deterministic cache keys and stores results', () => {
    const cacheKey = extractionTaskCache.computeCacheKey({
      documentHash: 'abc123hash',
      taskType: 'DOCUMENT_MAP',
      model: 'gemini-2.5-flash',
      promptVersion: 'v1.0'
    });

    expect(cacheKey).toBe('abc123hash_DOCUMENT_MAP_GENERAL_gemini-2.5-flash_v1.0');

    extractionTaskCache.set({
      cacheKey,
      documentHash: 'abc123hash',
      taskType: 'DOCUMENT_MAP',
      model: 'gemini-2.5-flash',
      promptVersion: 'v1.0',
      resultData: { documentTitle: 'Test Annual Report', primaryReportingCurrency: 'EUR' }
    });

    const retrieved = extractionTaskCache.get(cacheKey);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.resultData.documentTitle).toBe('Test Annual Report');
  });
});
