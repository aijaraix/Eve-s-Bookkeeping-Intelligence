import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { AnyDocParser } from '../../src/lib/parser/anydocParser.js';
import { EvidenceCrossCheckEngine } from '../hybridExtraction/EvidenceCrossCheckEngine.js';
import { validateSourceCoordinate } from '../../src/lib/evidence/universalSourceEvidence.js';

const html = Buffer.from('<html><body><p>Total assets 125,000</p><p>Total liabilities 55,000</p></body></html>');
const expectedSha = crypto.createHash('sha256').update(html).digest('hex');
const parsed: any = await new AnyDocParser().parse({ filename: 'issuer-filing.html', mimeType: 'text/html', buffer: html });
assert.equal(parsed.source.hash, expectedSha);
assert.ok(parsed.source.sourceArtifactId);
assert.equal(parsed.sourceBlocks.length, 2);
for (const block of parsed.sourceBlocks) {
  assert.equal(block.source_sha256, expectedSha);
  assert.equal(block.source_artifact_id, parsed.source.sourceArtifactId);
  assert.ok(block.source_provenance_id);
  assert.equal(validateSourceCoordinate(block.source_coordinate).valid, true);
}

const result = EvidenceCrossCheckEngine.verifyCandidateAgainstSource({
  rowLabel: 'Total assets',
  metricLabel: 'Assets',
  rawValue: '125,000',
  sourceQuote: 'Total assets 125,000',
  physicalPage: 1,
  confidence: 0.97
} as any, parsed.pageManifests, parsed.sourceBlocks);
assert.equal(result.evidenceStatus, 'CONFIRMED');
assert.equal(result.matchedSourceBlock?.source_sha256, expectedSha);
assert.equal(result.matchedSourceBlock?.source_coordinate?.sourceType, 'HTML');

console.log('ANYDOC_NATIVE_LINEAGE=PASS');
