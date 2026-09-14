from pathlib import Path
import json


def replace_once(path: str, old: str, new: str, label: str):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'{label} anchor not found in {path}')
    p.write_text(s.replace(old, new, 1))

# 1) Hermes specialist swarm consumes actual proof-complete fact digest.
replace_once(
    'server/cpaOrganization/hermesJobDispatchService.ts',
    '''    customerPbcUploaded?: boolean;\n    customerPbcFilesCount?: number;\n  }): Promise<SwarmExecutionSummary> {''',
    '''    customerPbcUploaded?: boolean;\n    customerPbcFilesCount?: number;\n    verifiedFacts?: Array<Record<string, any>>;\n    verifiedFactsDigestSha256?: string;\n    reportingCurrency?: string;\n    workspaceId?: string;\n    documentId?: string;\n  }): Promise<SwarmExecutionSummary> {''',
    'Hermes params'
)
replace_once(
    'server/cpaOrganization/hermesJobDispatchService.ts',
    '''    const initialReferences = [\n      `ref-source-file-${params.engagementId}`,\n      `ref-sec-metadata-${params.ticker}`,\n      `ref-facts-count-${params.extractedFactsCount}`\n    ];''',
    '''    const verifiedFactCount = Array.isArray(params.verifiedFacts) ? params.verifiedFacts.length : 0;\n    const initialReferences = [\n      `ref-source-file-${params.engagementId}`,\n      `ref-sec-metadata-${params.ticker}`,\n      `ref-facts-count-${params.extractedFactsCount}`,\n      ...(params.workspaceId ? [`ref-workspace-${params.workspaceId}`] : []),\n      ...(params.documentId ? [`ref-document-${params.documentId}`] : []),\n      ...(params.verifiedFactsDigestSha256 ? [`ref-verified-facts-${params.verifiedFactsDigestSha256}`] : [])\n    ];''',
    'Hermes references'
)
replace_once(
    'server/cpaOrganization/hermesJobDispatchService.ts',
    '''          userPrompt: `Establish statutory audit scope and materiality recommendation for ${params.clientName} (${params.ticker}) with reported assets $${params.reportedAssets}.`,\n          contextData: {\n            client: params.clientName,\n            ticker: params.ticker,\n            fiscalYear: params.fiscalYear,\n            reportedAssets: params.reportedAssets\n          },''',
    '''          userPrompt: `Establish statutory audit scope and materiality recommendation for ${params.clientName} (${params.ticker}) with reported assets $${params.reportedAssets}. Use the supplied ${verifiedFactCount} VERIFIED + CONFIRMED financial facts as the engagement evidence set; do not invent missing values.`,\n          contextData: {\n            client: params.clientName,\n            ticker: params.ticker,\n            fiscalYear: params.fiscalYear,\n            reportedAssets: params.reportedAssets,\n            reportedLiabilities: params.reportedLiabilities,\n            reportedEquity: params.reportedEquity,\n            reportingCurrency: params.reportingCurrency,\n            verifiedFactCount,\n            verifiedFactsDigestSha256: params.verifiedFactsDigestSha256,\n            verifiedFacts: params.verifiedFacts || []\n          },''',
    'Hermes evidence context'
)
replace_once(
    'server/cpaOrganization/hermesJobDispatchService.ts',
    '''            citedFactsCount: params.extractedFactsCount,\n            provenanceStatus: actualSha256Match ? 'FULL_CRYPTOGRAPHIC_PROVENANCE_PROVED' : 'HASH_MISMATCH_FAIL' ''',
    '''            citedFactsCount: verifiedFactCount,\n            evidenceConfirmedFactsCount: verifiedFactCount,\n            verifiedFactsDigestSha256: params.verifiedFactsDigestSha256 || null,\n            provenanceStatus: actualSha256Match ? 'FULL_CRYPTOGRAPHIC_PROVENANCE_PROVED' : 'HASH_MISMATCH_FAIL' ''',
    'Veritas verified fact count'
)
replace_once(
    'server/cpaOrganization/hermesJobDispatchService.ts',
    '''          userPrompt: `Evaluate GAAP technical disclosure compliance for ${params.clientName} (${params.fiscalYear}). Extracted facts: ${params.extractedFactsCount}. Prior evidence references: ${context.inputObjectReferences.join(', ')}.`,\n          contextData: {\n            client: params.clientName,\n            fiscalYear: params.fiscalYear,\n            extractedFactsCount: params.extractedFactsCount,\n            evidenceReferences: context.inputObjectReferences\n          },''',
    '''          userPrompt: `Evaluate GAAP technical disclosure compliance for ${params.clientName} (${params.fiscalYear}) using the supplied VERIFIED + CONFIRMED fact digest. Do not infer compliance from fact counts alone. Flag standards that cannot be evaluated from the provided evidence. Prior evidence references: ${context.inputObjectReferences.join(', ')}.`,\n          contextData: {\n            client: params.clientName,\n            fiscalYear: params.fiscalYear,\n            reportingCurrency: params.reportingCurrency,\n            extractedFactsCount: params.extractedFactsCount,\n            verifiedFactCount,\n            verifiedFactsDigestSha256: params.verifiedFactsDigestSha256,\n            verifiedFacts: params.verifiedFacts || [],\n            evidenceReferences: context.inputObjectReferences\n          },''',
    'Athena evidence context'
)
replace_once(
    'server/cpaOrganization/hermesJobDispatchService.ts',
    '''          userPrompt: `Conduct EQCR quality review on ${context.priorJobs.length} workpapers for ${params.clientName}. Euclid variance: $${variance}. All prior succeeded: ${allPriorSucceeded}.`,\n          contextData: {\n            workpapersCount: context.priorJobs.length,\n            euclidVariance: variance,\n            allPriorSucceeded,\n            priorJobIds: context.priorJobs.map(j => j.agentExecutionId)\n          },''',
    '''          userPrompt: `Conduct AI EQCR quality review on ${context.priorJobs.length} workpapers for ${params.clientName}. Euclid variance: $${variance}. All prior succeeded: ${allPriorSucceeded}. Review the supplied VERIFIED + CONFIRMED financial fact digest and identify unresolved matters. This AI review cannot grant human partner approval.`,\n          contextData: {\n            workpapersCount: context.priorJobs.length,\n            euclidVariance: variance,\n            allPriorSucceeded,\n            reportingCurrency: params.reportingCurrency,\n            verifiedFactCount,\n            verifiedFactsDigestSha256: params.verifiedFactsDigestSha256,\n            verifiedFacts: params.verifiedFacts || [],\n            priorJobIds: context.priorJobs.map(j => j.agentExecutionId)\n          },''',
    'Quinn evidence context'
)

