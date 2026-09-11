import { describe, it, expect } from 'vitest';
import { BackgroundIngestionQueue } from '../backgroundQueue.js';

export async function runPhasePackageB1_2QueueAuthorityTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, failMsg?: string) {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${testName}`);
      passed++;
    } else {
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${testName}: ${failMsg || 'Assertion failed'}`);
      failed++;
    }
  }

  console.log('===============================================================');
  console.log('RUNNING PACKAGE B1.2 QUEUE LEADER AUTHORITY TEST SUITE');
  console.log('===============================================================');

  const origNodeEnv = process.env.NODE_ENV;
  const origTestQueueAuth = process.env.TEST_QUEUE_AUTHORITY;
  const origStandby = process.env.STANDBY_OBSERVER;

  try {
    // Test 1: Unset leader/authority configuration does NOT authorize production queue writing
    try {
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(false);
      queue.setQueueWriterAuthority(null);
      process.env.NODE_ENV = 'production';
      delete process.env.TEST_QUEUE_AUTHORITY;

      const isAuth = queue.isQueueWriterAuthorized();
      let threw = false;
      try {
        await queue.performDiskSave();
      } catch (e: any) {
        threw = e?.message?.includes('UNAUTHORIZED_QUEUE_WRITER');
      }

      assert(
        'Test 1: Unset leader/authority configuration does NOT authorize production queue writing',
        !isAuth && threw,
        `Expected isQueueWriterAuthorized to be false and performDiskSave to throw, got isAuth=${isAuth}, threw=${threw}`
      );
    } catch (err: any) {
      assert('Test 1: Unset leader/authority configuration does NOT authorize production queue writing', false, err?.message);
    }

    // Test 2: Explicit valid leader authorizes queue writes
    try {
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(false);
      queue.setQueueWriterAuthority(true);

      const isAuth = queue.isQueueWriterAuthorized();
      assert(
        'Test 2: Explicit valid leader authorizes queue writes',
        isAuth === true,
        `Expected isQueueWriterAuthorized to be true, got ${isAuth}`
      );
    } catch (err: any) {
      assert('Test 2: Explicit valid leader authorizes queue writes', false, err?.message);
    }

    // Test 3: Explicit intake-creator authority can create the initial job but cannot process it
    try {
      process.env.NODE_ENV = 'test';
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(false);
      queue.setIntakeJobCreationAuthority(true);
      queue.setQueueProcessingAuthority(false);
      queue.setQueueWriterAuthority(false);

      const job = queue.createJob(
        'prj-b12-intake',
        'doc-b12-1',
        'IntakeTest.pdf',
        'Sample text',
        'USD',
        '/tmp/intake.pdf',
        [],
        [],
        'sess-b12-1',
        'HYBRID_GEMINI_NATIVE',
        'hash-b12-1',
        'JOB-B12-INTAKE-1'
      );

      const isProcAuth = queue.isQueueProcessingAuthorized();
      assert(
        'Test 3: Explicit intake-creator authority can create the initial job but cannot process it',
        !!job && job.id === 'JOB-B12-INTAKE-1' && !isProcAuth,
        `Expected job created with ID JOB-B12-INTAKE-1 and isQueueProcessingAuthorized=false, got job=${job?.id}, isProcAuth=${isProcAuth}`
      );
    } catch (err: any) {
      assert('Test 3: Explicit intake-creator authority can create the initial job but cannot process it', false, err?.message);
    }

    // Test 4: Standby can read persisted jobs
    try {
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(false);
      queue.setQueueWriterAuthority(true);
      const created = queue.createJob(
        'prj-b12-standby',
        'doc-b12-2',
        'ReadTest.pdf',
        'Content',
        'USD',
        undefined,
        [],
        [],
        'sess-b12-2',
        'HYBRID_GEMINI_NATIVE',
        'hash-b12-2',
        'JOB-B12-READ-1'
      );

      queue.setStandbyObserverMode(true);
      const readJob = queue.getJob('JOB-B12-READ-1');

      assert(
        'Test 4: Standby can read persisted jobs',
        !!readJob && readJob.id === 'JOB-B12-READ-1',
        `Expected standby process to read job JOB-B12-READ-1, got ${readJob?.id}`
      );
    } catch (err: any) {
      assert('Test 4: Standby can read persisted jobs', false, err?.message);
    }

    // Test 5: Standby cannot rewrite/recover/requeue jobs
    try {
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(true);

      let saveThrew = false;
      let retryThrew = false;
      let clearThrew = false;

      try {
        await queue.performDiskSave();
      } catch (e: any) {
        saveThrew = e?.message?.includes('UNAUTHORIZED');
      }

      try {
        queue.retryFailedJob('JOB-B12-READ-1');
      } catch (e: any) {
        retryThrew = e?.message?.includes('UNAUTHORIZED');
      }

      try {
        queue.clearQueue();
      } catch (e: any) {
        clearThrew = e?.message?.includes('UNAUTHORIZED');
      }

      assert(
        'Test 5: Standby cannot rewrite/recover/requeue jobs',
        saveThrew && retryThrew && clearThrew,
        `Expected save, retry, and clear to all throw UNAUTHORIZED error in standby mode. got save=${saveThrew}, retry=${retryThrew}, clear=${clearThrew}`
      );
    } catch (err: any) {
      assert('Test 5: Standby cannot rewrite/recover/requeue jobs', false, err?.message);
    }

    // Test 6: Standby does not start processing/retry timers
    try {
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(true);

      const isProcAuth = queue.isQueueProcessingAuthorized();
      // Stall recovery check must be no-op on standby
      queue.checkStalledJobs();

      assert(
        'Test 6: Standby does not start processing/retry timers',
        !isProcAuth,
        `Expected isQueueProcessingAuthorized to be false on standby, got ${isProcAuth}`
      );
    } catch (err: any) {
      assert('Test 6: Standby does not start processing/retry timers', false, err?.message);
    }

    // Test 7: Unauthorized process cannot clear queue
    try {
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(false);
      queue.setQueueWriterAuthority(false);

      let clearThrew = false;
      try {
        queue.clearQueue();
      } catch (e: any) {
        clearThrew = e?.message?.includes('UNAUTHORIZED_QUEUE_WRITER');
      }

      assert(
        'Test 7: Unauthorized process cannot clear queue',
        clearThrew,
        `Expected clearQueue to throw UNAUTHORIZED_QUEUE_WRITER when unauthorized, got threw=${clearThrew}`
      );
    } catch (err: any) {
      assert('Test 7: Unauthorized process cannot clear queue', false, err?.message);
    }

    // Test 8: Unauthorized process cannot advance a persisted stage
    try {
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(false);
      queue.setQueueWriterAuthority(false);
      queue.setIntakeJobCreationAuthority(false);

      const dummyJob: any = { id: 'JOB-DUMMY', stageHistory: [] };
      let advanceThrew = false;
      try {
        queue.advanceJobStage(dummyJob, 'PHYSICAL_EXTRACTION_COMPLETED');
      } catch (e: any) {
        advanceThrew = e?.message?.includes('UNAUTHORIZED_STAGE_ADVANCEMENT');
      }

      assert(
        'Test 8: Unauthorized process cannot advance a persisted stage',
        advanceThrew,
        `Expected advanceJobStage to throw UNAUTHORIZED_STAGE_ADVANCEMENT when unauthorized, got threw=${advanceThrew}`
      );
    } catch (err: any) {
      assert('Test 8: Unauthorized process cannot advance a persisted stage', false, err?.message);
    }

    // Test 9: Test/local override must be explicit and cannot silently apply in production
    try {
      process.env.NODE_ENV = 'production';
      process.env.TEST_QUEUE_AUTHORITY = 'true';
      const queue = new BackgroundIngestionQueue();
      queue.setStandbyObserverMode(false);
      queue.setQueueWriterAuthority(null);

      const isAuthInProd = queue.isQueueWriterAuthorized();

      assert(
        'Test 9: Test/local override must be explicit and cannot silently apply in production',
        !isAuthInProd,
        `Expected TEST_QUEUE_AUTHORITY to be ignored in production without explicit setter, got isAuth=${isAuthInProd}`
      );
    } catch (err: any) {
      assert('Test 9: Test/local override must be explicit and cannot silently apply in production', false, err?.message);
    }

  } finally {
    process.env.NODE_ENV = origNodeEnv;
    if (origTestQueueAuth) {
      process.env.TEST_QUEUE_AUTHORITY = origTestQueueAuth;
    } else {
      delete process.env.TEST_QUEUE_AUTHORITY;
    }
    if (origStandby) {
      process.env.STANDBY_OBSERVER = origStandby;
    } else {
      delete process.env.STANDBY_OBSERVER;
    }
  }

  console.log('===============================================================');
  console.log(`PACKAGE B1.2 TEST RESULTS: ${passed}/9 PASSED (${failed} FAILED)`);
  console.log('===============================================================');

  return { passed, failed };
}
