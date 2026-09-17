import assert from 'node:assert/strict';
import { DocumentIntelligenceAgent } from '../../src/lib/agents/documentAgents.js';

const agent = new DocumentIntelligenceAgent();
const invoice = agent.classifyAndExtract({ raw_text: 'INVOICE INV-1\nBILL TO Client\nTOTAL DUE $100\nDUE DATE 10/16/2026\nPURCHASE ORDER PO-1\nCURRENCY USD' } as any);
assert.equal(invoice.category, 'Invoice / Billing Record');
assert.equal(invoice.documentKind, 'INVOICE');
assert.equal(invoice.reportingCurrency, 'USD');
assert.deepEqual(invoice.statementTypes, []);
assert.ok(invoice.classificationSignals >= 5);
assert.ok(invoice.confidence < 1 && invoice.confidence > 0.9);

const dollarOnly = agent.classifyAndExtract({ raw_text: 'INVOICE INV-2\nBILL TO Client\nTOTAL DUE $100' } as any);
assert.equal(dollarOnly.category, 'Invoice / Billing Record');
assert.equal(dollarOnly.reportingCurrency, undefined, 'dollar sign alone must not silently mean USD');
assert.deepEqual(dollarOnly.statementTypes, []);

console.log('DOCUMENT_INTELLIGENCE_INVOICE_TRUTH_TESTS=PASS');
