import crypto from 'crypto';
import { CanonicalDocumentModel, FileInspectionResult } from './types.js';

function isPdf(inspection: Partial<FileInspectionResult> | any): boolean {
  return String(inspection?.detectedType || '').toLowerCase() === 'pdf' ||
    String(inspection?.mimeType || '').toLowerCase().includes('pdf');
}

function manifests(parsedDoc: Partial<CanonicalDocumentModel> | any): any[] {
  return Array.isArray(parsedDoc?.pageManifests) ? parsedDoc.pageManifests : [];
}

export function getPdfPagesRequiringOcr(
  parsedDoc: Partial<CanonicalDocumentModel> | any,
  inspection: Partial<FileInspectionResult> | any,
): number[] {
  if (!isPdf(inspection)) return [];
  return manifests(parsedDoc)
    .map((page: any, index: number) => ({
      pageNumber: Number(page?.page_number || page?.pageNumber || index + 1),
      native: page?.native_text_available !== false,
    }))
    .filter((page: any) => !page.native && Number.isInteger(page.pageNumber) && page.pageNumber > 0)
    .map((page: any) => page.pageNumber);
}

export function shouldUsePdfOcrFallback(
  parsedDoc: Partial<CanonicalDocumentModel> | any,
  inspection: Partial<FileInspectionResult> | any,
): boolean {
  if (!isPdf(inspection)) return false;
  const pageManifests = manifests(parsedDoc);
  const rawText = String(parsedDoc?.raw_text || '').trim();
  if (!pageManifests.length) return rawText.length === 0;
  const missing = getPdfPagesRequiringOcr(parsedDoc, inspection);
  return missing.length === pageManifests.length && rawText.length === 0;
}

export function shouldUseSelectivePdfOcr(
  parsedDoc: Partial<CanonicalDocumentModel> | any,
  inspection: Partial<FileInspectionResult> | any,
): boolean {
  if (!isPdf(inspection)) return false;
  const pageManifests = manifests(parsedDoc);
  if (pageManifests.length < 2) return false;
  const missing = getPdfPagesRequiringOcr(parsedDoc, inspection);
  return missing.length > 0 && missing.length < pageManifests.length;
}

function sourceIdentity(buffer: Buffer) {
  const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return { sourceSha256, sourceArtifactId: `artifact-pdf-${sourceSha256.slice(0, 24)}` };
}

function nativePageEvidence(page: any, docId: string, sourceSha256: string, sourceArtifactId: string, parserVersion: string) {
  const pageNumber = Number(page.page_number);
  const text = String(page.text || '').trim();
  const provenanceId = `prov-${sourceSha256.slice(0, 16)}-p${pageNumber}-native`;
  const coordinate = {
    coordinateId: `coord-${sourceSha256.slice(0, 16)}-p${pageNumber}-native`,
    sourceArtifactId,
    sourceSha256,
    sourceType: 'PDF',
    pageNumber,
    rawLiteral: text,
    normalizedLiteral: text,
    nativeTextAvailable: true,
    evidenceMode: 'NATIVE_TEXT',
    extractionMethod: 'anydoc:pdf-native-text',
    extractionVersion: parserVersion,
  };
  return {
    block: {
      source_block_id: `SB-${docId}-P${pageNumber}-NATIVE`,
      document_id: docId,
      page_number: pageNumber,
      section: 'Native PDF Text',
      raw_text: text,
      text_content: text,
      evidence_scope: 'PAGE',
      source_format: 'pdf',
      source_artifact_id: sourceArtifactId,
      source_sha256: sourceSha256,
      source_provenance_id: provenanceId,
      source_coordinate: coordinate,
      extraction_method: 'anydoc:pdf-native-text',
      extraction_version: parserVersion,
    },
    provenance: {
      provenanceId,
      lineageKind: 'SOURCE_OBSERVATION',
      materiality: 'UNKNOWN',
      coordinates: [coordinate],
      parentProvenanceIds: [],
      rawLiteral: text,
      normalizedValue: text,
      transformationSteps: [{
        stepId: `step-native-${provenanceId}`,
        operation: 'PARSE',
        inputLiteral: sourceSha256,
        outputLiteral: text,
        engine: 'anydoc',
        engineVersion: parserVersion,
        notes: 'Native PDF text retained without OCR.',
      }],
      verificationState: 'VERIFIED',
      presentationUsages: [],
      createdAt: new Date().toISOString(),
    },
  };
}

