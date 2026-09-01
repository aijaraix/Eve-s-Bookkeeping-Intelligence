/**
 * Fail-closed CPA pipeline regressions.
 * Empty extraction cannot look verified; invented hashes/amounts/approvals must fail.
 */

import { EvidenceCrossCheckEngine } from "../hybridExtraction/EvidenceCrossCheckEngine.js";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";
import { ReportingEngine } from "../reportingEngine.js";
import { DeliverableWizardEngine } from "../../src/lib/deliverables/wizardEngine.js";
import { UNILEVER_FY2025_GOLDEN_DATASET } from "../../src/lib/unileverGoldenFixture.js";
import { ExtractedFact } from "../../src/types.js";
import { StatementFactCandidate } from "../hybridExtraction/types.js";
import {
  amountAppearsInSourceBlock,
  persistFactStatus,
  persistFactConfidence,
  isPlaceholderDocumentHash,
  assertRealDocumentHash,
  shouldRejectDriveUrlOnlyUpload,
  shouldRejectEmptyUpload,
  isBannedMockFact,
  formatUnileverContinuingTurnoverDisplay
} from "../failClosedGuards.js";

function goldenToFact(workspaceId: string, g: (typeof UNILEVER_FY2025_GOLDEN_DATASET)[number], overrides: Partial<ExtractedFact> = {}): ExtractedFact {
  return {
    id: g.factId,
    workspaceId,
    documentId: "doc-unilever-ar",
    factType: g.metric === "revenue" ? "revenue" : "general",
    canonicalMetric: g.metric,
    labelOriginal: g.rowLabel,
    labelNormalized: g.rowLabel,
    valueOriginal: String(g.rawAmount),
    valueFunctional: String(g.normalizedValue),
    normalizedValue: g.normalizedValue,
    currencyOriginal: g.currency,
    functionalCurrency: g.currency,
    unitScale: "Millions",
    reportingPeriod: g.period,
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    pageNumber: g.pageNumber,
    sourceText: g.rawText,
    status: "approved",
    confidence: undefined as any,
    extractionMethod: "HYBRID_GEMINI_NATIVE",
    continuingOrDiscontinued: "continuing",
    ...overrides
  };
}

