import assert from 'node:assert/strict';
import { computeFinalDeliverableLineageHash, validateFinalDeliverableLineage } from '../cpaOrganization/finalDeliverableLineageValidator.js';
import { buildFinalLineageFacts,buildMissingOperandFinalLineageFacts,buildTamperedFinalLineageFacts } from './fixtures/finalDeliverableLineageFixture.js';
const valid=buildFinalLineageFacts();const result=validateFinalDeliverableLineage(valid);assert.equal(result.valid,true,result.issues.join('|'));assert.equal(result.derivedFactIds.length,1);
const tampered=validateFinalDeliverableLineage(buildTamperedFinalLineageFacts());assert.equal(tampered.valid,false);assert.ok(tampered.issues.some(x=>x.includes('SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA')));
const missing=validateFinalDeliverableLineage(buildMissingOperandFinalLineageFacts());assert.equal(missing.valid,false);assert.ok(missing.issues.some(x=>x.includes('OPERAND_FACT_MISSING')));
const h1=computeFinalDeliverableLineageHash(valid);const mutated=buildFinalLineageFacts();mutated[0]={...mutated[0],sourceProvenanceId:'prov-alternate-same-value',sourceProvenanceIds:['prov-alternate-same-value']};const h2=computeFinalDeliverableLineageHash(mutated);assert.notEqual(h1,h2,'canonical package hash must bind lineage, not only metric/value');assert.match(h1,/^[a-f0-9]{64}$/);console.log('FINAL_DELIVERABLE_LINEAGE_VALIDATOR=PASS');