function mergeSelectivePdfOcr(
  nativeDoc: any,
  ocrDocs: Array<{ pageNumber: number; document: any }>,
  sourceBuffer: Buffer,
  requestedPages: number[],
): any {
  const { sourceSha256, sourceArtifactId } = sourceIdentity(sourceBuffer);
  const requested = new Set(requestedPages);
  const nativePages = Array.isArray(nativeDoc?.pages) ? nativeDoc.pages : [];
  if (!nativePages.length) throw new Error('SELECTIVE_PDF_NATIVE_PAGE_INVENTORY_MISSING');
  const nativePageNumbers = new Set(nativePages.map((p: any) => Number(p.page_number)));
  for (const pageNumber of requestedPages) {
    if (!nativePageNumbers.has(pageNumber)) throw new Error(`SELECTIVE_PDF_PAGE_OUTSIDE_NATIVE_INVENTORY:${pageNumber}`);
  }

  const ocrByPage = new Map<number, any>();
  for (const row of ocrDocs) {
    const pages = Array.isArray(row.document?.pages) ? row.document.pages : [];
    const page = pages.find((p: any) => Number(p.page_number) === row.pageNumber);
    if (!page || !String(page.text || '').trim()) throw new Error(`SELECTIVE_PDF_OCR_EMPTY_PAGE:${row.pageNumber}`);
    if (pages.some((p: any) => Number(p.page_number) !== row.pageNumber)) {
      throw new Error(`SELECTIVE_PDF_OCR_RETURNED_UNREQUESTED_PAGE:${row.pageNumber}`);
    }
    if (String(row.document?.source?.hash || '').toLowerCase() !== sourceSha256.toLowerCase()) {
      throw new Error(`SELECTIVE_PDF_OCR_SOURCE_HASH_MISMATCH:${row.pageNumber}`);
    }
    const provenances = Array.isArray(row.document?.sourceValueProvenance) ? row.document.sourceValueProvenance : [];
    if (!provenances.length) throw new Error(`SELECTIVE_PDF_OCR_PROVENANCE_MISSING:${row.pageNumber}`);
    for (const provenance of provenances) {
      for (const coordinate of provenance.coordinates || []) {
        if (coordinate?.sourceType !== 'PDF' || Number(coordinate?.pageNumber) !== row.pageNumber ||
            String(coordinate?.sourceSha256 || '').toLowerCase() !== sourceSha256.toLowerCase() ||
            coordinate?.evidenceMode !== 'OCR' || coordinate?.nativeTextAvailable !== false) {
          throw new Error(`SELECTIVE_PDF_OCR_COORDINATE_MISMATCH:${row.pageNumber}`);
        }
      }
    }
    ocrByPage.set(row.pageNumber, row.document);
  }
  if (ocrByPage.size !== requested.size) throw new Error('SELECTIVE_PDF_OCR_PAGE_SET_MISMATCH');

  const mergedPages = nativePages.map((page: any) => {
    const pageNumber = Number(page.page_number);
    if (!requested.has(pageNumber)) return page;
    const ocrPage = ocrByPage.get(pageNumber).pages.find((p: any) => Number(p.page_number) === pageNumber);
    return { ...ocrPage, page_number: pageNumber };
  }).sort((a: any, b: any) => Number(a.page_number) - Number(b.page_number));

  const docId = String(nativeDoc?.document_id || `doc-mixed-pdf-${sourceSha256.slice(0, 16)}`);
  const parserVersion = String(nativeDoc?.parser?.version || '2.0');
  const sourceBlocks: any[] = [];
  const sourceValueProvenance: any[] = [];
  for (const page of mergedPages) {
    const pageNumber = Number(page.page_number);
    if (requested.has(pageNumber)) {
      const ocrDoc = ocrByPage.get(pageNumber);
      sourceBlocks.push(...(ocrDoc.sourceBlocks || ocrDoc.source_blocks || []));
      sourceValueProvenance.push(...(ocrDoc.sourceValueProvenance || []));
    } else if (String(page.text || '').trim()) {
      const nativeEvidence = nativePageEvidence(page, docId, sourceSha256, sourceArtifactId, parserVersion);
      sourceBlocks.push(nativeEvidence.block);
      sourceValueProvenance.push(nativeEvidence.provenance);
    }
  }

  const rawText = mergedPages.map((p: any) => String(p.text || '')).join('\n');
  const pageManifests = mergedPages.map((page: any) => {
    const pageNumber = Number(page.page_number);
    if (!requested.has(pageNumber)) {
      return { page_number: pageNumber, native_text_available: true, ocr_used: false, evidence_mode: 'NATIVE_TEXT' };
    }
    const ocrDoc = ocrByPage.get(pageNumber);
    return {
      page_number: pageNumber,
      native_text_available: false,
      ocr_used: true,
      evidence_mode: 'OCR',
      ocr_engine: ocrDoc?.parser?.selectedEngine,
      ocr_engine_version: ocrDoc?.parser?.selectedEngineVersion,
      ocr_rotation_degrees: Number(ocrDoc?.parser?.selectedRotationDegrees || 0),
    };
  });

  return {
    ...nativeDoc,
    source: { ...(nativeDoc.source || {}), hash: sourceSha256, sourceArtifactId },
    parser: {
      ...(nativeDoc.parser || {}),
      engine: 'anydoc+selective-local-ocr',
      version: '1.0',
      ocr_used: true,
      selectiveOcrPages: [...requestedPages],
      nativeParserEngine: nativeDoc?.parser?.engine || 'anydoc',
      ocrEngines: ocrDocs.map(row => ({
        pageNumber: row.pageNumber,
        engine: row.document?.parser?.selectedEngine,
        version: row.document?.parser?.selectedEngineVersion,
        rotationDegrees: Number(row.document?.parser?.selectedRotationDegrees || 0),
      })),
    },
    metadata: {
      ...(nativeDoc.metadata || {}),
      page_count: mergedPages.length,
      pages: mergedPages.length,
      detectedType: 'mixed_pdf_native_ocr',
      selectiveOcrPageCount: requestedPages.length,
    },
    raw_text: rawText,
    markdown: rawText,
    pages: mergedPages,
    page_count: mergedPages.length,
    pageManifests,
    sourceBlocks,
    source_blocks: sourceBlocks,
    sourceValueProvenance,
    ocrLines: ocrDocs.flatMap(row => row.document?.ocrLines || []),
    ocrEngineResults: ocrDocs.flatMap(row => (row.document?.ocrEngineResults || []).map((attempt: any) => ({ pageNumber: row.pageNumber, ...attempt }))),
    ocrRoutingDecisions: ocrDocs.map(row => ({ pageNumber: row.pageNumber, ...(row.document?.ocrRoutingDecision || {}) })),
    selectivePdfOcr: {
      sourceSha256,
      sourceArtifactId,
      requestedPageNumbers: [...requestedPages],
      nativePageNumbers: mergedPages.map((p: any) => Number(p.page_number)).filter((n: number) => !requested.has(n)),
    },
    sections: mergedPages.filter((page: any) => String(page.text || '').trim()).map((page: any) => ({
      title: requested.has(Number(page.page_number)) ? `OCR Page ${page.page_number}` : `Native PDF Page ${page.page_number}`,
      text: page.text,
      page: Number(page.page_number),
    })),
  };
}

