import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { UniversityStore } from '../university/universityStore.js';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eve-university-activation-'));
try {
  const store = new UniversityStore(root);
  const initial = store.snapshot();
  assert.equal(initial.overview.examinations, 0);
  assert.equal(initial.capabilityMatrix.length, 11);
  assert.equal(initial.hermes.idleReason, 'NO_ELIGIBLE_RECORDED_UNIVERSITY_WORK');

  const exam = store.registerAcademyIntake({
    intakeId: 'intake-academy-001',
    tenantId: 'tenant-academy-001',
    name: 'Receipt vertical slice',
    tenantClassification: 'ACADEMY_SYNTHETIC',
    sourceType: 'RECEIPT',
    documentIds: ['doc-receipt-001']
  });
  assert.equal(exam.tenantClassification, 'ACADEMY_SYNTHETIC');
  assert.equal(store.registerAcademyIntake({ ...exam, intakeId: exam.intakeId, tenantClassification: 'ACADEMY_SYNTHETIC' }).examinationId, exam.examinationId);
  assert.equal(store.linkWorkspace(exam.intakeId, 'ws-academy-001')?.workspaceId, 'ws-academy-001');

  const snapshot = store.snapshot();
  assert.equal(snapshot.overview.examinations, 1);
  assert.equal(snapshot.syntheticCustomers[0].classification, 'ACADEMY_SYNTHETIC');
  assert.equal(snapshot.rawInputLab[0].sourceType, 'RECEIPT');

  assert.throws(() => store.registerAcademyIntake({
    intakeId: 'intake-production',
    tenantClassification: 'PRODUCTION_CUSTOMER'
  }), /UNIVERSITY_PRODUCTION_TENANT_REJECTED/);
  assert.throws(() => store.inventoryPurge(['PRODUCTION_CUSTOMER']), /UNIVERSITY_PURGE_PRODUCTION_REJECTED/);

  const preview = store.purge({ classifications: ['ACADEMY_SYNTHETIC'], dryRun: true, actor: 'test-owner' });
  assert.equal(preview.counts.examinations, 1);
  assert.equal(store.snapshot().overview.examinations, 1);
  const executed = store.purge({ classifications: ['ACADEMY_SYNTHETIC'], dryRun: false, actor: 'test-owner' });
  assert.equal(executed.counts.examinations, 1);
  assert.equal(store.snapshot().overview.examinations, 0);
  assert.equal(store.read().audit.at(-1)?.action, 'ACADEMY_CONTROL_STATE_PURGED');

  console.log('UNIVERSITY_ACTIVATION_INFRASTRUCTURE=PASS');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
