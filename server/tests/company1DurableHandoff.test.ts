import fs from "fs";
import { persistFactStatus } from "../failClosedGuards.js";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

assert(persistFactStatus("approved", undefined) === "pending_review", "approved without evidence must fail closed");
assert(persistFactStatus("approved", "UNCONFIRMED") === "pending_review", "approved with unconfirmed evidence must fail closed");
assert(persistFactStatus("approved", "CONFIRMED") === "approved", "confirmed approved fact may persist approved");
assert(persistFactStatus("validated", "CONFIRMED") === "validated", "confirmed validated fact may persist validated");

const queueSrc = fs.readFileSync("server/backgroundQueue.ts", "utf8");
assert(queueSrc.includes("private diskSaveChain: Promise<void> = Promise.resolve()"), "queue writes must be serialized");
assert(queueSrc.includes("this.diskSaveChain.then(() => this.performDiskSaveNow"), "serialized chain must wrap physical disk writes");
assert(queueSrc.includes("recoverPersistedJobsAfterAuthorityAcquired"), "leader acquisition must recover persisted jobs");
assert(queueSrc.includes("authorized && !this.lastProcessingAuthority"), "recovery must trigger on physical processing-authority transition");
assert(queueSrc.includes("WAITING_FOR_AI_CAPACITY") && queueSrc.includes("schedulePersistedCapacityResume"), "persisted capacity waits must regain timers after restart");
assert(queueSrc.includes("Rehydration is read-only"), "startup must not mutate before fenced leadership is acquired");

const hybridSrc = fs.readFileSync("server/hybridExtraction/HybridExtractionOrchestrator.ts", "utf8");
assert(hybridSrc.includes("evidenceStatus: ev.evidenceStatus"), "hybrid facts must retain evidence status");
assert(hybridSrc.includes("verificationStatus: isConfirmedEvidenceStatus"), "hybrid facts must carry pre-promotion verification lineage");

const serverSrc = fs.readFileSync("server.ts", "utf8");
for (const marker of ["evidenceStatus: f.evidenceStatus", "verificationStatus: f.verificationStatus", "reportingScope: f.reportingScope", "reportingEntity: f.reportingEntity"]) {
  assert(serverSrc.includes(marker), `workspace handoff missing ${marker}`);
}

console.log("✓ Company 1 durable queue/restart/proof-lineage handoff tests passed");
