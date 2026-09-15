import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const roles = ['OWNER','PLATFORM_ADMIN','INTERNAL_OPERATOR','CPA_REVIEWER','CLIENT_ADMIN','CLIENT_USER','READ_ONLY'] as const;
export type Role = typeof roles[number];
export interface User { id:string; email:string; role:Role; tenantId:string|null; passwordHash:string; mustChangePassword:boolean; temporaryExpiresAt:number|null; disabled:boolean; createdAt:string; }
export interface Session { hash:string; userId:string; csrf:string; expiresAt:number; restricted:boolean; createdAt:string; }
export interface Tenant { id:string; name:string; workspaceIds:string[]; }
interface State { version:1; users:User[]; sessions:Session[]; tenants:Tenant[]; attempts:Record<string,{count:number;until:number}>; audit:{at:string;actor:string;event:string;subject:string}[]; }
export const digest=(s:string)=>crypto.createHash('sha256').update(s).digest('hex');
export const random=()=>crypto.randomBytes(32).toString('base64url');
export const internal=(u:Pick<User,'role'>)=>['OWNER','PLATFORM_ADMIN','INTERNAL_OPERATOR'].includes(u.role);
export const admin=(u:Pick<User,'role'>)=>['OWNER','PLATFORM_ADMIN'].includes(u.role);
export function hashPassword(password:string) { const salt=crypto.randomBytes(16).toString('hex'); return `scrypt$32768$${salt}$${crypto.scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex')}`; }
export function verifyPassword(password:string,encoded:string) { const parts=encoded.split('$'); if(parts.length!==4||parts[0]!=='scrypt'||parts[1]!=='32768')return false; const actual=crypto.scryptSync(password,parts[2],64,{N:32768,r:8,p:1,maxmem:64*1024*1024});const expected=Buffer.from(parts[3],'hex');return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual); }
export function validatePassword(p:string) { if(typeof p!=='string'||p.length<14||p.length>256)throw new Error('Use a password between 14 and 256 characters.'); }
export function safeUser(u:User) { const {passwordHash,temporaryExpiresAt,...safe}=u;return {...safe,setupExpiresAt:temporaryExpiresAt}; }
export class IdentityStore {
 readonly root:string; readonly file:string;
 constructor(root=process.env.EVE_IDENTITY_DIR||path.join(process.cwd(),'storage','identity')) {this.root=root;this.file=path.join(root,'accounts.json');}
 read():State { if(!fs.existsSync(this.file))return {version:1,users:[],sessions:[],tenants:[],attempts:{},audit:[]};const s=JSON.parse(fs.readFileSync(this.file,'utf8'));if(s.version!==1||!Array.isArray(s.users)||!Array.isArray(s.sessions)||!Array.isArray(s.tenants))throw new Error('IDENTITY_STORE_INVALID');return s; }
 transaction<T>(fn:(s:State)=>T):T {
  fs.mkdirSync(this.root,{recursive:true,mode:0o700});const lock=path.join(this.root,'write.lock');
  let fd:number;try{fd=fs.openSync(lock,'wx',0o600);}catch{throw new Error('IDENTITY_STORE_BUSY');}
  try {const state=this.read(); const result=fn(state); state.sessions=state.sessions.filter(s=>s.expiresAt>Date.now());for(const [k,v]of Object.entries(state.attempts))if(v.until<Date.now())delete state.attempts[k];
   const temp=this.file+'.'+crypto.randomUUID()+'.tmp';const out=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(out,JSON.stringify(state));fs.fsyncSync(out);}finally{fs.closeSync(out);}fs.renameSync(temp,this.file);const dir=fs.openSync(this.root,'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}return result;
  }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
 }
 event(s:State,actor:string,event:string,subject='') {s.audit.push({at:new Date().toISOString(),actor,event,subject});}
 invite(email:string,role:Role,tenantId:string|null,actor:string,bootstrap=false) {
  email=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!roles.includes(role))throw new Error('Invalid account.');
  const temporaryPassword=random();const passwordHash=hashPassword(temporaryPassword);
  const user=this.transaction(s=>{if(bootstrap&&s.users.length)throw new Error('Bootstrap already completed.');if(s.users.some(u=>u.email===email))throw new Error('Account already exists.');
   if(!['OWNER','PLATFORM_ADMIN','INTERNAL_OPERATOR'].includes(role)&&!s.tenants.some(t=>t.id===tenantId))throw new Error('Tenant required.');
   const u:User={id:crypto.randomUUID(),email,role,tenantId:internal({role} as User)?null:tenantId,passwordHash,mustChangePassword:true,temporaryExpiresAt:Date.now()+86400000,disabled:false,createdAt:new Date().toISOString()};s.users.push(u);this.event(s,actor,'ACCOUNT_INVITED',u.id);return safeUser(u);});return {user,temporaryPassword};
 }
 login(email:string,password:string,ip:string) {
  email=email.trim().toLowerCase();if(password.length>256||email.length>254)return null;
  const token=random();return this.transaction(s=>{const keys=[digest('email:'+email),digest('ip:'+ip)];if(keys.some(k=>(s.attempts[k]?.until||0)>Date.now()&&s.attempts[k].count>=10))throw new Error('LOGIN_THROTTLED');
   const u=s.users.find(u=>u.email===email);const valid=u?.passwordHash?verifyPassword(password,u.passwordHash):verifyPassword(password,`scrypt$32768$${'0'.repeat(32)}$${'0'.repeat(128)}`);
   if(!u||u.disabled||!valid||(u.temporaryExpiresAt!==null&&u.temporaryExpiresAt<Date.now())){for(const k of keys){const a=s.attempts[k];s.attempts[k]={count:a&&a.until>Date.now()?a.count+1:1,until:Date.now()+15*60000};}this.event(s,'anonymous','LOGIN_FAILED',digest(email));return null;}
   for(const k of keys)delete s.attempts[k];const session:Session={hash:digest(token),userId:u.id,csrf:random(),expiresAt:Date.now()+(u.mustChangePassword?30*60000:12*3600000),restricted:u.mustChangePassword,createdAt:new Date().toISOString()};
   if(u.mustChangePassword){u.passwordHash='';u.temporaryExpiresAt=Date.now();s.sessions=s.sessions.filter(x=>x.userId!==u.id);}s.sessions.push(session);this.event(s,u.id,'LOGIN_SUCCESS');return {token,session,user:safeUser(u)};});
 }
 session(token:string) {if(!token)return null;const s=this.read();const session=s.sessions.find(x=>x.hash===digest(token)&&x.expiresAt>Date.now());const user=session&&s.users.find(u=>u.id===session.userId&&!u.disabled);return user&&session?{session,user}:null;}
 changePassword(token:string,password:string,current:string) {validatePassword(password);const hash=hashPassword(password);return this.transaction(s=>{const session=s.sessions.find(x=>x.hash===digest(token)&&x.expiresAt>Date.now());const user=session&&s.users.find(u=>u.id===session.userId&&!u.disabled);if(!user||!session)throw new Error('SESSION_EXPIRED');if(!session.restricted&&!verifyPassword(current,user.passwordHash))throw new Error('Current password was not accepted.');user.passwordHash=hash;user.mustChangePassword=false;user.temporaryExpiresAt=null;s.sessions=s.sessions.filter(x=>x.userId!==user.id);this.event(s,user.id,'PASSWORD_CHANGED_SESSIONS_REVOKED');});}
 revoke(userId:string,actor:string) {this.transaction(s=>{s.sessions=s.sessions.filter(x=>x.userId!==userId);this.event(s,actor,'SESSIONS_REVOKED',userId);});}
 logout(token:string) {this.transaction(s=>{const session=s.sessions.find(x=>x.hash===digest(token));s.sessions=s.sessions.filter(x=>x.hash!==digest(token));if(session)this.event(s,session.userId,'LOGOUT');});}
 reset(userId:string,actor:string) {const temporaryPassword=random(),passwordHash=hashPassword(temporaryPassword);this.transaction(s=>{const user=s.users.find(u=>u.id===userId);if(!user)throw new Error('Account not found.');user.passwordHash=passwordHash;user.mustChangePassword=true;user.temporaryExpiresAt=Date.now()+86400000;s.sessions=s.sessions.filter(x=>x.userId!==userId);this.event(s,actor,'PASSWORD_RESET_ISSUED',userId);});return temporaryPassword;}
}
