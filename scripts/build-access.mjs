import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
await build({entryPoints:['scripts/owner-account.ts'],bundle:true,platform:'node',format:'cjs',packages:'external',outfile:'dist/owner-account.cjs'});
const files=['server/access/identityStore.ts','server/access/accessPortal.ts','server/access/portalPages.ts','server/operatorAccess.ts','src/main.tsx','src/App.tsx'];
const sourceFingerprint=crypto.createHash('sha256').update(files.map(p=>p+'\n'+fs.readFileSync(p,'utf8')).join('\n')).digest('hex');
let gitSha=null;try{gitSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
fs.writeFileSync('dist/access-build.json',JSON.stringify({gitSha,sourceFingerprint,builtAt:new Date().toISOString()}));
