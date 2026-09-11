/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — PACKAGE B1.1 INTAKE HYGIENE & QUEUE AUTHORITY BOUNDARY SUITE
 * 
 * Target: Document 35 Package B1.1 Verification
 * Enforces:
 * 1. Temp files (e.g. storage/queue_jobs.json.*.tmp) are explicitly excluded in .gitignore
 * 2. Unauthorized queue writers cannot mutate authoritative queue state
 * 3. Authorized customer intake job creation remains fully functional
 * 4. Queue processing authority is distinct from customer job creation authority
 * 5. Failed queue authority check fails closed and cannot return durable queue success
 */

import fs from 'fs';
import path from 'path';
import { backgroundIngestionQueue } from '../backgroundQueue.js';

export async function runPhasePackageB1_1IntakeHygieneTests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n===============================================================');
  console.log('RUNNING PACKAGE B1.1 INTAKE HYGIENE & QUEUE AUTHORITY TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  const total = 5;

  function assertTest(name: string, condition: boolean, details: string) {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${name}`);
      passed++;
    } else {
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${name} — ${details}`);
      failed++;
    }
  }

  // Test 1: .gitignore excludes queue_jobs.json.*.tmp and atomic write temp files
  {
    const gitignoreContent = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf-8');
    const excludesQueueJobsTmp = gitignoreContent.includes('storage/queue_jobs.json.*.tmp') || gitignoreContent.includes('storage/*.tmp');
    assertTest(
      'Test 1: .gitignore explicitly excludes atomic-write queue temp artifacts (storage/queue_jobs.json.*.tmp)',
      excludesQueueJobsTmp,
      'Expected storage/queue_jobs.json.*.tmp or storage/*.tmp in .gitignore'
    );
  }

  // Test 2: Unauthorized queue writer cannot mutate authoritative queue state (fail closed)
  {
    let caughtError: Error | null = null;
    try {
      backgroundIngestionQueue.setStandbyObserverMode(true);
      await backgroundIngestionQueue.performDiskSave();
    } catch (err: any) {
      caughtError = err;
    } finally {
      backgroundIngestionQueue.setStandbyObserverMode(false);
    }

    assertTest(
      'Test 2: Unauthorized second queue writer / standby observer cannot mutate authoritative queue state',
      caughtError !== null && caughtError.message.includes('UNAUTHORIZED_QUEUE_WRITER'),
      `Expected error containing UNAUTHORIZED_QUEUE_WRITER, got: ${caughtError?.message}`
    );
  }

  // Test 3: Authorized intake job creation remains fully functional
  {
    backgroundIngestionQueue.setStandbyObserverMode(false);
    backgroundIngestionQueue.setQueueWriterAuthority(true);

    const testDocId = `doc-b11-test-${Date.now()}`;
    const testJobId = `JOB-INTAKE-B11-${Date.now()}`;
    const job = backgroundIngestionQueue.createJob(
      'prj-b11-test',
      testDocId,
      'b11_sample.pdf',
      'Sample content for B1.1',
      'USD',
      '/tmp/b11_sample.pdf',
      [],
      [],
      'intake-session-b11',
      'HYBRID_GEMINI_NATIVE',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      testJobId
    );

    const fetchedJob = backgroundIngestionQueue.getJob(testJobId);

    assertTest(
      'Test 3: Authorized customer intake job creation remains functional and returns queued job',
      job.id === testJobId && fetchedJob !== undefined && fetchedJob.id === testJobId,
      `Expected created job ID ${testJobId}, got ${job.id}`
    );
  }

  // Test 4: Queue processing authority remains distinct from customer job creation authority
  {
    // A process can create a job in memory, but if queue processing authority is false, processing is not initiated
    backgroundIngestionQueue.setQueueWriterAuthority(false);
    const testDocId = `doc-b11-distinct-${Date.now()}`;
    const testJobId = `JOB-INTAKE-DISTINCT-${Date.now()}`;

    const job = backgroundIngestionQueue.createJob(
      'prj-b11-distinct',
      testDocId,
      'distinct.pdf',
      'Text',
      'USD',
      '/tmp/distinct.pdf',
      [],
      [],
      'intake-distinct',
      'HYBRID_GEMINI_NATIVE',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      testJobId
    );

    const isProcessing = backgroundIngestionQueue.isQueueProcessingAuthorized();

    backgroundIngestionQueue.setQueueWriterAuthority(true); // reset

    assertTest(
      'Test 4: Queue processing authority is distinct from job creation authority and evaluates false for non-writers',
      job.id === testJobId && isProcessing === false,
      `Expected job created but isQueueProcessingAuthorized to be false, got ${isProcessing}`
    );
  }

  // Test 5: Failed authority check cannot return durable queue success
  {
    let rejected = false;
    try {
      backgroundIngestionQueue.setQueueWriterAuthority(false);
      await backgroundIngestionQueue.saveQueueToDiskAsync(true);
    } catch (err: any) {
      if (err.message.includes('UNAUTHORIZED_QUEUE_WRITER')) {
        rejected = true;
      }
    } finally {
      backgroundIngestionQueue.setQueueWriterAuthority(true); // reset
    }

    assertTest(
      'Test 5: Failed authority check throws and rejects durable queue write (cannot return success)',
      rejected,
      'Expected saveQueueToDiskAsync to reject with UNAUTHORIZED_QUEUE_WRITER when authority check fails'
    );
  }

  console.log('\n===============================================================');
  console.log(`PACKAGE B1.1 TEST RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('===============================================================');

  return { passed, failed, total };
}
