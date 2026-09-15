/** Resolve explicit user intent before parsing or writing any uploaded source.
 * Creating a new intake must never inherit the currently selected customer.
 * Attach requires an exact existing workspace ID, never a fuzzy name match.
 */
export function resolveExplicitIntakeTarget(
  intent: unknown,
  workspaceId: unknown,
  workspaces: Array<{ id: string }>,
): string | null {
  if (intent === 'CREATE_NEW_INTAKE') return null;
  if (intent !== 'ATTACH_TO_EXISTING_PROJECT') {
    throw new Error('Choose a new intake or an existing engagement explicitly.');
  }
  if (typeof workspaceId !== 'string' || !workspaceId || !workspaces.some(w => w.id === workspaceId)) {
    throw new Error('Select an existing engagement before attaching documents.');
  }
  return workspaceId;
}
