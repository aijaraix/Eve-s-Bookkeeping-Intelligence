import assert from 'node:assert/strict';
import { deriveFiscalYear, mapProofFactToDeliverableFact, shouldInvalidateReadyContinuation, shouldRecoverPersistedEvidenceBlock } from '../cpaOrganization/verifiedCustomerContinuationService.js';
import { validateFinalDeliverableLineage } from '../cpaOrganization/finalDeliverableLineageValidator.js';

const sourceSha256 = 'a'.repeat(64);
const sourceArtifactId = 'artifact-pdf-aaaaaaaaaaaaaaaaaaaaaaaa';
const sourceCoordinate = {
  coordinateId: 'coord-a-p1-native',
  sourceArtifactId,
  sourceSha256,
  sourceType: 'PDF',
  pageNumber: 1,
  rawLiteral: 'Total assets 125000',
  normalizedLiteral: '125000',
  extractionMethod: 'PDF_NATIVE_TEXT',
  extractionVersion: '1.0'
};

const mapped = mapProofFactToDeliverableFact({
  id: 'fact-assets',
  canonicalMetric: 'assets',
  labelOriginal: 'Total assets',
  normalizedValue: 125000,
  statementType: 'BALANCE_SHEET',
  documentId: 'doc-a',
  pageNumber: 1,
  verificationStatus: 'VERIFIED',
  evidenceStatus: 'CONFIRMED',
  status: 'APPROVED',
  unitScale: 'ONES',
  normalizedScaleMultiplier: 1,
  reportingPeriod: 'FY 2026',
  sourceText: 'Total assets 125000',
  sourceBlockIds: ['SB-doc-a-P1'],
  sourceSha256,
  sourceArtifactId,
  sourceProvenanceId: 'prov-a-p1-native',
  sourceProvenanceIds: ['prov-a-p1-native'],
  sourceCoordinate,
  sourceCoordinates: [sourceCoordinate],
  sourceConfidence: 0.99,
  sourceExtractionMethod: 'PDF_NATIVE_TEXT',
  sourceExtractionVersion: '1.0'
}, { filename: 'issuer-filing.pdf' }, { documentTitle: 'issuer-filing.pdf', documentHash: sourceSha256 });

assert.equal(mapped.sourceSha256, sourceSha256);
assert.equal(mapped.sourceArtifactId, sourceArtifactId);
assert.deepEqual(mapped.sourceProvenanceIds, ['prov-a-p1-native']);
assert.deepEqual(mapped.sourceCoordinates, [sourceCoordinate]);
assert.equal(mapped.sourceExtractionMethod, 'PDF_NATIVE_TEXT');
assert.equal(mapped.factState, 'APPROVED');
assert.equal(mapped.unitScale, 'ONES');
assert.equal(mapped.normalizedScaleMultiplier, 1);
assert.deepEqual(validateFinalDeliverableLineage([mapped]), {
  valid: true,
  issues: [],
  checkedFactIds: ['fact-assets'],
  derivedFactIds: []
});

const incomplete = mapProofFactToDeliverableFact({
  id: 'fact-missing-lineage',
  canonicalMetric: 'revenue',
  normalizedValue: 42,
  documentId: 'doc-b',
  sourceText: 'Revenue 42'
}, { filename: 'incomplete.txt' }, { documentTitle: 'incomplete.txt', documentHash: 'b'.repeat(64) });
assert.equal(validateFinalDeliverableLineage([incomplete]).valid, false, 'missing coordinate/provenance must fail closed');

const proof = (id: string, canonicalMetric: string, normalizedValue: number) => ({
  id,
  workspaceId: 'ws-race',
  documentId: 'doc-race',
  canonicalMetric,
  labelNormalized: canonicalMetric,
  normalizedValue,
  reportingPeriod: 'FY 2026',
  statementType: 'CONSOLIDATED_BALANCE_SHEET',
  status: 'APPROVED',
  verificationStatus: 'VERIFIED',
  evidenceStatus: 'CONFIRMED',
  sourceText: `${canonicalMetric} ${normalizedValue}`
});
const balanced = [proof('assets', 'total_assets', 125000), proof('liabilities', 'total_liabilities', 55000), proof('equity', 'total_equity', 70000)];
assert.equal(shouldRecoverPersistedEvidenceBlock({ status: 'BLOCKED_ACCOUNTING_IDENTITY' } as any, { workspaceId: 'ws-race' }, balanced), true);
assert.equal(shouldInvalidateReadyContinuation({ status: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', deliverable: { reportId: 'rep-a' } } as any, { workspaceId: 'ws-race' }, [...balanced, { ...balanced[0], id: 'assets-conflict', normalizedValue: 130000 }]), true);
assert.equal(shouldInvalidateReadyContinuation({ status: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW', deliverable: { reportId: 'rep-a' } } as any, { workspaceId: 'ws-race' }, balanced), false);
assert.equal(deriveFiscalYear(balanced.map(fact => ({ ...fact, reportingPeriod: 'FY2026' }))), '2026');
assert.equal(shouldRecoverPersistedEvidenceBlock({ status: 'BLOCKED_ACCOUNTING_IDENTITY' } as any, { workspaceId: 'ws-race' }, balanced.slice(0, 2)), false);
assert.equal(shouldRecoverPersistedEvidenceBlock({ status: 'BLOCKED_NO_PROOF_COMPLETE_FACTS' } as any, { workspaceId: 'ws-race' }, [balanced[0]]), true);

console.log('VERIFIED_CONTINUATION_DELIVERABLE_LINEAGE=PASS');
