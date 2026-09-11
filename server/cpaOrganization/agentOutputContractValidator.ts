/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — REAL AGENT OUTPUT CONTRACT VALIDATOR (PACKAGE B2.2 / DOC 35)
 * 
 * Enforces strict semantic output contracts on physical model execution responses.
 * 
 * Core Mandates:
 * 1. Model execution success (valid modelExecutionId + provider SUCCESS) is NOT output validation.
 * 2. Real AI Agents (HERMES, ATHENA, CLARA, LEXICON, QUINN) must return structured, validated responses.
 * 3. Plain prose, malformed JSON, missing mandatory fields, invalid field types, and unsupported conclusions
 *    must fail closed with INVALID_MODEL_OUTPUT or JOB_NEEDS_REVIEW.
 * 4. Local successful-looking fallback conclusions (e.g. parsedOutput?.field || 'SUCCESS_DEFAULT') are prohibited.
 * 5. Clara model outputs must reconcile with actual persisted PBC objects (cannot claim more responses than exist).
 * 6. Lexicon semantic conclusions must be separated from deterministic counts; missing semantic conclusions must not pass.
 * 7. Quinn model execution alone cannot grant concurring approval, delivery clearance, or human sign-off.
 * 8. HERMES cannot approve independence; scope established and independence status are strictly separated.
 *    Materiality recommendation is distinguished from deterministic calculation and authorized values.
 */

export type OutputValidationStatus =
  | 'VALIDATED'
  | 'INVALID_MODEL_OUTPUT'
  | 'INVALID_SCHEMA'
  | 'MISSING_MANDATORY_FIELDS'
  | 'RECONCILIATION_FAILED'
  | 'UNSUPPORTED_CONCLUSION'
  | 'NOT_APPLICABLE'
  | 'PENDING';

export interface OutputValidationResult {
  isValid: boolean;
  validationStatus: OutputValidationStatus;
  errors: string[];
  validatedOutput?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Role Contracts
// ---------------------------------------------------------------------------

export interface HermesOutputContract {
  auditScope: string;
  recommendedMaterialityUsd: number;
  riskAreas: string[];
  orchestrationPlan: string | Record<string, any>;
  scopeEstablished?: boolean;
  independenceStatus?: 'NOT_EVALUATED' | 'PENDING_AUTHORIZED_REVIEW' | 'VERIFIED_BY_AUTHORIZED_CONTROL';
}

export interface AthenaOutputContract {
  reviewStatus: string;
  standardsEvaluated: string[];
  asc280SegmentCompliance: string;
  asc606RevenueDisaggregation: string;
  asc842LeaseDisclosures: string;
  technicalSignOff: string;
  evidenceReferences: string[];
  findings: string[];
  uncertainties: string[];
  substantiveFindingsCount?: number;
}

export interface ClaraOutputContract {
  pbcStatus: string;
  requestsReconciled: number;
  responsesReconciled: number;
  summary: string;
  evidenceSufficiency: string;
}

export interface LexiconOutputContract {
  semanticAnchorStatus: string;
  taxonomyVersion: string;
  customExtensionsEvaluated: number;
  semanticAlignments: Array<string | Record<string, any>>;
  disposition: string;
}

export interface QuinnOutputContract {
  significantMattersAssessed: number;
  workpaperAuditTrailIntact: boolean;
  reviewConclusion: string;
  memoText: string;
  consultationsDocumented: boolean;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Validates HERMES model response.
 * Enforces engagement scoping and materiality recommendation without auto-approving firm independence.
 */
export function validateHermesOutput(
  raw: any,
  context?: { reportedAssets?: number }
): OutputValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['HERMES output must be a structured JSON object']
    };
  }

  // Reject plain prose wrapped in fallback textResponse
  if (raw.textResponse && !raw.auditScope && !raw.recommendedMaterialityUsd) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['HERMES returned unstructured plain prose; structured auditScope and recommendedMaterialityUsd required']
    };
  }

  // Mandatory fields
  if (typeof raw.auditScope !== 'string' || raw.auditScope.trim().length === 0) {
    errors.push('Missing mandatory string field: auditScope');
  }

  if (typeof raw.recommendedMaterialityUsd !== 'number' || isNaN(raw.recommendedMaterialityUsd) || raw.recommendedMaterialityUsd <= 0) {
    errors.push('Missing or invalid mandatory positive number field: recommendedMaterialityUsd');
  }

  if (!Array.isArray(raw.riskAreas) || raw.riskAreas.length === 0) {
    errors.push('Missing mandatory non-empty array field: riskAreas');
  } else {
    for (const area of raw.riskAreas) {
      if (typeof area !== 'string' || area.trim().length === 0) {
        errors.push('riskAreas elements must be non-empty strings');
        break;
      }
    }
  }

  if (!raw.orchestrationPlan || (typeof raw.orchestrationPlan !== 'string' && typeof raw.orchestrationPlan !== 'object')) {
    errors.push('Missing mandatory field: orchestrationPlan (must be string or object)');
  }

  // INVARIANT 1: HERMES AI cannot approve independence
  if (raw.scopeAndIndependenceApproved === true || raw.independenceApproved === true) {
    errors.push('INDEPENDENCE_AUTHORITY_VIOLATION: HERMES model execution cannot approve firm independence. Independence requires specifically authorized independence control / human authority.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      validationStatus: errors.some(e => e.startsWith('INDEPENDENCE')) ? 'UNSUPPORTED_CONCLUSION' : 'MISSING_MANDATORY_FIELDS',
      errors
    };
  }

  return {
    isValid: true,
    validationStatus: 'VALIDATED',
    errors: [],
    validatedOutput: {
      auditScope: raw.auditScope.trim(),
      recommendedMaterialityUsd: raw.recommendedMaterialityUsd,
      riskAreas: [...raw.riskAreas],
      orchestrationPlan: raw.orchestrationPlan,
      scopeEstablished: true,
      independenceStatus: 'PENDING_AUTHORIZED_REVIEW',
      independenceApproved: false
    }
  };
}

