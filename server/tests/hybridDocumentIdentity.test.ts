import assert from 'node:assert/strict';
import { bindParsedDocumentIdentity } from '../hybridExtraction/HybridExtractionOrchestrator.js';

const parsed = {
  document_id: 'doc-parser-123',
  sourceBlocks: [
    {
      source_block_id: 'SB-doc-parser-123-P1',
      document_id: 'doc-parser-123',
      page_number: 1
    }
  ]
};

bindParsedDocumentIdentity(parsed, 'doc-durable-456');

assert.equal(parsed.document_id, 'doc-durable-456');
assert.equal(parsed.sourceBlocks[0].document_id, 'doc-durable-456');
assert.equal(parsed.sourceBlocks[0].source_block_id, 'SB-doc-durable-456-P1');
console.log('HYBRID_DOCUMENT_IDENTITY=PASS');
