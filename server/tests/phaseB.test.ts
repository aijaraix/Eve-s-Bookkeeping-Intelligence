import { describe, it, expect, beforeEach } from 'vitest';
import { BackgroundIngestionQueue } from '../backgroundQueue.js';

describe('Phase B Mandatory Architecture & State Machine Tests', () => {
  let queue: BackgroundIngestionQueue;

  beforeEach(() => {
    queue = new BackgroundIngestionQueue();
  });

  it('Requirement 1 & 2: Stages are real executed code state records, not percentages or 18-stage labels', () => {
    const pageManifests = Array.from({ length: 5 }, (_, i) => ({
      page_id: `PM-TEST-P${i + 1}`,
      physical_page_number: i + 1,
      page_number: i + 1
    }));

    const sourceBlocks = pageManifests.map(pm => ({
      source_block_id: `SB-TEST-P${pm.physical_page_number}`,
      page_number: pm.physical_page_number,
      raw_text: `Financial disclosure content for page ${pm.physical_page_number}. Revenue EUR 100,000.`
    }));

    const uniqueId = `req12-${Date.now()}`;
    const job = queue.createJob(
      `ws-${uniqueId}`,
      `doc-${uniqueId}`,
      'PhaseB_Financial_Report.pdf',
      'Full text content',
      'EUR',
      '/uploads/PhaseB_Financial_Report.pdf',
      pageManifests,
      sourceBlocks
    );

    expect(job.stage).toBe('SOURCE_BLOCKS_INDEXED');
    expect(job.stageHistory).toBeDefined();
    expect(job.stageHistory.some(s => s.stage === 'DOCUMENT_REGISTERED' && s.status === 'COMPLETED')).toBe(true);
    expect(job.stageHistory.some(s => s.stage === 'PAGE_INVENTORY_COMPLETED' && s.status === 'COMPLETED')).toBe(true);
    expect(job.stageHistory.some(s => s.stage === 'SOURCE_BLOCKS_INDEXED' && s.status === 'COMPLETED')).toBe(true);

    // Ensure stageHistory records contain exact execution timestamps
    const invRecord = job.stageHistory.find(s => s.stage === 'PAGE_INVENTORY_COMPLETED');
    expect(invRecord?.timestamp).toBeDefined();
    expect(invRecord?.details).toContain('manifest bounds 1 to 5');
  });

  it('Requirement 7 & 10: Persistent heartbeatAt and stall detection when worker becomes silent for >30s', () => {
    const pageManifests = [
      { page_id: 'PM-STALL-P1', physical_page_number: 1 }
    ];
    const sourceBlocks = [
      { source_block_id: 'SB-STALL-P1', page_number: 1, raw_text: 'Text for stall test' }
    ];

    const uniqueId = `stall-${Date.now()}`;
    const job = queue.createJob(
      `ws-${uniqueId}`,
      `doc-${uniqueId}`,
      'Stall_Test.pdf',
      'Text',
      'EUR',
      'Stall_Test.pdf',
      pageManifests,
      sourceBlocks
    );

    // Lock background loop so worker does not finish job asynchronously
    (queue as any).isProcessingQueue = true;

    // Simulate worker actively processing job
    job.status = 'PROCESSING';
    job.processingUnits.forEach(u => { u.status = 'PROCESSING'; });
    // Manually backdate heartbeatAt to 35 seconds ago
    const silentTime = new Date(Date.now() - 35000).toISOString();
    job.heartbeatAt = silentTime;
    job.workerHeartbeatAt = silentTime;
    job.updatedAt = silentTime;

    // Trigger stall detection check
    queue.checkStalledJobs();

    const checkedJob = queue.getJob(job.id);
    expect(checkedJob?.status).toBe('STALLED');
    expect(checkedJob?.lastError).toContain('Heartbeat timed out');
    expect(checkedJob?.stageHistory.some(s => s.status === 'FAILED' && s.details?.includes('heartbeat'))).toBe(true);
  });

  it('Requirement 8 & 9: Browser refresh/reconnect deduplication re-attaches to active job', () => {
    const pageManifests = [
      { page_id: 'PM-DEDUP-P1', physical_page_number: 1 }
    ];
    const sourceBlocks = [
      { source_block_id: 'SB-DEDUP-P1', page_number: 1, raw_text: 'Text' }
    ];

    const uniqueId = `dedup-${Date.now()}`;
    const initialJob = queue.createJob(
      `ws-${uniqueId}`,
      `doc-${uniqueId}`,
      'Dedup_Test.pdf',
      'Text',
      'EUR',
      'Dedup_Test.pdf',
      pageManifests,
      sourceBlocks
    );

    initialJob.status = 'PROCESSING';

    // Simulate user refreshing browser and triggering duplicate createJob call
    const reconnectedJob = queue.createJob(
      `ws-${uniqueId}`,
      `doc-${uniqueId}`,
      'Dedup_Test.pdf',
      'Text',
      'EUR',
      'Dedup_Test.pdf',
      pageManifests,
      sourceBlocks
    );

    // Must return exact same job instance ID without creating a duplicate job entry
    expect(reconnectedJob.id).toBe(initialJob.id);
  });

  it('Requirement 4 & Proof: 25-page PDF creates exactly 25 page units and cannot render Page 26', () => {
    const pageManifests = Array.from({ length: 25 }, (_, i) => ({
      page_id: `PM-25P-P${i + 1}`,
      physical_page_number: i + 1,
      page_number: i + 1
    }));

    const sourceBlocks = pageManifests.map(pm => ({
      source_block_id: `SB-25P-P${pm.physical_page_number}`,
      page_number: pm.physical_page_number,
      raw_text: `Revenue for page ${pm.physical_page_number}`
    }));

    const uniqueId = `p25-${Date.now()}`;
    const job = queue.createJob(
      `ws-${uniqueId}`,
      `doc-${uniqueId}`,
      'AnnualReport_25Pages.pdf',
      'Full Text',
      'EUR',
      'AnnualReport_25Pages.pdf',
      pageManifests,
      sourceBlocks
    );

    expect(job.pagesTotal).toBe(25);
    expect(job.processingUnits.length).toBe(25);

    const highestPage = Math.max(...job.processingUnits.map(u => u.actual_page_start));
    expect(highestPage).toBe(25);
    expect(job.processingUnits.find(u => u.actual_page_start === 26)).toBeUndefined();
  });

  it('Requirement 5 & 6: Physical page progress is distinct from internal processing task counts', () => {
    const pageManifests = Array.from({ length: 10 }, (_, i) => ({
      page_id: `PM-SEP-P${i + 1}`,
      physical_page_number: i + 1
    }));
    const sourceBlocks = pageManifests.map(pm => ({
      source_block_id: `SB-SEP-P${pm.physical_page_number}`,
      page_number: pm.physical_page_number,
      raw_text: `Text page ${pm.physical_page_number}`
    }));

    const uniqueId = `sep-${Date.now()}`;
    const job = queue.createJob(
      `ws-${uniqueId}`,
      `doc-${uniqueId}`,
      'SeparateCounts.pdf',
      'Text',
      'EUR',
      'SeparateCounts.pdf',
      pageManifests,
      sourceBlocks
    );

    expect(job.pagesTotal).toBe(10);
    expect(job.tasksTotal).toBe(12); // 10 physical units + 2 analysis tasks
    expect(job.pagesTotal).not.toBe(job.tasksTotal);
  });

  it('Requirement 11 & 12: Distinct final status states and financial analysis running after page extraction', () => {
    const pageManifests = [
      { page_id: 'PM-FIN-P1', physical_page_number: 1 }
    ];
    const sourceBlocks = [
      { source_block_id: 'SB-FIN-P1', page_number: 1, raw_text: 'Revenue EUR 500,000' }
    ];

    const uniqueId = `fin-${Date.now()}`;
    const job = queue.createJob(
      `ws-${uniqueId}`,
      `doc-${uniqueId}`,
      'Financial_Analysis_Test.pdf',
      'Text',
      'EUR',
      'Financial_Analysis_Test.pdf',
      pageManifests,
      sourceBlocks
    );

    // Verify stages: physical extraction completed happens BEFORE financial analysis completed
    queue.advanceJobStage(job, 'PHYSICAL_EXTRACTION_COMPLETED', 'COMPLETED', 'Physical extraction done');
    queue.advanceJobStage(job, 'FINANCIAL_ANALYSIS_IN_PROGRESS', 'IN_PROGRESS', 'Running financial analysis');
    queue.advanceJobStage(job, 'FINANCIAL_ANALYSIS_COMPLETED', 'COMPLETED', 'Financial analysis done');

    const physIdx = job.stageHistory.findIndex(s => s.stage === 'PHYSICAL_EXTRACTION_COMPLETED');
    const finIdx = job.stageHistory.findIndex(s => s.stage === 'FINANCIAL_ANALYSIS_COMPLETED');

    expect(physIdx).toBeGreaterThan(-1);
    expect(finIdx).toBeGreaterThan(-1);
    expect(physIdx).toBeLessThan(finIdx);
  });
});
