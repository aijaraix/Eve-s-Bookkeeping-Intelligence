export type EvidenceSourceType =
  | 'PDF'
  | 'IMAGE'
  | 'SPREADSHEET'
  | 'CSV'
  | 'HTML'
  | 'IXBRL'
  | 'DOCX'
  | 'EMAIL'
  | 'TEXT'
  | 'OTHER';

export type ProvenanceLineageKind =
  | 'SOURCE_OBSERVATION'
  | 'NORMALIZED_VALUE'
  | 'SEMANTIC_FACT'
  | 'CANONICAL_FACT'
  | 'DERIVED_VALUE';

export type ProvenanceVerificationState =
  | 'PROVISIONAL'
  | 'VERIFIED'
  | 'REVIEW_REQUIRED'
  | 'UNSUPPORTED';

export type ProvenanceMateriality = 'MATERIAL' | 'NON_MATERIAL' | 'UNKNOWN';

export type PresentationOutputType = 'DASHBOARD' | 'REPORT' | 'DOCUMENT' | 'API' | 'OTHER';

export type PresentationVerificationState =
  | 'EXPECTED_PRESENTATION'
  | 'SERVER_REGISTERED_PRESENTATION'
  | 'BROWSER_RENDER_CONFIRMED'
  | 'REPORT_RENDER_CONFIRMED'
  | 'NOT_TESTED';

export interface EvidenceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'PX' | 'POINT' | 'NORMALIZED';
}

export interface SourceCoordinateBase {
  coordinateId: string;
  sourceArtifactId: string;
  sourceSha256: string;
  sourceType: EvidenceSourceType;
  rawLiteral?: string;
  normalizedLiteral?: string;
  confidence?: number;
  extractionMethod?: string;
  extractionVersion?: string;
}

export interface PdfSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'PDF';
  pageNumber: number;
  pageLabel?: string;
  boundingBox?: EvidenceBoundingBox;
  textStart?: number;
  textEnd?: number;
  tableId?: string;
  rowIndex?: number;
  columnIndex?: number;
  nativeTextAvailable?: boolean;
  evidenceMode?: 'NATIVE_TEXT' | 'OCR' | 'VISUAL';
}

export interface ImageSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'IMAGE';
  pageNumber?: number;
  imageWidth: number;
  imageHeight: number;
  boundingBox: EvidenceBoundingBox;
  ocrRegionId?: string;
  ocrLineId?: string;
  ocrTokenId?: string;
  transformId?: string;
}

export interface SpreadsheetSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'SPREADSHEET';
  workbookName?: string;
  sheetName: string;
  cellAddress?: string;
  rangeAddress?: string;
  rowIndex?: number;
  columnIndex?: number;
  formula?: string;
  cachedValue?: string | number | boolean | null;
  numberFormat?: string;
  cellType?: string;
  mergedRange?: string;
  hiddenSheet?: boolean;
  hiddenRow?: boolean;
  hiddenColumn?: boolean;
}

export interface CsvSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'CSV';
  rowIndex: number;
  columnIndex?: number;
  columnName?: string;
}

export interface HtmlSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'HTML';
  domSelector?: string;
  domAnchor?: string;
  byteStart?: number;
  byteEnd?: number;
  textStart?: number;
  textEnd?: number;
}

export interface IxbrlSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'IXBRL';
  xbrlConcept: string;
  xbrlContextRef: string;
  xbrlUnitRef?: string;
  domSelector?: string;
  domAnchor?: string;
  byteStart?: number;
  byteEnd?: number;
}

export interface DocxSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'DOCX';
  paragraphIndex?: number;
  tableIndex?: number;
  rowIndex?: number;
  columnIndex?: number;
  runIndex?: number;
}

export interface EmailSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'EMAIL';
  messageId: string;
  headerName?: string;
  bodyPart?: string;
  attachmentId?: string;
  attachmentFilename?: string;
}

export interface TextSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'TEXT';
  lineStart?: number;
  lineEnd?: number;
  byteStart?: number;
  byteEnd?: number;
}

export interface OtherSourceCoordinate extends SourceCoordinateBase {
  sourceType: 'OTHER';
  locator: string;
}

export type UniversalSourceCoordinate =
  | PdfSourceCoordinate
  | ImageSourceCoordinate
  | SpreadsheetSourceCoordinate
  | CsvSourceCoordinate
  | HtmlSourceCoordinate
  | IxbrlSourceCoordinate
  | DocxSourceCoordinate
  | EmailSourceCoordinate
  | TextSourceCoordinate
  | OtherSourceCoordinate;

