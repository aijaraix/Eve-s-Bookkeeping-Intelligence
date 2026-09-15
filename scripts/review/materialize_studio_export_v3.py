"""One-shot preservation of four source/test deltas from the owner's third ZIP.
Not a production repair/deployment. Only used on fix/frontend-runtime-parity.
ZIP SHA256 dd3876f1d2e16e6e3cd2f7bf5b8806c4bff755b9fff3ec70890cf084948397ed.
All before/after Git blobs are verified before writing any source file.
"""
import hashlib
import pathlib

ROOT = pathlib.Path.cwd()
EXPECTED = {
    'server/cpaOrganization/cpaOrganizationRoutes.ts': ('ca64e0c633c22279482f3952b7c04182809a26b0', 'ed801ac922e2a12038b14a1966f95cc586509cc6'),
    'server/cpaOrganization/deliverableArtifactService.ts': ('a0ab5708193da41fe5bd0fc858c690ae023e6045', 'af65dc3e5a762faf7425466368b3970b05467b31'),
    'server/cpaOrganization/eveInternalAuditEngine.ts': ('afc59cafe60ce969bf5a174475b0ea9436656213', '61de6f843d72ca6775eee1cb9bdb4461a07d61b5'),
    'test_all_defects.ts': ('1d029b4ea73c945d4d0a8d2ff282e7de0bae1aac', '7d63a79f52023b3f037153a0693338a08827c461'),
}

def blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def replace_once(text, before, after):
    if text.count(before) != 1:
        raise RuntimeError('SOURCE_CONTEXT_NOT_UNIQUE')
    return text.replace(before, after, 1)

texts = {}
for name, (before, after) in EXPECTED.items():
    data = (ROOT / name).read_bytes()
    if blob(data) != before:
        raise RuntimeError('SOURCE_BASE_CHANGED:' + name)
    texts[name] = data.decode('utf-8')

