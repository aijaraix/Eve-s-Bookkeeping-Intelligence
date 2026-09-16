#!/usr/bin/env python3
from pathlib import Path


def read(path): return Path(path).read_text()
def write(path, content):
    p=Path(path); p.parent.mkdir(parents=True, exist_ok=True); p.write_text(content)
def replace_once(path, old, new):
    text=read(path)
    if old not in text: raise SystemExit(f'PATCH_ANCHOR_MISSING:{path}:{old[:140]!r}')
    if text.count(old)!=1: raise SystemExit(f'PATCH_ANCHOR_NOT_UNIQUE:{path}:{text.count(old)}')
    write(path,text.replace(old,new,1))

write('server/cpaOrganization/finalDeliverableLineageValidator.ts', r'''import crypto from 'node:crypto';
import { validatePresentationSourceIdentity } from '../../src/lib/evidence/presentationSourceIdentity.js';

export type DeliverableDerivationOperation = 'ADD' | 'SUBTRACT' | 'SUM';
export interface FinalDeliverableLineageValidation { valid: boolean; issues: string[]; checkedFactIds: string[]; derivedFactIds: string[]; }

function num(value: any): number | null { const n = typeof value === 'number' ? value : Number(value); return Number.isFinite(n) ? n : null; }
function unique(values: any[]): string[] { return [...new Set(values.filter(Boolean).map(String))]; }
function stable(value: any): any {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function valueOf(f: any): number | null { return num(f?.value ?? f?.normalizedValue ?? f?.valueFunctional ?? f?.expectedValue); }
function sourceIdentityShape(f: any): any { return {
  id: f?.id || null, canonicalMetric: f?.canonicalMetric || null, value: valueOf(f), reportingPeriod: f?.reportingPeriod || f?.period || null,
  sourceSha256: f?.sourceSha256 || null, sourceArtifactId: f?.sourceArtifactId || null,
  sourceProvenanceId: f?.sourceProvenanceId || null, sourceProvenanceIds: unique(f?.sourceProvenanceIds || []),
  sourceCoordinate: f?.sourceCoordinate || null, sourceCoordinates: f?.sourceCoordinates || [],
  derivationId: f?.derivationId || null, derivationFormula: f?.derivationFormula || null,
  derivationOperation: f?.derivationOperation || null, operandFactIds: unique(f?.operandFactIds || []), operandValues: f?.operandValues || null,
}; }

export function computeFinalDeliverableLineageHash(facts: any[]): string {
  const material = [...facts].map(sourceIdentityShape).sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')));
  return crypto.createHash('sha256').update(JSON.stringify(stable(material))).digest('hex');
}

export function validateFinalDeliverableLineage(facts: any[]): FinalDeliverableLineageValidation {
  const issues: string[] = []; const checkedFactIds: string[] = []; const derivedFactIds: string[] = [];
  const byId = new Map<string, any>();
  for (const f of facts) {
    const id=String(f?.id||'').trim(); if(!id){issues.push('FACT_ID_MISSING');continue;} if(byId.has(id))issues.push(`DUPLICATE_FACT_ID:${id}`); else byId.set(id,f);
  }
  const visiting = new Set<string>(); const validated = new Set<string>();
  const walk = (id: string) => {
    if (validated.has(id)) return;
    if (visiting.has(id)) { issues.push(`DERIVATION_CYCLE:${id}`); return; }
    const f=byId.get(id); if(!f){issues.push(`OPERAND_FACT_MISSING:${id}`);return;} visiting.add(id); checkedFactIds.push(id);
    const derivationId=String(f?.derivationId||'').trim();
    if (!derivationId) {
      const direct=validatePresentationSourceIdentity(f); for(const issue of direct.issues)issues.push(`${id}:${issue}`);
    } else {
      derivedFactIds.push(id);
      const formula=String(f?.derivationFormula||'').trim(); const op=String(f?.derivationOperation||'').trim() as DeliverableDerivationOperation;
      const operands=unique(Array.isArray(f?.operandFactIds)?f.operandFactIds:[]);
      if(!formula)issues.push(`${id}:DERIVATION_FORMULA_MISSING`);
      if(!['ADD','SUBTRACT','SUM'].includes(op))issues.push(`${id}:DERIVATION_OPERATION_UNSUPPORTED`);
      if(operands.length<1)issues.push(`${id}:DERIVATION_OPERANDS_MISSING`);
      const values:number[]=[];
      for(const parentId of operands){ if(!byId.has(parentId)){issues.push(`${id}:OPERAND_FACT_MISSING:${parentId}`);continue;} walk(parentId); const v=valueOf(byId.get(parentId)); if(v===null)issues.push(`${id}:OPERAND_VALUE_INVALID:${parentId}`); else values.push(v); const recorded=f?.operandValues?.[parentId]; if(recorded!==undefined && num(recorded)!==v)issues.push(`${id}:OPERAND_VALUE_MISMATCH:${parentId}`); }
      if(values.length===operands.length && values.length){ let expected:number|null=null; if(op==='ADD'||op==='SUM')expected=values.reduce((a,b)=>a+b,0); else if(op==='SUBTRACT')expected=values.slice(1).reduce((a,b)=>a-b,values[0]); const actual=valueOf(f); if(actual===null)issues.push(`${id}:DERIVED_VALUE_INVALID`); else if(expected!==null && Math.abs(actual-expected)>1e-9)issues.push(`${id}:DERIVED_VALUE_MISMATCH:${actual}:${expected}`); }
    }
    visiting.delete(id); validated.add(id);
  };
  for(const id of byId.keys())walk(id);
  return { valid: issues.length===0, issues: unique(issues), checkedFactIds: unique(checkedFactIds), derivedFactIds: unique(derivedFactIds) };
}
''')

replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"import { ProfessionalApprovalObject, professionalSignoffGuard } from './professionalSignoffGuard.js';\n",
"import { ProfessionalApprovalObject, professionalSignoffGuard } from './professionalSignoffGuard.js';\nimport { computeFinalDeliverableLineageHash, validateFinalDeliverableLineage } from './finalDeliverableLineageValidator.js';\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"  duplicateEvidenceReview?: any;\n}\n",
"  duplicateEvidenceReview?: any;\n  finalLineageValidation?: any;\n}\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"      sourceExtractionVersion?: string;\n    }>;\n",
"      sourceExtractionVersion?: string;\n      derivationId?: string;\n      derivationFormula?: string;\n      derivationOperation?: 'ADD' | 'SUBTRACT' | 'SUM';\n      operandFactIds?: string[];\n      operandValues?: Record<string, number>;\n    }>;\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"        sourceExtractionVersion: f.sourceExtractionVersion || sourceCoordinate?.extractionVersion || f.provenance?.ocrEngineVersion,\n      };\n    });\n\n    // Normalize euclidBalance",
"        sourceExtractionVersion: f.sourceExtractionVersion || sourceCoordinate?.extractionVersion || f.provenance?.ocrEngineVersion,\n        derivationId: f.derivationId || f.derivation?.derivationId || f.derivedCalculationId || undefined,\n        derivationFormula: f.derivationFormula || f.derivation?.formula || undefined,\n        derivationOperation: f.derivationOperation || f.derivation?.operation || undefined,\n        operandFactIds: Array.isArray(f.operandFactIds) ? f.operandFactIds.map(String) : (Array.isArray(f.derivation?.operandFactIds) ? f.derivation.operandFactIds.map(String) : []),\n        operandValues: f.operandValues || f.derivation?.operandValues || undefined,\n      };\n    });\n\n    const finalLineageValidation = validateFinalDeliverableLineage(normalizedFacts);\n    if (params.requireFinalLineage === true && !finalLineageValidation.valid) {\n      throw new Error(`FINAL_DELIVERABLE_LINEAGE_INVALID:${finalLineageValidation.issues.join('|')}`);\n    }\n\n    // Normalize euclidBalance")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"    const canonicalFactHash = crypto.createHash('sha256')\n      .update(normalizedFacts.map(f => `${f.canonicalMetric}:${f.value}`).join(';'))\n      .digest('hex');\n",
"    const canonicalFactHash = computeFinalDeliverableLineageHash(normalizedFacts);\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"      duplicateEvidenceReview: params.duplicateEvidenceReview || null\n    };\n",
"      duplicateEvidenceReview: params.duplicateEvidenceReview || null,\n      finalLineageRequired: params.requireFinalLineage === true,\n      finalLineageValidation\n    };\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"      createdAt: new Date().toISOString(),\n      artifacts: {\n",
"      createdAt: new Date().toISOString(),\n      contentHash: canonicalFactHash,\n      artifacts: {\n")
replace_once('server/cpaOrganization/deliverableArtifactService.ts',
"      duplicateEvidenceReview: params.duplicateEvidenceReview || undefined\n    };\n",
"      duplicateEvidenceReview: params.duplicateEvidenceReview || undefined,\n      finalLineageValidation\n    };\n")

replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"    sourceExtractionVersion: f.sourceExtractionVersion || coordinate?.extractionVersion || null,\n    verificationStatus: f.verificationStatus || 'NOT_VERIFIED', evidenceStatus: f.evidenceStatus || 'NOT_MEASURED' };\n",
"    sourceExtractionVersion: f.sourceExtractionVersion || coordinate?.extractionVersion || null,\n    derivationId: f.derivationId || null, derivationFormula: f.derivationFormula || null, derivationOperation: f.derivationOperation || null,\n    operandFactIds: Array.isArray(f.operandFactIds) ? f.operandFactIds.map(String) : [], operandValues: f.operandValues || null,\n    verificationStatus: f.verificationStatus || 'NOT_VERIFIED', evidenceStatus: f.evidenceStatus || 'NOT_MEASURED' };\n")
replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"['Source Fact ID','Metric','Label','Value','Currency','Reporting Period','Statement','Document ID','Source Document','Extractor Locator','Verification','Evidence Status','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt'],\n    ...facts.map(f=>{const r=reviewRow(f);return [r.id,r.metric,r.label,r.value,currency,r.period,r.statement,r.documentId,r.sourceDoc,r.extractorPage,r.verificationStatus,r.evidenceStatus,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText];})];",
"['Source Fact ID','Metric','Label','Value','Currency','Reporting Period','Statement','Document ID','Source Document','Extractor Locator','Verification','Evidence Status','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt','Derivation ID','Derivation Formula','Derivation Operation','Operand Fact IDs','Operand Values'],\n    ...facts.map(f=>{const r=reviewRow(f);return [r.id,r.metric,r.label,r.value,currency,r.period,r.statement,r.documentId,r.sourceDoc,r.extractorPage,r.verificationStatus,r.evidenceStatus,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText,r.derivationId,r.derivationFormula,r.derivationOperation,r.operandFactIds.join(';'),r.operandValues?JSON.stringify(r.operandValues):''];})];")
replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"    text(`Extraction: ${r.sourceExtractionMethod || 'NOT_RECORDED'} ${r.sourceExtractionVersion || ''} | Confidence: ${r.sourceConfidence == null ? 'NOT_RECORDED' : r.sourceConfidence}\\nSource excerpt: ${r.sourceText || 'NOT_RECORDED'}`);\n  });\n",
"    text(`Extraction: ${r.sourceExtractionMethod || 'NOT_RECORDED'} ${r.sourceExtractionVersion || ''} | Confidence: ${r.sourceConfidence == null ? 'NOT_RECORDED' : r.sourceConfidence}\\nSource excerpt: ${r.sourceText || 'NOT_RECORDED'}`);\n    if(r.derivationId) text(`Derivation ID: ${r.derivationId}\\nDerivation formula: ${r.derivationFormula || 'NOT_RECORDED'}\\nDerivation operation: ${r.derivationOperation || 'NOT_RECORDED'}\\nOperand fact IDs: ${r.operandFactIds.join(', ') || 'NOT_RECORDED'}\\nOperand values: ${r.operandValues ? JSON.stringify(r.operandValues) : 'NOT_RECORDED'}`);\n  });\n")
replace_once('server/cpaOrganization/reviewPackageRendering.ts',
"['Source Fact ID','Metric','Reporting Period','Document ID','Source Document','Extractor Locator','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt'],\n    ...rows.map((r:any)=>[r.id,r.metric,r.period,r.documentId,r.sourceDoc,r.extractorPage,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText])\n  ],[48,34,28,38,27,20,50,66,66,100,30,18,14,90]);",
"['Source Fact ID','Metric','Reporting Period','Document ID','Source Document','Extractor Locator','Source Block IDs','Source SHA256','Source Provenance IDs','Source Coordinate','Extraction Method','Extraction Version','Confidence','Source Excerpt','Derivation ID','Derivation Formula','Derivation Operation','Operand Fact IDs','Operand Values'],\n    ...rows.map((r:any)=>[r.id,r.metric,r.period,r.documentId,r.sourceDoc,r.extractorPage,r.sourceBlockIds.join(';'),r.sourceSha256,r.sourceProvenanceIds.join(';'),sourceCoordinateText(r),r.sourceExtractionMethod,r.sourceExtractionVersion,r.sourceConfidence,r.sourceText,r.derivationId,r.derivationFormula,r.derivationOperation,r.operandFactIds.join(';'),r.operandValues?JSON.stringify(r.operandValues):''])\n  ],[48,34,28,38,27,20,50,66,66,100,30,18,14,90,42,54,22,70,90]);")

