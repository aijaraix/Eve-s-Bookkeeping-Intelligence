from pathlib import Path
p=Path('server/cpaOrganization/mixedSourceBatchEvidenceEngine.ts')
t=p.read_text()
old="if(coordinate){ for(const issue of validateSourceCoordinate(coordinate)) issues.push(`COORDINATE_INVALID:${issue}`); }"
new="if(coordinate){ for(const issue of validateSourceCoordinate(coordinate).issues) issues.push(`COORDINATE_INVALID:${issue}`); }"
if old not in t:
    raise SystemExit('MIXED_BATCH_VALIDATOR_FIX_TARGET_MISSING')
p.write_text(t.replace(old,new,1))
print('MIXED_BATCH_VALIDATOR_CONTRACT_FIX=PASS')
