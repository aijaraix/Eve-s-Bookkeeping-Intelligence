import assert from 'node:assert/strict';
import { resolveExplicitIntakeTarget } from '../intakeTargetPolicy.js';

const workspaces = [{ id: 'protected-pfizer' }, { id: 'isolated-academy' }];
assert.equal(resolveExplicitIntakeTarget('CREATE_NEW_INTAKE', 'protected-pfizer', workspaces), null);
assert.equal(resolveExplicitIntakeTarget('CREATE_NEW_INTAKE', undefined, workspaces), null);
assert.equal(resolveExplicitIntakeTarget('ATTACH_TO_EXISTING_PROJECT', 'isolated-academy', workspaces), 'isolated-academy');
assert.throws(() => resolveExplicitIntakeTarget('ATTACH_TO_EXISTING_PROJECT', '', workspaces));
assert.throws(() => resolveExplicitIntakeTarget('ATTACH_TO_EXISTING_PROJECT', 'missing', workspaces));
assert.throws(() => resolveExplicitIntakeTarget(undefined, 'protected-pfizer', workspaces));
console.log('PASS: new intake cannot inherit selected Pfizer; attachment requires exact existing target.');