write('server/tests/fixtures/finalDeliverableLineageFixture.ts', r'''import { buildDashboardReceiptFact, buildDashboardSpreadsheetFact, SOURCE_DASHBOARD_RECEIPT_FACT_ID, SOURCE_DASHBOARD_SPREADSHEET_FACT_ID, SOURCE_DASHBOARD_VALUE, sourceDashboardDir } from './sourceToDashboardFixture.js';
export const FINAL_LINEAGE_ENGAGEMENT_ID='eng-academy-final-deliverable-lineage';
export const FINAL_LINEAGE_WORKSPACE_ID='ws-academy-final-deliverable-lineage';
export const FINAL_LINEAGE_DERIVED_FACT_ID='fact-final-derived-net-zero';
export const FINAL_LINEAGE_DERIVATION_ID='DER-FINAL-REVENUE-MINUS-EXPENSE';
export function finalLineageDir(){return process.env.FINAL_LINEAGE_ACCEPTANCE_DIR||sourceDashboardDir();}
export function buildFinalLineageFacts():any[]{
 const revenue:any={...buildDashboardSpreadsheetFact(),workspaceId:FINAL_LINEAGE_WORKSPACE_ID};
 const expense:any={...buildDashboardReceiptFact(),workspaceId:FINAL_LINEAGE_WORKSPACE_ID};
 const derived:any={id:FINAL_LINEAGE_DERIVED_FACT_ID,workspaceId:FINAL_LINEAGE_WORKSPACE_ID,canonicalMetric:'net_income',labelOriginal:'Derived Net Result',labelNormalized:'Derived Net Result',valueOriginal:'0.00',valueFunctional:0,normalizedValue:0,functionalCurrency:'USD',currencyOriginal:'USD',reportingPeriod:'FY 2026',periodOriginal:'FY 2026',statement:'DERIVED_RESULT',status:'CALCULATED',verificationStatus:'CALCULATED',evidenceStatus:'DERIVED_FROM_CONFIRMED_PARENTS',sourceDocument:'DERIVED_FROM_SOURCE_FACTS',documentTitle:'DERIVED_FROM_SOURCE_FACTS',sourceText:'53.23 - 53.23 = 0.00',derivationId:FINAL_LINEAGE_DERIVATION_ID,derivationFormula:'revenue - operating_expenses',derivationOperation:'SUBTRACT',operandFactIds:[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,SOURCE_DASHBOARD_RECEIPT_FACT_ID],operandValues:{[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID]:SOURCE_DASHBOARD_VALUE,[SOURCE_DASHBOARD_RECEIPT_FACT_ID]:SOURCE_DASHBOARD_VALUE}};
 return [revenue,expense,derived];
}
export function buildTamperedFinalLineageFacts():any[]{const facts=buildFinalLineageFacts();facts[0]={...facts[0],sourceSha256:facts[1].sourceSha256};return facts;}
export function buildMissingOperandFinalLineageFacts():any[]{const facts=buildFinalLineageFacts();facts[2]={...facts[2],operandFactIds:[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,'fact-does-not-exist']};return facts;}
''')

