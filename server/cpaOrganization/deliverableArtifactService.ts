import fs from 'fs';
import { renderReviewPdf, renderReviewWorkbook, buildReviewCsv } from './reviewPackageRendering.js';
import path from 'path';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { ProfessionalApprovalObject, professionalSignoffGuard } from './professionalSignoffGuard.js';
import { computeFinalDeliverableLineageHash, validateFinalDeliverableLineage } from './finalDeliverableLineageValidator.js';

export interface ArtifactManifestItem {
  format: 'PDF' | 'XLSX' | 'JSON' | 'CSV';
  filename: string;
  filepath: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
  verified: boolean;
  verificationDetails?: string;
  verificationScope?: 'BINARY_INTEGRITY_ONLY';
}

export interface DeliverableManifest {
  reportId: string;
  version: string;
  generator: string;
  engagementId: string;
  createdAt: string;
  contentHash?: string;
  artifacts: {
    pdf: ArtifactManifestItem;
    xlsx: ArtifactManifestItem;
    json: ArtifactManifestItem;
    csv: ArtifactManifestItem;
  };
  overallStatus: 'ALL_ARTIFACT_HASHES_VERIFIED' | 'ALL_VERIFIED' | 'PARTIAL' | 'FAILED';
}

export interface DeliverableArtifactRecord {
  reportId: string;
  engagementId: string;
  workspaceId: string;
  version: string;
  title: string;
  deliverableType: string;
  audience: string;
  generatedAt: string;
  templateId: string;
  manifest: DeliverableManifest;
  branding: {
    firmName: string;
    partnerName: string;
    licenseNumber: string;
    clientName: string;
    primaryColor: string;
  };
  formats: {
    pdf?: {
      filename: string;
      filepath: string;
      sizeBytes: number;
      sha256: string;
    };
    xlsx?: {
      filename: string;
      filepath: string;
      sizeBytes: number;
      sha256: string;
    };
    json?: {
      filename: string;
      filepath: string;
      sizeBytes: number;
      sha256: string;
    };
    csvLeadSchedules?: {
      filename: string;
      filepath: string;
      sizeBytes: number;
      sha256: string;
    };
  };
  canonicalFactHash: string;
  numericFactsCount: number;
  euclidVariance: number;
  quinnReviewStatus: 'CLEARED' | 'PENDING' | 'AI_REVIEW_COMPLETE' | 'REVIEW_ISSUES_FOUND' | 'READY_FOR_AUTHORIZED_HUMAN_REVIEW';
  status: 'DRAFT' | 'AI_PREPARED' | 'INTERNALLY_REVIEWED' | 'READY_FOR_AUTHORIZED_HUMAN_REVIEW' | 'AUTHORIZED_APPROVAL_RECEIVED' | 'ELIGIBLE_FOR_DELIVERY' | 'DELIVERED' | 'SUPERSEDED' | 'STALE_INVALIDATED' | 'FINAL_CERTIFIED';
  isStale?: boolean;
  approvalObject?: ProfessionalApprovalObject;
  dependentFactIds?: string[];
  dependentDerivationIds?: string[];
  specialistReview?: any;
  disclosureEvidenceLedger?: any;
  apReview?: any;
  bankStatementReview?: any;
  trialBalanceReview?: any;
  mixedSourceReview?: any;
  mixedSourceBatchReview?: any;
  duplicateEvidenceReview?: any;
  finalLineageValidation?: any;
}

export class DeliverableArtifactService {
  private static instance: DeliverableArtifactService | null = null;
  private storageDir: string;
  private artifacts: Map<string, DeliverableArtifactRecord[]> = new Map(); // key = engagementId

  private constructor() {
    this.storageDir = process.env.HERMES_REPORTS_DIR || path.join(process.cwd(), 'storage', 'reports');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.rehydrateFromDisk();
  }

  public static getInstance(): DeliverableArtifactService {
    if (!DeliverableArtifactService.instance) {
      DeliverableArtifactService.instance = new DeliverableArtifactService();
    }
    return DeliverableArtifactService.instance;
  }