/**
 * Validates ATHENA model response.
 * Enforces substantive technical-accounting review fields and forbids synthetic pre-certification.
 */
export function validateAthenaOutput(
  raw: any,
  context?: { extractedFactsCount?: number }
): OutputValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['ATHENA output must be a structured JSON object']
    };
  }

  if (raw.textResponse && !raw.standardsEvaluated && !raw.technicalSignOff) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['ATHENA returned unstructured textResponse instead of required technical review fields']
    };
  }

  // Mandatory fields
  if (typeof raw.reviewStatus !== 'string' || raw.reviewStatus.trim().length === 0) {
    errors.push('Missing mandatory string field: reviewStatus');
  }

  if (!Array.isArray(raw.standardsEvaluated) || raw.standardsEvaluated.length === 0) {
    errors.push('Missing mandatory non-empty array field: standardsEvaluated (e.g. ASC 280, ASC 606, ASC 842)');
  }

  if (typeof raw.asc280SegmentCompliance !== 'string' || raw.asc280SegmentCompliance.trim().length === 0) {
    errors.push('Missing mandatory string field: asc280SegmentCompliance');
  }

  if (typeof raw.asc606RevenueDisaggregation !== 'string' || raw.asc606RevenueDisaggregation.trim().length === 0) {
    errors.push('Missing mandatory string field: asc606RevenueDisaggregation');
  }

  if (typeof raw.asc842LeaseDisclosures !== 'string' || raw.asc842LeaseDisclosures.trim().length === 0) {
    errors.push('Missing mandatory string field: asc842LeaseDisclosures');
  }

  if (typeof raw.technicalSignOff !== 'string' || raw.technicalSignOff.trim().length === 0) {
    errors.push('Missing mandatory string field: technicalSignOff');
  }

  if (!Array.isArray(raw.evidenceReferences) || raw.evidenceReferences.length === 0) {
    errors.push('Missing mandatory non-empty array field: evidenceReferences');
  }

  if (!Array.isArray(raw.findings)) {
    errors.push('Missing mandatory array field: findings');
  }

  if (!Array.isArray(raw.uncertainties)) {
    errors.push('Missing mandatory array field: uncertainties');
  }

  // Prohibit premature pre-certified compliance without independent audit sign-off
  if (raw.technicalSignOff === 'STANDARDS_REVIEW_COMPLETE_WITH_EVIDENCE_REFERENCES') {
    errors.push('PREMATURE_SIGN_OFF_PROHIBITED: Athena cannot claim full pre-certified STANDARDS_REVIEW_COMPLETE_WITH_EVIDENCE_REFERENCES without independent audit sign-off.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      validationStatus: errors.some(e => e.includes('PREMATURE')) ? 'UNSUPPORTED_CONCLUSION' : 'MISSING_MANDATORY_FIELDS',
      errors
    };
  }

  return {
    isValid: true,
    validationStatus: 'VALIDATED',
    errors: [],
    validatedOutput: {
      reviewStatus: raw.reviewStatus.trim(),
      standardsEvaluated: [...raw.standardsEvaluated],
      asc280SegmentCompliance: raw.asc280SegmentCompliance.trim(),
      asc606RevenueDisaggregation: raw.asc606RevenueDisaggregation.trim(),
      asc842LeaseDisclosures: raw.asc842LeaseDisclosures.trim(),
      substantiveFindingsCount: typeof raw.substantiveFindingsCount === 'number' ? raw.substantiveFindingsCount : 0,
      technicalSignOff: raw.technicalSignOff.trim(),
      evidenceReferences: [...raw.evidenceReferences],
      findings: [...raw.findings],
      uncertainties: [...raw.uncertainties]
    }
  };
}

