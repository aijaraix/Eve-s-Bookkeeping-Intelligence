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
import { extractBankStatementFromDocument } from '../bankStatementExtractor.js';
import {
  looksLikeBankStatement,
  derivePeriodBounds,
  isConfirmedEvidenceStatus
} from '../failClosedGuards.js';
import { SpreadsheetParser } from '../../src/lib/parser/spreadsheetParser.js';

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
  pageManifests?: any[];
  sourceBlocks?: any[];
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
      const ext = path.extname(params.originalFilename || params.filePath || '').toLowerCase();
      const isSpreadsheet = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv', '.ods'].includes(ext);
      const mimeType = isSpreadsheet
        ? (ext === '.csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        : 'application/pdf';

      let parsedDoc = await this.parser.parse({
        filename: params.originalFilename,
        originalName: params.originalFilename,
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType
      });

      if (isSpreadsheet) {
        try {
          const sheetParser = new SpreadsheetParser();
          parsedDoc = await sheetParser.parse({
            filename: params.originalFilename,
            originalName: params.originalFilename,
            buffer: fileBuffer,
            size: fileBuffer.length,
            mimeType
          }, await sheetParser.inspect({
            filename: params.originalFilename,
            originalName: params.originalFilename,
            buffer: fileBuffer,
            size: fileBuffer.length,
            mimeType
          }));
        } catch (sheetErr) {
          console.warn('[HybridExtractionOrchestrator] Spreadsheet parse warning:', sheetErr);
        }
      }

      const physicalPagesTotal = parsedDoc.pageManifests?.length || parsedDoc.metadata.pages || 1;
      console.log(`[HybridExtractionOrchestrator] Deterministic Physical Page Inventory: ${physicalPagesTotal} pages identified.`);
      updateProgress('Preparing Documents', 15);

      const parsedText = `${parsedDoc.markdown || ''} ${(parsedDoc.sections || []).map((s: any) => s.text || '').join(' ')}`;
      const bankDoc = looksLikeBankStatement(params.originalFilename, parsedText);

      if (bankDoc || (isSpreadsheet && looksLikeBankStatement(params.originalFilename, parsedText))) {
        updateProgress('Reading Bank Statement', 40);
        const bankRes = extractBankStatementFromDocument({
          doc: parsedDoc,
          workspaceId: params.workspaceId,
          documentId: params.documentId,
          filename: params.originalFilename,
          currency: params.currency
        });
        if (!bankRes.success) {
          return {
            success: false,
            intakeId: params.intakeId,
            documentId: params.documentId,
            workspaceId: params.workspaceId,
            physicalPagesTotal,
            factsCandidateCount: 0,
            factsConfirmedCount: 0,
            factsCanonicalCount: 0,
            canonicalFacts: [],
            evidenceResults: [],
            documentMap: { documentType: 'BANK_STATEMENT' },
            accountingValidations: [],
            processingDurationMs: Date.now() - startTime,
            pageManifests: parsedDoc.pageManifests || [],
            sourceBlocks: parsedDoc.sourceBlocks || [],
            error: bankRes.error || 'Bank statement parse missed.'
          };
        }

        const accountingValidations = AccountingValidationEngine.validateWorkspace(params.workspaceId, bankRes.facts);
        updateProgress('Complete', 100);
        return {
          success: true,
          intakeId: params.intakeId,
          documentId: params.documentId,
          workspaceId: params.workspaceId,
          physicalPagesTotal,
          factsCandidateCount: bankRes.facts.length,
          factsConfirmedCount: 0,
          factsCanonicalCount: bankRes.facts.length,
          canonicalFacts: bankRes.facts,
          evidenceResults: [],
          documentMap: { documentType: 'BANK_STATEMENT', primaryReportingCurrency: params.currency },
          accountingValidations: accountingValidations ? [accountingValidations] : [],
          processingDurationMs: Date.now() - startTime,
          pageManifests: parsedDoc.pageManifests || [],
          sourceBlocks: parsedDoc.sourceBlocks || []
        };
      }

      if (isSpreadsheet) {
        updateProgress('Reading Spreadsheet', 50);
        const tableFacts: ExtractedFact[] = [];
        (parsedDoc.tables || []).forEach((table: any, tIdx: number) => {
          (table.rows || []).forEach((row: string[], rIdx: number) => {
            if (!row || row.length < 2) return;
            const label = String(row[0] || '').trim();
            if (!label || !/[a-zA-Z]{3,}/.test(label)) return;
            for (let i = 1; i < row.length; i++) {
              const cell = String(row[i] || '').trim();
              const numMatch = cell.match(/-?\(?\$?€?£?\s*[\d,]+(?:\.\d+)?\)?/);
              if (!numMatch) continue;
              const source = `${label} | ${row.join(' | ')}`;
              if (!cell || !source.includes(cell)) continue;
              const clean = numMatch[0].replace(/[^\d.-]/g, '');
              const parsed = parseFloat(clean.replace(/,/g, ''));
              if (Number.isNaN(parsed) || parsed === 0) continue;
              tableFacts.push({
                id: `FCT-SHEET-${params.documentId}-${tIdx}-${rIdx}-${i}`,
                workspaceId: params.workspaceId,
                documentId: params.documentId,
                factType: 'general',
                extractionEngine: 'DETERMINISTIC_NATIVE',
                labelOriginal: label,
                labelNormalized: label,
                valueOriginal: cell,
                valueFunctional: String(parsed),
                normalizedValue: parsed,
                currencyOriginal: params.currency || '',
                functionalCurrency: params.currency || '',
                pageNumber: table.pageNumber || tIdx + 1,
                sourceText: source,
                status: 'pending_review',
                extractionMethod: 'SPREADSHEET_CELL'
              } as ExtractedFact);
              break;
            }
          });
        });
        const accountingValidations = AccountingValidationEngine.validateWorkspace(params.workspaceId, tableFacts);
        return {
          success: true,
          intakeId: params.intakeId,
          documentId: params.documentId,
          workspaceId: params.workspaceId,
          physicalPagesTotal,
          factsCandidateCount: tableFacts.length,
          factsConfirmedCount: 0,
          factsCanonicalCount: tableFacts.length,
          canonicalFacts: tableFacts,
          evidenceResults: [],
          documentMap: { documentType: 'SPREADSHEET' },
          accountingValidations: accountingValidations ? [accountingValidations] : [],
          processingDurationMs: Date.now() - startTime,
          pageManifests: parsedDoc.pageManifests || [],
          sourceBlocks: parsedDoc.sourceBlocks || []
        };
      }

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

      const periodFromMap = docMap.fiscalPeriods?.[0] || docMap.primaryStatements?.[0]?.period || params.period;
      const currencyFromMap = docMap.primaryReportingCurrency || docMap.currencies?.[0] || params.currency;
      const periodBounds = derivePeriodBounds(periodFromMap);

      if (looksLikeBankStatement(params.originalFilename, parsedText, docMap.documentType)) {
        updateProgress('Reading Bank Statement', 40);
        const bankRes = extractBankStatementFromDocument({
          doc: parsedDoc,
          workspaceId: params.workspaceId,
          documentId: params.documentId,
          filename: params.originalFilename,
          currency: currencyFromMap
        });
        if (!bankRes.success) {
          return {
            success: false,
            intakeId: params.intakeId,
            documentId: params.documentId,
            workspaceId: params.workspaceId,
            physicalPagesTotal,
            factsCandidateCount: 0,
            factsConfirmedCount: 0,
            factsCanonicalCount: 0,
            canonicalFacts: [],
            evidenceResults: [],
            documentMap: docMap,
            accountingValidations: [],
            processingDurationMs: Date.now() - startTime,
            pageManifests: parsedDoc.pageManifests || [],
            sourceBlocks: parsedDoc.sourceBlocks || [],
            error: bankRes.error || 'Bank statement parse missed.'
          };
        }
        const accountingValidations = AccountingValidationEngine.validateWorkspace(params.workspaceId, bankRes.facts);
        return {
          success: true,
          intakeId: params.intakeId,
          documentId: params.documentId,
          workspaceId: params.workspaceId,
          physicalPagesTotal,
          factsCandidateCount: bankRes.facts.length,
          factsConfirmedCount: 0,
          factsCanonicalCount: bankRes.facts.length,
          canonicalFacts: bankRes.facts,
          evidenceResults: [],
          documentMap: docMap,
          accountingValidations: accountingValidations ? [accountingValidations] : [],
          processingDurationMs: Date.now() - startTime,
          pageManifests: parsedDoc.pageManifests || [],
          sourceBlocks: parsedDoc.sourceBlocks || []
        };
      }

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
            reportingPeriod: statement.period || periodFromMap
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

      const notePlans = NoteExtractionPlanner.planMaterialNoteTasks(params.intakeId, params.documentId, docMap);
      for (let nIdx = 0; nIdx < notePlans.length; nIdx++) {
        const notePlan = notePlans[nIdx];
        const notePages = notePlan.resultData?.physicalPages || [];
        if (!notePages.length) continue;
        const noteTask = semanticTaskManager.createTask({
          intakeId: params.intakeId,
          documentId: params.documentId,
          taskType: 'EXTRACT_NOTE',
          stageLabel: `Reading note ${notePlan.resultData?.noteTitle || notePlan.resultData?.noteNumber || nIdx + 1}`
        });
        semanticTaskManager.updateTaskStatus(noteTask.taskId, 'RUNNING');
        try {
          const noteCandidates = await structuredStatementExtractor.extractPrimaryStatement({
            filePath: params.filePath,
            documentHash: params.documentHash,
            statementType: `FOOTNOTE_${notePlan.resultData?.noteCategory || 'DISCLOSURE'}`,
            targetPhysicalPages: notePages,
            reportingEntity: docMap.documentIssuer,
            reportingPeriod: periodFromMap
          });
          allExtractedCandidates.push(...noteCandidates);
          semanticTaskManager.updateTaskStatus(noteTask.taskId, 'COMPLETED', { factsProduced: noteCandidates.length });
        } catch (noteErr: any) {
          console.warn(`[HybridExtractionOrchestrator] Note extraction warning:`, noteErr);
          semanticTaskManager.updateTaskStatus(noteTask.taskId, 'COMPLETED_WITH_WARNINGS', { error: noteErr?.message });
        }
      }

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

      const confirmedCount = evidenceResults.filter(e => e.evidenceStatus === 'CONFIRMED').length;
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
          currencyOriginal: normRes.currency || c.currency || currencyFromMap || params.currency || "",
          functionalCurrency: normRes.currency || c.currency || currencyFromMap || params.currency || "",
          currency: normRes.currency || c.currency || currencyFromMap || params.currency || "",
          unitScale: normRes.resolvedScale,
          normalizedScaleMultiplier: normRes.scaleMultiplier,
          exchangeRate: "1.0000",
          periodStart: periodBounds.start,
          periodEnd: periodBounds.end,
          reportingPeriod: c.period || periodBounds.label || periodFromMap,
          pageNumber: c.physicalPage,
          sourceText: ev.matchedSourceText || c.sourceQuote || c.rowLabel,
          confidence: ev.confidenceScore,
          status: isConfirmedEvidenceStatus(ev.evidenceStatus) ? 'approved' : 'pending_review',
          extractionMethod: `HYBRID_GEMINI_NATIVE_${c.statementType}`
        });
      });

      // Resolve Canonical Facts
      const canonicalFacts = CanonicalFactResolver.promotePrimaryStatementFacts(rawFactList);

      // Step 6: Accounting Equation Validations (live engine — previously imported unused)
      const workspaceValidation = AccountingValidationEngine.validateWorkspace(params.workspaceId, canonicalFacts);
      const accountingValidations: any[] = workspaceValidation ? [workspaceValidation] : [];

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
        processingDurationMs: durationMs,
        pageManifests: parsedDoc.pageManifests || [],
        sourceBlocks: parsedDoc.sourceBlocks || []
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

