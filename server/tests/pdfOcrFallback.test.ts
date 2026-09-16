import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getPdfPagesRequiringOcr, shouldUsePdfOcrFallback, shouldUseSelectivePdfOcr } from '../../src/lib/parser/pdfOcrFallback.js';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';

assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [{ page_number:1,native_text_available: false }, { page_number:2,native_text_available: false }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), true);
assert.equal(shouldUsePdfOcrFallback({ raw_text: 'native text', pageManifests: [{ page_number:1,native_text_available: true }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), false);
const mixed={raw_text:'native page',pageManifests:[{page_number:1,native_text_available:true},{page_number:2,native_text_available:false},{page_number:3,native_text_available:true}]};
assert.equal(shouldUsePdfOcrFallback(mixed,{detectedType:'pdf',mimeType:'application/pdf'}),false);
assert.equal(shouldUseSelectivePdfOcr(mixed,{detectedType:'pdf',mimeType:'application/pdf'}),true);
assert.deepEqual(getPdfPagesRequiringOcr(mixed,{detectedType:'pdf',mimeType:'application/pdf'}),[2]);
assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [] }, { detectedType: 'png', mimeType: 'image/png' }), false);

const buffer = Buffer.from('synthetic-image-only-pdf-bytes');
const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
let received:any;
const mockClient = { async recognize(input:any) { received=input; return {engine:'paddleocr' as const,engineVersion:'3.7.0',model:'test-pdf-ocr',sourceSha256,elapsedMs:10,pages:[{pageNumber:2,width:1000,height:1400,regions:[{regionId:'p2-r1',text:'TOTAL $53.23',confidence:0.99,boundingBox:{x:0.1,y:0.8,width:0.4,height:0.05,unit:'NORMALIZED' as const}}]}],routingDecision:{selectedEngine:'paddleocr' as const,fallbackInvoked:false,reasons:[],primaryScore:0.99,fallbackScore:null,orientationRetryInvoked:false,selectedRotationDegrees:0},attempts:[]}; } };
const parser=new OCRParser(mockClient as any);
const doc:any=await parser.parse({filename:'scan.pdf',originalName:'scan.pdf',mimeType:'application/pdf',buffer},{detectedType:'pdf',mimeType:'application/pdf',ocrPageNumbers:[2]});
assert.deepEqual(received.pdfPageNumbers,[2]);
assert.equal(doc.metadata.detectedType,'ocr_pdf');
assert.equal(doc.metadata.ocrRequestedPdfPageNumbers[0],2);
const coord=doc.sourceValueProvenance[0].coordinates[0];
assert.equal(coord.sourceType,'PDF');assert.equal(coord.pageNumber,2);assert.equal(coord.evidenceMode,'OCR');assert.equal(coord.nativeTextAvailable,false);assert.equal(coord.sourceSha256,sourceSha256);
console.log('PDF_OCR_FALLBACK_TESTS=PASS');
