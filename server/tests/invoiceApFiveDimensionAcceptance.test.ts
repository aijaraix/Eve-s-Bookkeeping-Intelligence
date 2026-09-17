import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { academyMinervaLab } from '../cpaOrganization/academyMinervaLab.js';
import { buildInvoiceApFiveDimensionChecks } from '../cpaOrganization/invoiceApInterpretationEngine.js';
import { buildInvoiceApInterpretation, INVOICE_SHA256, invoiceEvidenceDir } from './fixtures/invoiceApFiveDimensionFixture.js';

const dir=invoiceEvidenceDir(); const productPath=path.join(dir,'product-truth.json'); const deliverablePath=path.join(dir,'deliverable-truth.json');
assert.ok(fs.existsSync(productPath),'Product Truth evidence receipt missing'); assert.ok(fs.existsSync(deliverablePath),'Deliverable Truth evidence receipt missing');
const product=JSON.parse(fs.readFileSync(productPath,'utf8')); const deliverable=JSON.parse(fs.readFileSync(deliverablePath,'utf8'));
assert.equal(product.marker,'P2_INVOICE_AP_PRODUCT_TRUTH_BROWSER=PASS'); assert.equal(deliverable.marker,'P2_INVOICE_AP_DELIVERABLE_TRUTH=PASS'); assert.equal(product.sourceSha256,INVOICE_SHA256); assert.equal(deliverable.sourceSha256,INVOICE_SHA256);
const invoice=buildInvoiceApInterpretation(); const checks=buildInvoiceApFiveDimensionChecks(invoice);
const report=academyMinervaLab.evaluateFiveDimensions({caseId:'CURR-OCR-SCANNED-INVOICE',executionId:`invoice-ap-${INVOICE_SHA256.slice(0,12)}`,dimensions:{
 SOURCE_COVERAGE:{checks:checks.source}, SEMANTIC_UNDERSTANDING:{checks:checks.semantic}, ACCOUNTING_ACCURACY:{checks:checks.accounting},
 PRODUCT_TRUTH:{checks:[{checkId:'invoice-ap-real-product-browser',label:'Actual Eve AP invoice review renders evidence-backed state in Chromium',outcome:'PASS',evidenceRefs:[`browser:${product.screenshot}`,`source:${INVOICE_SHA256}`],details:[`approval=${product.approvalStatus}; payment=${product.paymentEligibility}; threeWay=${product.threeWayMatch}`]}]},
 DELIVERABLE_TRUTH:{checks:[{checkId:'invoice-ap-artifact-reverse-lineage',label:'Invoice AP draft artifacts preserve AP state and original source lineage',outcome:'PASS',evidenceRefs:[`artifact:pdf:${deliverable.formats.pdf}`,`artifact:json:${deliverable.formats.json}`,`artifact:xlsx:${deliverable.formats.xlsx}`,`artifact:csv:${deliverable.formats.csv}`],details:[`report=${deliverable.reportId}:${deliverable.version}; pdfSha=${deliverable.pdfSha256}`]}]},
}});
for(const dimension of ['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY','PRODUCT_TRUTH','DELIVERABLE_TRUTH'] as const) assert.equal(report.dimensions[dimension].status,'PASS',`${dimension} must pass`);
assert.equal(report.passedDimensionCount,5); assert.equal(report.notTestedDimensionCount,0); assert.equal(report.fullyTested,true); assert.equal(report.allRequiredDimensionsPassed,true); assert.equal(report.overallStatus,'FIVE_DIMENSION_PASS');
fs.writeFileSync(path.join(dir,'five-dimension-result.json'),JSON.stringify({marker:'P2_INVOICE_AP_FIVE_DIMENSION_PASS=PASS',sourceSha256:INVOICE_SHA256,report},null,2)); console.log('P2_INVOICE_AP_FIVE_DIMENSION_PASS=PASS');
