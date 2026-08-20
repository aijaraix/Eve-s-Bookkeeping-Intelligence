import fs from 'fs';
import path from 'path';
import { AnyDocParser } from '../../src/lib/parser/anydocParser.js';
import { documentMapService } from './DocumentMapService.js';
import { structuredStatementExtractor } from './StructuredStatementExtractor.js';
import { EvidenceCrossCheckEngine } from './EvidenceCrossCheckEngine.js';
import { NoteExtractionPlanner } from './NoteExtractionPlanner.js';
import { CanonicalFactResolver } from '../canonicalFactResolver.js';
import { AccountingValidationEngine } from '../accountingValidationEngine.js';
import { normalizeFinancialValue } from '../forensicExtractionEngine.js';
import { StatementFactCandidate, EvidenceCrossCheckResult } from './types.js';
import { ExtractedFact } from '../../src/types.js';
import { semanticTaskManager } from './SemanticTaskManager.js';

export interface HybridExtractionResult {
  success: boolean;
  intakeId: string;
  documentId: string;
  workspaceId: string;
  physicalPagesTotal: number;
  factsCandidateCount: number;
  factsConfirmedCount: number;
  factsCanonicalCount: number;
  canonicalFacts: ExtractedFact[];
  evidenceResults: EvidenceCrossCheckResult[];
  documentMap: any;
  accountingValidations: any[];
  processingDurationMs: number;
  error?: string;
}

export class HybridExtractionOrchestrator {
  private parser: AnyDocParser = new AnyDocParser();

