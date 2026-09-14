from pathlib import Path
import json
p=Path('server/tests/company1VerifiedContinuation.test.ts');s=p.read_text()
assert "VERIFIED_CONTINUATION_LOGIC_VERSION === 'v5-disclosure-evidence-ledger'" in s
p.write_text(s.replace("VERIFIED_CONTINUATION_LOGIC_VERSION === 'v5-disclosure-evidence-ledger'", "VERIFIED_CONTINUATION_LOGIC_VERSION === 'v6-bounded-lexicon-review-package'"))
p=Path('package.json');obj=json.loads(p.read_text());obj['scripts']['test']+=' && tsx server/tests/company1BoundedLexiconReview.test.ts';p.write_text(json.dumps(obj,indent=2)+'\n')
p=Path('server/cpaOrganization/reviewPackageRendering.ts');s=p.read_text()
old="...(params.specialistReview?.jobs||[]).map((j:any)=>[j.agentId,j.status,j.outputValidationStatus,j.provenance?.actualModel||j.provenance?.model,(j.uncertainties||[]).map(display).join(';'),JSON.stringify(j.outputManifest)])"
new="""...(params.specialistReview?.jobs||[]).flatMap((j:any)=>{
      const serialized=JSON.stringify(j.outputManifest||{});
      const chunks=serialized.match(/[\\s\\S]{1,24000}/g)||[''];
      return chunks.map((chunk:string,index:number)=>[`${j.agentId} [part ${index+1}/${chunks.length}]`,j.status,j.outputValidationStatus,j.provenance?.actualModel||j.provenance?.model,(j.uncertainties||[]).map(display).join(';'),chunk]);
    })"""
assert old in s;s=s.replace(old,new);p.write_text(s)
p=Path('server/tests/company1BoundedLexiconReview.test.ts');s=p.read_text();needle="  const pdf=await renderReviewPdf("
insert="""  const longOutput={description:'evidence '.repeat(6000)};
  const large=renderReviewWorkbook({...params,version:'v6-large-test',specialistReview:{jobs:[{agentId:'LEXICON',status:'JOB_COMPLETED_SUCCESS',outputManifest:longOutput}]}},root);
  const lw=XLSX.readFile(large.filepath);const lr=XLSX.utils.sheet_to_json(lw.Sheets['Specialist Review'],{header:1}) as any[][];
  assert.equal(lr.slice(1).map(r=>r[5]).join(''),JSON.stringify(longOutput),'long specialist output must survive workbook cell limits without truncation');
"""
assert needle in s;s=s.replace(needle,insert+needle);p.write_text(s)
