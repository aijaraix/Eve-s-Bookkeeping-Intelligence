import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Import after selecting an isolated persistence file; never load customer state.
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-intake-observation-'));
process.env.INTAKE_SESSIONS_FILE = path.join(temporaryDirectory, 'intake_sessions.json');
const { IntakeService } = await import('../intakeService.js');
try {
  const service = new IntakeService();
  const intake = service.createIntakeSession({ uploadedFiles: [{ originalName: 'synthetic.pdf' }], documentIds: ['synthetic-doc'] });
  service.registerQueueJobs(intake.id, ['first', 'second']);
  const jobs = (status: string) => [
    { id: 'first', status: 'COMPLETED', pagesTotal: 1, pagesCompleted: 1 },
    { id: 'second', status, pagesTotal: 1, pagesCompleted: 0 }
  ];
  for (const status of ['WAITING_FOR_LLM', 'RATE_LIMITED', 'PROCESSING', 'QUEUED']) {
    assert.equal(service.updateIntakeSessionFromJobs(intake.id, jobs(status))?.status, 'PROCESSING');
  }
  for (const status of ['CONFIGURATION_REQUIRED', 'UNRECOGNIZED_STATUS']) {
    assert.equal(service.updateIntakeSessionFromJobs(intake.id, jobs(status))?.status, 'BLOCKED');
    assert.notEqual(intake.completionState, 'PROMOTED');
  }
  assert.equal(service.updateIntakeSessionFromJobs(intake.id, jobs('COMPLETED').slice(0, 1))?.status, 'PROCESSING');
  assert.equal(service.updateIntakeSessionFromJobs(intake.id, jobs('COMPLETED_WITH_WARNINGS'))?.status, 'REVIEW_REQUIRED');
  assert.equal(service.updateIntakeSessionFromJobs(intake.id, jobs('CANCELLED'))?.status, 'REVIEW_REQUIRED');
  assert.equal(service.updateIntakeSessionFromJobs(intake.id, jobs('COMPLETED'))?.status, 'COMPLETED');
  assert.equal(intake.completionState, 'PENDING', 'Worker completion alone must not claim promotion');
  const reloaded = new IntakeService().getIntakeSession(intake.id);
  assert.equal(reloaded?.status, 'COMPLETED');
  assert.equal(reloaded?.completionState, 'PENDING');
  console.log('PASS: persisted intake distinguishes waiting, blocked, partial, reviewed and completed work.');
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
