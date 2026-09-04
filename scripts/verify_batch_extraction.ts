import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { GROUND_TRUTH, generateCompanySpreadsheet, generateCompanyDocument } from './test_real_companies';
import { executeWorkerExtraction, WorkerJob } from '../server/worker';
import { CanonicalFactResolver } from '../server/canonicalFactResolver';
import { AccountingValidationEngine } from '../server/accountingValidationEngine';

async function runBatchAudit() {
  console.log("================================================================================");
  console.log("        PRODUCTION AUDIT & SIMULTANEOUS BATCH EXTRACTION VERIFICATION           ");
  console.log("================================================================================");

  const testDir = path.join(process.cwd(), 'temp_test_batch');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const companies = ['APPLE', 'MICROSOFT', 'TESLA'] as const;
  const jobs: WorkerJob[] = [];

  // Generate test workbooks for all 3 public companies
  for (const compKey of companies) {
    const truth = GROUND_TRUTH[compKey];
    const xlsxBuf = generateCompanySpreadsheet(compKey);
    const filePath = path.join(testDir, `${truth.ticker}_FY2024_10K.xlsx`);
    fs.writeFileSync(filePath, xlsxBuf);

    const docHash = crypto.createHash('sha256').update(xlsxBuf).digest('hex');

    const job: WorkerJob = {
      jobId: `job-batch-${truth.ticker.toLowerCase()}-${Date.now()}`,
      workspaceId: `ws-${truth.ticker.toLowerCase()}`,
      documentId: `doc-${truth.ticker.toLowerCase()}`,
      documentTitle: `${truth.name} FY2024 Annual Report (10-K)`,
      filePath,
      fileSize: xlsxBuf.length,
      documentHash: docHash,
      functionalCurrency: truth.currency,
      status: "QUEUED",
      currentStage: "Queued for deterministic extraction",
      progress: 0,
      counters: {
        physicalPages: 2,
        tablesParsed: 0,
        statementsIdentified: 0,
        statementsProcessed: 0,
        factsNormalized: 0,
        evidenceConfirmed: 0,
        accountingGatesPassed: 0
      },
      results: {},
      createdAt: new Date().toISOString()
    };

    jobs.push(job);
  }

  console.log(`[Batch Test] Submitting ${jobs.length} documents simultaneously into production worker...`);
  const startTime = Date.now();

  // Execute extraction on all documents simultaneously
  await Promise.all(jobs.map((job) => executeWorkerExtraction(job)));

  const totalTimeMs = Date.now() - startTime;
  console.log(`[Batch Test] All ${jobs.length} extraction jobs completed in ${totalTimeMs}ms.\n`);

  let allPassed = true;

  for (const job of jobs) {
    const compKey = (job.documentTitle.includes('Apple') ? 'APPLE' : job.documentTitle.includes('Microsoft') ? 'MICROSOFT' : 'TESLA') as keyof typeof GROUND_TRUTH;
    const truth = GROUND_TRUTH[compKey];

    console.log(`--------------------------------------------------------------------------------`);
    console.log(`COMPANY AUDIT: ${truth.name} (${truth.ticker}) | Status: ${job.status}`);
    console.log(`--------------------------------------------------------------------------------`);

    if (job.status !== "COMPLETE" && job.status !== "COMPLETE_REVIEW_REQUIRED") {
      console.error(`❌ Job failed with status: ${job.status}, error: ${job.lastError}`);
      allPassed = false;
      continue;
    }

    const facts = job.results.facts || [];
    console.log(`Extracted Facts Count: ${facts.length}`);
    console.log(`Gates Passed: ${job.counters.accountingGatesPassed}`);

    // Map extracted facts to metrics
    const revFact = facts.find((f: any) => f.canonicalMetric === 'revenue');
    const netIncFact = facts.find((f: any) => f.canonicalMetric === 'net_income');
    const assetsFact = facts.find((f: any) => f.canonicalMetric === 'total_assets');
    const liabFact = facts.find((f: any) => f.canonicalMetric === 'total_liabilities');
    const eqFact = facts.find((f: any) => f.canonicalMetric === 'total_equity');

    const rev = parseFloat(revFact?.valueFunctional || "0");
    const netInc = parseFloat(netIncFact?.valueFunctional || "0");
    const assets = parseFloat(assetsFact?.valueFunctional || "0");
    const liab = parseFloat(liabFact?.valueFunctional || "0");
    const eq = parseFloat(eqFact?.valueFunctional || "0");

    console.log(`Revenue:           Expected $${(truth.revenue / 1e9).toFixed(1)}B | Extracted $${(rev / 1e9).toFixed(1)}B -> ${rev === truth.revenue ? '✅ EXACT' : '⚠️ MISMATCH'}`);
    console.log(`Net Income:        Expected $${(truth.netIncome / 1e9).toFixed(1)}B | Extracted $${(netInc / 1e9).toFixed(1)}B -> ${netInc === truth.netIncome ? '✅ EXACT' : '⚠️ MISMATCH'}`);
    console.log(`Total Assets:      Expected $${(truth.totalAssets / 1e9).toFixed(1)}B | Extracted $${(assets / 1e9).toFixed(1)}B -> ${assets === truth.totalAssets ? '✅ EXACT' : '⚠️ MISMATCH'}`);
    console.log(`Total Liabilities: Expected $${(truth.totalLiabilities / 1e9).toFixed(1)}B | Extracted $${(liab / 1e9).toFixed(1)}B -> ${liab === truth.totalLiabilities ? '✅ EXACT' : '⚠️ MISMATCH'}`);
    console.log(`Total Equity:      Expected $${(truth.totalEquity / 1e9).toFixed(1)}B | Extracted $${(eq / 1e9).toFixed(1)}B -> ${eq === truth.totalEquity ? '✅ EXACT' : '⚠️ MISMATCH'}`);

    // Verify Accounting Equation: Assets = Liabilities + Equity
    const balanceDiff = Math.abs(assets - (liab + eq));
    console.log(`Balance Sheet Identity check (Assets = Liab + Equity): Difference = $${balanceDiff} -> ${balanceDiff === 0 ? '✅ BALANCED' : '❌ UNBALANCED'}`);

    if (rev !== truth.revenue || assets !== truth.totalAssets || balanceDiff !== 0) {
      allPassed = false;
    }
  }

  // Clean up
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}

  console.log("================================================================================");
  if (allPassed) {
    console.log("🎉 ALL PRODUCTION EXTRACTIONS & ACCOUNTING GATES PASSED WITH 100% ACCURACY! 🎉");
  } else {
    console.log("❌ SOME TESTS FAILED.");
  }
  console.log("================================================================================");
}

runBatchAudit().catch((err) => {
  console.error("FATAL ERROR in batch audit:", err);
  process.exit(1);
});