# 2) Deliverables: artifact integrity != professional certification; actual proof labels and Quinn state only.
p = Path('server/cpaOrganization/deliverableArtifactService.ts')
s = p.read_text()
s = s.replace("  verificationDetails?: string;\n", "  verificationDetails?: string;\n  verificationScope?: 'BINARY_INTEGRITY_ONLY';\n", 1)
s = s.replace("  overallStatus: 'ALL_VERIFIED' | 'PARTIAL' | 'FAILED';", "  overallStatus: 'ALL_ARTIFACT_HASHES_VERIFIED' | 'ALL_VERIFIED' | 'PARTIAL' | 'FAILED';", 1)
s = s.replace("              overallStatus: 'ALL_VERIFIED'", "              overallStatus: 'ALL_ARTIFACT_HASHES_VERIFIED'", 1)
s = s.replace("              firmName: \"Eve's CPA & Advisory LLP\",\n              partnerName: \"Managing Partner, CPA / CA\",\n              licenseNumber: \"CPA-PCAOB-982410\",", "              firmName: data.firmName || 'Eve Autonomous CPA System',\n              partnerName: data.partnerName || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',\n              licenseNumber: data.licenseNumber || '',", 1)
s = s.replace("            canonicalFactHash: data.quinnSignoff || '',", "            canonicalFactHash: data.canonicalFactHash || crypto.createHash('sha256').update(JSON.stringify(data.facts || [])).digest('hex'),", 1)
s = s.replace("            quinnReviewStatus: data.quinnReviewStatus || 'AI_REVIEW_COMPLETE',", "            quinnReviewStatus: data.quinnReviewStatus || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',", 1)
s = s.replace("page1.drawText(`Page 1 of 1 | Report ID: ${params.reportId} | Eve Autonomous CPA Firm`,", "page1.drawText(`Page 1 of 1 | Report ID: ${params.reportId} | Eve Autonomous CPA System`,", 1)
s = s.replace("      ['EVE AUTONOMOUS CPA ASSURANCE & AUDIT STUDIO'],\n      ['STATUTORY DELIVERABLE WORKBOOK'],", "      ['EVE AUTONOMOUS CPA SYSTEM'],\n      ['FINANCIAL REVIEW DRAFT — AUTHORIZED HUMAN REVIEW REQUIRED'],", 1)
s = s.replace("      verificationStatus: string;\n    }>;", "      verificationStatus: string;\n      evidenceStatus?: string;\n    }>;", 1)
s = s.replace("      `SEC_XBRL_BLOCK_${idx + 101}`,\n      'CRYPTOGRAPHICALLY_VERIFIED'", "      `SOURCE_EVIDENCE_${idx + 1}`,\n      `${f.verificationStatus || 'NOT_VERIFIED'}${f.evidenceStatus ? ` / ${f.evidenceStatus}` : ''}`", 1)
s = s.replace("    const firmName = params.firmName || 'Eve Autonomous CPA Assurance LLP';", "    const firmName = params.firmName || 'Eve Autonomous CPA System';", 1)
s = s.replace("      verificationStatus?: string;\n    }>;", "      verificationStatus?: string;\n      evidenceStatus?: string;\n      documentId?: string;\n    }>;", 1)
s = s.replace("      verificationStatus: f.verificationStatus || 'NOT_VERIFIED'\n    }));", "      verificationStatus: f.verificationStatus || 'NOT_VERIFIED',\n      evidenceStatus: f.evidenceStatus || 'NOT_MEASURED',\n      documentId: f.documentId\n    }));", 1)
s = s.replace("      facts: normalizedFacts,\n      quinnSignoff: 'CLEARED_CONCURRING_PARTNER'", "      status: reportStatus,\n      firmName,\n      partnerName,\n      licenseNumber,\n      facts: normalizedFacts,\n      quinnReviewStatus: params.quinnReviewStatus || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',\n      quinnReview: params.quinnReview || { aiQualityReview: 'NOT_RUN', humanPartnerSignOff: 'PENDING', concurringApprovalGranted: false, deliveryEligible: false }", 1)
s = s.replace("      overallStatus: 'ALL_VERIFIED'\n    };", "      overallStatus: 'ALL_ARTIFACT_HASHES_VERIFIED'\n    };", 1)
s = s.replace("      quinnReviewStatus: params.quinnReviewStatus || 'AI_REVIEW_COMPLETE',", "      quinnReviewStatus: params.quinnReviewStatus || 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',", 1)
# Clarify per-artifact 'verified' semantics on newly generated manifest items.
s = s.replace("          verified: true\n        },", "          verified: true,\n          verificationScope: 'BINARY_INTEGRITY_ONLY',\n          verificationDetails: 'Artifact file/hash integrity only; not professional approval.'\n        },", 4)
# JSON should carry the canonical fact hash for rehydration; move computation before JSON generation.
old = """    // 3. Generate JSON deliverable\n    const jsonFilename = `audit_package_${reportId}_${version}.json`;"""
new = """    // Canonical fact hash binds the draft package to the verified fact set.\n    const canonicalFactHash = crypto.createHash('sha256')\n      .update(normalizedFacts.map(f => `${f.canonicalMetric}:${f.value}`).join(';'))\n      .digest('hex');\n\n    // 3. Generate JSON deliverable\n    const jsonFilename = `audit_package_${reportId}_${version}.json`;"""
if old not in s:
    raise SystemExit('deliverable JSON anchor missing')
