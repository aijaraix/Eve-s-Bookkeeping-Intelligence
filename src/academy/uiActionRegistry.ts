/** Product action contracts shared by the real UI and its existing browser operator.
 * These are workflow permissions, not professional authorization credentials.
 */
export interface UiActionDefinition {
  id: string;
  label: string;
  view: string;
  workflow: string;
  step: string;
  prerequisites: string[];
  expectedTransition: string;
  expectedEvidence: string;
  role: 'operator' | 'account' | 'platform-admin';
  destructive: boolean;
  academyAllowed: boolean;
  professionalApprovalRequired: boolean;
}

const navigation = {
  'practice-home': 'Home', 'practice-clients': 'Clients', 'practice-engagements': 'Engagements',
  'practice-documents': 'Documents', 'engagement-overview': 'Overview',
  'financials-overview': 'Statements Overview', 'financials-income': 'Income Statement',
  'financials-balance': 'Balance Sheet', 'financials-cashflow': 'Cash Flow',
  'financials-equity': 'Statement of Equity', 'financials-notes': 'Notes & Disclosures',
  'analysis-ratios': 'Ratios & Analytics', 'analysis-segments': 'Segment Reporting',
  'analysis-trends': 'Comparative Trends', 'analysis-forecast': 'Forecasts & Projections',
  'engagement-structure': 'Corporate Structure', 'engagement-currencies': 'Currencies & FX',
  'engagement-evidence': 'Evidence & Workpapers', 'engagement-findings': 'Findings & Review',
  'engagement-deliverables': 'Deliverables & Reports', 'eve-copilot': 'Eve Copilot',
  'eve-intelligence': 'Intelligence Center', 'eve-academy': 'Hermes Academy',
  'admin-firm': 'Firm & Branding', 'admin-users': 'Users & Access',
  'admin-health': 'System Health', 'admin-audit-logs': 'Audit Logs', 'admin-diagnostics': 'Diagnostics'
};

function definition(id: string, label: string, view: string, workflow: string, transition: string, evidence: string): UiActionDefinition {
  return { id, label, view, workflow, step: id, prerequisites: ['Authenticated operator', 'Correct engagement scope'],
    expectedTransition: transition, expectedEvidence: evidence, role: 'operator', destructive: false,
    academyAllowed: true, professionalApprovalRequired: false };
}