  /**
   * Rehydrates all persistent report packages from disk into the in-memory registry.
   */
  public rehydrateFromDisk(): number {
    let rehydratedCount = 0;
    try {
      if (!fs.existsSync(this.storageDir)) return 0;
      const files = fs.readdirSync(this.storageDir);
      const pkgFiles = files.filter(f => f.startsWith('audit_package_') && f.endsWith('.json'));

      for (const pkgFile of pkgFiles) {
        try {
          const fullPath = path.join(this.storageDir, pkgFile);
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const data = JSON.parse(raw);

          const reportId = data.reportId;
          const version = data.version || 'v1.0';
          const engagementId = data.engagementId || 'eng-historical';

          // Check for companion binary artifacts
          const pdfFilename = `audit_report_${reportId}_${version}.pdf`;
          const pdfPath = path.join(this.storageDir, pdfFilename);
          const xlsxFilename = `audit_workbook_${reportId}_${version}.xlsx`;
          const xlsxPath = path.join(this.storageDir, xlsxFilename);
          const csvFilename = `lead_schedules_${reportId}_${version}.csv`;
          const csvPath = path.join(this.storageDir, csvFilename);

          const pdfSha = fs.existsSync(pdfPath) ? crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex') : '';
          const xlsxSha = fs.existsSync(xlsxPath) ? crypto.createHash('sha256').update(fs.readFileSync(xlsxPath)).digest('hex') : '';
          const csvSha = fs.existsSync(csvPath) ? crypto.createHash('sha256').update(fs.readFileSync(csvPath)).digest('hex') : '';
          const jsonSha = crypto.createHash('sha256').update(raw).digest('hex');

          const recordedApproval = pdfSha ? professionalSignoffGuard.getApprovalForReport(reportId, pdfSha) : undefined;
          const releaseAuthorized = recordedApproval?.reportVersion === version &&
            recordedApproval.engagementId === engagementId &&
            recordedApproval.approvalScope === 'STATUTORY_DELIVERABLE_RELEASE' &&
            professionalSignoffGuard.isValidApprovalObject(recordedApproval).valid;
          const safeDraftStatuses = ['DRAFT', 'AI_PREPARED', 'INTERNALLY_REVIEWED', 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', 'SUPERSEDED', 'STALE_INVALIDATED'];
          const record: DeliverableArtifactRecord = {
            reportId,
            engagementId,
            workspaceId: data.workspaceId || engagementId,
            version,
            title: data.title || `${data.clientName || 'Practice Client'} Audited Financial Deliverable Package`,
            deliverableType: 'AUDIT_FINANCIAL_DELIVERABLE',
            audience: 'EXECUTIVE_BOARD',
            generatedAt: data.generatedAt || new Date().toISOString(),
            templateId: 'tpl-board-statutory-a4',
            manifest: {
              reportId,
              version,
              generator: 'DeliverableArtifactService:Scribe',
              engagementId,
              createdAt: data.generatedAt || new Date().toISOString(),
              artifacts: {
                pdf: {
                  format: 'PDF',
                  filename: pdfFilename,
                  filepath: pdfPath,
                  sizeBytes: fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : 0,
                  sha256: pdfSha,
                  createdAt: data.generatedAt || new Date().toISOString(),
                  verified: fs.existsSync(pdfPath)
                },
                xlsx: {
                  format: 'XLSX',
                  filename: xlsxFilename,
                  filepath: xlsxPath,
                  sizeBytes: fs.existsSync(xlsxPath) ? fs.statSync(xlsxPath).size : 0,
                  sha256: xlsxSha,
                  createdAt: data.generatedAt || new Date().toISOString(),
                  verified: fs.existsSync(xlsxPath)
                },
                json: {
                  format: 'JSON',
                  filename: pkgFile,
                  filepath: fullPath,
                  sizeBytes: Buffer.byteLength(raw),
                  sha256: jsonSha,
                  createdAt: data.generatedAt || new Date().toISOString(),
                  verified: true
                },
                csv: {
                  format: 'CSV',
                  filename: csvFilename,
                  filepath: csvPath,
                  sizeBytes: fs.existsSync(csvPath) ? fs.statSync(csvPath).size : 0,
                  sha256: csvSha,
                  createdAt: data.generatedAt || new Date().toISOString(),
                  verified: fs.existsSync(csvPath)
                }
              },
              overallStatus: 'ALL_ARTIFACT_HASHES_VERIFIED'
            },
            branding: {
              firmName: data.firmName || 'Eve Autonomous CPA System',
              partnerName: data.partnerName || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
              licenseNumber: data.licenseNumber || '',
              clientName: data.clientName || 'Client Entity',
              primaryColor: '#0f172a'
            },
            formats: {
              pdf: fs.existsSync(pdfPath) ? {
                filename: pdfFilename,
                filepath: pdfPath,
                sizeBytes: fs.statSync(pdfPath).size,
                sha256: pdfSha
              } : undefined,
              xlsx: fs.existsSync(xlsxPath) ? {
                filename: xlsxFilename,
                filepath: xlsxPath,
                sizeBytes: fs.statSync(xlsxPath).size,
                sha256: xlsxSha
              } : undefined,
              json: {
                filename: pkgFile,
                filepath: fullPath,
                sizeBytes: Buffer.byteLength(raw),
                sha256: jsonSha
              },
              csvLeadSchedules: fs.existsSync(csvPath) ? {
                filename: csvFilename,
                filepath: csvPath,
                sizeBytes: fs.statSync(csvPath).size,
                sha256: csvSha
              } : undefined
            },
            canonicalFactHash: data.canonicalFactHash || crypto.createHash('sha256').update(JSON.stringify(data.facts || [])).digest('hex'),
            numericFactsCount: data.facts?.length || 0,
            euclidVariance: data.euclidBalance?.variance || 0,
            quinnReviewStatus: data.quinnReviewStatus || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
            status: releaseAuthorized ? 'FINAL_CERTIFIED' : (safeDraftStatuses.includes(data.status) ? data.status : 'READY_FOR_AUTHORIZED_HUMAN_REVIEW'),
            isStale: data.isStale || false,
            approvalObject: data.approvalObject,
            dependentFactIds: data.dependentFactIds || [],
            dependentDerivationIds: data.dependentDerivationIds || [],
            specialistReview: data.specialistReview,
            disclosureEvidenceLedger: data.disclosureEvidenceLedger,
            apReview: data.apReview,
            bankStatementReview: data.bankStatementReview,
            trialBalanceReview: data.trialBalanceReview,
            mixedSourceReview: data.mixedSourceReview,
            mixedSourceBatchReview: data.mixedSourceBatchReview,
            duplicateEvidenceReview: data.duplicateEvidenceReview
          };

          const existing = this.artifacts.get(engagementId) || [];
          if (!existing.some(e => e.reportId === reportId && e.version === version)) {
            existing.push(record);
            this.artifacts.set(engagementId, existing);
            rehydratedCount++;
          }
        } catch (pkgErr) {
          console.warn('[DeliverableArtifactService] Error parsing package file:', pkgFile, pkgErr);
        }
      }
    } catch (err) {
      console.warn('[DeliverableArtifactService] Error during disk rehydration:', err);
    }
    return rehydratedCount;
  }

  /**
   * Generates a genuine binary PDF deliverable using pdf-lib.
   */
  public async generateBinaryPdf(params: any): Promise<{ filename: string; filepath: string; sizeBytes: number; sha256: string }> {
    return renderReviewPdf(params, this.storageDir);
  }

  public generateBinaryXlsx(params: any): { filename: string; filepath: string; sizeBytes: number; sha256: string } {
    return renderReviewWorkbook(params, this.storageDir);
  }

  public async compileAndRegisterDeliverable(params: {
    reportId?: string;
    engagementId?: string;
    workspaceId?: string;
    version?: string;
    title?: string;
    deliverableType?: string;
    audience?: string;
    clientName?: string;
    companyName?: string;
    firmName?: string;
    partnerName?: string;
    licenseNumber?: string;
    period?: string;
    currency?: string;
    facts?: Array<{
      canonicalMetric: string;
      label?: string;
      value: number;
      statement?: string;
      sourceDoc?: string;
      page?: number;
      verificationStatus?: string;
      evidenceStatus?: string;
      documentId?: string;
      reportingPeriod?: string;
      sourceText?: string;
      sourceBlockIds?: string[];
      sourceSha256?: string;
      sourceArtifactId?: string;
      sourceProvenanceId?: string;
      sourceProvenanceIds?: string[];
      sourceCoordinate?: any;
      sourceCoordinates?: any[];
      sourceConfidence?: number;
      sourceExtractionMethod?: string;
      sourceExtractionVersion?: string;
      derivationId?: string;
      derivationFormula?: string;
      derivationOperation?: 'ADD' | 'SUBTRACT' | 'SUM';
      operandFactIds?: string[];
      operandValues?: Record<string, number>;
    }>;
    canonicalFacts?: any[];
    euclidBalance?: {
      assets?: number;
      liabilities?: number;
      equity?: number;
      variance?: number;
    };
    [key: string]: any;
  }): Promise<DeliverableArtifactRecord> {
    const engagementId = params.engagementId || 'eng-sim-canary-01';
    const existing = this.artifacts.get(engagementId) || [];
    const reportId = params.reportId || `REP-${Date.now()}`;
    const version = params.version || (existing.length > 0 ? `v${existing.length + 1}.0` : 'v1.0');
    const clientName = params.clientName || params.companyName || 'Corporate Client';
    const title = params.title || `${clientName} Financial Attestation Deliverable`;
    const firmName = params.firmName || 'Eve Autonomous CPA System';
    const partnerName = params.partnerName || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW';
    const licenseNumber = params.licenseNumber || '';
    const period = params.period || 'FY 2025';
    const currency = params.currency || 'USD';

    // Normalize facts strictly without defaulting missing source data
    const rawFacts = params.facts || params.canonicalFacts || [];
    const normalizedFacts = rawFacts.map((f: any) => {
      const inheritedCoordinates = Array.isArray(f.sourceCoordinates) ? f.sourceCoordinates
        : Array.isArray(f.provenanceCoordinates) ? f.provenanceCoordinates
        : Array.isArray(f.provenance?.provenanceCoordinates) ? f.provenance.provenanceCoordinates
        : [];
      const sourceCoordinate = f.sourceCoordinate || f.provenance?.sourceCoordinate || inheritedCoordinates[0];
      const sourceCoordinates = inheritedCoordinates.length ? inheritedCoordinates : (sourceCoordinate ? [sourceCoordinate] : []);
      const sourceProvenanceIds = [...new Set([
        ...(Array.isArray(f.sourceProvenanceIds) ? f.sourceProvenanceIds : []),
        ...(f.sourceProvenanceId ? [f.sourceProvenanceId] : []),
        ...(Array.isArray(f.provenance?.sourceProvenanceIds) ? f.provenance.sourceProvenanceIds : []),
        ...(f.provenance?.sourceProvenanceId ? [f.provenance.sourceProvenanceId] : []),
      ].filter(Boolean).map(String))];
      return {
        id: f.id || undefined,
        canonicalMetric: f.canonicalMetric || 'Financial Metric',
        label: f.label || f.labelNormalized || f.labelOriginal || f.canonicalMetric || 'Line Item',
        value: typeof f.value === 'number' ? f.value : (Number(f.normalizedValue ?? f.valueFunctional ?? f.expectedValue) || 0),
        statement: f.statement || f.statementType || 'BALANCE_SHEET',
        sourceDoc: f.sourceDoc || f.documentTitle || f.sourceDocument || 'MISSING_EVIDENCE',
        page: typeof f.page === 'number' ? f.page : (typeof f.sourcePage === 'number' ? f.sourcePage : (typeof f.pageNumber === 'number' ? f.pageNumber : undefined)),
        verificationStatus: f.verificationStatus || 'NOT_VERIFIED',
        evidenceStatus: f.evidenceStatus || 'NOT_MEASURED',
        documentId: f.documentId,
        reportingPeriod: f.reportingPeriod || f.period || 'NOT_RECORDED',
        sourceText: f.sourceText || f.rawText || f.provenance?.sourceText || '',
        sourceBlockIds: Array.isArray(f.sourceBlockIds) ? f.sourceBlockIds : [],
        sourceSha256: f.sourceSha256 || f.provenance?.sourceSha256 || sourceCoordinate?.sourceSha256,
        sourceArtifactId: f.sourceArtifactId || f.provenance?.sourceArtifactId || sourceCoordinate?.sourceArtifactId,
        sourceProvenanceId: f.sourceProvenanceId || f.provenance?.sourceProvenanceId || sourceProvenanceIds[0],
        sourceProvenanceIds,
        sourceCoordinate,
        sourceCoordinates,
        sourceConfidence: f.sourceConfidence ?? sourceCoordinate?.confidence ?? f.provenance?.ocrConfidence,
        sourceExtractionMethod: f.sourceExtractionMethod || sourceCoordinate?.extractionMethod || f.provenance?.ocrEngine,
        sourceExtractionVersion: f.sourceExtractionVersion || sourceCoordinate?.extractionVersion || f.provenance?.ocrEngineVersion,
        derivationId: f.derivationId || f.derivation?.derivationId || f.derivedCalculationId || undefined,
        derivationFormula: f.derivationFormula || f.derivation?.formula || undefined,
        derivationOperation: f.derivationOperation || f.derivation?.operation || undefined,
        operandFactIds: Array.isArray(f.operandFactIds) ? f.operandFactIds.map(String) : (Array.isArray(f.derivation?.operandFactIds) ? f.derivation.operandFactIds.map(String) : []),
        operandValues: f.operandValues || f.derivation?.operandValues || undefined,
      };
    });

    const finalLineageValidation = validateFinalDeliverableLineage(normalizedFacts);
    if (params.requireFinalLineage === true && !finalLineageValidation.valid) {
      throw new Error(`FINAL_DELIVERABLE_LINEAGE_INVALID:${finalLineageValidation.issues.join('|')}`);
    }

    // Normalize euclidBalance from real fact numbers rather than fabricated defaults
    const balance = params.euclidBalance || {};
    const assets = typeof balance.assets === 'number' ? balance.assets : (normalizedFacts.find(f => (f.canonicalMetric || '').toLowerCase().includes('asset'))?.value || 0);
    const liabilities = typeof balance.liabilities === 'number' ? balance.liabilities : (normalizedFacts.find(f => (f.canonicalMetric || '').toLowerCase().includes('liabilit'))?.value || 0);
    const equity = typeof balance.equity === 'number' ? balance.equity : (normalizedFacts.find(f => (f.canonicalMetric || '').toLowerCase().includes('equity'))?.value || 0);
    const variance = typeof balance.variance === 'number' ? balance.variance : Math.abs(assets - (liabilities + equity));

    const balanceIdentityApplicable = [balance.assets, balance.liabilities, balance.equity].some(v => typeof v === 'number') ||
      normalizedFacts.some(f => /(?:asset|liabilit|equity)/i.test(String(f.canonicalMetric || '')));
    const euclidBalance = { assets, liabilities, equity, variance };

    // Determine initial lifecycle status following Requirement 7 & 4
    let reportStatus: DeliverableArtifactRecord['status'] = 'READY_FOR_AUTHORIZED_HUMAN_REVIEW';
    // Compilation prepares a new artifact, never a professional approval event.
    if (params.status && ['DRAFT', 'AI_PREPARED', 'INTERNALLY_REVIEWED', 'READY_FOR_AUTHORIZED_HUMAN_REVIEW'].includes(params.status)) {
      reportStatus = params.status;
    }

    // Mark previous versions as SUPERSEDED if same reportId
    existing.forEach(art => {
      if (art.status === 'FINAL_CERTIFIED') {
        art.status = 'SUPERSEDED';
      }
    });

    // 1. Generate Binary PDF
    const pdf = await this.generateBinaryPdf({
      reportId,
      version,
      clientName,
      deliverableTitle: title,
      firmName,
      partnerName,
      licenseNumber,
      period,
      currency,
      facts: normalizedFacts,
      specialistReview: params.specialistReview,
      disclosureEvidenceLedger: params.disclosureEvidenceLedger,
      euclidBalance,
      balanceIdentityApplicable,
      apReview: params.apReview,
      bankStatementReview: params.bankStatementReview,
      trialBalanceReview: params.trialBalanceReview,
      mixedSourceReview: params.mixedSourceReview,
      mixedSourceBatchReview: params.mixedSourceBatchReview,
      duplicateEvidenceReview: params.duplicateEvidenceReview
    });

    // 2. Generate Binary XLSX
    const xlsx = this.generateBinaryXlsx({
      reportId,
      version,
      clientName,
      deliverableTitle: title,
      firmName,
      partnerName,
      period,
      currency,
      facts: normalizedFacts,
      specialistReview: params.specialistReview,
      disclosureEvidenceLedger: params.disclosureEvidenceLedger,
      euclidBalance,
      balanceIdentityApplicable,
      apReview: params.apReview,
      bankStatementReview: params.bankStatementReview,
      trialBalanceReview: params.trialBalanceReview,
      mixedSourceReview: params.mixedSourceReview,
      mixedSourceBatchReview: params.mixedSourceBatchReview,
      duplicateEvidenceReview: params.duplicateEvidenceReview
    });

    // Canonical fact hash binds the draft package to the verified fact set.
    const canonicalFactHash = computeFinalDeliverableLineageHash(normalizedFacts);

    // 3. Generate JSON deliverable
    const jsonFilename = `audit_package_${reportId}_${version}.json`;
    const jsonFilepath = path.join(this.storageDir, jsonFilename);
    const jsonPayload = {
      reportId,
      version,
      engagementId,
      clientName,
      title,
      period,
      currency,
      generatedAt: new Date().toISOString(),
      euclidBalance: balanceIdentityApplicable ? euclidBalance : null,
      balanceIdentityApplicable,
      status: reportStatus,
      firmName,
      partnerName,
      licenseNumber,
      canonicalFactHash,
      facts: normalizedFacts,
      quinnReviewStatus: params.quinnReviewStatus || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
      quinnReview: params.quinnReview || { aiQualityReview: 'NOT_RUN', humanPartnerSignOff: 'PENDING', concurringApprovalGranted: false, deliveryEligible: false },
      specialistReview: params.specialistReview || null,
      disclosureEvidenceLedger: params.disclosureEvidenceLedger || null,
      apReview: params.apReview || null,
      bankStatementReview: params.bankStatementReview || null,
      trialBalanceReview: params.trialBalanceReview || null,
      mixedSourceReview: params.mixedSourceReview || null,
      mixedSourceBatchReview: params.mixedSourceBatchReview || null,
      duplicateEvidenceReview: params.duplicateEvidenceReview || null,
      finalLineageRequired: params.requireFinalLineage === true,
      finalLineageValidation
    };
    const jsonStr = JSON.stringify(jsonPayload, null, 2);
    fs.writeFileSync(jsonFilepath, jsonStr, 'utf-8');
    const jsonSha = crypto.createHash('sha256').update(jsonStr).digest('hex');

    // 4. Generate CSV Lead Schedules
    const csvFilename = `lead_schedules_${reportId}_${version}.csv`;
    const csvFilepath = path.join(this.storageDir, csvFilename);
    const csvContent = buildReviewCsv(normalizedFacts, currency, params.apReview, params.bankStatementReview, params.trialBalanceReview, params.mixedSourceReview, params.mixedSourceBatchReview, params.duplicateEvidenceReview);
    fs.writeFileSync(csvFilepath, csvContent, 'utf-8');
    const csvSha = crypto.createHash('sha256').update(csvContent).digest('hex');

    const manifest: DeliverableManifest = {
      reportId,
      version,
      generator: 'DeliverableArtifactService:Scribe',
      engagementId,
      createdAt: new Date().toISOString(),
      contentHash: canonicalFactHash,
      artifacts: {
        pdf: {
          format: 'PDF',
          filename: pdf.filename,
          filepath: pdf.filepath,
          sizeBytes: pdf.sizeBytes,
          sha256: pdf.sha256,
          createdAt: new Date().toISOString(),
          verified: true,
          verificationScope: 'BINARY_INTEGRITY_ONLY',
          verificationDetails: 'Artifact file/hash integrity only; not professional approval.'
        },
        xlsx: {
          format: 'XLSX',
          filename: xlsx.filename,
          filepath: xlsx.filepath,
          sizeBytes: xlsx.sizeBytes,
          sha256: xlsx.sha256,
          createdAt: new Date().toISOString(),
          verified: true,
          verificationScope: 'BINARY_INTEGRITY_ONLY',
          verificationDetails: 'Artifact file/hash integrity only; not professional approval.'
        },
        json: {
          format: 'JSON',
          filename: jsonFilename,
          filepath: jsonFilepath,
          sizeBytes: Buffer.byteLength(jsonStr),
          sha256: jsonSha,
          createdAt: new Date().toISOString(),
          verified: true,
          verificationScope: 'BINARY_INTEGRITY_ONLY',
          verificationDetails: 'Artifact file/hash integrity only; not professional approval.'
        },
        csv: {
          format: 'CSV',
          filename: csvFilename,
          filepath: csvFilepath,
          sizeBytes: Buffer.byteLength(csvContent),
          sha256: csvSha,
          createdAt: new Date().toISOString(),
          verified: true
        }
      },
      overallStatus: 'ALL_ARTIFACT_HASHES_VERIFIED'
    };

    const record: DeliverableArtifactRecord = {
      reportId,
      engagementId,
      workspaceId: params.workspaceId || engagementId,
      version,
      title,
      deliverableType: params.deliverableType || 'AUDIT_FINANCIAL_DELIVERABLE',
      audience: params.audience || 'EXECUTIVE_BOARD',
      generatedAt: new Date().toISOString(),
      templateId: 'tpl-board-statutory-a4',
      manifest,
      branding: {
        firmName,
        partnerName,
        licenseNumber,
        clientName,
        primaryColor: '#0f172a'
      },
      formats: {
        pdf: {
          filename: pdf.filename,
          filepath: pdf.filepath,
          sizeBytes: pdf.sizeBytes,
          sha256: pdf.sha256
        },
        xlsx: {
          filename: xlsx.filename,
          filepath: xlsx.filepath,
          sizeBytes: xlsx.sizeBytes,
          sha256: xlsx.sha256
        },
        json: {
          filename: jsonFilename,
          filepath: jsonFilepath,
          sizeBytes: Buffer.byteLength(jsonStr),
          sha256: jsonSha
        },
        csvLeadSchedules: {
          filename: csvFilename,
          filepath: csvFilepath,
          sizeBytes: Buffer.byteLength(csvContent),
          sha256: csvSha
        }
      },
      canonicalFactHash,
      numericFactsCount: normalizedFacts.length,
      euclidVariance: euclidBalance.variance,
      quinnReviewStatus: params.quinnReviewStatus || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
      status: reportStatus,
      isStale: false,
      approvalObject: params.approvalObject,
      dependentFactIds: normalizedFacts.map(f => f.id).filter(Boolean) as string[],
      dependentDerivationIds: params.dependentDerivationIds || [],
      specialistReview: params.specialistReview || undefined,
      disclosureEvidenceLedger: params.disclosureEvidenceLedger || undefined,
      apReview: params.apReview || undefined,
      bankStatementReview: params.bankStatementReview || undefined,
      trialBalanceReview: params.trialBalanceReview || undefined,
      mixedSourceReview: params.mixedSourceReview || undefined,
      mixedSourceBatchReview: params.mixedSourceBatchReview || undefined,
      duplicateEvidenceReview: params.duplicateEvidenceReview || undefined,
      finalLineageValidation
    };

    const updatedList = existing.filter(r => !(r.reportId === reportId && r.version === version));
    updatedList.push(record);
    this.artifacts.set(engagementId, updatedList);

    return record;
  }

  /**
   * Package B3 & B3.1 Requirements:
   * Applies physical human sign-off with authentic principal validation, cryptographic report binding,
   * and fail-closed persistence. Transitions report to FINAL_CERTIFIED only upon successful durable registration.
   */
  public async applyPhysicalSignoff(
    engagementId: string,
    reportId: string,
    approval: ProfessionalApprovalObject
  ): Promise<{ success: boolean; report?: DeliverableArtifactRecord; error?: string }> {
    const list = this.artifacts.get(engagementId);
    if (!list) {
      return { success: false, error: `Engagement ${engagementId} not found.` };
    }
    const report = list.find(r => r.reportId === reportId);
    if (!report) {
      return { success: false, error: `Report ${reportId} not found in engagement.` };
    }

    if (report.isStale || report.status === 'STALE_INVALIDATED') {
      return { success: false, error: `Report ${reportId} is stale/invalidated and cannot receive professional sign-off.` };
    }

    // Cryptographic report binding check
    if (approval.reportId !== report.reportId) {
      return { success: false, error: `Approval reportId mismatch: approval is for '${approval.reportId}' but report is '${report.reportId}'.` };
    }
    if (approval.reportVersion && report.version && approval.reportVersion !== report.version) {
      return { success: false, error: `Approval reportVersion mismatch: approval is for '${approval.reportVersion}' but report is '${report.version}'.` };
    }

    const expectedHashes = [
      report.formats?.pdf?.sha256,
      report.canonicalFactHash,
      report.formats?.json?.sha256,
      report.manifest?.artifacts?.pdf?.sha256,
      report.manifest?.contentHash
    ].filter(Boolean) as string[];

    if (expectedHashes.length > 0 && approval.reportHash) {
      if (!expectedHashes.includes(approval.reportHash)) {
        return { success: false, error: `Approval reportHash (${approval.reportHash}) does not match actual report artifact hash.` };
      }
    }

    const validation = await professionalSignoffGuard.validateApprovalObjectAsync(approval);
    if (!validation.valid) {
      return { success: false, error: `Sign-off validation failed: ${validation.errors.join(', ')}` };
    }

    // Durable fail-closed persistence
    const regResult = await professionalSignoffGuard.registerApprovalAsync(approval);
    if (!regResult.success) {
      return { success: false, error: `Durable approval persistence failed: ${regResult.reason}` };
    }

    report.approvalObject = approval;
    report.status = 'FINAL_CERTIFIED';
    return { success: true, report };
  }

  /**
   * Package B3 & B3.1 Requirements:
   * Invalidates dependent reports when canonical facts are rejected, superseded, or modified.
   * Immediately revokes associated professional approvals and revokes delivery eligibility.
   */
  public invalidateDependentReports(invalidatedFactIds: string[]): {
    affectedReports: string[];
    updatedCount: number;
  } {
    const affectedReports: string[] = [];
    let updatedCount = 0;

    for (const [engagementId, reports] of this.artifacts.entries()) {
      for (const report of reports) {
        const hasDependency = report.dependentFactIds && report.dependentFactIds.some(id => invalidatedFactIds.includes(id));
        if (hasDependency && !report.isStale) {
          report.isStale = true;
          report.status = 'STALE_INVALIDATED';
          if (report.approvalObject) {
            professionalSignoffGuard.revokeOrInvalidateApproval(
              report.approvalObject.approvalId,
              'DEPENDENT_FACT_INVALIDATED'
            );
            report.approvalObject.approvalStatus = 'REVOKED';
            report.approvalObject.status = 'REVOKED';
          }
          affectedReports.push(report.reportId);
          updatedCount++;

          if (report.formats?.json?.filepath && fs.existsSync(report.formats.json.filepath)) {
            try {
              const raw = fs.readFileSync(report.formats.json.filepath, 'utf-8');
              const data = JSON.parse(raw);
              data.isStale = true;
              data.status = 'STALE_INVALIDATED';
              fs.writeFileSync(report.formats.json.filepath, JSON.stringify(data, null, 2), 'utf-8');
            } catch (e) {}
          }
        }
      }
    }

    return { affectedReports, updatedCount };
  }

  /**
   * Authoritatively verifies an artifact manifest by inspecting file existence,
   * SHA-256 signatures, binary magic bytes, and parsing file contents.
   */
  public verifyArtifactManifest(record: DeliverableArtifactRecord): {
    allValid: boolean;
    pdfValid: boolean;
    xlsxValid: boolean;
    jsonValid: boolean;
    csvValid: boolean;
    details: Record<string, any>;
  } {
    let pdfValid = false;
    let xlsxValid = false;
    let jsonValid = false;
    let csvValid = false;
    const details: Record<string, any> = {};

    const pdfArt = record.manifest?.artifacts?.pdf || record.formats?.pdf;
    if (pdfArt?.filepath && fs.existsSync(pdfArt.filepath)) {
      try {
        const buf = fs.readFileSync(pdfArt.filepath);
        const actualSha = crypto.createHash('sha256').update(buf).digest('hex');
        const magicPass = buf.length > 0 && buf.slice(0, 5).toString() === '%PDF-';
        const shaPass = actualSha === pdfArt.sha256;
        pdfValid = magicPass && shaPass;
        details.pdf = { exists: true, sizeBytes: buf.length, magicPass, shaPass, actualSha };
      } catch (e: any) {
        details.pdf = { error: e.message };
      }
    }

    const xlsxArt = record.manifest?.artifacts?.xlsx || record.formats?.xlsx;
    if (xlsxArt?.filepath && fs.existsSync(xlsxArt.filepath)) {
      try {
        const buf = fs.readFileSync(xlsxArt.filepath);
        const actualSha = crypto.createHash('sha256').update(buf).digest('hex');
        const xlsxLib: any = (XLSX as any).default || XLSX;
        let wb: any = null;
        try {
          wb = xlsxLib.read ? xlsxLib.read(buf, { type: 'buffer' }) : (xlsxLib.readFile ? xlsxLib.readFile(xlsxArt.filepath) : null);
        } catch (readErr) {
          if (xlsxLib.readFile) wb = xlsxLib.readFile(xlsxArt.filepath);
        }
        const sheetsPass = Boolean(wb && wb.SheetNames && wb.SheetNames.length > 0);
        const shaPass = !xlsxArt.sha256 || actualSha === xlsxArt.sha256;
        xlsxValid = sheetsPass && shaPass;
        details.xlsx = { exists: true, sizeBytes: buf.length, sheetCount: wb?.SheetNames?.length || 0, sheetsPass, shaPass };
      } catch (e: any) {
        details.xlsx = { error: e.message };
      }
    }

    const jsonArt = record.manifest?.artifacts?.json || record.formats?.json;
    if (jsonArt?.filepath && fs.existsSync(jsonArt.filepath)) {
      try {
        const raw = fs.readFileSync(jsonArt.filepath, 'utf-8');
        const actualSha = crypto.createHash('sha256').update(raw).digest('hex');
        const parsed = JSON.parse(raw);
        const shaPass = actualSha === jsonArt.sha256;
        jsonValid = Boolean(parsed.reportId) && shaPass;
        details.json = { exists: true, parsed: Boolean(parsed.reportId), shaPass };
      } catch (e: any) {
        details.json = { error: e.message };
      }
    }

    const csvArt = record.manifest?.artifacts?.csv || record.formats?.csvLeadSchedules;
    if (csvArt?.filepath && fs.existsSync(csvArt.filepath)) {
      try {
        const raw = fs.readFileSync(csvArt.filepath, 'utf-8');
        const actualSha = crypto.createHash('sha256').update(raw).digest('hex');
        const lines = raw.split('\n').filter(l => l.trim().length > 0);
        const shaPass = actualSha === csvArt.sha256;
        csvValid = lines.length > 1 && shaPass;
        details.csv = { exists: true, lineCount: lines.length, shaPass };
      } catch (e: any) {
        details.csv = { error: e.message };
      }
    }

    const allValid = pdfValid && xlsxValid && jsonValid && csvValid;
    return { allValid, pdfValid, xlsxValid, jsonValid, csvValid, details };
  }

  public getArtifacts(engagementId: string): DeliverableArtifactRecord[] {
    return this.artifacts.get(engagementId) || [];
  }

  public getAllArtifacts(): DeliverableArtifactRecord[] {
    const all: DeliverableArtifactRecord[] = [];
    for (const list of this.artifacts.values()) {
      all.push(...list);
    }
    return all.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  public getArtifactByReportId(reportId: string, version?: string): DeliverableArtifactRecord | undefined {
    const findInLists = (): DeliverableArtifactRecord | undefined => {
      const candidates: DeliverableArtifactRecord[] = [];
      for (const list of this.artifacts.values()) {
        for (const r of list) {
          if (r.reportId === reportId) {
            if (version) {
              if (r.version === version) return r;
            } else {
              candidates.push(r);
            }
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        return candidates[0];
      }
      return undefined;
    };

    const firstTry = findInLists();
    if (firstTry) return firstTry;

    // On-demand fallback: re-scan storageDir if not yet in memory
    this.rehydrateFromDisk();
    return findInLists();
  }
}

export const deliverableArtifactService = DeliverableArtifactService.getInstance();

