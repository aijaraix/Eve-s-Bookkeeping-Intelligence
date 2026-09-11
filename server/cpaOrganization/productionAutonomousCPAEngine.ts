/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PRODUCTION AUTONOMOUS CPA ENGINE
 * 
 * Master Production Orchestrator for Fully Autonomous Practice Engagements.
 * 
 * Replaces all legacy certification test engines (H940, H941) with ONE unified,
 * zero-bypass, authentic production execution pipeline.
 * 
 * Strict Production Graph:
 * Heartbeat (15s)
 *   → Autonomous Discovery (Dynamic CIK / Submissions lookup)
 *   → Real SEC EDGAR Network Acquisition (Physical bytes persistence & SHA-256)
 *   → Synthetic Contamination & Authority Gate (Fail-closed)
 *   → Customer Simulator Real Browser Intake (Headless Chrome process)
 *   → Cryptographic Hash Continuity Verification (Source → Staging → Server)
 *   → Universal Document IR & Fact Promotion
 *   → Hermes Specialist Swarm Dispatch (9 Specialist Agents)
 *   → Professional PBC Collaboration & Review Clearance
 *   → Deliverable Artifact Compilation (PDF / Excel / CSV / JSON)
 *   → Independent First-Line Internal Audit (Fail-closed)
 *   → Minerva Sealed Academy Examination
 *   → Academy Learning Synthesis & Persistent Memory
 *   → Sequential Engagement Close
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { secEdgarProductionClient } from './secEdgarProductionClient.js';
import { syntheticContaminationGuard } from './syntheticContaminationGuard.js';
import { realBrowserCustomerSimulatorEngine, RealBrowserJourneyResult } from './realBrowserCustomerSimulatorEngine.js';
import { deepDocumentExtractionPipeline } from './deepDocumentExtractionPipeline.js';
import { hermesJobDispatchService, SwarmExecutionSummary } from './hermesJobDispatchService.js';
import { eveInternalAuditEngine, EngagementInternalAuditReport } from './eveInternalAuditEngine.js';
import { academyMinervaLab, EvaluationReport } from './academyMinervaLab.js';
import { deliverableArtifactService } from './deliverableArtifactService.js';

export interface ProductionEngagementSummary {
  engagementId: string;
  ticker: string;
  cik: string;
  entityName: string;
  fiscalYear: string;
  accessionNumber: string;
  documentUrl: string;
  physicalFilePath: string;
  physicalSizeBytes: number;
  physicalSha256: string;
  browserSessionId: string;
  browserVersion: string;
  hashContinuityVerified: boolean;
  leafElementsCount: number;
  extractedFactsCount: number;
  reportedAssets: number;
  reportedLiabilities: number;
  reportedEquity: number;
  euclidVarianceUsd: number;
  swarmExecution: SwarmExecutionSummary;
  deliverablePackageId: string;
  internalAuditReport: EngagementInternalAuditReport;
  minervaExamScore: number;
  minervaStatus: string;
  status: 'ENGAGEMENT_CERTIFIED_CLOSED' | 'ENGAGEMENT_FAILED';
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export class ProductionAutonomousCPAEngine {
  private static instance: ProductionAutonomousCPAEngine;
  private activeEngagementLock = false;
  private currentSlotIndex = 0;
  private completedEngagements: ProductionEngagementSummary[] = [];

  // Excluded historical / development quarantine tickers to prevent cross-contamination
  private readonly quarantinedTickers = new Set<string>([
    'PFE', 'BA', 'GM', 'JPM', 'CVX', 'HD', 'NEE', 'MAR', 'DE', 'CAT', 'SNOW', 'PLTR'
  ]);

  private constructor() {
    const memoryDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'production_engagements');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
  }

  public static getInstance(): ProductionAutonomousCPAEngine {
    if (!ProductionAutonomousCPAEngine.instance) {
      ProductionAutonomousCPAEngine.instance = new ProductionAutonomousCPAEngine();
    }
    return ProductionAutonomousCPAEngine.instance;
  }

  public isLocked(): boolean {
    return this.activeEngagementLock;
  }

  public getCompletedEngagements(): ProductionEngagementSummary[] {
    return this.completedEngagements;
  }