write('server/tests/finalDeliverableLineageValidator.test.ts', r'''import assert from 'node:assert/strict';
import { computeFinalDeliverableLineageHash, validateFinalDeliverableLineage } from '../cpaOrganization/finalDeliverableLineageValidator.js';
import { buildFinalLineageFacts,buildMissingOperandFinalLineageFacts,buildTamperedFinalLineageFacts } from './fixtures/finalDeliverableLineageFixture.js';
const valid=buildFinalLineageFacts();const result=validateFinalDeliverableLineage(valid);assert.equal(result.valid,true,result.issues.join('|'));assert.equal(result.derivedFactIds.length,1);
const tampered=validateFinalDeliverableLineage(buildTamperedFinalLineageFacts());assert.equal(tampered.valid,false);assert.ok(tampered.issues.some(x=>x.includes('SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA')));
const missing=validateFinalDeliverableLineage(buildMissingOperandFinalLineageFacts());assert.equal(missing.valid,false);assert.ok(missing.issues.some(x=>x.includes('OPERAND_FACT_MISSING')));
const h1=computeFinalDeliverableLineageHash(valid);const mutated=buildFinalLineageFacts();mutated[0]={...mutated[0],sourceProvenanceId:'prov-alternate-same-value',sourceProvenanceIds:['prov-alternate-same-value']};const h2=computeFinalDeliverableLineageHash(mutated);assert.notEqual(h1,h2,'canonical package hash must bind lineage, not only metric/value');assert.match(h1,/^[a-f0-9]{64}$/);console.log('FINAL_DELIVERABLE_LINEAGE_VALIDATOR=PASS');
''')

write('server/tests/finalDeliverableLineageTruth.test.ts', r'''import assert from 'node:assert/strict';import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import * as XLSXModule from 'xlsx';const XLSX:any=(XLSXModule as any).default||XLSXModule;
import { computeFinalDeliverableLineageHash } from '../cpaOrganization/finalDeliverableLineageValidator.js';import { FINAL_LINEAGE_DERIVATION_ID,FINAL_LINEAGE_DERIVED_FACT_ID,FINAL_LINEAGE_ENGAGEMENT_ID,FINAL_LINEAGE_WORKSPACE_ID,buildFinalLineageFacts,buildTamperedFinalLineageFacts,finalLineageDir } from './fixtures/finalDeliverableLineageFixture.js';import { RECEIPT_PROVENANCE_ID,RECEIPT_SHA256 } from './fixtures/receiptFiveDimensionFixture.js';import { SOURCE_DASHBOARD_RECEIPT_FACT_ID,SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,loadSourceDashboardManifest } from './fixtures/sourceToDashboardFixture.js';
const dir=finalLineageDir();const reportsDir=path.join(dir,'reports');fs.mkdirSync(reportsDir,{recursive:true});process.env.HERMES_REPORTS_DIR=reportsDir;const {deliverableArtifactService}=await import('../cpaOrganization/deliverableArtifactService.js');const manifest=loadSourceDashboardManifest();
await assert.rejects(()=>deliverableArtifactService.compileAndRegisterDeliverable({reportId:'REP-FINAL-LINEAGE-BAD',engagementId:FINAL_LINEAGE_ENGAGEMENT_ID,workspaceId:FINAL_LINEAGE_WORKSPACE_ID,version:'v1.0',title:'Bad Final Lineage Draft',clientName:'Eve Academy Final Lineage',period:'FY 2026',currency:'USD',status:'AI_PREPARED',requireFinalLineage:true,facts:buildTamperedFinalLineageFacts()}),/FINAL_DELIVERABLE_LINEAGE_INVALID:.*SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA/);assert.equal(fs.existsSync(path.join(reportsDir,'audit_package_REP-FINAL-LINEAGE-BAD_v1.0.json')),false,'invalid lineage must fail before artifact write');
const facts=buildFinalLineageFacts();const report=await deliverableArtifactService.compileAndRegisterDeliverable({reportId:'REP-FINAL-LINEAGE',engagementId:FINAL_LINEAGE_ENGAGEMENT_ID,workspaceId:FINAL_LINEAGE_WORKSPACE_ID,version:'v1.0',title:'Final Evidence Lineage Draft',clientName:'Eve Academy Final Lineage',period:'FY 2026',currency:'USD',status:'AI_PREPARED',requireFinalLineage:true,facts});assert.equal(report.canonicalFactHash,computeFinalDeliverableLineageHash(facts));assert.equal(report.manifest.contentHash,report.canonicalFactHash);assert.equal(report.finalLineageValidation?.valid,true);const verified=deliverableArtifactService.verifyArtifactManifest(report);assert.equal(verified.allValid,true,JSON.stringify(verified.details));
const expected=[FINAL_LINEAGE_DERIVED_FACT_ID,FINAL_LINEAGE_DERIVATION_ID,'revenue - operating_expenses',SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,SOURCE_DASHBOARD_RECEIPT_FACT_ID,manifest.spreadsheet.sha256,'SPREADSHEET Revenue Register!B2',RECEIPT_SHA256,RECEIPT_PROVENANCE_ID,'fixture-total-glyph-region'];
const pdfBytes=fs.readFileSync(report.formats.pdf!.filepath);assert.equal(crypto.createHash('sha256').update(pdfBytes).digest('hex'),report.formats.pdf!.sha256);const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:pdfBytes});let pdf='';try{pdf=(await parser.getText()).text;}finally{await parser.destroy();}for(const x of expected)assert.ok(pdf.includes(x),`PDF missing ${x}`);
const json=JSON.parse(fs.readFileSync(report.formats.json!.filepath,'utf8'));assert.equal(json.finalLineageRequired,true);assert.equal(json.finalLineageValidation.valid,true);assert.equal(json.canonicalFactHash,report.canonicalFactHash);const derived=json.facts.find((f:any)=>f.id===FINAL_LINEAGE_DERIVED_FACT_ID);assert.deepEqual(derived.operandFactIds,[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,SOURCE_DASHBOARD_RECEIPT_FACT_ID]);assert.equal(derived.derivationId,FINAL_LINEAGE_DERIVATION_ID);const jtext=JSON.stringify(json);for(const x of expected.filter(x=>!x.startsWith('SPREADSHEET ')))assert.ok(jtext.includes(x),`JSON missing ${x}`);
const csv=fs.readFileSync(report.formats.csvLeadSchedules!.filepath,'utf8');for(const x of expected)assert.ok(csv.includes(x),`CSV missing ${x}`);
const wb=XLSX.readFile(report.formats.xlsx!.filepath);const lead:any[][]=XLSX.utils.sheet_to_json(wb.Sheets['Lead Schedules'],{header:1,raw:false});const leadText=lead.flat().map(v=>String(v??'')).join(' | ');for(const x of expected)assert.ok(leadText.includes(x),`XLSX missing ${x}`);
const proof={marker:'P2_FINAL_DELIVERABLE_LINEAGE_TRUTH=PASS',reportId:report.reportId,canonicalFactHash:report.canonicalFactHash,derivedFactId:FINAL_LINEAGE_DERIVED_FACT_ID,derivationId:FINAL_LINEAGE_DERIVATION_ID,operandFactIds:[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,SOURCE_DASHBOARD_RECEIPT_FACT_ID],spreadsheet:{sha256:manifest.spreadsheet.sha256,coordinate:'Revenue Register!B2',provenanceId:manifest.spreadsheet.provenanceId},receipt:{sha256:RECEIPT_SHA256,coordinate:'fixture-total-glyph-region',provenanceId:RECEIPT_PROVENANCE_ID},formats:{pdf:report.formats.pdf!.sha256,json:report.formats.json!.sha256,xlsx:report.formats.xlsx!.sha256,csv:report.formats.csvLeadSchedules!.sha256},manifestVerification:verified};fs.writeFileSync(path.join(dir,'final-deliverable-lineage-truth.json'),JSON.stringify(proof,null,2));console.log('P2_FINAL_DELIVERABLE_LINEAGE_TRUTH=PASS');
''')

