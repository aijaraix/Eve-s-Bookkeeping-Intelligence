import assert from 'node:assert/strict';
import { DiagnosticsEngine } from '../diagnosticsEngine.js';

const conflicts = DiagnosticsEngine.detectConflicts('ws-conflict', [
  { id: 'fact-a', workspaceId: 'ws-conflict', canonicalMetric: 'Total assets', reportingPeriod: 'FY2028', normalizedValue: 300000, documentId: 'doc-a', sourceSha256: 'a'.repeat(64), sourceBlockIds: ['sb-a'], sourceProvenanceIds: ['prov-a'], sourceCoordinate: { coordinateId: 'coord-a' } },
  { id: 'fact-b', workspaceId: 'ws-conflict', canonicalMetric: 'TotalAssets', reportingPeriod: 'FY2028', normalizedValue: 320000, documentId: 'doc-b', sourceSha256: 'b'.repeat(64), sourceBlockIds: ['sb-b'], sourceProvenanceIds: ['prov-b'], sourceCoordinate: { coordinateId: 'coord-b' } }
] as any);
assert.equal(conflicts.length, 1);
assert.deepEqual(conflicts[0].candidates?.map(c => c.source_sha256), ['a'.repeat(64), 'b'.repeat(64)]);
assert.deepEqual(conflicts[0].candidates?.map(c => c.source_provenance_ids[0]), ['prov-a', 'prov-b']);
console.log('DIAGNOSTICS_CONFLICT_IDENTITY=PASS');
