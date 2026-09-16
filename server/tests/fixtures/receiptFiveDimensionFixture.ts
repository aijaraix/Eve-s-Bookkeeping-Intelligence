import fs from 'node:fs';
import path from 'node:path';

export const RECEIPT_SHA256 = 'bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436';
export const RECEIPT_FACT_ID = 'fact-receipt-total-53-23';
export const RECEIPT_DOCUMENT_ID = 'doc-receipt-bdd93a72';
export const RECEIPT_PROVENANCE_ID = 'prov-receipt-bdd93a72-total-53-23';
export const RECEIPT_ENGAGEMENT_ID = 'eng-academy-receipt-five-dim';
export const RECEIPT_WORKSPACE_ID = 'ws-academy-receipt-five-dim';
export const RECEIPT_EXPECTED_VALUE = 53.23;

export interface ReceiptSourceRegionEvidence {
  marker: 'RECEIPT_FIXTURE_SOURCE_REGION=PASS';
  sourceSha256: string;
  filename: string;
  imageWidth: number;
  imageHeight: number;
  pixelBoundingBox: { x: number; y: number; width: number; height: number };
  normalizedBoundingBox: { x: number; y: number; width: number; height: number; unit: 'NORMALIZED' };
  rawLiteral: string;
  transformId: string;
}

export function receiptEvidenceDir(): string {
  return process.env.RECEIPT_ACCEPTANCE_EVIDENCE_DIR || '/tmp/eve-receipt-five-dimension';
}

export function loadReceiptSourceRegionEvidence(): ReceiptSourceRegionEvidence {
  const file = path.join(receiptEvidenceDir(), 'source-region.json');
  const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (evidence.marker !== 'RECEIPT_FIXTURE_SOURCE_REGION=PASS' || evidence.sourceSha256 !== RECEIPT_SHA256) {
    throw new Error('RECEIPT_SOURCE_REGION_EVIDENCE_INVALID');
  }
  return evidence;
}

export function buildReceiptCoordinate(evidence = loadReceiptSourceRegionEvidence()): any {
  return {
    coordinateId: 'coord-receipt-total-53-23',
    sourceArtifactId: `artifact-image-${RECEIPT_SHA256.slice(0, 24)}`,
    sourceSha256: RECEIPT_SHA256,
    sourceType: 'IMAGE',
    pageNumber: 1,
    imageWidth: evidence.imageWidth,
    imageHeight: evidence.imageHeight,
    boundingBox: evidence.normalizedBoundingBox,
    ocrRegionId: 'fixture-total-glyph-region',
    transformId: evidence.transformId,
    rawLiteral: evidence.rawLiteral,
    normalizedLiteral: evidence.rawLiteral,
    extractionMethod: 'local-ocr:paddleocr',
    extractionVersion: '3.7.0',
  };
}

export function buildReceiptFact(evidence = loadReceiptSourceRegionEvidence()): any {
  const coordinate = buildReceiptCoordinate(evidence);
  return {
    id: RECEIPT_FACT_ID,
    workspaceId: RECEIPT_WORKSPACE_ID,
    documentId: RECEIPT_DOCUMENT_ID,
    canonicalMetric: 'operating_expenses',
    labelOriginal: 'Receipt Total',
    labelNormalized: 'Receipt Total',
    valueOriginal: '$53.23',
    valueFunctional: RECEIPT_EXPECTED_VALUE,
    normalizedValue: RECEIPT_EXPECTED_VALUE,
    currencyOriginal: 'USD',
    functionalCurrency: 'USD',
    reportingPeriod: 'FY 2026',
    periodOriginal: 'FY 2026',
    status: 'APPROVED',
    verificationStatus: 'VERIFIED',
    evidenceStatus: 'CONFIRMED',
    pageNumber: 1,
    sourceDocument: 'receipt.png',
    documentTitle: 'receipt.png',
    sourceText: 'TOTAL $53.23',
    sourceSha256: RECEIPT_SHA256,
    sourceArtifactId: coordinate.sourceArtifactId,
    sourceProvenanceId: RECEIPT_PROVENANCE_ID,
    sourceProvenanceIds: [RECEIPT_PROVENANCE_ID],
    sourceCoordinate: coordinate,
    sourceCoordinates: [coordinate],
    provenanceCoordinates: [coordinate],
    sourceExtractionMethod: coordinate.extractionMethod,
    sourceExtractionVersion: coordinate.extractionVersion,
    scale: 'Source units',
  };
}

export function buildReceiptEngagement(evidence = loadReceiptSourceRegionEvidence()): any {
  const fact = buildReceiptFact(evidence);
  const document = {
    id: RECEIPT_DOCUMENT_ID,
    filename: 'receipt.png',
    sha256: RECEIPT_SHA256,
    workspaceId: RECEIPT_WORKSPACE_ID,
    pageCount: 1,
  };
  return {
    engagementId: RECEIPT_ENGAGEMENT_ID,
    workspaceId: RECEIPT_WORKSPACE_ID,
    classification: 'ACADEMY',
    isCustomer: false,
    clientName: 'Eve Academy Receipt Fixture',
    entityName: 'Eve Academy Receipt Fixture',
    title: 'Receipt Product and Deliverable Truth',
    period: 'FY 2026',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    currentStage: 'ENGAGEMENT_COMPLETE',
    openReviewNotesCount: 0,
    facts: [fact],
    documents: [document],
    reports: [],
    findings: [],
    periods: ['FY 2026'],
    continuation: null,
  };
}
