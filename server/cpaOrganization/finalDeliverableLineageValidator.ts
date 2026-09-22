import crypto from 'node:crypto';
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
