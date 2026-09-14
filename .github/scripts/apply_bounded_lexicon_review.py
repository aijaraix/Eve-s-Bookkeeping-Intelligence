from pathlib import Path

def patch(name, old, new, count=1):
 p=Path(name);s=p.read_text()
 if s.count(old)<count:raise RuntimeError('PATCH_CONTEXT_MISMATCH:'+name+':'+old[:80])
 p.write_text(s.replace(old,new,count))

adapter='server/cpaOrganization/realAgentExecutionAdapter.ts'
patch(adapter,'  promptTemplateVersion?: string;\n}', '  promptTemplateVersion?: string;\n  structuredSchema?: Record<string, any>;\n  maxOutputTokens?: number;\n  localModelTimeoutMs?: number;\n}')
patch(adapter,'        requireRealModel: true','        requireRealModel: true,\n        structuredSchema: request.structuredSchema,\n        maxOutputTokens: request.maxOutputTokens,\n        localModelTimeoutMs: request.localModelTimeoutMs')
patch(adapter,"          provider: 'google',", "          provider: decision.selectedTier === 'LEVEL_1_LOCAL_QWEN' ? 'ollama' : 'google',")
router='server/cpaOrganization/cpaModelRouter.ts'
patch(router,"import { GoogleGenAI } from '@google/genai';", "import { GoogleGenAI } from '@google/genai';\nimport { boundedOllamaGenerate } from './boundedOllamaGenerate.js';")
patch(router,'    requireRealModel?: boolean;', '    requireRealModel?: boolean;\n    structuredSchema?: Record<string, any>;\n    maxOutputTokens?: number;\n    localModelTimeoutMs?: number;')
p=Path(router);s=p.read_text();a=s.index('        const controller = new AbortController();');b=s.index('      } catch (err: any) {',a)
s=s[:a]+'''        const data = await boundedOllamaGenerate(`${ollamaUrl}/api/generate`, {
          model: process.env.LOCAL_AI_MODEL || 'qwen3.5:4b-q4_K_M',
          prompt: `${params.systemPrompt ? params.systemPrompt + '\\n\\n' : ''}${promptText}`,
          stream: false,
          ...(params.jsonMode ? { format: 'json', think: false } : {}),
          ...(params.structuredSchema ? { format: params.structuredSchema } : {}),
          keep_alive: '10m',
          options: { temperature: 0, num_ctx: 4096, num_predict: Math.max(64, Math.min(1024, params.maxOutputTokens || 1024)) }
        }, Math.max(1000, Math.min(90000, params.localModelTimeoutMs || 30000)));
        outputText = data.response;
        tokensUsed = typeof data.prompt_eval_count === 'number' && typeof data.eval_count === 'number'
          ? { promptTokens: data.prompt_eval_count, completionTokens: data.eval_count } : undefined;
        costUsd = 0.0;
        actualModel = process.env.LOCAL_AI_MODEL || 'qwen3.5:4b-q4_K_M';
        executionStatus = 'PRIMARY_MODEL_SUCCESS';
'''+s[b:];p.write_text(s)
patch(router,'    let tokensUsed = { promptTokens: 0, completionTokens: 0 };','    let tokensUsed: { promptTokens: number; completionTokens: number } | undefined;')
patch(router,'          tokensUsed = { promptTokens: 350, completionTokens: 180 };',"          tokensUsed = response.usageMetadata && typeof response.usageMetadata.promptTokenCount === 'number' && typeof response.usageMetadata.candidatesTokenCount === 'number' ? { promptTokens: response.usageMetadata.promptTokenCount, completionTokens: response.usageMetadata.candidatesTokenCount } : undefined;")
patch(router,'              tokensUsed = { promptTokens: 250, completionTokens: 120 };',"              tokensUsed = fbResponse.usageMetadata && typeof fbResponse.usageMetadata.promptTokenCount === 'number' && typeof fbResponse.usageMetadata.candidatesTokenCount === 'number' ? { promptTokens: fbResponse.usageMetadata.promptTokenCount, completionTokens: fbResponse.usageMetadata.candidatesTokenCount } : undefined;")
hermes='server/cpaOrganization/hermesJobDispatchService.ts'
patch(hermes,"import fs from 'fs';", "import fs from 'fs';\nimport { executeLexiconBatches, BatchReceipt } from './lexiconBatchExecutionService.js';")
patch(hermes,'        const lexiconReceipt = await executeRealAgentWork({', '''        const lexiconReceipt: BatchReceipt = customConcepts.length > 0 ? await executeLexiconBatches({
          engagementId: params.engagementId, sourceSha256: params.sourceSha256,
          taxonomyVersion, customConcepts, expectedCount: customExts,
          inputObjectReferences: context.inputObjectReferences
        }) : await executeRealAgentWork({''')