export function runFailClosedTests(): { passed: number; total: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${name}`);
    } else {
      const msg = detail ? `${name} — ${detail}` : name;
      failures.push(msg);
      console.error(`  [FAIL] ${msg}`);
    }
  }

  console.log("\n=======================================================");
  console.log("RUNNING FAIL-CLOSED CPA PIPELINE REGRESSION SUITE");
  console.log("=======================================================\n");

  // 1. Unilever continuing turnover is €50.503B / 50503000000, never 59604 / 59.6B
  try {
    const wsId = "ws-unilever-failclosed";
    const goldenRev = UNILEVER_FY2025_GOLDEN_DATASET.find((f) => f.metric === "revenue")!;
    const continuing = goldenToFact(wsId, goldenRev);
    const staleDiscontinued = goldenToFact(wsId, goldenRev, {
      id: "fct-stale-59604",
      valueOriginal: "59604",
      valueFunctional: "59604000000",
      normalizedValue: 59604000000,
      sourceText: "Discontinued or stale mock turnover €59,604 million",
      continuingOrDiscontinued: "discontinued",
      status: "pending_review",
      canonicalMetric: "revenue"
    });

    const summary = CanonicalFactResolver.resolveWorkspaceSummary(wsId, [continuing, staleDiscontinued]);
    const formatted = String(summary.revenue.formattedValue || "");
    const scalar = summary.revenue.normalizedScalarValue;
    const blob = `${formatted} ${scalar} ${summary.revenue.primaryFact?.id || ""}`;

    assert(goldenRev.normalizedValue === 50503000000, "1a. Golden fixture continuing turnover is 50503000000");
    assert(scalar === 50503000000, "1b. Resolver selects 50503000000 continuing turnover", `got ${scalar}`);
    assert(
      formatted.includes("50.50") || formatted.includes("50.503") || formatted.includes("50,503"),
      "1c. Display is €50.50B / €50.503B class",
      `got ${formatted}`
    );
    assert(
      !/59\.6|59604|59,604|59604000000/.test(blob),
      "1d. Verified display never contains 59604 / 59.6B",
      blob
    );
    assert(
      formatUnileverContinuingTurnoverDisplay(50503000000) === "€50.503B",
      "1e. Explicit continuing-ops display helper is €50.503B"
    );
    assert(
      isBannedMockFact({ id: "x", valueOriginal: "59.60B", valueFunctional: "59604000000" }),
      "1f. 59.60B / 59604000000 is banned from live fact store"
    );
  } catch (e: any) {
    assert(false, "1. Unilever continuing turnover", e.message);
  }

  // 2. Wizard / generate with 0 validated facts does not emit line items or passed:true
  try {
    const wizard = new DeliverableWizardEngine();
    let threw = false;
    let thrown = "";
    try {
      wizard.generateReport({
        companyName: "Empty Co",
        projectName: "Empty",
        projectId: "ws-empty",
        workspaceId: "ws-empty",
        deliverableType: "Financial Report",
        audience: "Board",
        detailLevel: "standard",
        facts: [],
        signedOffBy: "cpa@firm.com"
      });
    } catch (err: any) {
      threw = true;
      thrown = String(err.message || err);
    }
    assert(threw, "2a. Wizard throws when facts array is empty");
    assert(/REFUSED|Zero validated|cannot generate/i.test(thrown), "2b. Wizard error is a refuse, not a fake pass", thrown);

    let reportThrew = false;
    try {
      ReportingEngine.generateFinancialReport({
        workspaceId: "ws-empty",
        reportingPeriod: "",
        entityName: "Empty Co",
        facts: [],
        documents: []
      });
    } catch {
      reportThrew = true;
    }
    assert(reportThrew, "2c. ReportingEngine.generateFinancialReport throws on zero REPORT_READY facts");

    const pendingOnly: ExtractedFact = {
      id: "fct-pending",
      workspaceId: "ws-empty",
      documentId: "doc-1",
      factType: "revenue",
      canonicalMetric: "revenue",
      labelOriginal: "Turnover",
      labelNormalized: "Turnover",
      valueOriginal: "50503",
      valueFunctional: "50503000000",
      normalizedValue: 50503000000,
      currencyOriginal: "EUR",
      functionalCurrency: "EUR",
      reportingPeriod: "FY 2025",
      pageNumber: 1,
      sourceText: "Group turnover was €50,503 million in FY 2025.",
      status: "pending_review",
      confidence: 0,
      extractionMethod: "HYBRID_GEMINI_NATIVE"
    };
    const gate = ReportingEngine.evaluateFactEligibility(pendingOnly);
    assert(gate.eligibilityStatus !== "REPORT_READY", "2d. pending_review is not REPORT_READY", gate.eligibilityStatus);
  } catch (e: any) {
    assert(false, "2. Wizard empty facts", e.message);
  }

  // 3. Number not in PDF/source block cannot be VALIDATED/approved
  try {
    const candidate: StatementFactCandidate = {
      metricLabel: "Turnover",
      rawValue: "999999",
      currency: "EUR",
      scale: "Millions",
      period: "FY2025",
      statementType: "CONSOLIDATED_INCOME_STATEMENT",
      physicalPage: 1,
      rowLabel: "Turnover",
      confidence: 0.99,
      sourceQuote: "Turnover 50,503"
    };
    const result = EvidenceCrossCheckEngine.verifyCandidateAgainstSource(
      candidate,
      [{ physical_page_number: 1, native_text_available: true }],
      [{ page_number: 1, raw_text: "Group turnover was €50,503 million in FY 2025." }]
    );
    assert(result.evidenceStatus === "UNCONFIRMED" || result.evidenceStatus === "PARTIAL", "3a. Hallucinated 999999 is not CONFIRMED", result.evidenceStatus);
    assert(!amountAppearsInSourceBlock("999999", "Group turnover was €50,503 million"), "3b. Amount must be a real token in the source block");
    assert(amountAppearsInSourceBlock("50503", "Group turnover was €50,503 million"), "3c. 50,503 is accepted as a grouped token of 50503");
    assert(!amountAppearsInSourceBlock("50", "Turnover 50861"), "3d. Digit-soup false positive (50 inside 50861) is rejected");

    const approvedWithoutEvidence = persistFactStatus("approved", "UNCONFIRMED");
    assert(approvedWithoutEvidence !== "approved", "3e. persistFactStatus refuses approved when evidence is UNCONFIRMED", approvedWithoutEvidence);
  } catch (e: any) {
    assert(false, "3. Amount not in source", e.message);
  }

  // 4. Queue does not persist status approved when evidence is unconfirmed
  try {
    assert(persistFactStatus("approved", "UNCONFIRMED") === "pending_review", "4a. approved + UNCONFIRMED → pending_review");
    assert(persistFactStatus("approved", "PARTIAL") === "pending_review", "4b. approved + PARTIAL → pending_review");
    assert(persistFactStatus("approved", "VISUALLY_CONFIRMED") === "pending_review", "4c. approved + VISUALLY_CONFIRMED → pending_review");
    assert(persistFactStatus(undefined, undefined) === "pending_review", "4d. missing status never fail-opens to approved");
    assert(persistFactStatus("approved", "CONFIRMED") === "approved", "4e. approved + CONFIRMED stays approved");
    assert(persistFactConfidence(undefined) === undefined, "4f. missing confidence is not defaulted to 0.98");
    assert(persistFactConfidence(0.98) === 0.98, "4g. explicit confidence is preserved");
  } catch (e: any) {
    assert(false, "4. Queue persist status", e.message);
  }

  // 5. documentHash passed to hybrid is real sha256, not HASH-${id}
  try {
    const fake = "HASH-doc-123";
    const real = "a".repeat(64);
    assert(isPlaceholderDocumentHash(fake) === true, "5a. HASH-${id} is a placeholder");
    assert(isPlaceholderDocumentHash("") === true, "5b. empty hash is a placeholder");
    assert(isPlaceholderDocumentHash("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") === true, "5c. empty-string SHA is refused");
    assert(isPlaceholderDocumentHash(real) === false, "5d. 64-char hex is accepted");
    let threw = false;
    try {
      assertRealDocumentHash(fake);
    } catch {
      threw = true;
    }
    assert(threw, "5e. assertRealDocumentHash throws on HASH-${id}");
    assert(assertRealDocumentHash(real) === real, "5f. real sha256 is passed through to hybrid");
  } catch (e: any) {
    assert(false, "5. documentHash", e.message);
  }

  // 6. Upload with only driveUrl rejects; empty upload rejects
  try {
    assert(shouldRejectDriveUrlOnlyUpload(0, "https://drive.google.com/file/d/abc") === true, "6a. driveUrl with no files is rejected");
    assert(shouldRejectDriveUrlOnlyUpload(1, "https://drive.google.com/file/d/abc") === false, "6b. files present are not rejected as drive-only");
    assert(shouldRejectEmptyUpload(0, "") === true, "6c. empty upload is rejected (no synthesized Audit Working Paper)");
    assert(shouldRejectEmptyUpload(1, "") === false, "6d. a real file is accepted");
  } catch (e: any) {
    assert(false, "6. Drive/empty upload", e.message);
  }

  return { passed, total, failures };
}