write('server/tests/finalDeliverableLineageCurriculumAcceptance.test.ts', r'''import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {academyMinervaLab} from '../cpaOrganization/academyMinervaLab.js';import {finalLineageDir} from './fixtures/finalDeliverableLineageFixture.js';const dir=finalLineageDir();const proof=JSON.parse(fs.readFileSync(path.join(dir,'final-deliverable-lineage-truth.json'),'utf8'));assert.equal(proof.marker,'P2_FINAL_DELIVERABLE_LINEAGE_TRUTH=PASS');const refs=[`report:${proof.reportId}:hash:${proof.canonicalFactHash}`,`xlsx:${proof.spreadsheet.sha256}:${proof.spreadsheet.coordinate}`,`image:${proof.receipt.sha256}:${proof.receipt.coordinate}`,`derivation:${proof.derivationId}:${proof.operandFactIds.join('+')}`,`formats:${Object.values(proof.formats).join(':')}`];const report=academyMinervaLab.evaluateFiveDimensions({caseId:'CURR-DELIVERABLE-FINAL-LINEAGE',executionId:`final-lineage-${proof.canonicalFactHash.slice(0,12)}`,dimensions:{SOURCE_COVERAGE:{checks:[{checkId:'direct-parents-retained',label:'Final exports retain both original source parents and exact source coordinates',outcome:'PASS',evidenceRefs:refs.slice(1,3),details:['Spreadsheet and receipt evidence remain independently traceable in every final format.']},{checkId:'invalid-source-binding-fails-closed',label:'A source SHA/coordinate mismatch fails before final artifact creation',outcome:'PASS',evidenceRefs:[refs[0]],details:['REP-FINAL-LINEAGE-BAD produced no JSON artifact.']}]},SEMANTIC_UNDERSTANDING:{checks:[{checkId:'semantic-not-targeted',label:'Semantic interpretation is outside this final-lineage case',outcome:'NOT_TESTED',details:['The source facts were already accepted by their own curriculum cases.']}]},ACCOUNTING_ACCURACY:{checks:[{checkId:'derived-value-recomputed',label:'Derived report value is recomputed from physically grounded operands',outcome:'PASS',evidenceRefs:[refs[3]],details:['53.23 - 53.23 = 0.00; operand IDs and values are persisted with the derivation.']},{checkId:'lineage-bound-package-hash',label:'Canonical package hash binds source and derivation lineage as well as values',outcome:'PASS',evidenceRefs:[refs[0]],details:['Changing provenance while preserving the same numeric value changes the lineage hash.']}]},PRODUCT_TRUTH:{checks:[{checkId:'product-not-targeted',label:'Browser Product Truth was accepted in the dedicated prior case',outcome:'NOT_TESTED',details:['CURR-PRODUCT-SOURCE-TO-DASHBOARD already owns browser click-through.']}]},DELIVERABLE_TRUTH:{checks:[{checkId:'physical-four-format-readback',label:'PDF JSON CSV and XLSX physically read back complete direct and derived lineage',outcome:'PASS',evidenceRefs:[refs[4],refs[1],refs[2],refs[3]],details:['All four artifact hashes verified and all required reverse-lineage tokens were physically present.']}]}}});assert.equal(report.dimensions.SOURCE_COVERAGE.status,'PASS');assert.equal(report.dimensions.ACCOUNTING_ACCURACY.status,'PASS');assert.equal(report.dimensions.DELIVERABLE_TRUTH.status,'PASS');assert.equal(report.dimensions.SEMANTIC_UNDERSTANDING.status,'NOT_TESTED');assert.equal(report.dimensions.PRODUCT_TRUTH.status,'NOT_TESTED');assert.equal(report.overallStatus,'INCOMPLETE_DIMENSION_COVERAGE');fs.writeFileSync(path.join(dir,'five-dimension.json'),JSON.stringify(report,null,2));console.log('P2_FINAL_DELIVERABLE_LINEAGE_TARGETED_DIMENSIONS=PASS');
''')