s = s.replace(old, new, 1)
s = s.replace("      licenseNumber,\n      facts: normalizedFacts,", "      licenseNumber,\n      canonicalFactHash,\n      facts: normalizedFacts,", 1)
old_dupe = """    // Canonical fact hash\n    const canonicalFactHash = crypto.createHash('sha256')\n      .update(normalizedFacts.map(f => `${f.canonicalMetric}:${f.value}`).join(';'))\n      .digest('hex');\n\n"""
if old_dupe not in s:
    raise SystemExit('duplicate canonical hash anchor missing')
s = s.replace(old_dupe, '', 1)
# Ensure no forbidden legacy claims remain in this service.
for forbidden in ['CLEARED_CONCURRING_PARTNER', 'CRYPTOGRAPHICALLY_VERIFIED', 'CPA-PCAOB-982410', 'Eve Autonomous CPA Firm']:
    if forbidden in s:
        raise SystemExit(f'forbidden deliverable legacy claim still present: {forbidden}')
p.write_text(s)

# 3) Minerva live validation checks proof completeness instead of fact count alone.
replace_once(
    'server/cpaOrganization/academyMinervaLab.ts',
    '''    // 3. Extracted facts count check\n    const factsCount = (params.facts || []).length;\n    if (factsCount > 0) {\n      details.push(`Extracted ${factsCount} authoritative financial facts with source-to-pixel citations`);\n    } else {\n      passed = false;\n      details.push('Zero financial facts extracted from filing');\n    }''',
    '''    // 3. Live fact evidence integrity check. A non-empty array is not proof.\n    const facts = params.facts || [];\n    const factsCount = facts.length;\n    const proofCompleteCount = facts.filter((fact: any) =>\n      String(fact?.status || '').toUpperCase() === 'APPROVED' &&\n      String(fact?.verificationStatus || fact?.verification_status || '').toUpperCase() === 'VERIFIED' &&\n      String(fact?.evidenceStatus || fact?.evidence_status || '').toUpperCase() === 'CONFIRMED' &&\n      Boolean(fact?.documentId || fact?.document_id) &&\n      Boolean(String(fact?.sourceText || fact?.source_text || '').trim())\n    ).length;\n    if (factsCount > 0 && proofCompleteCount === factsCount) {\n      details.push(`Validated ${proofCompleteCount} source-evidence-corroborated financial facts (VERIFIED + CONFIRMED).`);\n    } else {\n      passed = false;\n      details.push(`Fact evidence integrity failed: ${proofCompleteCount}/${factsCount} facts are APPROVED + VERIFIED + CONFIRMED with source evidence.`);\n    }''',
    'Minerva live evidence check'
)

