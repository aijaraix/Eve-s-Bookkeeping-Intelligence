import assert from 'node:assert/strict';
import fs from 'node:fs';
const hybrid = fs.readFileSync('server/hybridExtraction/HybridExtractionOrchestrator.ts', 'utf8');
assert.ok(hybrid.includes('buildLongDocumentSemanticContext'));
assert.ok(hybrid.includes('semanticContextReview'));
assert.ok(hybrid.includes('physicalPagesTotal >= 8'));
console.log('LONG_DOCUMENT_SEMANTIC_RUNTIME_WIRING=PASS');