name = 'server/cpaOrganization/cpaOrganizationRoutes.ts'
s = texts[name]
for fmt, field, title, content_type in [
    ('pdf', 'pdf', 'PDF', 'application/pdf'),
    ('xlsx', 'xlsx', 'XLSX', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    ('json', 'json', 'JSON', 'application/json; charset=utf-8'),
    ('csv', 'csvLeadSchedules', 'CSV', 'text/csv; charset=utf-8'),
]:
    start = s.index("  router.get(['/report/download-" + fmt + "', '/reports/download-" + fmt + "']")
    end = s.index('\n  });', start) + len('\n  });')
    old = s[start:end]
    new = replace_once(old, "      const reportId = String(req.query.reportId || '');", "      const reportId = String(req.query.reportId || '');\n      const version = req.query.version ? String(req.query.version).trim() : undefined;")
    new = replace_once(new, 'getArtifactByReportId(reportId)', 'getArtifactByReportId(reportId, version)')
    new = replace_once(new, f'!fs.existsSync(artifact.formats.{field}.filepath))', f'!fs.existsSync(artifact.formats.{field}.filepath) || (version && artifact.version !== version))')
    new = replace_once(new, f"error: '{title} artifact not found or not yet generated.'", f"error: version ? `{title} artifact for version ${{version}} not found.` : '{title} artifact not found or not yet generated.'")
    header = f"      res.setHeader('X-Artifact-SHA256', artifact.formats.{field}.sha256);"
    new = replace_once(new, header, f"      if (artifact.formats.{field}.sha256) {{\n  {header}\n      }}")
    s = s[:start] + new + s[end:]
texts[name] = s

name = 'server/cpaOrganization/deliverableArtifactService.ts'
s = texts[name]
s = replace_once(s, 'workspaceId: `workspace-${engagementId}`', 'workspaceId: data.workspaceId || engagementId')
s = replace_once(s, 'workspaceId: params.workspaceId || `workspace-${engagementId}`', 'workspaceId: params.workspaceId || engagementId')
s = replace_once(s, 'if (!existing.some(e => e.reportId === reportId))', 'if (!existing.some(e => e.reportId === reportId && e.version === version))')
s = replace_once(s, 'const updatedList = existing.filter(r => r.reportId !== reportId);', 'const updatedList = existing.filter(r => !(r.reportId === reportId && r.version === version));')
start = s.index('  public getArtifactByReportId(reportId: string, version?: string): DeliverableArtifactRecord | undefined {')
end = s.index('\n  }', start) + len('\n  }')
s = s[:start] + '''  public getArtifactByReportId(reportId: string, version?: string): DeliverableArtifactRecord | undefined {
    const findInLists = (): DeliverableArtifactRecord | undefined => {
      const candidates: DeliverableArtifactRecord[] = [];
      for (const list of this.artifacts.values()) {
        for (const r of list) {
          if (r.reportId === reportId) {
            if (version) {
              if (r.version === version) return r;
            } else {
              candidates.push(r);
            }
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        return candidates[0];
      }
      return undefined;
    };

    const firstTry = findInLists();
    if (firstTry) return firstTry;

    // On-demand fallback: re-scan storageDir if not yet in memory
    this.rehydrateFromDisk();
    return findInLists();
  }''' + s[end:]
texts[name] = s

name = 'server/cpaOrganization/eveInternalAuditEngine.ts'
s = texts[name]
s = replace_once(s, "import { syntheticContaminationGuard } from './syntheticContaminationGuard.js';", "import { syntheticContaminationGuard } from './syntheticContaminationGuard.js';\nimport { professionalSignoffGuard } from './professionalSignoffGuard.js';")
start = s.index('    const isAuthenticHumanApproval = (app: any): boolean => {')
end = s.index('    const quinnEligible =', start)
s = s[:start] + '''    // Helper: validate authentic, scoped, non-revoked physical human approval backed by trusted authority
    const validateHumanApproval = (app: any): { valid: boolean; reason?: string } => {
      if (!app || typeof app !== 'object') {
        return { valid: false, reason: 'No approval object attached.' };
      }
      if (app.revoked === true || app.status === 'REVOKED' || app.approvalStatus === 'REVOKED') {
        return { valid: false, reason: 'Approval has been revoked.' };
      }
      if (app.isAiGenerated === true || app.signedByAi === true) {
        return { valid: false, reason: 'Approval indicates AI signature.' };
      }
      if (app.signatureType !== 'PHYSICAL_HUMAN') {
        return { valid: false, reason: `Signature type must be explicitly 'PHYSICAL_HUMAN', got '${app.signatureType}'.` };
      }
      // Must pass trusted professional authority validation
      const guardCheck = professionalSignoffGuard.isValidApprovalObject(app);
      if (!guardCheck.valid) {
        return { valid: false, reason: guardCheck.reason || 'Approval object failed trusted authority verification.' };
      }
      // Bound to report ID
      if (app.reportId && report?.reportId && app.reportId !== report.reportId) {
        return { valid: false, reason: `Approval reportId '${app.reportId}' does not match deliverable reportId '${report.reportId}'.` };
      }
      // Bound to report version
      const appVersion = app.reportVersion || app.version;
      const repVersion = report?.version || report?.reportVersion;
      if (appVersion && repVersion && appVersion !== repVersion) {
        return { valid: false, reason: `Approval version '${appVersion}' does not match deliverable version '${repVersion}'.` };
      }
      // Bound to artifact SHA256
      const repHash = report?.formats?.pdf?.sha256 || report?.reportSha256 || report?.sha256;
      const appHash = app.reportHash || app.reportSha256 || app.expectedReportHash;
      if (repHash && appHash && repHash !== appHash) {
        return { valid: false, reason: `Approval hash '${appHash}' does not match deliverable SHA256 '${repHash}'.` };
      }
      if (reportStatus === 'FINAL_CERTIFIED' && repHash && !appHash) {
        return { valid: false, reason: 'Approval lacks cryptographic artifact hash binding for certified deliverable.' };
      }
      if (app.engagementId && report?.engagementId && app.engagementId !== report.engagementId) {
        return { valid: false, reason: `Approval engagementId '${app.engagementId}' does not match report engagementId '${report.engagementId}'.` };
      }
      return { valid: true };
    };

    let approvalCandidate = approval;
    if (!approvalCandidate && report?.reportId) {
      approvalCandidate = professionalSignoffGuard.getApprovalForReport(
        report.reportId,
        report?.formats?.pdf?.sha256 || report?.reportSha256 || report?.sha256
      );
    }

    const approvalResult = approvalCandidate ? validateHumanApproval(approvalCandidate) : { valid: false, reason: 'Missing approval object.' };
    const hasValidHumanApproval = approvalResult.valid;
''' + s[end:]
s = replace_once(s, '    if (isCertifiedState) {\n      if (!approval) {', '    if (isCertifiedState) {\n      if (!approvalCandidate) {')
s = replace_once(s, "title: 'Invalid, AI, or Unscoped Signatory for Certified Deliverable',", "title: 'Invalid, AI, or Unregistered/Untrusted Signatory for Certified Deliverable',")
s = replace_once(s, 'description: `Deliverable claims certified status but attached approval fails authentic human partner validation.`,', 'description: `Deliverable claims certified status but attached approval fails authentic human partner validation: ${approvalResult.reason}`,')
s = replace_once(s, 'evidence: JSON.stringify(approval),', 'evidence: JSON.stringify(approvalCandidate),')
texts[name] = s

name = 'test_all_defects.ts'
s = "process.env.TEST_MODE = 'true';\n" + texts[name]
s = replace_once(s, "import { eveInternalAuditEngine } from './server/cpaOrganization/eveInternalAuditEngine.js';", "import { eveInternalAuditEngine } from './server/cpaOrganization/eveInternalAuditEngine.js';\nimport { professionalSignoffGuard } from './server/cpaOrganization/professionalSignoffGuard.js';")
start = s.index('    const validHumanAudit = eveInternalAuditEngine.auditDeliverableTruth({')
end = s.index('\n    });', start) + len('\n    });')
s = s[:start] + '''    professionalSignoffGuard.registerTrustedPrincipal({
      principalId: 'usr-partner-steve-01',
      displayName: 'Steve Stein, CPA',
      email: 'sstein@cpa-audit.com',
      isHuman: true,
      role: 'ENGAGEMENT_PARTNER',
      licenseDetails: {
        licenseNumber: 'CPA-NY-094821',
        jurisdiction: 'NY',
        status: 'ACTIVE',
        verificationSource: 'STATE_BOARD_OF_ACCOUNTANCY',
        verifiedAt: '2026-01-01T00:00:00Z'
      },
      authorizedEngagements: ['eng-test-human'],
      sessionValid: true,
      status: 'ACTIVE'
    });

    const validHumanAudit = eveInternalAuditEngine.auditDeliverableTruth({
      reportId: 'REP-TEST-HUMAN',
      engagementId: 'eng-test-human',
      version: '1.0',
      status: 'FINAL_CERTIFIED',
      formats: { pdf: { sha256: 'a'.repeat(64) } },
      approvalObject: {
        principalId: 'usr-partner-steve-01',
        authorizedRole: 'ENGAGEMENT_PARTNER',
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        signatureType: 'PHYSICAL_HUMAN',
        approverName: 'Steve Stein, CPA',
        approverLicenseNumber: 'CPA-NY-094821',
        engagementId: 'eng-test-human',
        reportId: 'REP-TEST-HUMAN',
        reportVersion: '1.0',
        reportHash: 'a'.repeat(64),
        authenticationContext: {
          sessionId: 'sess-test-01',
          authenticationMethod: 'BEARER_TOKEN',
          timestamp: new Date().toISOString()
        }
      },
      facts: []
    });''' + s[end:]
texts[name] = s

for name, s in texts.items():
    if blob(s.encode('utf-8')) != EXPECTED[name][1]:
        raise RuntimeError('EXPORT_RESULT_MISMATCH:' + name)
for name, s in texts.items():
    (ROOT / name).write_bytes(s.encode('utf-8'))
    print('PRESERVED_FILE=' + name + ' BLOB=' + EXPECTED[name][1])
print('THIRD_ZIP_PRESERVATION=PASS; PRODUCTION_ACCEPTANCE=NOT_ESTABLISHED')