# 4) Server leader-only automatic continuation sweep. No duplicate intake/re-extraction.
p = Path('server.ts')
s = p.read_text()
import_anchor = 'import { backgroundIngestionQueue } from "./server/backgroundQueue.js";\n'
imports = import_anchor + 'import { verifiedCustomerContinuationService } from "./server/cpaOrganization/verifiedCustomerContinuationService.js";\nimport { runtimeAuthorityManifestManager } from "./server/cpaOrganization/runtimeAuthorityManifest.js";\n'
if import_anchor not in s:
    raise SystemExit('server import anchor missing')
s = s.replace(import_anchor, imports, 1)
listener_tail = '''    saveStorage();\n    console.log(`[Server] Applied ${job.result.facts.length} facts & reprocessed audit findings for background job ${job.id} to workspace ${job.workspaceId}`);\n  }\n});\n'''
sweep = listener_tail + '''\n// Leader-only continuation sweep for completed HYBRID customer jobs.\n// This never creates a new intake and never re-runs extraction. The continuation\n// service is durable/idempotent by job ID + attempt + source hash.\nlet verifiedContinuationSweepRunning = false;\nasync function sweepVerifiedCustomerContinuations(): Promise<void> {\n  if (verifiedContinuationSweepRunning) return;\n  try {\n    if (!runtimeAuthorityManifestManager.isLeader()) return;\n  } catch {\n    return;\n  }\n\n  verifiedContinuationSweepRunning = true;\n  try {\n    const jobs = backgroundIngestionQueue.getAllJobs();\n    for (const job of jobs) {\n      if (job?.engineMode !== 'HYBRID_GEMINI_NATIVE' || job?.status !== 'COMPLETED') continue;\n      const state = await verifiedCustomerContinuationService.continueCompletedHybridJob(job, db);\n      if (state) {\n        console.log(`[VerifiedCustomerContinuation] ${job.id} -> ${state.status}`);\n      }\n    }\n  } catch (err: any) {\n    console.error('[VerifiedCustomerContinuation] sweep failed closed:', err?.message || err);\n  } finally {\n    verifiedContinuationSweepRunning = false;\n  }\n}\n\nsetTimeout(() => { void sweepVerifiedCustomerContinuations(); }, 5000);\nsetInterval(() => { void sweepVerifiedCustomerContinuations(); }, 15000);\n'''
if listener_tail not in s:
    raise SystemExit('server completion listener anchor missing')
s = s.replace(listener_tail, sweep, 1)
p.write_text(s)

