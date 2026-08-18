import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "ai_cpa_storage.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

import { CanonicalFactResolver } from "../server/canonicalFactResolver.js";
import { AccountingValidationEngine } from "../server/accountingValidationEngine.js";

function runAudit() {
  const ws = db.workspaces.find(w => w.id === "ws-1786987791096") || db.workspaces[1];
  const rawFacts = (db.extracted_facts || db.facts || []).filter(f => f.workspaceId === ws.id || f.workspace_id === ws.id);

  const readiness = AccountingValidationEngine.evaluateCustomerReadiness(ws.id, rawFacts);

  console.log("=== CUSTOMER READINESS CRITERIA EVALUATION ===");
  console.log("Overall Is Ready:", readiness.isCustomerReady);
  console.log("Criteria Details:");
  if (readiness.criteria) {
    readiness.criteria.forEach((c, idx) => {
      console.log(`  Gate ${idx+1}: [${c.passed ? "PASS" : "FAIL"}] ${c.name} - ${c.detail}`);
    });
  } else {
    console.log(JSON.stringify(readiness, null, 2));
  }
}

runAudit();
