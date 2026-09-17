import fs from 'node:fs';
import { bankEvidenceDir, buildBankStatementPdf, fixtureManifestPath, fixturePath, sha256, type BankFixtureVariant } from './fixtures/bankStatementCompletenessFixture.js';
const variants:BankFixtureVariant[]=['complete','missing-disclosure','missing-transactions','missing-unknown'];
fs.rmSync(bankEvidenceDir(),{recursive:true,force:true}); fs.mkdirSync(bankEvidenceDir(),{recursive:true});
const manifest:any={marker:'BANK_STATEMENT_PHYSICAL_FIXTURES=PASS',fixtures:{}};
for(const variant of variants){ const bytes=await buildBankStatementPdf(variant); fs.writeFileSync(fixturePath(variant),bytes); manifest.fixtures[variant]={filename:fixturePath(variant).split('/').pop(),bytes:bytes.length,sha256:sha256(bytes)}; }
fs.writeFileSync(fixtureManifestPath(),JSON.stringify(manifest,null,2));
console.log('BANK_STATEMENT_PHYSICAL_FIXTURES=PASS'); console.log(JSON.stringify(manifest.fixtures));
