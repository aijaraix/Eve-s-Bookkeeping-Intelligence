import { CanonicalDocumentModel, FileInspectionResult } from './types.js';

function isPdf(inspection: Partial<FileInspectionResult> | any): boolean {
  return String(inspection?.detectedType || '').toLowerCase() === 'pdf' ||
    String(inspection?.mimeType || '').toLowerCase().includes('pdf');
}

export function shouldUsePdfOcrFallback(
  parsedDoc: Partial<CanonicalDocumentModel> | any,
  inspection: Partial<FileInspectionResult> | any,
): boolean {
  if (!isPdf(inspection)) return false;
  const manifests = Array.isArray(parsedDoc?.pageManifests) ? parsedDoc.pageManifests : [];
  const rawText = String(parsedDoc?.raw_text || '').trim();
  if (!manifests.length) return rawText.length === 0;
  const allPagesLackNativeText = manifests.every((page: any) => page?.native_text_available === false);
  return allPagesLackNativeText && rawText.length === 0;
}
