"""One-shot source preservation, not a repair or deployment.
Applies only six text deltas whose old/new blob IDs were independently compared
with the owner's second ZIP. Never run application source in the write job.
"""
import hashlib
import json
from pathlib import Path

DELTA = r'''{
  "server.ts": {
    "before": "7b169e0bc4c669ea9a85e052551ca0562d7685bf",
    "after": "37dd0b9113c99d8f69e95932baabeb9d35587a95",
    "edits": [
      [19,19,"import { deliverableArtifactService } from \"./server/cpaOrganization/deliverableArtifactService.js\";\n"],
      [3406,3406,"    let targetEngagementId: string | null = null;\n    let targetWorkspaceId: string | null = null;\n    if (workspaceId) {\n      const qWs = String(workspaceId);\n      targetWorkspaceId = qWs;\n      const cont = verifiedCustomerContinuationService.getContinuationByEngagementId(qWs);\n      if (cont) {\n        targetEngagementId = cont.engagementId;\n        if (!targetWorkspaceId && cont.workspaceId) targetWorkspaceId = cont.workspaceId;\n      }\n    }\n"],
      [3407,3408,"      const matches = !workspaceId ||\n        art.workspaceId === targetWorkspaceId ||\n        art.engagementId === targetWorkspaceId ||\n        (targetEngagementId !== null && art.engagementId === targetEngagementId);\n      if (matches) {\n"],
      [3413,3414,"            workspaceId: art.workspaceId || targetWorkspaceId || art.engagementId,\n"],
      [3420,3421,"            numericFactsCount: (art as any).numericFactsCount,\n"],
      [3427,3428,"  } catch (e: any) {\n    console.error(\"[/api/reports] Error fetching deliverable artifacts:\", e);\n    return res.status(500).json({ success: false, error: e?.message || \"Failed to load deliverable artifacts\" });\n  }\n"]
    ]
  },
  "server/cpaOrganization/deliverableArtifactService.ts": {
    "before": "9f85bebe87b80c6deee9088fe902388e0ee46b8a",
    "after": "a0ab5708193da41fe5bd0fc858c690ae023e6045",
    "edits": [
      [763,764,"  public getArtifactByReportId(reportId: string, version?: string): DeliverableArtifactRecord | undefined {\n"],
      [765,766,"      const found = list.find(r => r.reportId === reportId && (!version || r.version === version));\n"],
      [772,773,"      const found = list.find(r => r.reportId === reportId && (!version || r.version === version));\n"]
    ]
  },
  "server/cpaOrganization/eveInternalAuditEngine.ts": {
    "before": "3a812452ba3f027aa0a1200ae8b288281cffab0c",
    "after": "afc59cafe60ce969bf5a174475b0ea9436656213",
    "edits": [
      [1356,1357,"    // Helper: validate authentic, scoped, non-revoked physical human approval\n"],
      [1358,1358,"    const isAuthenticHumanApproval = (app: any): boolean => {\n      if (!app || typeof app !== 'object') return false;\n      if (app.revoked === true || app.status === 'REVOKED') return false;\n      const st = String(app.status || app.approvalStatus || '').toUpperCase();\n      if (st !== 'APPROVED' && st !== 'GRANTED' && st !== 'PHYSICAL_HUMAN_SIGN_OFF') return false;\n      if (app.signatureType && app.signatureType !== 'PHYSICAL_HUMAN') return false;\n      if (app.isAiGenerated === true || app.signedByAi === true) return false;\n      const approverName = String(app.approverName || app.signerName || '').trim().toUpperCase();\n      if (!approverName || approverName.includes('QUINN') || approverName.includes('AI') || approverName.includes('BOT')) return false;\n      if (!app.approverLicenseNumber || String(app.approverLicenseNumber).trim().length === 0) return false;\n      if (app.reportId && report?.reportId && app.reportId !== report.reportId) return false;\n      if (app.version && report?.version && app.version !== report.version) return false;\n      if (app.reportSha256 && report?.formats?.pdf?.sha256 && app.reportSha256 !== report.formats.pdf.sha256) return false;\n      return true;\n    };\n\n    const hasValidHumanApproval = isAuthenticHumanApproval(approval);\n"],
      [1359,1374,"    const isDraftState = ['READY_FOR_AUTHORIZED_HUMAN_REVIEW', 'READY_FOR_AUTHORIZED_HUMAN_REVIEW_WITH_SYSTEM_FINDINGS', 'DRAFT', 'AI_PREPARED', 'UNKNOWN'].includes(reportStatus);\n    const isCertifiedState = ['FINAL_CERTIFIED', 'ELIGIBLE_FOR_DELIVERY', 'DELIVERED'].includes(reportStatus);\n\n    if (isCertifiedState) {\n"],
      [1386,1387,"        if (!hasValidHumanApproval) {\n"],
      [1392,1394,"            title: 'Invalid, AI, or Unscoped Signatory for Certified Deliverable',\n            description: `Deliverable claims certified status but attached approval fails authentic human partner validation.`,\n"],
      [1395,1407,""],
      [1471,1471,"    const deliveryEligible = compliant && quinnEligible && hasValidHumanApproval && !isDraftState;\n    const deliveryGateStatus = deliveryEligible ? 'ELIGIBLE_FOR_DELIVERY' : 'DELIVERY_BLOCKED_PENDING_REVIEW';\n\n"],
      [1474,1475,"      deliveryGateStatus,\n"],
      [1476,1477,"        ? (deliveryEligible\n            ? 'Deliverable passed independent internal audit truth inspection and is authorized for external delivery.'\n            : 'Deliverable passed technical truth inspection. External delivery blocked pending authorized human review.')\n"]
    ]
  },
  "server/cpaOrganization/universalEngagementModel.ts": {
    "before": "9462fd5ce22772aa67fb8bab91e26ef279f1b95f",
    "after": "86fa800bc08de9b01fab71638e857f84ebc16696",
    "edits": [
      [101,101,"  financialFacts?: Array<any>;\n"],
      [236,244,"      const storageFile = process.env.STORAGE_FILE || process.env.AI_CPA_STORAGE_FILE || path.join(process.cwd(), 'storage', 'ai_cpa_storage.json');\n"],
      [267,268,"            period: ws.period || (wsFacts.find((f: any) => f.reportingPeriod)?.reportingPeriod) || (isAcademyRun ? 'FY 2025' : 'FY 2024'),\n"],
      [271,274,"            currentStage: wsFacts.length > 0 ? (wsReports.length > 0 ? 'FINAL_DELIVERABLE' : 'EVIDENCE_REVIEW') : 'ONBOARDING',\n            stageProgressPercent: wsFacts.length > 0 ? (wsReports.length > 0 ? 85 : 50) : 15,\n            assignedPartner: ws.assignedPartner || ws.partner || (isAcademyRun ? 'Steve Stein, CPA' : undefined),\n"],
      [276,277,"            documentsCount: wsDocs.length,\n"],
      [279,280,"            clearedPbcCount: (ws.pbcRequests || []).filter((p: any) => p.status === 'CLEARED').length,\n"],
      [282,283,"            reportsGeneratedCount: wsReports.length,\n"],
      [291,292,"            minervaOverallScore: ws.minervaOverallScore !== undefined ? ws.minervaOverallScore : undefined,\n"],
      [407,408,"    const summary = all.find(e =>\n      e.engagementId === engagementId ||\n      e.engagementId === `eng-${engagementId}` ||\n      e.clientId === engagementId ||\n      (e.engagementId?.startsWith('eng-') && e.engagementId.replace('eng-', '') === engagementId)\n    );\n"],
      [488,489,"      const storageFile = process.env.STORAGE_FILE || process.env.AI_CPA_STORAGE_FILE || path.join(process.cwd(), 'storage', 'ai_cpa_storage.json');\n"]
    ]
  },
  "server/cpaOrganization/verifiedCustomerContinuationService.ts": {
    "before": "0a029f59efea5f9876a36f6c6f5c6c5d1cf06931",
    "after": "c14dd42ec7db8dc62695154fa303f930f73148e4",
    "edits": [
      [66,66,"}\n\nexport function formatUncertainty(u: any): string {\n  if (u === null || u === undefined) return '';\n  if (typeof u === 'string') return u;\n  if (typeof u === 'number' || typeof u === 'boolean') return String(u);\n  if (typeof u === 'object') {\n    if (u.topic && u.description) return `[${u.topic}] ${u.description}`;\n    if (u.description) return String(u.description);\n    if (u.topic) return String(u.topic);\n    if (u.text) return String(u.text);\n    if (u.message) return String(u.message);\n    try {\n      return JSON.stringify(u);\n    } catch {\n      return String(u);\n    }\n  }\n  return String(u);\n"],
      [478,483,""]
    ]
  },
  "src/components/views/engagement/DeliverablesView.tsx": {
    "before": "f908f874b3f339fb965638ba1759070cef7bf870",
    "after": "870357c0f998774b2cae480e5a2d7099dcd506a8",
    "edits": [
      [90,91,"  const downloadReportFile = (reportId: string, format: 'pdf' | 'xlsx' | 'csv' | 'json', version?: string) => {\n    const vParam = version ? `&version=${encodeURIComponent(version)}` : '';\n"],
      [92,93,"      window.open(`/api/cpa/report/download-pdf?reportId=${encodeURIComponent(reportId)}${vParam}`, '_blank');\n"],
      [94,95,"      window.open(`/api/cpa/report/download-xlsx?reportId=${encodeURIComponent(reportId)}${vParam}`, '_blank');\n"],
      [96,97,"      window.open(`/api/cpa/report/download-csv?reportId=${encodeURIComponent(reportId)}${vParam}`, '_blank');\n"],
      [98,99,"      window.open(`/api/cpa/report/download-json?reportId=${encodeURIComponent(reportId)}${vParam}`, '_blank');\n"],
      [292,293,"                        onClick={() => downloadReportFile(rep.reportId, 'pdf', rep.version)}\n"],
      [303,304,"                        onClick={() => downloadReportFile(rep.reportId, 'xlsx', rep.version)}\n"],
      [314,315,"                        onClick={() => downloadReportFile(rep.reportId, 'csv', rep.version)}\n"],
      [325,326,"                        onClick={() => downloadReportFile(rep.reportId, 'json', rep.version)}\n"]
    ]
  }
}'''


