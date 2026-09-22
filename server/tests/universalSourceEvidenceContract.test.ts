import assert from 'node:assert/strict';
import {
  evaluateRenderedLineageCompleteness,
  traceProvenanceToSources,
  validateSourceValueProvenance
} from '../../src/lib/evidence/universalSourceEvidence.js';
import type { SourceValueProvenance } from '../../src/lib/evidence/universalSourceEvidence.js';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

const spreadsheetSource: SourceValueProvenance = {
  provenanceId: 'prov-spreadsheet-cash-g18',
  lineageKind: 'SOURCE_OBSERVATION',
  materiality: 'MATERIAL',
  entityId: 'ExampleCo',
  period: '2026-08-31',
  currency: 'USD',
  coordinates: [
    {
      coordinateId: 'coord-cash-g18',
      sourceArtifactId: 'artifact-workbook-a',
      sourceSha256: HASH_A,
      sourceType: 'SPREADSHEET',
      workbookName: 'Cash_Workpaper.xlsx',
      sheetName: 'Cash',
      cellAddress: 'G18',
      formula: '=SUM(G10:G17)',
      cachedValue: 1200000,
      numberFormat: '$#,##0.00',
      rawLiteral: '1200000',
      normalizedLiteral: '1200000.00',
      confidence: 1,
      extractionMethod: 'sheetjs-cell',
      extractionVersion: '1'
    }
  ],
  parentProvenanceIds: [],
  rawLiteral: '1200000',
  normalizedValue: 1200000,
  transformationSteps: [],
  verificationState: 'VERIFIED',
  presentationUsages: []
};

const receiptSource: SourceValueProvenance = {
  provenanceId: 'prov-receipt-petty-cash',
  lineageKind: 'SOURCE_OBSERVATION',
  materiality: 'MATERIAL',
  entityId: 'ExampleCo',
  period: '2026-08-31',
  currency: 'USD',
  coordinates: [
    {
      coordinateId: 'coord-receipt-total',
      sourceArtifactId: 'artifact-receipt-001',
      sourceSha256: HASH_B,
      sourceType: 'IMAGE',
      imageWidth: 1200,
      imageHeight: 1800,
      boundingBox: { x: 0.62, y: 0.83, width: 0.25, height: 0.06, unit: 'NORMALIZED' },
      ocrRegionId: 'ocr-region-total',
      rawLiteral: '$43,821.00',
      normalizedLiteral: '43821.00',
      confidence: 0.98,
      extractionMethod: 'ocr-primary',
      extractionVersion: '1'
    }
  ],
  parentProvenanceIds: [],
  rawLiteral: '$43,821.00',
  normalizedValue: 43821,
  transformationSteps: [
    {
      stepId: 'step-receipt-normalize',
      operation: 'NORMALIZE',
      inputLiteral: '$43,821.00',
      outputValue: 43821,
      engine: 'eve-number-normalizer',
      engineVersion: '1'
    }
  ],
  verificationState: 'VERIFIED',
  presentationUsages: []
};

const derivedDashboardValue: SourceValueProvenance = {
  provenanceId: 'prov-ending-cash-dashboard',
  lineageKind: 'DERIVED_VALUE',
  materiality: 'MATERIAL',
  entityId: 'ExampleCo',
  period: '2026-08-31',
  currency: 'USD',
  coordinates: [],
  parentProvenanceIds: [spreadsheetSource.provenanceId, receiptSource.provenanceId],
  normalizedValue: 1243821,
  transformationSteps: [
    {
      stepId: 'step-ending-cash-sum',
      operation: 'FORMULA',
      inputProvenanceIds: [spreadsheetSource.provenanceId, receiptSource.provenanceId],
      outputValue: 1243821,
      formula: 'spreadsheet_cash + petty_cash',
      engine: 'eve-calculation-engine',
      engineVersion: '1'
    }
  ],
  verificationState: 'VERIFIED',
  presentationUsages: [
    {
      presentationUsageId: 'usage-dashboard-ending-cash',
      outputType: 'DASHBOARD',
      renderId: 'RND-ending-cash',
      route: '/engagements/example/overview',
      screen: 'Overview',
      component: 'FinancialDashboardView',
      widget: 'Ending Cash KPI',
      domSelector: '[data-fact-lineage-id="FLID-ending-cash"]',
      observedDisplayValue: '$1,243,821',
      factLineageId: 'FLID-ending-cash',
      derivedCalculationId: 'DRV-ending-cash',
      presentationState: 'BROWSER_RENDER_CONFIRMED',
      verifiedAt: '2026-09-16T00:00:00Z'
    }
  ]
};