export interface ProvenanceTransformationStep {
  stepId: string;
  operation:
    | 'PARSE'
    | 'OCR'
    | 'NORMALIZE'
    | 'CLASSIFY'
    | 'MAP'
    | 'SCALE'
    | 'SIGN_NORMALIZATION'
    | 'FX_CONVERSION'
    | 'FORMULA'
    | 'AGGREGATE'
    | 'ROUND'
    | 'CLARIFICATION'
    | 'OTHER';
  inputProvenanceIds?: string[];
  inputLiteral?: string;
  inputValue?: string | number | boolean | null;
  outputLiteral?: string;
  outputValue?: string | number | boolean | null;
  engine?: string;
  engineVersion?: string;
  formula?: string;
  roundingPolicy?: string;
  notes?: string;
  performedAt?: string;
}

export interface PresentationUsageRef {
  presentationUsageId: string;
  outputType: PresentationOutputType;
  renderId?: string;
  route?: string;
  screen?: string;
  component?: string;
  widget?: string;
  domSelector?: string;
  reportArtifactId?: string;
  reportPageNumber?: number;
  documentArtifactId?: string;
  observedDisplayValue?: string;
  factLineageId?: string;
  canonicalFactId?: string;
  derivedCalculationId?: string;
  presentationState: PresentationVerificationState;
  verifiedAt?: string;
}

export interface SourceValueProvenance {
  provenanceId: string;
  tenantId?: string;
  workspaceId?: string;
  engagementId?: string;
  entityId?: string;
  period?: string;
  currency?: string;
  unit?: string;
  scale?: string;
  lineageKind: ProvenanceLineageKind;
  materiality?: ProvenanceMateriality;

  sourceElementIds?: string[];
  evidenceIds?: string[];
  coordinates: UniversalSourceCoordinate[];
  parentProvenanceIds: string[];

  rawLiteral?: string;
  normalizedValue?: string | number | boolean | null;

  observationIds?: string[];
  semanticFactIds?: string[];
  canonicalFactId?: string;
  clarificationIds?: string[];

  transformationSteps: ProvenanceTransformationStep[];
  verificationState: ProvenanceVerificationState;
  presentationUsages: PresentationUsageRef[];
  createdAt?: string;
}

export interface LineageValidationResult {
  valid: boolean;
  issues: string[];
}

export interface ProvenanceTraceResult {
  rootProvenanceId: string;
  visitedProvenanceIds: string[];
  sourceCoordinates: UniversalSourceCoordinate[];
  unresolvedParentIds: string[];
  cycles: string[][];
}

export interface RenderedLineageCompletenessResult {
  complete: boolean;
  sourceLineageComplete: boolean;
  presentationLineageComplete: boolean;
  sourceCoordinateCount: number;
  unresolvedParentIds: string[];
  cycles: string[][];
  confirmedPresentationUsageIds: string[];
  issues: string[];
}

export type ProvenanceResolver = (provenanceId: string) => SourceValueProvenance | undefined;

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const CELL_PATTERN = /^\$?[A-Z]{1,3}\$?\d+$/i;
const RANGE_PATTERN = /^\$?[A-Z]{1,3}\$?\d+:\$?[A-Z]{1,3}\$?\d+$/i;

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function validateBoundingBox(box: EvidenceBoundingBox, label: string): string[] {
  const issues: string[] = [];
  if (!isFiniteNonNegative(box.x)) issues.push(`${label}.x must be finite and >= 0`);
  if (!isFiniteNonNegative(box.y)) issues.push(`${label}.y must be finite and >= 0`);
  if (!Number.isFinite(box.width) || box.width <= 0) issues.push(`${label}.width must be > 0`);
  if (!Number.isFinite(box.height) || box.height <= 0) issues.push(`${label}.height must be > 0`);
  if (box.unit === 'NORMALIZED') {
    if (box.x > 1 || box.y > 1 || box.width > 1 || box.height > 1) {
      issues.push(`${label} normalized values must be <= 1`);
    }
    if (box.x + box.width > 1.000001 || box.y + box.height > 1.000001) {
      issues.push(`${label} normalized rectangle must fit inside the source surface`);
    }
  }
  return issues;
}