  /**
   * Executes a single authentic production engagement from live SEC retrieval to audit sign-off.
   */
  public async executeProductionEngagement(targetCikOrTicker: string): Promise<ProductionEngagementSummary> {
    if (this.activeEngagementLock) {
      throw new Error('[ProductionAutonomousCPAEngine] Concurrency Violation: An engagement is currently in progress. Engagements must execute strictly sequentially.');
    }

    this.activeEngagementLock = true;
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const engagementId = `eng-prod-${targetCikOrTicker.toLowerCase()}-${Date.now()}`;

    console.log(`\n============================================================`);
    console.log(`[EVE PRODUCTION CPA] Starting Engagement: ${engagementId} (${targetCikOrTicker})`);
    console.log(`============================================================\n`);

    try {
      // 1. Dynamic SEC EDGAR Discovery & Submission Resolution
      console.log(`[Stage 1/11] Querying SEC EDGAR Submissions for ${targetCikOrTicker}...`);
      const { metadata, latest10K } = await secEdgarProductionClient.getRegistrantSubmissions(targetCikOrTicker);

      // 2. Real SEC Network Acquisition
      console.log(`[Stage 2/11] Downloading physical 10-K bytes from SEC EDGAR (${latest10K.documentUrl})...`);
      const acquisition = await secEdgarProductionClient.acquireAuthoritative10K(latest10K);

      // 3. Synthetic Contamination Guard (Fail-Closed)
      console.log(`[Stage 3/11] Validating physical source against Synthetic Contamination Guard...`);
      const contamination = syntheticContaminationGuard.assertAuthoritative(acquisition.physicalFilePath);

      // 4. Real Browser Customer Intake (Headless Chrome)
      console.log(`[Stage 4/11] Spawning real headless Chrome process for Customer Intake...`);
      const browserResult: RealBrowserJourneyResult = await realBrowserCustomerSimulatorEngine.executeBrowserCustomerJourney({
        clientName: metadata.entityName,
        ticker: metadata.ticker,
        engagementId,
        physicalSourcePath: acquisition.physicalFilePath
      });

      // 5. Cryptographic Hash Continuity Verification (Source → Staging → Server)
      console.log(`[Stage 5/11] Verifying cryptographic hash continuity across source, staging, and server boundaries...`);
      if (!browserResult.hashContinuityVerified || browserResult.sourceSha256 !== acquisition.actualSha256) {
        throw new Error(`[ProductionAutonomousCPAEngine] Hash continuity breach: SEC=${acquisition.actualSha256}, Staged=${browserResult.stagingSha256}, Received=${browserResult.serverReceivedSha256}`);
      }

      // 6. Universal Document IR & Fact Ingestion (Authoritative Deep Extraction Pipeline)
      console.log(`[Stage 6/11] Executing Deep Document Extraction Pipeline & Universal Document IR...`);
      const extractionResult = deepDocumentExtractionPipeline.runExtraction(acquisition.physicalFilePath);
      
      const leafCount = extractionResult.completenessAudit.leafContentElementsDetected;
      const tablesCount = extractionResult.completenessAudit.totalTablesDetected;
      const xbrlCount = extractionResult.totalNonFractionTagsFound;

      const reportedAssets = extractionResult.metrics.totalAssetsUsd;
      const reportedLiabilities = extractionResult.metrics.totalLiabilitiesUsd;
      const reportedEquity = extractionResult.metrics.stockholdersEquityUsd;

      // Fail-closed if any primary balance sheet element is missing. DO NOT derive equity = assets - liabilities!
      if (reportedAssets <= 0 || reportedLiabilities <= 0 || reportedEquity <= 0) {
        throw new Error(
          `[ProductionAutonomousCPAEngine] Fail-Closed: Authoritative extraction could not establish complete Balance Sheet facts ` +
          `(Assets=$${reportedAssets}, Liabilities=$${reportedLiabilities}, Equity=$${reportedEquity}) from physical source ${acquisition.physicalFilePath}. Unresolved accounting facts.`
        );
      }

      // Count actual discovered accounts and taxonomy concepts from extraction (no floor minimums)
      const discoveredAssetAccounts = extractionResult.atomicDataPoints.filter(dp => dp.canonicalMetric.toLowerCase().includes('asset')).length;
      const discoveredLiabAccounts = extractionResult.atomicDataPoints.filter(dp => dp.canonicalMetric.toLowerCase().includes('liabilit')).length;
      const discoveredEquityAccounts = extractionResult.atomicDataPoints.filter(dp => dp.canonicalMetric.toLowerCase().includes('equity')).length;

      // 7. Real Hermes Multi-Agent Specialist Swarm (Durable Contracts)
      console.log(`[Stage 7/11] Dispatching Hermes multi-agent specialist work contracts...`);
      const swarmSummary = await hermesJobDispatchService.executeCpaSpecialistSwarm({
        engagementId,
        clientName: metadata.entityName,
        ticker: metadata.ticker,
        fiscalYear: latest10K.reportDate || 'FY2025',
        reportedAssets,
        reportedLiabilities,
        reportedEquity,
        sourceFilePath: acquisition.physicalFilePath,
        sourceSha256: acquisition.actualSha256,
        extractedFactsCount: extractionResult.atomicDataPoints.length,
        discoveredAccounts: {
          assetAccountsCount: discoveredAssetAccounts,
          liabilityAccountsCount: discoveredLiabAccounts,
          equityAccountsCount: discoveredEquityAccounts
        },
        taxonomyMetrics: {
          uniqueConceptsCount: extractionResult.uniqueConceptsCount,
          customExtensionsCount: 0,
          dimensionContextsCount: extractionResult.atomicDataPoints.length
        },
        customerPbcUploaded: false,
        customerPbcFilesCount: 0
      });

      // 8. Deliverable Package Generation
      console.log(`[Stage 8/11] Compiling statutory deliverable artifact package...`);
      const deliverable = await deliverableArtifactService.compileAndRegisterDeliverable({
        engagementId,
        clientName: metadata.entityName,
        period: latest10K.reportDate || 'FY 2025',
        euclidBalance: {
          assets: reportedAssets,
          liabilities: reportedLiabilities,
          equity: reportedEquity,
          variance: swarmSummary.euclidVarianceUsd
        }
      });

      // 9. Independent First-Line Internal Audit (Fail-Closed)
      console.log(`[Stage 9/11] Executing independent First-Line Internal Audit...`);
      const internalAuditReport = eveInternalAuditEngine.executeEngagementAudit({
        projectId: 'PROD-CPA-PRACTICE',
        engagementId,
        entityName: metadata.entityName,
        ticker: metadata.ticker,
        cik: metadata.cik,
        periodEnded: latest10K.reportDate || '2025-12-31',
        physicalFilePath: acquisition.physicalFilePath,
        expectedBytes: acquisition.actualBytes,
        expectedSha256: acquisition.actualSha256,
        reportedAssets,
        reportedLiabilities,
        reportedStockholdersEquity: reportedEquity,
        leafElementsDetected: leafCount,
        totalTablesDetected: tablesCount,
        totalXbrlFactsDetected: xbrlCount,
        totalAtomicDataPointsDetected: extractionResult.atomicDataPoints.length
      });

      if (internalAuditReport.status !== 'INTERNAL_AUDIT_PASSED') {
        throw new Error(`[ProductionAutonomousCPAEngine] Internal Audit Gate Failed: ${internalAuditReport.scorecard.finalOpinion}`);
      }

      // 10. Independent Minerva Sealed Exam & Live Engagement Validation (Genuine Evaluation)
      console.log(`[Stage 10/11] Evaluating physical source and solver output under Minerva Sealed Academy Lab...`);
      const minervaSourceEval = academyMinervaLab.evaluateAuthoritativePhysicalSource(acquisition.physicalFilePath);
      if (!minervaSourceEval.passed) {
        throw new Error(`[ProductionAutonomousCPAEngine] Minerva rejected physical source: ${minervaSourceEval.details.join('; ')}`);
      }

      // Evaluate actual extraction and solver outputs against Minerva live engagement validation
      const minervaLiveReport = academyMinervaLab.evaluateLiveEngagement({
        facts: extractionResult.atomicDataPoints,
        assets: reportedAssets,
        liabilities: reportedLiabilities,
        equity: reportedEquity,
        variance: swarmSummary.euclidVarianceUsd,
        physicalFilePath: acquisition.physicalFilePath,
        physicalSha256: acquisition.actualSha256
      });

      if (minervaLiveReport.certifiedStatus !== 'TECHNICAL_VALIDATION_PASSED') {
        throw new Error(`[ProductionAutonomousCPAEngine] Minerva Live Validation Failed: status=${minervaLiveReport.certifiedStatus}`);
      }

      // 11. Academy Learning Handoff & Memory
      console.log(`[Stage 11/11] Synthesizing Academy Learning and closing engagement boundary...`);
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      const summary: ProductionEngagementSummary = {
        engagementId,
        ticker: metadata.ticker,
        cik: metadata.cik,
        entityName: metadata.entityName,
        fiscalYear: latest10K.reportDate || 'FY2025',
        accessionNumber: latest10K.accessionNumber,
        documentUrl: latest10K.documentUrl,
        physicalFilePath: acquisition.physicalFilePath,
        physicalSizeBytes: acquisition.actualBytes,
        physicalSha256: acquisition.actualSha256,
        browserSessionId: browserResult.browserSessionId,
        browserVersion: browserResult.browserVersion,
        hashContinuityVerified: true,
        leafElementsCount: leafCount,
        extractedFactsCount: extractionResult.atomicDataPoints.length,
        reportedAssets,
        reportedLiabilities,
        reportedEquity,
        euclidVarianceUsd: swarmSummary.euclidVarianceUsd,
        swarmExecution: swarmSummary,
        deliverablePackageId: deliverable.reportId,
        internalAuditReport,
        minervaExamScore: minervaLiveReport.score,
        minervaStatus: minervaLiveReport.certifiedStatus,
        status: 'ENGAGEMENT_CERTIFIED_CLOSED',
        startedAt,
        completedAt,
        durationMs
      };

      this.completedEngagements.push(summary);

      // Persist engagement audit record
      const persistPath = path.join(process.cwd(), 'storage', 'cpa_memory', 'production_engagements', `${engagementId}.json`);
      fs.writeFileSync(persistPath, JSON.stringify(summary, null, 2));

      console.log(`[ProductionAutonomousCPAEngine] Engagement ${engagementId} successfully certified and closed in ${durationMs}ms.\n`);
      return summary;
    } finally {
      this.activeEngagementLock = false;
    }
  }
}

export const productionAutonomousCPAEngine = ProductionAutonomousCPAEngine.getInstance();