const registry = new Map<string, SourceValueProvenance>([
  [spreadsheetSource.provenanceId, spreadsheetSource],
  [receiptSource.provenanceId, receiptSource],
  [derivedDashboardValue.provenanceId, derivedDashboardValue]
]);
const resolve = (id: string) => registry.get(id);

{
  const validation = validateSourceValueProvenance(spreadsheetSource);
  assert.equal(validation.valid, true, validation.issues.join('; '));
}

{
  const trace = traceProvenanceToSources(derivedDashboardValue.provenanceId, resolve);
  assert.equal(trace.unresolvedParentIds.length, 0);
  assert.equal(trace.cycles.length, 0);
  assert.equal(trace.sourceCoordinates.length, 2);
  assert.deepEqual(
    new Set(trace.sourceCoordinates.map(coordinate => coordinate.sourceType)),
    new Set(['SPREADSHEET', 'IMAGE'])
  );
}

{
  const result = evaluateRenderedLineageCompleteness(
    derivedDashboardValue.provenanceId,
    resolve,
    'usage-dashboard-ending-cash'
  );
  assert.equal(result.sourceLineageComplete, true, result.issues.join('; '));
  assert.equal(result.presentationLineageComplete, true, result.issues.join('; '));
  assert.equal(result.complete, true, result.issues.join('; '));
  assert.equal(result.sourceCoordinateCount, 2);
}

{
  const unconfirmed: SourceValueProvenance = {
    ...derivedDashboardValue,
    provenanceId: 'prov-unconfirmed-render',
    presentationUsages: [
      {
        ...derivedDashboardValue.presentationUsages[0],
        presentationUsageId: 'usage-server-only',
        presentationState: 'SERVER_REGISTERED_PRESENTATION'
      }
    ]
  };
  const localRegistry = new Map(registry);
  localRegistry.set(unconfirmed.provenanceId, unconfirmed);
  const result = evaluateRenderedLineageCompleteness(
    unconfirmed.provenanceId,
    id => localRegistry.get(id),
    'usage-server-only'
  );
  assert.equal(result.sourceLineageComplete, true);
  assert.equal(result.presentationLineageComplete, false);
  assert.equal(result.complete, false);
}

{
  const brokenSource: SourceValueProvenance = {
    provenanceId: 'prov-broken-source',
    lineageKind: 'SOURCE_OBSERVATION',
    coordinates: [],
    parentProvenanceIds: [],
    transformationSteps: [],
    verificationState: 'VERIFIED',
    presentationUsages: []
  };
  const validation = validateSourceValueProvenance(brokenSource);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some(issue => issue.includes('source coordinate')));
}

{
  const cyclicA: SourceValueProvenance = {
    provenanceId: 'prov-cycle-a',
    lineageKind: 'DERIVED_VALUE',
    coordinates: [],
    parentProvenanceIds: ['prov-cycle-b'],
    transformationSteps: [],
    verificationState: 'VERIFIED',
    presentationUsages: []
  };
  const cyclicB: SourceValueProvenance = {
    provenanceId: 'prov-cycle-b',
    lineageKind: 'DERIVED_VALUE',
    coordinates: [],
    parentProvenanceIds: ['prov-cycle-a'],
    transformationSteps: [],
    verificationState: 'VERIFIED',
    presentationUsages: []
  };
  const cycleRegistry = new Map<string, SourceValueProvenance>([
    [cyclicA.provenanceId, cyclicA],
    [cyclicB.provenanceId, cyclicB]
  ]);
  const trace = traceProvenanceToSources(cyclicA.provenanceId, id => cycleRegistry.get(id));
  assert.equal(trace.cycles.length, 1);
}

console.log('UNIVERSAL_SOURCE_EVIDENCE_CONTRACT_TESTS=PASS');