export function validateSourceCoordinate(coordinate: UniversalSourceCoordinate): LineageValidationResult {
  const issues: string[] = [];

  if (!coordinate.coordinateId?.trim()) issues.push('coordinateId is required');
  if (!coordinate.sourceArtifactId?.trim()) issues.push('sourceArtifactId is required');
  if (!SHA256_PATTERN.test(coordinate.sourceSha256 || '')) issues.push('sourceSha256 must be a 64-character SHA-256 hex digest');
  if (coordinate.confidence != null && (!Number.isFinite(coordinate.confidence) || coordinate.confidence < 0 || coordinate.confidence > 1)) {
    issues.push('confidence must be between 0 and 1');
  }

  switch (coordinate.sourceType) {
    case 'PDF':
      if (!Number.isInteger(coordinate.pageNumber) || coordinate.pageNumber < 1) issues.push('PDF pageNumber must be >= 1');
      if (coordinate.boundingBox) issues.push(...validateBoundingBox(coordinate.boundingBox, 'PDF boundingBox'));
      if (coordinate.textStart != null && coordinate.textEnd != null && coordinate.textEnd < coordinate.textStart) {
        issues.push('PDF textEnd must be >= textStart');
      }
      break;
    case 'IMAGE':
      if (!Number.isFinite(coordinate.imageWidth) || coordinate.imageWidth <= 0) issues.push('IMAGE imageWidth must be > 0');
      if (!Number.isFinite(coordinate.imageHeight) || coordinate.imageHeight <= 0) issues.push('IMAGE imageHeight must be > 0');
      issues.push(...validateBoundingBox(coordinate.boundingBox, 'IMAGE boundingBox'));
      break;
    case 'SPREADSHEET':
      if (!coordinate.sheetName?.trim()) issues.push('SPREADSHEET sheetName is required');
      if (!coordinate.cellAddress && !coordinate.rangeAddress) issues.push('SPREADSHEET cellAddress or rangeAddress is required');
      if (coordinate.cellAddress && !CELL_PATTERN.test(coordinate.cellAddress)) issues.push('SPREADSHEET cellAddress is invalid');
      if (coordinate.rangeAddress && !RANGE_PATTERN.test(coordinate.rangeAddress)) issues.push('SPREADSHEET rangeAddress is invalid');
      break;
    case 'CSV':
      if (!Number.isInteger(coordinate.rowIndex) || coordinate.rowIndex < 0) issues.push('CSV rowIndex must be >= 0');
      if (coordinate.columnIndex == null && !coordinate.columnName?.trim()) issues.push('CSV columnIndex or columnName is required');
      break;
    case 'HTML':
      if (!coordinate.domSelector && !coordinate.domAnchor && coordinate.byteStart == null && coordinate.textStart == null) {
        issues.push('HTML coordinate requires a DOM, byte, or text locator');
      }
      break;
    case 'IXBRL':
      if (!coordinate.xbrlConcept?.trim()) issues.push('IXBRL xbrlConcept is required');
      if (!coordinate.xbrlContextRef?.trim()) issues.push('IXBRL xbrlContextRef is required');
      break;
    case 'DOCX':
      if (coordinate.paragraphIndex == null && coordinate.tableIndex == null) {
        issues.push('DOCX coordinate requires paragraphIndex or tableIndex');
      }
      break;
    case 'EMAIL':
      if (!coordinate.messageId?.trim()) issues.push('EMAIL messageId is required');
      if (!coordinate.headerName && !coordinate.bodyPart && !coordinate.attachmentId) {
        issues.push('EMAIL coordinate requires headerName, bodyPart, or attachmentId');
      }
      break;
    case 'TEXT':
      if (coordinate.lineStart == null && coordinate.byteStart == null) {
        issues.push('TEXT coordinate requires lineStart or byteStart');
      }
      break;
    case 'OTHER':
      if (!coordinate.locator?.trim()) issues.push('OTHER locator is required');
      break;
  }

  return { valid: issues.length === 0, issues };
}

export function validateSourceValueProvenance(record: SourceValueProvenance): LineageValidationResult {
  const issues: string[] = [];

  if (!record.provenanceId?.trim()) issues.push('provenanceId is required');
  if (!record.lineageKind) issues.push('lineageKind is required');
  if (!record.verificationState) issues.push('verificationState is required');

  const isDerived = record.lineageKind === 'DERIVED_VALUE';
  const hasDirectEvidence = Array.isArray(record.coordinates) && record.coordinates.length > 0;
  const hasParents = Array.isArray(record.parentProvenanceIds) && record.parentProvenanceIds.length > 0;

  if (!isDerived && !hasDirectEvidence) {
    issues.push(`${record.lineageKind} requires at least one source coordinate`);
  }
  if (isDerived && !hasParents) {
    issues.push('DERIVED_VALUE requires at least one parentProvenanceId');
  }

  for (const coordinate of record.coordinates || []) {
    const result = validateSourceCoordinate(coordinate);
    issues.push(...result.issues.map(issue => `${coordinate.coordinateId || 'coordinate'}: ${issue}`));
  }

  const seenCoordinateIds = new Set<string>();
  for (const coordinate of record.coordinates || []) {
    if (seenCoordinateIds.has(coordinate.coordinateId)) issues.push(`duplicate coordinateId ${coordinate.coordinateId}`);
    seenCoordinateIds.add(coordinate.coordinateId);
  }

  const seenParentIds = new Set<string>();
  for (const parentId of record.parentProvenanceIds || []) {
    if (!parentId?.trim()) issues.push('parentProvenanceIds may not contain blank IDs');
    if (seenParentIds.has(parentId)) issues.push(`duplicate parentProvenanceId ${parentId}`);
    seenParentIds.add(parentId);
  }

  return { valid: issues.length === 0, issues };
}

