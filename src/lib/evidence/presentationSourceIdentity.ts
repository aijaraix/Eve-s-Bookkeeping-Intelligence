export interface PresentationSourceIdentityValidation {
  valid: boolean;
  issues: string[];
}

function nonblank(value: unknown): boolean { return Boolean(String(value ?? '').trim()); }
function sha(value: unknown): string { return String(value ?? '').trim().toLowerCase(); }

export function validatePresentationSourceIdentity(fact: any): PresentationSourceIdentityValidation {
  const issues: string[] = [];
  const coordinates = Array.isArray(fact?.sourceCoordinates) && fact.sourceCoordinates.length
    ? fact.sourceCoordinates
    : Array.isArray(fact?.provenanceCoordinates) && fact.provenanceCoordinates.length
      ? fact.provenanceCoordinates
      : fact?.sourceCoordinate ? [fact.sourceCoordinate]
      : fact?.provenance?.sourceCoordinate ? [fact.provenance.sourceCoordinate]
      : [];
  if (!coordinates.length) return { valid: false, issues: ['SOURCE_COORDINATE_MISSING'] };

  const topSha = sha(fact?.sourceSha256 || fact?.provenance?.sourceSha256);
  const topArtifact = String(fact?.sourceArtifactId || fact?.provenance?.sourceArtifactId || '').trim();
  const provenanceId = String(fact?.sourceProvenanceId || fact?.provenance?.sourceProvenanceId || '').trim();
  if (!provenanceId) issues.push('SOURCE_PROVENANCE_ID_MISSING');

  for (const coordinate of coordinates) {
    const coordinateSha = sha(coordinate?.sourceSha256);
    const coordinateArtifact = String(coordinate?.sourceArtifactId || '').trim();
    if (!nonblank(coordinate?.coordinateId)) issues.push('SOURCE_COORDINATE_ID_MISSING');
    if (!/^[a-f0-9]{64}$/.test(coordinateSha)) issues.push('SOURCE_COORDINATE_SHA_INVALID');
    if (!coordinateArtifact) issues.push('SOURCE_COORDINATE_ARTIFACT_MISSING');
    if (topSha && coordinateSha && topSha !== coordinateSha) issues.push('SOURCE_SHA_DOES_NOT_MATCH_COORDINATE_SHA');
    if (topArtifact && coordinateArtifact && topArtifact !== coordinateArtifact) issues.push('SOURCE_ARTIFACT_DOES_NOT_MATCH_COORDINATE_ARTIFACT');
    if (coordinate?.sourceType === 'SPREADSHEET') {
      if (!nonblank(coordinate?.sheetName)) issues.push('SPREADSHEET_SHEET_MISSING');
      if (!nonblank(coordinate?.cellAddress) && !nonblank(coordinate?.rangeAddress)) issues.push('SPREADSHEET_CELL_OR_RANGE_MISSING');
    } else if (coordinate?.sourceType === 'IMAGE') {
      if (!(Number(coordinate?.imageWidth) > 0) || !(Number(coordinate?.imageHeight) > 0)) issues.push('IMAGE_DIMENSIONS_MISSING');
      const box = coordinate?.boundingBox;
      if (!box || !['NORMALIZED','PX','POINT'].includes(String(box.unit || ''))) issues.push('IMAGE_BOUNDING_BOX_MISSING');
    } else if (coordinate?.sourceType === 'PDF') {
      if (!(Number(coordinate?.pageNumber) > 0)) issues.push('PDF_PAGE_MISSING');
    } else if (coordinate?.sourceType === 'CSV') {
      if (!(Number(coordinate?.rowIndex) > 0)) issues.push('CSV_ROW_MISSING');
    }
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}
