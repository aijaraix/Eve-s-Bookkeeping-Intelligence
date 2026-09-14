import fs from "fs";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

const src = fs.readFileSync("server.ts", "utf8");
assert(src.includes('path.join(process.cwd(), "storage", "ai_cpa_storage.json")'), "workspace storage must default under PVC-backed storage root");
assert(src.includes('fs.renameSync(tempFile, storageFile)'), "workspace persistence must use atomic rename");
assert(src.includes('fs.fsyncSync(fileFd)'), "workspace persistence must fsync file before rename");
const loadStart = src.indexOf('function loadStorage()');
const loadCall = src.indexOf('loadStorage();', loadStart);
const loadBlock = src.slice(loadStart, loadCall);
assert(loadStart >= 0 && loadCall > loadStart, "loadStorage function and call must exist");
assert(loadBlock.includes('backgroundIngestionQueue.setDbRef(db);'), "queue must be rebound after storage object rehydration");
console.log("✓ Company 1 workspace persistence/rebind tests passed");