replace_once('server/cpaOrganization/academyMinervaLab.ts',
"""        'PHYSICAL_FIXTURE_REQUIRED',
        ['src/adapters/presentationAdapters.test.ts']
      )
""",
"""        'CONTRACT_READY',
        ['server/tests/finalDeliverableLineageValidator.test.ts', 'server/tests/finalDeliverableLineageTruth.test.ts', 'server/tests/finalDeliverableLineageCurriculumAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_FINAL_DELIVERABLE_LINEAGE_ACCEPTANCE.md']
      )
""")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',"assert.equal(coverage.contractReadyCases, 19);\nassert.equal(coverage.physicalFixturePendingCases, 1);","assert.equal(coverage.contractReadyCases, 20);\nassert.equal(coverage.physicalFixturePendingCases, 0);")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',
"assert.ok(find('CURR-DELIVERABLE-FINAL-LINEAGE').expectedSafeguards.join(' ').includes('reverse-trace'));\n",
"assert.equal(find('CURR-DELIVERABLE-FINAL-LINEAGE').fixtureStatus, 'CONTRACT_READY');\nassert.ok(find('CURR-DELIVERABLE-FINAL-LINEAGE').expectedSafeguards.join(' ').includes('reverse-trace'));\nassert.ok(find('CURR-DELIVERABLE-FINAL-LINEAGE').validationRefs.includes('server/tests/finalDeliverableLineageTruth.test.ts'));\n")
print('FINAL_DELIVERABLE_LINEAGE_PATCH_APPLIED')