/**
 * Validates CLARA model response.
 * Strictly reconciles claimed requests and responses against actual persisted engagement objects.
 */
export function validateClaraOutput(
  raw: any,
  context?: {
    actualPersistedRequestsCount: number;
    actualPersistedResponsesCount: number;
    hasCustomerPbc?: boolean;
  }
): OutputValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['CLARA output must be a structured JSON object']
    };
  }

  if (raw.textResponse && typeof raw.requestsReconciled !== 'number') {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['CLARA returned plain prose; structured PBC reconciliation fields required']
    };
  }

  if (typeof raw.pbcStatus !== 'string' || raw.pbcStatus.trim().length === 0) {
    errors.push('Missing mandatory string field: pbcStatus');
  }

  if (typeof raw.requestsReconciled !== 'number' || raw.requestsReconciled < 0) {
    errors.push('Missing or invalid mandatory non-negative number field: requestsReconciled');
  }

  if (typeof raw.responsesReconciled !== 'number' || raw.responsesReconciled < 0) {
    errors.push('Missing or invalid mandatory non-negative number field: responsesReconciled');
  }

  if (typeof raw.summary !== 'string' || raw.summary.trim().length === 0) {
    errors.push('Missing mandatory string field: summary');
  }

  if (typeof raw.evidenceSufficiency !== 'string' || raw.evidenceSufficiency.trim().length === 0) {
    errors.push('Missing mandatory string field: evidenceSufficiency');
  }

  // PHYSICAL RECONCILIATION INVARIANT:
  // A model cannot state 3 customer responses if the engagement contains 0 customer response objects.
  if (context) {
    if (typeof raw.requestsReconciled === 'number' && raw.requestsReconciled > context.actualPersistedRequestsCount) {
      errors.push(`RECONCILIATION_VIOLATION: Clara claimed ${raw.requestsReconciled} requests reconciled, but engagement contains only ${context.actualPersistedRequestsCount} persisted request objects.`);
    }

    if (typeof raw.responsesReconciled === 'number' && raw.responsesReconciled > context.actualPersistedResponsesCount) {
      errors.push(`RECONCILIATION_VIOLATION: Clara claimed ${raw.responsesReconciled} customer responses reconciled, but engagement contains only ${context.actualPersistedResponsesCount} persisted customer response objects.`);
    }
  }

  if (errors.length > 0) {
    const isReconciliationError = errors.some(e => e.startsWith('RECONCILIATION_VIOLATION'));
    return {
      isValid: false,
      validationStatus: isReconciliationError ? 'RECONCILIATION_FAILED' : 'MISSING_MANDATORY_FIELDS',
      errors
    };
  }

  return {
    isValid: true,
    validationStatus: 'VALIDATED',
    errors: [],
    validatedOutput: {
      pbcStatus: raw.pbcStatus.trim(),
      requestsReconciled: raw.requestsReconciled,
      responsesReconciled: raw.responsesReconciled,
      summary: raw.summary.trim(),
      evidenceSufficiency: raw.evidenceSufficiency.trim()
    }
  };
}

/**
 * Validates LEXICON model response.
 * Separates deterministic taxonomy counts from semantic AI conclusions; forbids default approval.
 */
export function validateLexiconOutput(
  raw: any,
  context?: {
    uniqueConcepts?: number;
    dimContexts?: number;
    customExts?: number;
  }
): OutputValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['LEXICON output must be a structured JSON object']
    };
  }

  if (raw.textResponse && !raw.semanticAnchorStatus && !raw.disposition) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['LEXICON returned plain prose; structured semanticAnchorStatus and disposition required']
    };
  }

  if (typeof raw.semanticAnchorStatus !== 'string' || raw.semanticAnchorStatus.trim().length === 0) {
    errors.push('Missing mandatory string field: semanticAnchorStatus');
  }

  if (typeof raw.taxonomyVersion !== 'string' || raw.taxonomyVersion.trim().length === 0) {
    errors.push('Missing mandatory string field: taxonomyVersion');
  }

  if (typeof raw.customExtensionsEvaluated !== 'number' || raw.customExtensionsEvaluated < 0) {
    errors.push('Missing or invalid mandatory non-negative number field: customExtensionsEvaluated');
  }

  if (!Array.isArray(raw.semanticAlignments)) {
    errors.push('Missing mandatory array field: semanticAlignments');
  }

  if (typeof raw.disposition !== 'string' || raw.disposition.trim().length === 0) {
    errors.push('Missing mandatory string field: disposition');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      validationStatus: 'MISSING_MANDATORY_FIELDS',
      errors
    };
  }

  return {
    isValid: true,
    validationStatus: 'VALIDATED',
    errors: [],
    validatedOutput: {
      semanticAnchorStatus: raw.semanticAnchorStatus.trim(),
      taxonomyVersion: raw.taxonomyVersion.trim(),
      customExtensionsEvaluated: raw.customExtensionsEvaluated,
      semanticAlignments: [...raw.semanticAlignments],
      disposition: raw.disposition.trim()
    }
  };
}