# 5) Targeted regression: proof gate, balance, downstream truth labels, Minerva live evidence, leader-only wiring.
test = Path('server/tests/company1VerifiedContinuation.test.ts')
test.write_text('''import fs from "fs";\nimport path from "path";\nimport crypto from "crypto";\nimport { isProofCompleteFact, selectProofCompleteFacts, deriveFiscalYear, deriveCurrentBalance, buildVerifiedFactDigest } from "../cpaOrganization/verifiedCustomerContinuationService.js";\nimport { academyMinervaLab } from "../cpaOrganization/academyMinervaLab.js";\n\nfunction assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }\n\nconst base = { workspaceId: "ws", documentId: "doc", status: "approved", verificationStatus: "VERIFIED", evidenceStatus: "CONFIRMED", functionalCurrency: "USD", reportingScope: "CONSOLIDATED", statementType: "CONSOLIDATED_BALANCE_SHEET", reportingPeriod: "2024-12-31", sourceText: "source row", pageNumber: 53 };\nconst facts: any[] = [\n  { ...base, id: "a", canonicalMetric: "totalAssets", labelOriginal: "Total assets", normalizedValue: 213396000000 },\n  { ...base, id: "l", canonicalMetric: "totalLiabilities", labelOriginal: "Total liabilities", normalizedValue: 124899000000 },\n  { ...base, id: "e", canonicalMetric: "totalEquity", labelOriginal: "Total equity", normalizedValue: 88497000000 },\n  { ...base, id: "bad", canonicalMetric: "cash", normalizedValue: 100, evidenceStatus: "UNCONFIRMED" }\n];\nassert(isProofCompleteFact(facts[0]), "verified/evidence-confirmed fact must be proof complete");\nassert(!isProofCompleteFact(facts[3]), "unconfirmed fact must fail proof-complete gate");\nconst proof = selectProofCompleteFacts(facts, "ws");\nassert(proof.length === 3, "continuation must exclude review-required facts");\nassert(deriveFiscalYear(proof) === "2024", "fiscal year must derive from persisted fact periods");\nconst bal = deriveCurrentBalance(proof, "2024");\nassert(!!bal && bal.variance === 0, "verified Pfizer-class balance sheet must reconcile before continuation");\nassert(buildVerifiedFactDigest(proof).every(f => f.verificationStatus === "VERIFIED" && f.evidenceStatus === "CONFIRMED"), "fact digest must retain proof lineage");\n\nconst deliverable = fs.readFileSync("server/cpaOrganization/deliverableArtifactService.ts", "utf8");\nfor (const forbidden of ["CLEARED_CONCURRING_PARTNER", "CRYPTOGRAPHICALLY_VERIFIED", "CPA-PCAOB-982410", "Eve Autonomous CPA Firm"]) {\n  assert(!deliverable.includes(forbidden), `deliverable service must not contain legacy false claim: ${forbidden}`);\n}\nassert(deliverable.includes("ALL_ARTIFACT_HASHES_VERIFIED"), "artifact manifest must describe binary integrity, not professional verification");\nassert(deliverable.includes("humanPartnerSignOff: 'PENDING'"), "deliverable must preserve pending human sign-off");\n\nconst hermes = fs.readFileSync("server/cpaOrganization/hermesJobDispatchService.ts", "utf8");\nassert(hermes.includes("verifiedFacts?: Array<Record<string, any>>"), "Hermes swarm must accept actual verified fact digest");\nassert(hermes.includes("verifiedFacts: params.verifiedFacts || []"), "real model contexts must receive verified facts, not counts alone");\nassert(hermes.includes("evidenceConfirmedFactsCount: verifiedFactCount"), "Veritas must report evidence-confirmed count");\n\nconst server = fs.readFileSync("server.ts", "utf8");\nassert(server.includes("runtimeAuthorityManifestManager.isLeader()"), "continuation sweep must be leader-only");\nassert(server.includes("continueCompletedHybridJob(job, db)"), "completed hybrid jobs must flow into verified continuation");\n\nconst tmp = path.join('/tmp', `eve-minerva-${Date.now()}.txt`);\nfs.writeFileSync(tmp, 'authoritative source');\nconst sha = crypto.createHash('sha256').update(fs.readFileSync(tmp)).digest('hex');\nconst good = academyMinervaLab.evaluateLiveEngagement({ facts: proof, assets: 213396000000, liabilities: 124899000000, equity: 88497000000, variance: 0, physicalFilePath: tmp, physicalSha256: sha });\nassert(good.certifiedStatus === 'TECHNICAL_VALIDATION_PASSED', 'Minerva live validation should pass proof-complete balanced facts with authentic source hash');\nconst bad = academyMinervaLab.evaluateLiveEngagement({ facts: [facts[3]], assets: 213396000000, liabilities: 124899000000, equity: 88497000000, variance: 0, physicalFilePath: tmp, physicalSha256: sha });\nassert(bad.certifiedStatus !== 'TECHNICAL_VALIDATION_PASSED', 'Minerva must fail closed on unconfirmed fact evidence');\nfs.unlinkSync(tmp);\nconsole.log('✓ Company 1 verified customer continuation tests passed');\n''')

pkg = json.loads(Path('package.json').read_text())
marker = 'tsx server/tests/company1VerifiedContinuation.test.ts'
if marker not in pkg['scripts']['test']:
    pkg['scripts']['test'] += ' && ' + marker
Path('package.json').write_text(json.dumps(pkg, indent=2) + '\n')
