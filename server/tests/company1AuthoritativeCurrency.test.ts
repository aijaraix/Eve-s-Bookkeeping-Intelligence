import fs from "fs";
import { applyPrimaryStatementAuthority } from "../hybridExtraction/HybridExtractionOrchestrator.js";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

const candidates: any[] = [
  { rowLabel: "Total assets", rawValue: "213396", currency: "USD", period: "2024-12-31", statementType: "CONSOLIDATED_BALANCE_SHEET", physicalPage: 53, confidence: .99, sourceQuote: "Total assets $ 213,396 $ 226,501" },
  { rowLabel: "Total assets", rawValue: "226501", currency: "EUR", period: "2023-12-31", statementType: "CONSOLIDATED_BALANCE_SHEET", physicalPage: 53, confidence: .99, sourceQuote: "Total assets $ 213,396 $ 226,501" }
];
const fixed = applyPrimaryStatementAuthority(candidates as any, { statementType: "CONSOLIDATED_BALANCE_SHEET", reportingEntity: "Pfizer Inc." }, "USD", "USD", "Pfizer Inc.");
assert(fixed.every(f => f.currency === "USD"), "authoritative primary reporting currency must override inconsistent row currency");
assert(fixed.every(f => f.reportingScope === "CONSOLIDATED"), "consolidated statement scope must be authoritative");
assert(fixed.every(f => f.reportingEntity === "Pfizer Inc."), "missing reporting entity must inherit authoritative statement issuer");
const src = fs.readFileSync("server/backgroundQueue.ts", "utf8");
assert(src.includes("hybridRes.documentMap?.primaryReportingCurrency"), "queue must bind resolved document-map currency into job state");
const server = fs.readFileSync("server.ts", "utf8");
assert(server.includes("ws.currency = resolvedWorkspaceCurrency"), "workspace currency must follow resolved reporting currency");
assert(server.includes("doc.currency = resolvedWorkspaceCurrency"), "document currency must follow resolved reporting currency");
console.log("✓ Company 1 authoritative primary-statement currency tests passed");
