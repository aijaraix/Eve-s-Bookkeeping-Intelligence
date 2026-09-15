import fs from 'node:fs';
import path from 'node:path';
import { IdentityStore } from '../server/access/identityStore.js';
// Invoke only from protected deployment administration. Never prints credentials.
// Bootstrap: node owner-account.cjs bootstrap email /private/setup.json
// Recovery: node owner-account.cjs reset email /private/setup.json
const [operation,email,output]=process.argv.slice(2);
if(!['bootstrap','reset'].includes(operation)||!email||!output||!path.isAbsolute(output))throw new Error('Usage: owner-account bootstrap|reset email /private/setup.json');
const store=new IdentityStore();
const fd=fs.openSync(output,'wx',0o600);
try{
 const existing=store.read().users.find(u=>u.email===email.toLowerCase());
 if(operation==='reset'&&(!existing||existing.role!=='OWNER'))throw new Error('OWNER_ACCOUNT_REQUIRED');
 const result=operation==='bootstrap'?store.invite(email,'OWNER',null,'DEPLOYMENT_BOOTSTRAP',true):{user:existing,temporaryPassword:store.reset(existing!.id,'DEPLOYMENT_RECOVERY')};
 fs.writeFileSync(fd,JSON.stringify({email:result.user!.email,temporaryPassword:result.temporaryPassword,expiresInHours:24,loginPath:'/login',mustChangePassword:true}));fs.fsyncSync(fd);
 console.log('One-time setup saved to the protected output file. No credential printed.');
}finally{fs.closeSync(fd);}