  /**
   * Execute Hybrid PDF Processing pipeline:
   * Deterministic Page Inventory -> Gemini Document Map -> Targeted Statement Extraction -> Evidence Cross-Check -> Canonical Resolution -> Accounting Validation.
   */
  public async processDocument(params: {
    intakeId: string;
    documentId: string;
    workspaceId: string;
    filePath: string;
    originalFilename: string;
    documentHash: string;
    period?: string;
    currency?: string;
    onProgress?: (stageName: string, progressPercent: number) => void;
  }): Promise<HybridExtractionResult> {
    const startTime = Date.now();
    console.log(`[HybridExtractionOrchestrator] Starting Hybrid Extraction for ${params.originalFilename} (Doc ID: ${params.documentId})...`);

    const updateProgress = (stageName: string, pct: number) => {
      if (params.onProgress) {
        params.onProgress(stageName, pct);
      }
    };

    try {
      // Step 1: Deterministic Physical Page Inventory & Source Block Extraction
      updateProgress('Preparing Documents', 10);
      const fileBuffer = fs.readFileSync(params.filePath);
      const parsedDoc = await this.parser.parse({
        filename: params.originalFilename,
        originalName: params.originalFilename,
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType: 'application/pdf'
      });

      const physicalPagesTotal = parsedDoc.pageManifests.length || parsedDoc.metadata.pages || 1;
      console.log(`[HybridExtractionOrchestrator] Deterministic Physical Page Inventory: ${physicalPagesTotal} pages identified.`);
      updateProgress('Preparing Documents', 15);

      // Step 2: Gemini Document Map Pass
      const docMapTask = semanticTaskManager.createTask({
        intakeId: params.intakeId,
        documentId: params.documentId,
        taskType: 'DOCUMENT_MAP',
        stageLabel: 'Understanding Document Structure'
      });
      semanticTaskManager.updateTaskStatus(docMapTask.taskId, 'RUNNING');
      updateProgress('Understanding Document Structure', 25);

      let docMap;
      try {
        docMap = await documentMapService.generateDocumentMap({
          filePath: params.filePath,
          documentHash: params.documentHash
        });
        semanticTaskManager.updateTaskStatus(docMapTask.taskId, 'COMPLETED');
      } catch (mapErr: any) {
        const errStr = mapErr?.message || String(mapErr);
        const isCap = mapErr?.isCapacityError || errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('high demand');
        if (isCap) {
          semanticTaskManager.updateTaskStatus(docMapTask.taskId, 'WAITING_FOR_AI_CAPACITY', { error: 'Gemini capacity temporarily reached. Paused automatically.' });
          updateProgress('AI Analysis Temporarily Paused (Waiting for Capacity)', 25);
        } else {
          semanticTaskManager.updateTaskStatus(docMapTask.taskId, 'FAILED', { error: errStr });
        }
        throw mapErr;
      }

      console.log(`[HybridExtractionOrchestrator] Document Map complete for ${docMap.documentIssuer || 'Issuer'}. Statements identified: ${docMap.primaryStatements.length}`);
      updateProgress('Identifying Companies & Reporting Periods', 35);

      // Step 3: Targeted Primary Statement Extractions
      const allExtractedCandidates: StatementFactCandidate[] = [];
      const validStatements = docMap.primaryStatements.filter(s => s.statementType !== 'UNKNOWN' && s.physicalPageCandidates && s.physicalPageCandidates.length > 0);

      for (let sIdx = 0; sIdx < validStatements.length; sIdx++) {
        const statement = validStatements[sIdx];
        let taskType: any = 'EXTRACT_INCOME_STATEMENT';
        if (statement.statementType.includes('BALANCE')) taskType = 'EXTRACT_BALANCE_SHEET';
        else if (statement.statementType.includes('CASH')) taskType = 'EXTRACT_CASH_FLOW';
        else if (statement.statementType.includes('EQUITY')) taskType = 'EXTRACT_EQUITY';

        const stmtTask = semanticTaskManager.createTask({
          intakeId: params.intakeId,
          documentId: params.documentId,
          taskType,
          stageLabel: `Reading ${statement.statementTitle || statement.statementType}`
        });
        semanticTaskManager.updateTaskStatus(stmtTask.taskId, 'RUNNING');

        const stmtPct = 35 + Math.round(((sIdx + 1) / (validStatements.length || 1)) * 35);
        updateProgress(`Reading ${statement.statementTitle || statement.statementType}`, stmtPct);

        try {
          const candidates = await structuredStatementExtractor.extractPrimaryStatement({
            filePath: params.filePath,
            documentHash: params.documentHash,
            statementType: statement.statementType,
            targetPhysicalPages: statement.physicalPageCandidates,
            reportingEntity: statement.reportingEntity || docMap.documentIssuer,
            reportingPeriod: params.period || 'FY2025'
          });
          allExtractedCandidates.push(...candidates);
          semanticTaskManager.updateTaskStatus(stmtTask.taskId, 'COMPLETED', { factsProduced: candidates.length });
        } catch (stmtErr: any) {
          console.warn(`[HybridExtractionOrchestrator] Primary statement extraction warn for ${statement.statementType}:`, stmtErr);
          if (stmtErr?.message?.includes('429') || stmtErr?.message?.includes('RESOURCE_EXHAUSTED')) {
            semanticTaskManager.updateTaskStatus(stmtTask.taskId, 'WAITING_FOR_AI_CAPACITY', { error: 'Gemini capacity reached. Paused automatically.' });
          } else {
            semanticTaskManager.updateTaskStatus(stmtTask.taskId, 'COMPLETED_WITH_WARNINGS', { error: stmtErr.message });
          }
        }
      }

      console.log(`[HybridExtractionOrchestrator] Extracted ${allExtractedCandidates.length} fact candidates across primary statements.`);

      // Step 4: Evidence Cross-Check against Native Text & Page Manifests
      const evTask = semanticTaskManager.createTask({
        intakeId: params.intakeId,
        documentId: params.documentId,
        taskType: 'EVIDENCE_CROSSCHECK',
        stageLabel: 'Verifying Source Evidence'
      });
      semanticTaskManager.updateTaskStatus(evTask.taskId, 'RUNNING');
      updateProgress('Verifying Source Evidence', 75);

      const evidenceResults: EvidenceCrossCheckResult[] = [];
      allExtractedCandidates.forEach(cand => {
        const checkRes = EvidenceCrossCheckEngine.verifyCandidateAgainstSource(
          cand,
          parsedDoc.pageManifests,
          parsedDoc.sourceBlocks
        );
        evidenceResults.push(checkRes);
      });

      const confirmedCount = evidenceResults.filter(e => e.evidenceStatus === 'CONFIRMED' || e.evidenceStatus === 'VISUALLY_CONFIRMED').length;
      console.log(`[HybridExtractionOrchestrator] Evidence Cross-Check: ${confirmedCount} / ${allExtractedCandidates.length} facts confirmed against source.`);
      semanticTaskManager.updateTaskStatus(evTask.taskId, 'COMPLETED', { factsVerified: confirmedCount });

      // Step 5: Canonical Fact Resolution & Scale/Currency Normalization
      const reconTask = semanticTaskManager.createTask({
        intakeId: params.intakeId,
        documentId: params.documentId,
        taskType: 'ACCOUNTING_RECONCILIATION',
        stageLabel: 'Reconciling Financial Statements'
      });
      semanticTaskManager.updateTaskStatus(reconTask.taskId, 'RUNNING');
      updateProgress('Reconciling Financial Statements', 85);

      const rawFactList: ExtractedFact[] = [];
      
      evidenceResults.forEach((ev, idx) => {
        const c = ev.candidate;
        const normLower = (c.metricLabel || c.rowLabel || "").toLowerCase();

        let fType = "general";
        if (normLower.includes("revenue") || normLower.includes("sales") || normLower.includes("turnover")) fType = "revenue";
        else if (normLower.includes("operating profit") || normLower.includes("net income") || normLower.includes("profit")) fType = "income";
        else if (normLower.includes("asset")) fType = "asset";
        else if (normLower.includes("liabilit")) fType = "liability";
        else if (normLower.includes("equity") || normLower.includes("patrimonio")) fType = "equity";

        // Use Eve Authoritative Normalization
        const normRes = normalizeFinancialValue({
          rawNumericValue: c.rawValue,
          tableScale: c.scale,
          currency: c.currency || params.currency || "EUR",
          contextText: `${c.rowLabel || ''} ${c.metricLabel || ''} ${c.sourceQuote || ''}`
        });

        // Block candidate if scale unresolved or value invalid
        if (normRes.normalizedBaseValue === null || normRes.resolvedScale === "UNKNOWN" && normRes.isAmbiguous) {
          console.warn(`[HybridExtractionOrchestrator] BLOCKED fact candidate due to unresolved scale/value: ${c.rowLabel} (${c.rawValue})`);
          return;
        }

        const normalizedVal = String(normRes.normalizedBaseValue);

        rawFactList.push({
          id: `FCT-HYBRID-${params.documentId}-${idx + 1}`,
          workspaceId: params.workspaceId,
          documentId: params.documentId,
          factType: fType,
          extractionEngine: 'HYBRID_GEMINI_NATIVE',
          labelOriginal: c.rowLabel || c.metricLabel,
          labelNormalized: c.canonicalMetricCandidate || c.metricLabel,
          canonicalMetric: c.canonicalMetricCandidate || fType,
          statementType: c.statementType as any,
          valueOriginal: c.rawValue,
          valueFunctional: normalizedVal,
          normalizedValue: normRes.normalizedBaseValue,
          currencyOriginal: normRes.currency || c.currency || params.currency || "EUR",
          functionalCurrency: normRes.currency || c.currency || params.currency || "EUR",
          currency: normRes.currency || c.currency || params.currency || "EUR",
          unitScale: normRes.resolvedScale,
          normalizedScaleMultiplier: normRes.scaleMultiplier,
          exchangeRate: "1.0000",
          periodStart: "2025-01-01",
          periodEnd: "2025-12-31",
          pageNumber: c.physicalPage,
          sourceText: ev.matchedSourceText || c.sourceQuote || c.rowLabel,
          confidence: ev.confidenceScore,
          status: ev.evidenceStatus === 'CONFIRMED' || ev.evidenceStatus === 'VISUALLY_CONFIRMED' ? 'approved' : 'pending_review',
          extractionMethod: `HYBRID_GEMINI_NATIVE_${c.statementType}`
        });
      });

      // Resolve Canonical Facts
      const canonicalFacts = CanonicalFactResolver.promotePrimaryStatementFacts(rawFactList);

      // Step 6: Accounting Equation Validations
      const accountingValidations: any[] = [];
      const revFact = canonicalFacts.find(f => f.factType === 'revenue');
      const assetFact = canonicalFacts.find(f => f.factType === 'asset');
      const liabFact = canonicalFacts.find(f => f.factType === 'liability');
      const eqFact = canonicalFacts.find(f => f.factType === 'equity');

      if (assetFact && liabFact && eqFact) {
        const assets = parseFloat(assetFact.valueFunctional) || 0;
        const liab = parseFloat(liabFact.valueFunctional) || 0;
        const eq = parseFloat(eqFact.valueFunctional) || 0;
        const diff = Math.abs(assets - (liab + eq));

        accountingValidations.push({
          equation: 'Assets = Liabilities + Equity',
          passed: diff < 1000,
          variance: diff,
          leftHand: assets,
          rightHand: liab + eq
        });
      }

      semanticTaskManager.updateTaskStatus(reconTask.taskId, 'COMPLETED');

      // Step 7: Project Materialization Task
      const matTask = semanticTaskManager.createTask({
        intakeId: params.intakeId,
        documentId: params.documentId,
        taskType: 'PROJECT_MATERIALIZATION',
        stageLabel: 'Preparing Project'
      });
      semanticTaskManager.updateTaskStatus(matTask.taskId, 'RUNNING');
      updateProgress('Preparing Project', 95);
      semanticTaskManager.updateTaskStatus(matTask.taskId, 'COMPLETED');
      updateProgress('Complete', 100);

      const durationMs = Date.now() - startTime;
      console.log(`[HybridExtractionOrchestrator] Completed Hybrid Pipeline in ${durationMs} ms. Resolved ${canonicalFacts.length} canonical facts.`);

      return {
        success: true,
        intakeId: params.intakeId,
        documentId: params.documentId,
        workspaceId: params.workspaceId,
        physicalPagesTotal,
        factsCandidateCount: allExtractedCandidates.length,
        factsConfirmedCount: confirmedCount,
        factsCanonicalCount: canonicalFacts.length,
        canonicalFacts,
        evidenceResults,
        documentMap: docMap,
        accountingValidations,
        processingDurationMs: durationMs
      };

    } catch (err: any) {
      console.error(`[HybridExtractionOrchestrator] Error processing document ${params.documentId}:`, err);
      return {
        success: false,
        intakeId: params.intakeId,
        documentId: params.documentId,
        workspaceId: params.workspaceId,
        physicalPagesTotal: 0,
        factsCandidateCount: 0,
        factsConfirmedCount: 0,
        factsCanonicalCount: 0,
        canonicalFacts: [],
        evidenceResults: [],
        documentMap: null,
        accountingValidations: [],
        processingDurationMs: Date.now() - startTime,
        error: err.message || String(err)
      };
    }
  }
}

export const hybridExtractionOrchestrator = new HybridExtractionOrchestrator();