export async function applySelectivePdfOcr(params: {
  nativeDoc: any;
  fileInput: any;
  inspection: any;
  ocrParser: { parse: (fileInput: any, inspection?: any) => Promise<any> };
}): Promise<{ document: any; ocrPageNumbers: number[] }> {
  const ocrPageNumbers = getPdfPagesRequiringOcr(params.nativeDoc, params.inspection);
  const pageManifests = manifests(params.nativeDoc);
  if (!ocrPageNumbers.length || ocrPageNumbers.length === pageManifests.length) {
    return { document: params.nativeDoc, ocrPageNumbers: [] };
  }
  const sourceBuffer = Buffer.isBuffer(params.fileInput?.buffer) ? params.fileInput.buffer : Buffer.alloc(0);
  if (!sourceBuffer.length) throw new Error('SELECTIVE_PDF_SOURCE_BYTES_REQUIRED');
  const ocrDocs: Array<{ pageNumber: number; document: any }> = [];
  for (const pageNumber of ocrPageNumbers) {
    const document = await params.ocrParser.parse(params.fileInput, {
      ...(params.inspection || {}),
      detectedType: 'pdf',
      needsOCR: true,
      requiresParser: 'OCRParser',
      ocrPageNumbers: [pageNumber],
      selectivePdfOcr: true,
    });
    ocrDocs.push({ pageNumber, document });
  }
  return {
    document: mergeSelectivePdfOcr(params.nativeDoc, ocrDocs, sourceBuffer, ocrPageNumbers),
    ocrPageNumbers,
  };
}