export const uiActionRegistry: Record<string, UiActionDefinition> = Object.fromEntries([
  ...[
    ['auth.login','Sign in','/login','Validated account session or mandatory password setup','Authentication audit event'],
    ['auth.password.change','Save permanent password','/account/password','Password replaced and all sessions revoked','Hash-only password record and revocation event'],
    ['auth.logout','Log out','/account','Current session revoked','Logout audit event'],
    ['auth.sessions.revoke','Revoke sessions','/account','All account sessions revoked','Session revocation audit event'],
    ['access.invite','Invite account','/owner/users','Single-use invitation created','Persisted account and invitation audit event'],
    ['access.tenant.assign','Assign customer organization','/owner/users','Customer workspaces assigned exclusively','Tenant assignment audit event'],
    ['access.password.reset','Reset account','/owner/users','Previous credential and sessions revoked','Single-use recovery and audit event']
  ].map(([id,label,view,transition,evidence])=>({...definition(id,label,view,'account-access',transition,evidence),role:(id.startsWith('access.')?'platform-admin':'account') as UiActionDefinition['role'],prerequisites:[id==='auth.login'?'Account credential':'Authenticated account and CSRF verification'],academyAllowed:false})),
  ...Object.entries(navigation).map(([view, label]) => definition(`nav.${view}`, label, view, 'navigation', `Active view becomes ${view}`, 'Visible view heading, scope and screenshot')),
  ...['header', 'home', 'documents', 'clients', 'clients-empty'].map(entry => definition(`intake.open.${entry}`, 'Upload', entry, 'canonical-intake', 'Upload dialog opens', 'Visible upload dialog; same canonical intake form')),
  ...[
    ['nav.mobile.open', 'Open navigation', '*', 'navigation', 'Navigation is visible', 'Visible menu'],
    ['nav.mobile.close', 'Close navigation', '*', 'navigation', 'Navigation closes', 'Current screen remains usable'],
    ['engagement.select', 'Select engagement', '*', 'engagement-selection', 'Selected persisted workspace changes', 'Workspace ID and visible client name'],
    ['period.select', 'Reporting period', '*', 'statement-review', 'Selected period changes', 'Rendered values and period evidence agree'],
    ['intake.route.new', 'New engagement', 'upload', 'canonical-intake', 'New-intake form shown', 'No existing target in request'],
    ['intake.route.existing', 'Existing engagement', 'upload', 'canonical-intake', 'Exact workspace selector shown', 'Explicit existing workspace ID'],
    ['intake.saved.select', 'Saved Academy intake', 'upload', 'canonical-intake', 'Saved receipt selected', 'Existing intake ID'],
    ['intake.saved.resume', 'Observe saved intake', 'upload', 'canonical-intake', 'Persisted processing observation resumes', 'No upload or extraction request'],
    ['intake.academy', 'Isolated Academy exercise', 'upload', 'canonical-intake', 'Synthetic classification selected', 'Persisted ACADEMY classification'],
    ['intake.name', 'Engagement name', 'upload', 'canonical-intake', 'Requested name changes', 'Name retained on newly promoted workspace'],
    ['intake.files', 'Choose files', 'upload', 'canonical-intake', 'Actual files appear in dialog', 'Filename, bytes and SHA-256 continuity'],
    ['intake.submit', 'Start AI Analysis & Ingestion', 'upload', 'canonical-intake', 'Upload enters saved processing', 'Authentic POST acknowledgement and durable intake/job IDs'],
    ['intake.minimize', 'Run in Background', 'upload', 'canonical-intake', 'Dialog minimizes', 'Saved processing continues'],
    ['intake.done', 'Done', 'upload', 'canonical-intake', 'Completed dialog closes', 'Promoted workspace remains selected'],
    ['intake.close', 'Close upload', 'upload', 'canonical-intake', 'Dialog closes', 'Saved processing remains independent of dialog'],
    ['evidence.inspect', 'Inspect source provenance', '*', 'evidence-review', 'Provenance drawer opens', 'Source document, quote and existing lineage'],
    ['evidence.close', 'Close provenance', '*', 'evidence-review', 'Drawer closes', 'Financial view remains visible'],
    ['evidence.summary', 'Auditor Summary View', '*', 'evidence-review', 'Source summary visible', 'Recorded source quotation'],
    ['evidence.technical', 'Cryptographic & Technical Trace', '*', 'evidence-review', 'Technical lineage visible', 'Existing fact/render identity'],
    ['evidence.source.download', 'Download original source', 'engagement-evidence', 'evidence-review', 'Original bytes downloaded', 'Downloaded SHA matches registered source'],
    ['evidence.processing', 'Recorded processing and review evidence', '*', 'evidence-review', 'Processing evidence expands', 'Actual continuation and specialist receipts'],
    ['draft.prepare', 'Prepare AI draft', 'engagement-deliverables', 'draft-review', 'Draft request recorded for completed intake', 'Canonical continuation draft; human approval pending'],
    ['draft.retry.lexicon', 'Retry unavailable Lexicon step', 'engagement-deliverables', 'draft-review', 'One bounded retry; successful receipts retained; new draft version', 'Original failure and draft preserved; new validated specialist and review receipts'],
    ['draft.refresh', 'Refresh reports', 'engagement-deliverables', 'draft-review', 'Saved report list refreshed', 'Exact report/version identity'],
    ...['pdf', 'xlsx', 'csv', 'json'].map(format => [`draft.download.${format}`, `Download ${format}`, 'engagement-deliverables', 'draft-review', 'Selected draft downloaded', 'Actual file and matching recorded artifact hash'])
  ].map(([id, label, view, workflow, transition, evidence]) => definition(id, label, view, workflow, transition, evidence))
].map(entry => [entry.id, entry]));

export function actionAttributes(id: string, target?: string): Record<string, string> {
  if (!uiActionRegistry[id]) throw new Error(`Unregistered Eve action: ${id}`);
  return { 'data-eve-action-id': id, ...(target ? { 'data-eve-action-target': target } : {}) };
}