/**
 * Validates QUINN model response.
 * Enforces structured EQCR quality review fields while strictly disallowing AI self-certification.
 */
export function validateQuinnOutput(
  raw: any,
  context?: {
    priorJobsCount?: number;
    variance?: number;
    allPriorSucceeded?: boolean;
  }
): OutputValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['QUINN output must be a structured JSON object']
    };
  }

  if (raw.textResponse && typeof raw.significantMattersAssessed !== 'number' && !raw.reviewConclusion) {
    return {
      isValid: false,
      validationStatus: 'INVALID_SCHEMA',
      errors: ['QUINN returned plain prose; structured reviewConclusion and significantMattersAssessed required']
    };
  }

  if (typeof raw.significantMattersAssessed !== 'number' || raw.significantMattersAssessed < 0) {
    errors.push('Missing or invalid mandatory non-negative number field: significantMattersAssessed');
  }

  if (typeof raw.workpaperAuditTrailIntact !== 'boolean') {
    errors.push('Missing mandatory boolean field: workpaperAuditTrailIntact');
  }

  if (typeof raw.reviewConclusion !== 'string' || raw.reviewConclusion.trim().length === 0) {
    errors.push('Missing mandatory string field: reviewConclusion');
  }

  if (typeof raw.memoText !== 'string' || raw.memoText.trim().length === 0) {
    errors.push('Missing mandatory string field: memoText');
  }

  if (typeof raw.consultationsDocumented !== 'boolean') {
    errors.push('Missing mandatory boolean field: consultationsDocumented');
  }

  // STRICT INVARIANT: QUINN AI model cannot self-certify concurring approval or delivery eligibility
  if (raw.concurringApprovalGranted === true) {
    errors.push('SELF_CERTIFICATION_VIOLATION: QUINN AI model cannot grant concurringApprovalGranted. Human engagement partner sign-off is mandatory.');
  }

  if (raw.deliveryEligible === true) {
    errors.push('SELF_CERTIFICATION_VIOLATION: QUINN AI model cannot grant deliveryEligible. Human engagement partner sign-off is mandatory.');
  }

  if (errors.length > 0) {
    const isSelfCert = errors.some(e => e.startsWith('SELF_CERTIFICATION_VIOLATION'));
    return {
      isValid: false,
      validationStatus: isSelfCert ? 'UNSUPPORTED_CONCLUSION' : 'MISSING_MANDATORY_FIELDS',
      errors
    };
  }

  return {
    isValid: true,
    validationStatus: 'VALIDATED',
    errors: [],
    validatedOutput: {
      significantMattersAssessed: raw.significantMattersAssessed,
      workpaperAuditTrailIntact: raw.workpaperAuditTrailIntact,
      reviewConclusion: raw.reviewConclusion.trim(),
      memoText: raw.memoText.trim(),
      consultationsDocumented: raw.consultationsDocumented,
      concurringApprovalGranted: false,
      deliveryEligible: false,
      humanPartnerSignOffRequired: true,
      humanPartnerSignOffStatus: 'PENDING_HUMAN_PARTNER_SIGNOFF'
    }
  };
}

/**
 * Universal dispatcher for role output contract validation.
 */
export function validateRoleOutputContract(
  agentId: string,
  raw: any,
  context?: any
): OutputValidationResult {
  switch (agentId) {
    case 'HERMES':
      return validateHermesOutput(raw, context);
    case 'ATHENA':
      return validateAthenaOutput(raw, context);
    case 'CLARA':
      return validateClaraOutput(raw, context);
    case 'LEXICON':
      return validateLexiconOutput(raw, context);
    case 'QUINN':
      return validateQuinnOutput(raw, context);
    default:
      return {
        isValid: true,
        validationStatus: 'NOT_APPLICABLE',
        errors: [],
        validatedOutput: raw && typeof raw === 'object' ? raw : {}
      };
  }
}