export function traceProvenanceToSources(
  rootProvenanceId: string,
  resolve: ProvenanceResolver
): ProvenanceTraceResult {
  const visited = new Set<string>();
  const coordinateMap = new Map<string, UniversalSourceCoordinate>();
  const unresolved = new Set<string>();
  const cycles: string[][] = [];

  const visit = (provenanceId: string, path: string[]) => {
    const cycleIndex = path.indexOf(provenanceId);
    if (cycleIndex >= 0) {
      cycles.push([...path.slice(cycleIndex), provenanceId]);
      return;
    }

    const record = resolve(provenanceId);
    if (!record) {
      unresolved.add(provenanceId);
      return;
    }

    visited.add(provenanceId);
    for (const coordinate of record.coordinates || []) {
      coordinateMap.set(coordinate.coordinateId, coordinate);
    }

    for (const parentId of record.parentProvenanceIds || []) {
      visit(parentId, [...path, provenanceId]);
    }
  };

  visit(rootProvenanceId, []);

  return {
    rootProvenanceId,
    visitedProvenanceIds: Array.from(visited),
    sourceCoordinates: Array.from(coordinateMap.values()),
    unresolvedParentIds: Array.from(unresolved),
    cycles
  };
}

export function isPresentationUsageConfirmed(usage: PresentationUsageRef): boolean {
  if (usage.outputType === 'DASHBOARD') return usage.presentationState === 'BROWSER_RENDER_CONFIRMED';
  if (usage.outputType === 'REPORT' || usage.outputType === 'DOCUMENT') {
    return usage.presentationState === 'REPORT_RENDER_CONFIRMED' || usage.presentationState === 'BROWSER_RENDER_CONFIRMED';
  }
  return usage.presentationState === 'BROWSER_RENDER_CONFIRMED' || usage.presentationState === 'REPORT_RENDER_CONFIRMED';
}

export function evaluateRenderedLineageCompleteness(
  rootProvenanceId: string,
  resolve: ProvenanceResolver,
  presentationUsageId?: string
): RenderedLineageCompletenessResult {
  const issues: string[] = [];
  const root = resolve(rootProvenanceId);

  if (!root) {
    return {
      complete: false,
      sourceLineageComplete: false,
      presentationLineageComplete: false,
      sourceCoordinateCount: 0,
      unresolvedParentIds: [rootProvenanceId],
      cycles: [],
      confirmedPresentationUsageIds: [],
      issues: [`root provenance ${rootProvenanceId} could not be resolved`]
    };
  }

  const rootValidation = validateSourceValueProvenance(root);
  issues.push(...rootValidation.issues.map(issue => `root: ${issue}`));

  const trace = traceProvenanceToSources(rootProvenanceId, resolve);
  for (const coordinate of trace.sourceCoordinates) {
    const coordinateValidation = validateSourceCoordinate(coordinate);
    issues.push(...coordinateValidation.issues.map(issue => `${coordinate.coordinateId}: ${issue}`));
  }

  if (trace.sourceCoordinates.length === 0) issues.push('no physical source coordinates resolved');
  if (trace.unresolvedParentIds.length > 0) issues.push(`unresolved parent provenance: ${trace.unresolvedParentIds.join(', ')}`);
  if (trace.cycles.length > 0) issues.push('provenance cycle detected');

  const candidateUsages = presentationUsageId
    ? (root.presentationUsages || []).filter(usage => usage.presentationUsageId === presentationUsageId)
    : (root.presentationUsages || []);

  if (presentationUsageId && candidateUsages.length === 0) {
    issues.push(`presentation usage ${presentationUsageId} not found on root provenance`);
  }

  const confirmedPresentationUsageIds = candidateUsages
    .filter(isPresentationUsageConfirmed)
    .map(usage => usage.presentationUsageId);

  if (candidateUsages.length === 0) issues.push('no presentation usage attached to rendered value');
  if (candidateUsages.length > 0 && confirmedPresentationUsageIds.length === 0) {
    issues.push('presentation exists but has not been physically browser/report confirmed');
  }

  const sourceLineageComplete =
    trace.sourceCoordinates.length > 0 &&
    trace.unresolvedParentIds.length === 0 &&
    trace.cycles.length === 0 &&
    rootValidation.valid;

  const presentationLineageComplete = confirmedPresentationUsageIds.length > 0;

  return {
    complete: sourceLineageComplete && presentationLineageComplete,
    sourceLineageComplete,
    presentationLineageComplete,
    sourceCoordinateCount: trace.sourceCoordinates.length,
    unresolvedParentIds: trace.unresolvedParentIds,
    cycles: trace.cycles,
    confirmedPresentationUsageIds,
    issues
  };
}