def blob(data: bytes) -> str:
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def main():
    changes = json.loads(DELTA)
    results = {}
    for filename, spec in changes.items():
        p = Path(filename)
        if p.is_absolute() or '..' in p.parts or p.is_symlink():
            raise RuntimeError('UNSAFE_TARGET_PATH')
        original = p.read_bytes()
        if blob(original) != spec['before']:
            raise RuntimeError('BASELINE_MISMATCH:' + filename)
        lines = original.decode('utf-8').splitlines(keepends=True)
        for start, end, replacement in reversed(spec['edits']):
            lines[start:end] = replacement.splitlines(keepends=True)
        result = ''.join(lines).encode('utf-8')
        if blob(result) != spec['after']:
            raise RuntimeError('RESULT_HASH_MISMATCH:' + filename)
        results[filename] = result
    if blob(Path('test_all_defects.ts').read_bytes()) != '1d029b4ea73c945d4d0a8d2ff282e7de0bae1aac':
        raise RuntimeError('REVISED_TEST_SOURCE_MISMATCH')
    for filename, result in results.items():
        Path(filename).write_bytes(result)
        print('PRESERVED_FILE=' + filename + ' BLOB=' + blob(result))
    print('ZIP_SOURCE_PRESERVATION=PASS; APPLICATION_ACCEPTANCE=NOT_ESTABLISHED')


if __name__ == '__main__':
    main()