patch(hermes,"uncertainties: ['Semantic taxonomy model unavailable; fell back to deterministic mapping requirements'],", "uncertainties: ['Semantic taxonomy model execution blocked; no deterministic substitute accepted'],")
patch(hermes,"          uncertainties: [],\n          findings: [`Semantic taxonomy analysis complete: evaluated ${validOut.customExtensionsEvaluated} custom extensions within ${uniqueConcepts} physical XBRL concepts`],", "          uncertainties: validOut.disposition.includes('DEFINITION_REVIEW_REQUIRED') ? ['Name-based categories are proposals only. Authoritative extension definitions/linkbases and semantic anchors remain unverified.'] : [],\n          findings: [`Taxonomy name review covered ${validOut.customExtensionsEvaluated} supplied custom extensions; this is not authoritative taxonomy anchoring`],")
patch(hermes,'            semanticAlignments: validOut.semanticAlignments,\n            disposition: validOut.disposition', '            semanticAlignments: validOut.semanticAlignments,\n            batchReceiptPaths: lexiconReceipt.batchReceiptPaths || [],\n            modelExecutionIds: lexiconReceipt.modelExecutionIds || [lexiconReceipt.modelExecutionId],\n            authoritativeAnchorsVerified: 0,\n            evaluationScope: \'PROVISIONAL_NAME_CLASSIFICATION\',\n            disposition: validOut.disposition')
patch(hermes,"? 'BALANCED_DEBIT_CREDIT_EQUALITY'", "? 'ACCOUNT_LINES_DISCOVERED_TRIAL_BALANCE_NOT_TESTED'")
patch(hermes,'findings: [`Registrant ticker ${params.ticker} confirmed against CIK directory`]', 'findings: [`Registrant ticker ${params.ticker}; independent CIK directory verification has not been executed`]')
patch(hermes,'registrantIdentityConfirmed: !!params.ticker', "registrantIdentityConfirmed: false,\n            identityVerificationStatus: 'NOT_EXECUTED'")
patch(hermes,"complianceStatus: 'REGISTRANT_CIK_VERIFIED_INDEPENDENCE_NOT_ATTESTED'", "complianceStatus: 'REGISTRANT_IDENTITY_NOT_VERIFIED_INDEPENDENCE_NOT_ATTESTED'")
patch(hermes,"uncertainties: ['Substantive technical accounting review completed via verified model runtime']", "uncertainties: [...(validOut.uncertainties || [])]")
patch(hermes,"systemPrompt: 'You are Hermes, Autonomous Lead Audit Partner and Engagement Director. Establish statutory audit scope, materiality recommendation, risk areas, and orchestration plan for Form 10-K engagement.'", "systemPrompt: 'You are Hermes, a public-filing analysis coordinator. Propose a bounded financial-review scope, materiality recommendation, and risk areas from supplied evidence. This is not an audit engagement. Do not claim controls testing, external confirmations, or an audit opinion. Final professional decisions remain pending authorized human review.'")
patch(hermes,'Establish statutory audit scope and materiality recommendation for', 'Propose a public-filing financial-analysis scope and materiality recommendation for')
cont='server/cpaOrganization/verifiedCustomerContinuationService.ts'
patch(cont,"'v5-disclosure-evidence-ledger'", "'v6-bounded-lexicon-review-package'")
patch(cont,'  systemFindings?: string[];', '  systemFindings?: string[];\n  reviewFindings?: string[];')
patch(cont,"          version: 'v1.0',", "          version: `v6.a${base.jobAttempt}.${factDigestSha256.slice(0,8)}`,")
patch(cont,'            evidenceStatus: f.evidenceStatus\n', "            evidenceStatus: f.evidenceStatus,\n            reportingPeriod: f.reportingPeriod || 'NOT_RECORDED',\n            sourceText: String(f.sourceText || f.source_text || ''),\n            sourceBlockIds: f.sourceBlockIds || (f.sourceBlockId ? [f.sourceBlockId] : [])\n")
patch(cont,'        systemFindings\n', "        systemFindings,\n        reviewFindings: swarm.jobs.flatMap(j => (j.uncertainties || []).map(u => `${j.agentId}: ${u}`))\n")
service='server/cpaOrganization/deliverableArtifactService.ts'
patch(service,"import fs from 'fs';", "import fs from 'fs';\nimport { renderReviewPdf, renderReviewWorkbook, buildReviewCsv } from './reviewPackageRendering.js';")
p=Path(service);s=p.read_text();a=s.index('  public async generateBinaryPdf(');b=s.index('  public generateBinaryXlsx(',a);c=s.index('  public async compileAndRegisterDeliverable(',b)
s=s[:a]+'''  public async generateBinaryPdf(params: any): Promise<{ filename: string; filepath: string; sizeBytes: number; sha256: string }> {
    return renderReviewPdf(params, this.storageDir);
  }

  public generateBinaryXlsx(params: any): { filename: string; filepath: string; sizeBytes: number; sha256: string } {
    return renderReviewWorkbook(params, this.storageDir);
  }

'''+s[c:];p.write_text(s)
patch(service,'      documentId: f.documentId\n', "      documentId: f.documentId,\n      reportingPeriod: f.reportingPeriod || f.period || 'NOT_RECORDED',\n      sourceText: f.sourceText || '',\n      sourceBlockIds: Array.isArray(f.sourceBlockIds) ? f.sourceBlockIds : []\n")
patch(service,'      facts: normalizedFacts,\n      euclidBalance\n', '      facts: normalizedFacts,\n      specialistReview: params.specialistReview,\n      disclosureEvidenceLedger: params.disclosureEvidenceLedger,\n      euclidBalance\n',2)
p=Path(service);s=p.read_text();a=s.index("    const csvHeaders = ['Fact ID,Metric,Label,Value,Currency,Statement,Source Document,Page,Verification'];");b=s.index("    fs.writeFileSync(csvFilepath",a);s=s[:a]+'    const csvContent = buildReviewCsv(normalizedFacts, currency);\n'+s[b:];p.write_text(s)
# Existing static assertion is replaced by the new full-response behavioral deadline test.
test='server/tests/company1VerifiedContinuation.test.ts'
patch(test,"assert(routerSource.includes('controller.abort(), 30000'), 'local model timeout must allow real inference instead of forcing a 2-second deterministic fallback');", "assert(routerSource.includes('boundedOllamaGenerate') && routerSource.includes('num_predict'), 'local model must use a whole-response deadline and finite output budget');")
# Explicit fact-period source contract; existing caller type remains extensible.
patch(service,'      documentId?: string;\n', '      documentId?: string;\n      reportingPeriod?: string;\n      sourceText?: string;\n      sourceBlockIds?: string[];\n')
