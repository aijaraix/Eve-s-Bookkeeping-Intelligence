from pathlib import Path

def replace_once(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f'ANCHOR_NOT_FOUND:{path}:{old[:120]}')
    p.write_text(s.replace(old,new,1))

p='server/cpaOrganization/duplicateEvidenceIntegrityEngine.ts'
replace_once(p,
"export function buildDuplicateEvidenceFiveDimensionChecks(clean:DuplicateEvidenceReview,conflict:DuplicateEvidenceReview){return {source:[pass('duplicate-physical-source-lineage','Exact and near-duplicate variants preserve document SHA artifact provenance and valid source coordinates',clean.evidenceRefs,[`inputs=${clean.inputObservationCount}; uniquePhysical=${clean.uniquePhysicalSourceCount}`]),pass('duplicate-invalid-source-blocks','Source identity tampering is independently validated and cannot be counted as corroboration',conflict.evidenceRefs,[`invalidSources=${conflict.invalidSourceCount}`])],",
"export function buildDuplicateEvidenceFiveDimensionChecks(clean:DuplicateEvidenceReview,conflict:DuplicateEvidenceReview,invalid:DuplicateEvidenceReview){return {source:[pass('duplicate-physical-source-lineage','Exact and near-duplicate variants preserve document SHA artifact provenance and valid source coordinates',clean.evidenceRefs,[`inputs=${clean.inputObservationCount}; uniquePhysical=${clean.uniquePhysicalSourceCount}`]),pass('duplicate-invalid-source-blocks','Source identity tampering is independently validated and cannot be counted as corroboration',invalid.evidenceRefs,[`status=${invalid.status}; invalidSources=${invalid.invalidSourceCount}; issues=${invalid.issues.join(' | ')}`])],")

replace_once('server/tests/duplicateEvidenceIntegrityEngine.test.ts',
"const checks=buildDuplicateEvidenceFiveDimensionChecks(p.cleanReview,p.conflictReview);",
"const checks=buildDuplicateEvidenceFiveDimensionChecks(p.cleanReview,p.conflictReview,p.invalidReview);assert(checks.source[1].evidenceRefs?.some((r:string)=>r==='document:doc-pdf-base'));assert(checks.source[1].details?.some((d:string)=>d.includes('BLOCKED_INVALID_SOURCE_IDENTITY')));assert(checks.source[1].details?.some((d:string)=>d.includes('invalidSources=1')));")
replace_once('server/tests/duplicateEvidenceFiveDimensionAcceptance.test.ts',
"const p=await prepareDuplicateEvidence(),checks=buildDuplicateEvidenceFiveDimensionChecks(p.cleanReview,p.conflictReview);",
"const p=await prepareDuplicateEvidence(),checks=buildDuplicateEvidenceFiveDimensionChecks(p.cleanReview,p.conflictReview,p.invalidReview);")
print('DUPLICATE_EVIDENCE_PROOF_HARDENING=PASS')
