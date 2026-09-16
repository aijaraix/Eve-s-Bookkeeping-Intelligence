#!/usr/bin/env python3
from pathlib import Path


def read(path):
    return Path(path).read_text()


def write(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f'PATCH_ANCHOR_MISSING:{path}:{old[:80]!r}')
    if text.count(old) != 1:
        raise SystemExit(f'PATCH_ANCHOR_NOT_UNIQUE:{path}:{text.count(old)}')
    write(path, text.replace(old, new, 1))

# ---------------------------------------------------------------------------
# Local OCR client: bind selective PDF page requests and permit orientation
# retry only when exactly one PDF page is selected.
# ---------------------------------------------------------------------------
replace_once('src/lib/ocr/localOcrClient.ts',
"""export interface LocalOcrInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  sourceSha256: string;
}
""",
"""export interface LocalOcrInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  sourceSha256: string;
  pdfPageNumbers?: number[];
}
""")
replace_once('src/lib/ocr/localOcrClient.ts',
"""          sourceSha256: input.sourceSha256,
          rotationDegrees,
""",
"""          sourceSha256: input.sourceSha256,
          rotationDegrees,
          pdfPageNumbers: input.pdfPageNumbers,
""")
replace_once('src/lib/ocr/localOcrClient.ts',
"""    const isDirectImage = input.mimeType.toLowerCase().startsWith('image/') || /\\.(?:png|jpe?g|webp|tiff?|bmp)$/i.test(input.filename);
    if (finalQualityReasons.length > 0 && this.orientationRetryEnabled && isDirectImage && this.orientationRetryAngles.length > 0) {
""",
"""    const isDirectImage = input.mimeType.toLowerCase().startsWith('image/') || /\\.(?:png|jpe?g|webp|tiff?|bmp)$/i.test(input.filename);
    const isSingleSelectedPdfPage = (input.mimeType.toLowerCase().includes('pdf') || /\\.pdf$/i.test(input.filename)) &&
      Array.isArray(input.pdfPageNumbers) && input.pdfPageNumbers.length === 1;
    const isRotatableSource = isDirectImage || isSingleSelectedPdfPage;
    if (finalQualityReasons.length > 0 && this.orientationRetryEnabled && isRotatableSource && this.orientationRetryAngles.length > 0) {
""")

# OCR parser forwards exact PDF page selection into the service.
replace_once('src/lib/parser/ocrParser.ts',
"""    const sourceArtifactId = `${isPdf ? 'artifact-pdf' : 'artifact-image'}-${sourceSha256.slice(0, 24)}`;
    const docId = `doc-ocr-${sourceSha256.slice(0, 16)}-${Date.now()}`;

    const result: LocalOcrCompositeResult = await this.client.recognize({
      filename: originalName,
      mimeType,
      buffer,
      sourceSha256,
    });
""",
"""    const sourceArtifactId = `${isPdf ? 'artifact-pdf' : 'artifact-image'}-${sourceSha256.slice(0, 24)}`;
    const docId = `doc-ocr-${sourceSha256.slice(0, 16)}-${Date.now()}`;
    const requestedPdfPageNumbers = isPdf && Array.isArray(inspection?.ocrPageNumbers)
      ? Array.from(new Set(inspection.ocrPageNumbers.map(Number).filter((n: number) => Number.isInteger(n) && n > 0))).sort((a: number, b: number) => a - b)
      : undefined;

    const result: LocalOcrCompositeResult = await this.client.recognize({
      filename: originalName,
      mimeType,
      buffer,
      sourceSha256,
      pdfPageNumbers: requestedPdfPageNumbers,
    });
""")
replace_once('src/lib/parser/ocrParser.ts',
"""        ocrRotationDegrees: Number(result.appliedRotationDegrees || 0),
      },
""",
"""        ocrRotationDegrees: Number(result.appliedRotationDegrees || 0),
        ocrRequestedPdfPageNumbers: requestedPdfPageNumbers || [],
      },
""")

# ---------------------------------------------------------------------------
# Page-aware PDF routing and native/OCR merge contract.
# ---------------------------------------------------------------------------
write('src/lib/parser/pdfOcrFallback.ts', r'''import crypto from 'crypto';
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
''')

# ---------------------------------------------------------------------------
# Local OCR service: page selection and single-page PDF orientation retry.
# ---------------------------------------------------------------------------
replace_once('services/local_ocr/app.py', 'APP_VERSION = "1.2.0"', 'APP_VERSION = "1.3.0"')
replace_once('services/local_ocr/app.py',
"""    sourceSha256: str | None = Field(default=None, pattern=r"^[a-fA-F0-9]{64}$")
    rotationDegrees: int = Field(default=0)
""",
"""    sourceSha256: str | None = Field(default=None, pattern=r"^[a-fA-F0-9]{64}$")
    rotationDegrees: int = Field(default=0)
    pdfPageNumbers: list[int] | None = Field(default=None)
""")
app = read('services/local_ocr/app.py')
start = app.index('def render_pdf_pages(')
end = app.index('\ndef get_paddle_model()', start)
render_fn = r'''def normalize_pdf_page_numbers(page_numbers: list[int] | None, page_count: int) -> list[int]:
    if page_numbers is None:
        if page_count > MAX_PDF_PAGES:
            raise HTTPException(status_code=413, detail=f"PDF_PAGE_LIMIT_EXCEEDED:{page_count}>{MAX_PDF_PAGES}")
        return list(range(1, page_count + 1))
    if not page_numbers:
        raise HTTPException(status_code=422, detail="PDF_PAGE_SELECTION_EMPTY")
    selected: list[int] = []
    seen: set[int] = set()
    for raw in page_numbers:
        page_number = int(raw)
        if page_number < 1 or page_number > page_count:
            raise HTTPException(status_code=422, detail=f"PDF_PAGE_SELECTION_OUT_OF_RANGE:{page_number}:{page_count}")
        if page_number not in seen:
            seen.add(page_number)
            selected.append(page_number)
    if len(selected) > MAX_PDF_PAGES:
        raise HTTPException(status_code=413, detail=f"PDF_PAGE_LIMIT_EXCEEDED:{len(selected)}>{MAX_PDF_PAGES}")
    return sorted(selected)


def render_pdf_pages(pdf_path: str, output_dir: str, page_numbers: list[int] | None = None) -> list[dict[str, Any]]:
    import pymupdf

    doc = pymupdf.open(pdf_path)
    try:
        if doc.needs_pass:
            raise HTTPException(status_code=422, detail="PDF_PASSWORD_REQUIRED")
        page_count = len(doc)
        if page_count < 1:
            raise HTTPException(status_code=422, detail="PDF_HAS_NO_PAGES")
        selected = normalize_pdf_page_numbers(page_numbers, page_count)
        matrix = pymupdf.Matrix(PDF_RENDER_DPI / 72.0, PDF_RENDER_DPI / 72.0)
        rendered: list[dict[str, Any]] = []
        for page_number in selected:
            page = doc[page_number - 1]
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            page_path = os.path.join(output_dir, f"page-{page_number:04d}.png")
            pix.save(page_path)
            rendered.append({
                "pageNumber": page_number,
                "path": page_path,
                "width": int(pix.width),
                "height": int(pix.height),
                "sourcePageWidthPoints": float(page.rect.width),
                "sourcePageHeightPoints": float(page.rect.height),
                "rasterDpi": PDF_RENDER_DPI,
            })
        return rendered
    finally:
        doc.close()
'''
write('services/local_ocr/app.py', app[:start] + render_fn + app[end:])
app = read('services/local_ocr/app.py')
start = app.index('@app.post("/v1/ocr")')
recognize_fn = r'''@app.post("/v1/ocr")
def recognize(req: OcrRequest) -> dict[str, Any]:
    payload, digest = decode_request(req)
    source_kind, suffix = ensure_supported_source(req, payload)
    rotation_degrees = normalize_rotation_degrees(req.rotationDegrees)
    selected_pdf_pages = list(dict.fromkeys(req.pdfPageNumbers or []))
    if source_kind == "pdf" and rotation_degrees != 0 and len(selected_pdf_pages) != 1:
        raise HTTPException(status_code=422, detail="OCR_ROTATION_RETRY_PDF_REQUIRES_SINGLE_SELECTED_PAGE")
    if source_kind != "pdf" and selected_pdf_pages:
        raise HTTPException(status_code=422, detail="OCR_PDF_PAGE_SELECTION_REQUIRES_PDF")
    started = time.perf_counter()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as fh:
        fh.write(payload)
        path = fh.name
    try:
        if source_kind == "pdf":
            with tempfile.TemporaryDirectory(prefix="eve-ocr-pdf-") as pages_dir:
                rasterized = render_pdf_pages(path, pages_dir, selected_pdf_pages or None)
                combined_pages: list[dict[str, Any]] = []
                combined_warnings: list[str] = ["PDF_RASTERIZED_FOR_OCR"]
                if selected_pdf_pages:
                    combined_warnings.append("PDF_SELECTIVE_PAGES_FOR_OCR:" + ",".join(str(n) for n in sorted(selected_pdf_pages)))
                engine_metadata: dict[str, Any] | None = None
                for page_meta in rasterized:
                    if rotation_degrees:
                        with Image.open(page_meta["path"]) as source_image:
                            original_width, original_height = source_image.size
                            with tempfile.TemporaryDirectory(prefix="eve-ocr-pdf-rotate-") as rotation_dir:
                                working = source_image.convert("RGB").rotate(
                                    rotation_degrees,
                                    expand=True,
                                    fillcolor=(255, 255, 255),
                                )
                                working_path = os.path.join(rotation_dir, f"rotation-{rotation_degrees}.png")
                                working.save(working_path, "PNG", optimize=True)
                                page_out = ocr_single_image(working_path, working.width, working.height)
                        page_out = remap_result_to_original(page_out, rotation_degrees, original_width, original_height)
                    else:
                        page_out = ocr_single_image(
                            page_meta["path"],
                            page_meta["width"],
                            page_meta["height"],
                        )
                    if engine_metadata is None:
                        engine_metadata = {k: v for k, v in page_out.items() if k not in {"pages", "warnings"}}
                    combined_warnings.extend(page_out.get("warnings") or [])
                    for page_payload in page_out.get("pages") or []:
                        normalized_page = dict(page_payload)
                        normalized_page["pageNumber"] = page_meta["pageNumber"]
                        normalized_page["width"] = page_meta["width"]
                        normalized_page["height"] = page_meta["height"]
                        normalized_page["sourcePageWidthPoints"] = page_meta["sourcePageWidthPoints"]
                        normalized_page["sourcePageHeightPoints"] = page_meta["sourcePageHeightPoints"]
                        normalized_page["rasterDpi"] = page_meta["rasterDpi"]
                        normalized_regions: list[dict[str, Any]] = []
                        for region_index, region in enumerate(normalized_page.get("regions") or [], start=1):
                            normalized_region = dict(region)
                            normalized_region["regionId"] = f"p{page_meta['pageNumber']}-r{region_index}"
                            normalized_regions.append(normalized_region)
                        normalized_page["regions"] = normalized_regions
                        combined_pages.append(normalized_page)
                out = dict(engine_metadata or {})
                out["pages"] = combined_pages
                out["warnings"] = list(dict.fromkeys(combined_warnings))
                out["requestedPdfPageNumbers"] = sorted(selected_pdf_pages) if selected_pdf_pages else [p["pageNumber"] for p in rasterized]
        else:
            with Image.open(path) as image:
                width, height = image.size
                if rotation_degrees:
                    with tempfile.TemporaryDirectory(prefix="eve-ocr-rotate-") as rotation_dir:
                        working = image.convert("RGB").rotate(
                            rotation_degrees,
                            expand=True,
                            fillcolor=(255, 255, 255),
                        )
                        rotated_path = os.path.join(rotation_dir, f"rotation-{rotation_degrees}.png")
                        working.save(rotated_path, "PNG", optimize=True)
                        out = ocr_single_image(rotated_path, working.width, working.height)
                else:
                    out = ocr_single_image(path, width, height)
            out = remap_result_to_original(out, rotation_degrees, width, height)

        if "appliedRotationDegrees" not in out:
            out["appliedRotationDegrees"] = rotation_degrees
        if "coordinateSpace" not in out:
            out["coordinateSpace"] = "ORIGINAL_SOURCE"
        out["sourceSha256"] = digest
        out["elapsedMs"] = int((time.perf_counter() - started) * 1000)
        out["serviceVersion"] = APP_VERSION
        return out
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"OCR_ENGINE_FAILURE:{type(exc).__name__}:{exc}") from exc
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
'''
write('services/local_ocr/app.py', app[:start] + recognize_fn + '\n')

# ---------------------------------------------------------------------------
# Worker and hybrid integration use page-level selective merge when mixed.
# ---------------------------------------------------------------------------
replace_once('server/worker.ts',
'import { shouldUsePdfOcrFallback } from "../src/lib/parser/pdfOcrFallback.js";',
'import { applySelectivePdfOcr, shouldUsePdfOcrFallback, shouldUseSelectivePdfOcr } from "../src/lib/parser/pdfOcrFallback.js";')
replace_once('server/worker.ts',
'    let ocrUsed = parserPath === "OCR";\n',
'    let ocrUsed = parserPath === "OCR";\n    let selectiveOcrPageCount = 0;\n')
replace_once('server/worker.ts',
"""      if (shouldUsePdfOcrFallback(parsedDoc, inspection)) {
        job.status = "OCR";
        job.currentStage = "Native PDF text unavailable; rasterizing pages for local OCR...";
        parsedDoc = await ocrParser.parse(fileInput, {
          ...inspection,
          detectedType: "pdf",
          needsOCR: true,
          requiresParser: "OCRParser",
        });
        ocrUsed = true;
        job.warnings = Array.from(new Set([...(job.warnings || []), "IMAGE_ONLY_PDF_OCR_FALLBACK_USED"]));
      }
""",
"""      if (shouldUsePdfOcrFallback(parsedDoc, inspection)) {
        job.status = "OCR";
        job.currentStage = "Native PDF text unavailable; rasterizing pages for local OCR...";
        parsedDoc = await ocrParser.parse(fileInput, {
          ...inspection,
          detectedType: "pdf",
          needsOCR: true,
          requiresParser: "OCRParser",
        });
        ocrUsed = true;
        job.warnings = Array.from(new Set([...(job.warnings || []), "IMAGE_ONLY_PDF_OCR_FALLBACK_USED"]));
      } else if (shouldUseSelectivePdfOcr(parsedDoc, inspection)) {
        job.status = "OCR";
        job.currentStage = "Native PDF retained; OCR only pages without native text...";
        const selective = await applySelectivePdfOcr({ nativeDoc: parsedDoc, fileInput, inspection, ocrParser });
        parsedDoc = selective.document;
        selectiveOcrPageCount = selective.ocrPageNumbers.length;
        ocrUsed = selectiveOcrPageCount > 0;
        job.warnings = Array.from(new Set([...(job.warnings || []), `MIXED_PDF_SELECTIVE_OCR_USED:PAGES=${selective.ocrPageNumbers.join(',')}`]));
      }
""")
replace_once('server/worker.ts',
'      job.counters.ocrPagesCount = pagesCount;\n',
'      job.counters.ocrPagesCount = selectiveOcrPageCount || pagesCount;\n')

replace_once('server/hybridExtraction/HybridExtractionOrchestrator.ts',
"import { shouldUsePdfOcrFallback } from '../../src/lib/parser/pdfOcrFallback.js';",
"import { applySelectivePdfOcr, shouldUsePdfOcrFallback, shouldUseSelectivePdfOcr } from '../../src/lib/parser/pdfOcrFallback.js';")
replace_once('server/hybridExtraction/HybridExtractionOrchestrator.ts',
"""      if (!isSpreadsheet && shouldUsePdfOcrFallback(parsedDoc, { detectedType: 'pdf', mimeType })) {
        parsedDoc = await this.ocrParser.parse({
          filename: params.originalFilename,
          originalName: params.originalFilename,
          buffer: fileBuffer,
          size: fileBuffer.length,
          mimeType
        }, {
          detectedType: 'pdf',
          mimeType,
          needsOCR: true,
          isMultimodalImage: false,
          requiresParser: 'OCRParser'
        });
      }
""",
"""      const pdfInspection = { detectedType: 'pdf', mimeType, needsOCR: false, isMultimodalImage: false };
      if (!isSpreadsheet && shouldUsePdfOcrFallback(parsedDoc, pdfInspection)) {
        parsedDoc = await this.ocrParser.parse({
          filename: params.originalFilename,
          originalName: params.originalFilename,
          buffer: fileBuffer,
          size: fileBuffer.length,
          mimeType
        }, {
          ...pdfInspection,
          needsOCR: true,
          requiresParser: 'OCRParser'
        });
      } else if (!isSpreadsheet && shouldUseSelectivePdfOcr(parsedDoc, pdfInspection)) {
        const selective = await applySelectivePdfOcr({
          nativeDoc: parsedDoc,
          fileInput: {
            filename: params.originalFilename,
            originalName: params.originalFilename,
            buffer: fileBuffer,
            size: fileBuffer.length,
            mimeType
          },
          inspection: pdfInspection,
          ocrParser: this.ocrParser,
        });
        parsedDoc = selective.document;
      }
""")

# ---------------------------------------------------------------------------
# Deterministic mixed native/scanned PDF fixture.
# ---------------------------------------------------------------------------
write('scripts/academy/generate_mixed_pdf_selective_fixture.py', r'''#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
import hashlib
import json
import os

import pymupdf
from PIL import Image, ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'

out = Path(os.environ.get('MIXED_PDF_OCR_ACCEPTANCE_DIR', '/tmp/eve-mixed-pdf-ocr'))
out.mkdir(parents=True, exist_ok=True)
pdf_path = out / 'mixed-native-scanned.pdf'

image = Image.new('RGB', (1000, 700), 'white')
draw = ImageDraw.Draw(image)
rows = [
    ('SCANNED PAGE TWO', BOLD, 42),
    ('INVOICE SUPPORT', FONT, 34),
    ('SUBTOTAL USD 49.75', FONT, 32),
    ('SALES TAX USD 3.48', FONT, 32),
    ('TOTAL USD 53.23', BOLD, 40),
]
y = 80
for text, font_path, size in rows:
    draw.text((70, y), text, font=ImageFont.truetype(font_path, size), fill='black')
    y += size + 25
# Physical source is intentionally rotated so page-level orientation retry is required.
image = image.rotate(90, expand=True, fillcolor='white')
buf = BytesIO()
image.save(buf, 'PNG', optimize=True)
scan_bytes = buf.getvalue()
(out / 'page-2-scanned-rotated.png').write_bytes(scan_bytes)

doc = pymupdf.open()
p1 = doc.new_page(width=612, height=792)
p1.insert_text((72, 100), 'NATIVE PAGE ONE | COVER | FY 2026 | EVE MIXED PDF', fontsize=14)
p1.insert_text((72, 130), 'Native evidence marker ALPHA-NATIVE-P1', fontsize=12)
p2 = doc.new_page(width=612, height=792)
p2.insert_image(p2.rect, stream=scan_bytes, keep_proportion=True)
p3 = doc.new_page(width=612, height=792)
p3.insert_text((72, 100), 'NATIVE PAGE THREE | APPROVAL NOTES | FY 2026', fontsize=14)
p3.insert_text((72, 130), 'Native evidence marker OMEGA-NATIVE-P3', fontsize=12)
doc.set_metadata({'title':'Eve Mixed Native Scanned PDF','author':'Eve Academy','creator':'Eve Academy','producer':'Eve Academy'})
doc.save(pdf_path, garbage=4, deflate=True, clean=True)
doc.close()

verify = pymupdf.open(pdf_path)
texts = [page.get_text().strip() for page in verify]
verify.close()
assert texts[0] and texts[1] == '' and texts[2]
payload = pdf_path.read_bytes()
manifest = {
    'marker': 'MIXED_PDF_SELECTIVE_FIXTURE=PASS',
    'filename': pdf_path.name,
    'bytes': len(payload),
    'sha256': hashlib.sha256(payload).hexdigest(),
    'nativePages': [1, 3],
    'scannedPages': [2],
    'page2ImageSha256': hashlib.sha256(scan_bytes).hexdigest(),
    'page2PhysicalRotationDegrees': 90,
}
(out / 'fixture-manifest.json').write_text(json.dumps(manifest, indent=2))
print('MIXED_PDF_SELECTIVE_FIXTURE=PASS')
print(json.dumps(manifest))
''')

# ---------------------------------------------------------------------------
# Service rasterization test: full image-only behavior plus selected page +
# orientation remap on the original PDF page.
# ---------------------------------------------------------------------------
write('services/local_ocr/test_pdf_rasterization.py', r'''import base64
import hashlib
import io
import json
import os
import tempfile
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw

import app as ocr_app


def image_bytes(label: str) -> bytes:
    image = Image.new('RGB', (600, 800), 'white')
    draw = ImageDraw.Draw(image)
    draw.text((50, 100), label, fill='black')
    out = io.BytesIO()
    image.save(out, 'PNG')
    return out.getvalue()


with tempfile.TemporaryDirectory() as td:
    root = Path(td)
    pdf_path = root / 'image-only.pdf'
    doc = pymupdf.open()
    for idx in (1, 2, 3):
        page = doc.new_page(width=300, height=400)
        page.insert_image(page.rect, stream=image_bytes(f'PAGE {idx} TOTAL $53.23'))
    doc.set_metadata({})
    doc.save(pdf_path, garbage=4, deflate=True)
    doc.close()

    verify = pymupdf.open(pdf_path)
    assert [page.get_text().strip() for page in verify] == ['', '', '']
    verify.close()

    rendered_dir = root / 'rendered'
    rendered_dir.mkdir()
    rendered = ocr_app.render_pdf_pages(str(pdf_path), str(rendered_dir))
    assert [p['pageNumber'] for p in rendered] == [1, 2, 3]
    selective_dir = root / 'selective'
    selective_dir.mkdir()
    selective = ocr_app.render_pdf_pages(str(pdf_path), str(selective_dir), [2])
    assert [p['pageNumber'] for p in selective] == [2]
    assert selective[0]['rasterDpi'] == ocr_app.PDF_RENDER_DPI

    def fake_paddle(path: str, width: int, height: int):
        return {
            'engine': 'paddleocr',
            'engineVersion': 'test',
            'model': 'fake',
            'pages': [{
                'pageNumber': 1,
                'width': width,
                'height': height,
                'regions': [{
                    'regionId': 'p1-r1',
                    'text': 'TOTAL $53.23',
                    'confidence': 0.99,
                    'boundingBox': {'x': 0.1, 'y': 0.8, 'width': 0.4, 'height': 0.05, 'unit': 'NORMALIZED'},
                    'polygon': [],
                }],
            }],
            'warnings': [],
        }

    original_engine = ocr_app.ENGINE
    original_paddle = ocr_app.paddle_ocr
    ocr_app.ENGINE = 'paddle'
    ocr_app.paddle_ocr = fake_paddle
    try:
        payload = pdf_path.read_bytes()
        digest = hashlib.sha256(payload).hexdigest()
        req = ocr_app.OcrRequest(filename='image-only.pdf', mimeType='application/pdf', dataBase64=base64.b64encode(payload).decode(), sourceSha256=digest)
        result = ocr_app.recognize(req)
        assert result['sourceSha256'] == digest
        assert [p['pageNumber'] for p in result['pages']] == [1, 2, 3]
        assert 'PDF_RASTERIZED_FOR_OCR' in result['warnings']

        selective_req = ocr_app.OcrRequest(filename='image-only.pdf', mimeType='application/pdf', dataBase64=base64.b64encode(payload).decode(), sourceSha256=digest, pdfPageNumbers=[2], rotationDegrees=270)
        selected = ocr_app.recognize(selective_req)
        assert selected['sourceSha256'] == digest
        assert [p['pageNumber'] for p in selected['pages']] == [2]
        assert selected['requestedPdfPageNumbers'] == [2]
        assert selected['appliedRotationDegrees'] == 270
        assert selected['coordinateSpace'] == 'ORIGINAL_SOURCE'
        assert selected['pages'][0]['regions'][0]['regionId'] == 'p2-r1'
        assert any(w.startswith('PDF_SELECTIVE_PAGES_FOR_OCR:2') for w in selected['warnings'])
        assert 'OCR_COORDINATES_REMAPPED_TO_ORIGINAL_SOURCE' in selected['warnings']
    finally:
        ocr_app.ENGINE = original_engine
        ocr_app.paddle_ocr = original_paddle

proof_dir = Path(os.environ.get('MIXED_PDF_OCR_ACCEPTANCE_DIR', '/tmp/eve-mixed-pdf-ocr'))
proof_dir.mkdir(parents=True, exist_ok=True)
(proof_dir / 'service-truth.json').write_text(json.dumps({
    'marker': 'PDF_OCR_SERVICE_SELECTIVE_RASTERIZATION=PASS',
    'appVersion': ocr_app.APP_VERSION,
    'selectivePage': 2,
    'rotationDegrees': 270,
    'coordinateSpace': 'ORIGINAL_SOURCE',
}, indent=2))
print('PDF_OCR_SERVICE_RASTERIZATION_TESTS=PASS')
print('PDF_OCR_SERVICE_SELECTIVE_RASTERIZATION=PASS')
''')

# ---------------------------------------------------------------------------
# TS contract tests.
# ---------------------------------------------------------------------------
write('server/tests/pdfOcrFallback.test.ts', r'''import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getPdfPagesRequiringOcr, shouldUsePdfOcrFallback, shouldUseSelectivePdfOcr } from '../../src/lib/parser/pdfOcrFallback.js';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';

assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [{ page_number:1,native_text_available: false }, { page_number:2,native_text_available: false }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), true);
assert.equal(shouldUsePdfOcrFallback({ raw_text: 'native text', pageManifests: [{ page_number:1,native_text_available: true }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), false);
const mixed={raw_text:'native page',pageManifests:[{page_number:1,native_text_available:true},{page_number:2,native_text_available:false},{page_number:3,native_text_available:true}]};
assert.equal(shouldUsePdfOcrFallback(mixed,{detectedType:'pdf',mimeType:'application/pdf'}),false);
assert.equal(shouldUseSelectivePdfOcr(mixed,{detectedType:'pdf',mimeType:'application/pdf'}),true);
assert.deepEqual(getPdfPagesRequiringOcr(mixed,{detectedType:'pdf',mimeType:'application/pdf'}),[2]);
assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [] }, { detectedType: 'png', mimeType: 'image/png' }), false);

const buffer = Buffer.from('synthetic-image-only-pdf-bytes');
const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
let received:any;
const mockClient = { async recognize(input:any) { received=input; return {engine:'paddleocr' as const,engineVersion:'3.7.0',model:'test-pdf-ocr',sourceSha256,elapsedMs:10,pages:[{pageNumber:2,width:1000,height:1400,regions:[{regionId:'p2-r1',text:'TOTAL $53.23',confidence:0.99,boundingBox:{x:0.1,y:0.8,width:0.4,height:0.05,unit:'NORMALIZED' as const}}]}],routingDecision:{selectedEngine:'paddleocr' as const,fallbackInvoked:false,reasons:[],primaryScore:0.99,fallbackScore:null,orientationRetryInvoked:false,selectedRotationDegrees:0},attempts:[]}; } };
const parser=new OCRParser(mockClient as any);
const doc:any=await parser.parse({filename:'scan.pdf',originalName:'scan.pdf',mimeType:'application/pdf',buffer},{detectedType:'pdf',mimeType:'application/pdf',ocrPageNumbers:[2]});
assert.deepEqual(received.pdfPageNumbers,[2]);
assert.equal(doc.metadata.detectedType,'ocr_pdf');
assert.equal(doc.metadata.ocrRequestedPdfPageNumbers[0],2);
const coord=doc.sourceValueProvenance[0].coordinates[0];
assert.equal(coord.sourceType,'PDF');assert.equal(coord.pageNumber,2);assert.equal(coord.evidenceMode,'OCR');assert.equal(coord.nativeTextAvailable,false);assert.equal(coord.sourceSha256,sourceSha256);
console.log('PDF_OCR_FALLBACK_TESTS=PASS');
''')

write('server/tests/mixedPdfSelectiveOcr.test.ts', r'''import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { AnyDocParser } from '../../src/lib/parser/anydocParser.js';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';
import { LocalOcrClient } from '../../src/lib/ocr/localOcrClient.js';
import { applySelectivePdfOcr, getPdfPagesRequiringOcr, shouldUseSelectivePdfOcr } from '../../src/lib/parser/pdfOcrFallback.js';

const dir=process.env.MIXED_PDF_OCR_ACCEPTANCE_DIR||'/tmp/eve-mixed-pdf-ocr';
const fixture=JSON.parse(fs.readFileSync(path.join(dir,'fixture-manifest.json'),'utf8'));
const buffer=fs.readFileSync(path.join(dir,fixture.filename));
const sha=crypto.createHash('sha256').update(buffer).digest('hex');
assert.equal(sha,fixture.sha256);
const inspection={detectedType:'pdf',mimeType:'application/pdf'};
const fileInput={filename:fixture.filename,originalName:fixture.filename,mimeType:'application/pdf',size:buffer.length,buffer};
const native:any=await new AnyDocParser().parse(fileInput,inspection as any);
assert.deepEqual(native.pageManifests.map((p:any)=>[p.page_number,p.native_text_available]),[[1,true],[2,false],[3,true]]);
assert.deepEqual(getPdfPagesRequiringOcr(native,inspection),[2]);
assert.equal(shouldUseSelectivePdfOcr(native,inspection),true);

const calls:any[]=[];
const fakeFetch:any=async (_url:string,init:any)=>{const body=JSON.parse(init.body);calls.push(body);const rotation=Number(body.rotationDegrees||0);const good=rotation===270;const confidence=good?0.99:0.40;return new Response(JSON.stringify({engine:'paddleocr',engineVersion:'3.7.0',serviceVersion:'test',model:'fake-selective-pdf',sourceSha256:body.sourceSha256,elapsedMs:1,appliedRotationDegrees:rotation,coordinateSpace:'ORIGINAL_SOURCE',pages:[{pageNumber:body.pdfPageNumbers[0],width:1200,height:900,regions:[{regionId:`p${body.pdfPageNumbers[0]}-r1`,text:good?'SCANNED PAGE TWO TOTAL USD 53.23':'SCANNED PAGE TWO TOTAL USD 53.23',confidence,boundingBox:{x:0.15,y:0.20,width:0.60,height:0.08,unit:'NORMALIZED'}}]}],warnings:[]}),{status:200,headers:{'content-type':'application/json'}});};
const client=new LocalOcrClient({primaryUrl:'http://paddle.test',fallbackUrl:'',fetchImpl:fakeFetch,orientationRetryEnabled:true,orientationRetryAngles:[90,270,180],primaryAverageConfidenceFloor:0.90,materialConfidenceFloor:0.85});
const selective=await applySelectivePdfOcr({nativeDoc:native,fileInput,inspection,ocrParser:new OCRParser(client)});
const doc:any=selective.document;
assert.deepEqual(selective.ocrPageNumbers,[2]);
assert.ok(calls.length>=4,'expected initial OCR plus bounded orientation retries');
assert.ok(calls.every(c=>JSON.stringify(c.pdfPageNumbers)==='[2]'),'native pages must never be sent to OCR');
assert.equal(doc.parser.engine,'anydoc+selective-local-ocr');
assert.deepEqual(doc.parser.selectiveOcrPages,[2]);
assert.equal(doc.pageManifests[0].evidence_mode,'NATIVE_TEXT');
assert.equal(doc.pageManifests[1].evidence_mode,'OCR');
assert.equal(doc.pageManifests[1].ocr_rotation_degrees,270);
assert.equal(doc.pageManifests[2].evidence_mode,'NATIVE_TEXT');
assert.match(doc.pages[0].text,/ALPHA-NATIVE-P1/);assert.match(doc.pages[1].text,/TOTAL USD 53\.23/);assert.match(doc.pages[2].text,/OMEGA-NATIVE-P3/);
assert.match(doc.raw_text,/ALPHA-NATIVE-P1/);assert.match(doc.raw_text,/TOTAL USD 53\.23/);assert.match(doc.raw_text,/OMEGA-NATIVE-P3/);
const coords=(doc.sourceValueProvenance||[]).flatMap((p:any)=>p.coordinates||[]);
const nativeCoords=coords.filter((c:any)=>c.evidenceMode==='NATIVE_TEXT');const ocrCoords=coords.filter((c:any)=>c.evidenceMode==='OCR');
assert.deepEqual(nativeCoords.map((c:any)=>c.pageNumber).sort(),[1,3]);assert.ok(ocrCoords.length>=1);assert.ok(ocrCoords.every((c:any)=>c.pageNumber===2));assert.ok(coords.every((c:any)=>c.sourceSha256===sha));assert.ok(coords.every((c:any)=>c.sourceArtifactId===`artifact-pdf-${sha.slice(0,24)}`));
const proof={marker:'P2_MIXED_PDF_SELECTIVE_OCR_SOURCE_TRUTH=PASS',sourceSha256:sha,nativePages:[1,3],ocrPages:[2],selectedRotationDegrees:doc.pageManifests[1].ocr_rotation_degrees,ocrRequestPageSelections:calls.map(c=>c.pdfPageNumbers),pageModes:doc.pageManifests.map((p:any)=>({pageNumber:p.page_number,mode:p.evidence_mode,ocrUsed:p.ocr_used,rotation:p.ocr_rotation_degrees||0})),coordinateCount:coords.length};
fs.writeFileSync(path.join(dir,'source-truth.json'),JSON.stringify(proof,null,2));
console.log('P2_MIXED_PDF_SELECTIVE_OCR_SOURCE_TRUTH=PASS');
''')

write('server/tests/mixedPdfSelectiveOcrFailClosed.test.ts', r'''import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {AnyDocParser} from '../../src/lib/parser/anydocParser.js';import {OCRParser} from '../../src/lib/parser/ocrParser.js';import {LocalOcrClient,LocalOcrInsufficientQualityError} from '../../src/lib/ocr/localOcrClient.js';import {applySelectivePdfOcr} from '../../src/lib/parser/pdfOcrFallback.js';
const dir=process.env.MIXED_PDF_OCR_ACCEPTANCE_DIR||'/tmp/eve-mixed-pdf-ocr';const manifest=JSON.parse(fs.readFileSync(path.join(dir,'fixture-manifest.json'),'utf8'));const buffer=fs.readFileSync(path.join(dir,manifest.filename));const inspection={detectedType:'pdf',mimeType:'application/pdf'};const fileInput={filename:manifest.filename,originalName:manifest.filename,mimeType:'application/pdf',size:buffer.length,buffer};const native:any=await new AnyDocParser().parse(fileInput,inspection as any);const calls:any[]=[];const fakeFetch:any=async(_url:string,init:any)=>{const body=JSON.parse(init.body);calls.push(body);return new Response(JSON.stringify({engine:'paddleocr',engineVersion:'3.7.0',model:'always-poor',sourceSha256:body.sourceSha256,elapsedMs:1,appliedRotationDegrees:Number(body.rotationDegrees||0),coordinateSpace:'ORIGINAL_SOURCE',pages:[{pageNumber:body.pdfPageNumbers[0],width:1200,height:900,regions:[{regionId:'poor',text:'TOTAL USD 53.23',confidence:0.30,boundingBox:{x:0.1,y:0.2,width:0.5,height:0.05,unit:'NORMALIZED'}}]}],warnings:[]}),{status:200});};const client=new LocalOcrClient({primaryUrl:'http://paddle.test',fallbackUrl:'',fetchImpl:fakeFetch,orientationRetryEnabled:true,orientationRetryAngles:[90,270,180]});let caught:any;try{await applySelectivePdfOcr({nativeDoc:native,fileInput,inspection,ocrParser:new OCRParser(client)});}catch(e){caught=e;}assert.ok(caught instanceof LocalOcrInsufficientQualityError);assert.equal(caught.code,'LOCAL_OCR_INSUFFICIENT_QUALITY');assert.ok(calls.every(c=>JSON.stringify(c.pdfPageNumbers)==='[2]'));assert.deepEqual([...new Set(calls.map(c=>Number(c.rotationDegrees||0)))].sort((a,b)=>a-b),[0,90,180,270]);const proof={marker:'P2_MIXED_PDF_SELECTIVE_OCR_FAIL_CLOSED=PASS',errorCode:caught.code,reasons:caught.diagnostics.reasons,pageSelections:calls.map(c=>c.pdfPageNumbers),rotations:calls.map(c=>c.rotationDegrees||0)};fs.writeFileSync(path.join(dir,'fail-closed.json'),JSON.stringify(proof,null,2));console.log('P2_MIXED_PDF_SELECTIVE_OCR_FAIL_CLOSED=PASS');
''')

write('server/tests/pdfOcrIntegrationWiring.test.ts', r'''import assert from 'node:assert/strict';import fs from 'node:fs';const worker=fs.readFileSync('server/worker.ts','utf8');const hybrid=fs.readFileSync('server/hybridExtraction/HybridExtractionOrchestrator.ts','utf8');const app=fs.readFileSync('services/local_ocr/app.py','utf8');const client=fs.readFileSync('src/lib/ocr/localOcrClient.ts','utf8');for(const source of [worker,hybrid]){assert.ok(source.includes('shouldUsePdfOcrFallback'));assert.ok(source.includes('shouldUseSelectivePdfOcr'));assert.ok(source.includes('applySelectivePdfOcr'));assert.ok(source.includes('OCRParser'));}assert.ok(worker.includes('MIXED_PDF_SELECTIVE_OCR_USED'));assert.ok(app.includes('pdfPageNumbers'));assert.ok(app.includes('PDF_SELECTIVE_PAGES_FOR_OCR'));assert.ok(app.includes('OCR_ROTATION_RETRY_PDF_REQUIRES_SINGLE_SELECTED_PAGE'));assert.ok(client.includes('pdfPageNumbers'));assert.ok(client.includes('isSingleSelectedPdfPage'));console.log('PDF_OCR_INTEGRATION_WIRING_TESTS=PASS');
''')

write('server/tests/imageOnlyPdfCurriculumAcceptance.test.ts', r'''import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {academyMinervaLab} from '../cpaOrganization/academyMinervaLab.js';const dir=process.env.MIXED_PDF_OCR_ACCEPTANCE_DIR||'/tmp/eve-mixed-pdf-ocr';const source=JSON.parse(fs.readFileSync(path.join(dir,'source-truth.json'),'utf8'));const failClosed=JSON.parse(fs.readFileSync(path.join(dir,'fail-closed.json'),'utf8'));const service=JSON.parse(fs.readFileSync(path.join(dir,'service-truth.json'),'utf8'));assert.equal(source.marker,'P2_MIXED_PDF_SELECTIVE_OCR_SOURCE_TRUTH=PASS');assert.equal(failClosed.marker,'P2_MIXED_PDF_SELECTIVE_OCR_FAIL_CLOSED=PASS');assert.equal(service.marker,'PDF_OCR_SERVICE_SELECTIVE_RASTERIZATION=PASS');const c=academyMinervaLab.getFiveDimensionCurriculumCases().find(x=>x.caseId==='CURR-OCR-IMAGE-ONLY-PDF')!;assert.equal(c.fixtureStatus,'CONTRACT_READY');assert.deepEqual(c.targetDimensions,['SOURCE_COVERAGE','SEMANTIC_UNDERSTANDING','ACCOUNTING_ACCURACY']);assert.deepEqual(source.nativePages,[1,3]);assert.deepEqual(source.ocrPages,[2]);assert.equal(source.selectedRotationDegrees,270);assert.equal(failClosed.errorCode,'LOCAL_OCR_INSUFFICIENT_QUALITY');const result={marker:'P2_PDF_OCR_CURRICULUM_TARGET_DIMENSIONS=PASS',caseId:c.caseId,targetDimensions:{SOURCE_COVERAGE:'PASS',SEMANTIC_UNDERSTANDING:'PASS',ACCOUNTING_ACCURACY:'PASS',PRODUCT_TRUTH:'NOT_TESTED',DELIVERABLE_TRUTH:'NOT_TESTED'},targetPassed:3,notTested:2,notes:['Native pages remain native and SHA-bound.','Only scanned page 2 is OCR-routed.','Single scanned PDF page may use bounded orientation retry with coordinates remapped to original PDF page space.','Unreadable selected page fails closed.']};fs.writeFileSync(path.join(dir,'curriculum-result.json'),JSON.stringify(result,null,2));console.log('P2_PDF_OCR_CURRICULUM_TARGET_DIMENSIONS=PASS');
''')

# Curriculum status and safeguards; this remains a three-target-dimension case.
replace_once('server/cpaOrganization/academyMinervaLab.ts',
"""      caseSpec(
        'CURR-OCR-IMAGE-ONLY-PDF',
        'Image-only PDF requiring page-aware OCR',
        'IMAGE_OCR',
        ['PDF', 'IMAGE_ONLY_PDF'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY'],
        [
          'Detect that native text is absent and route pages through the local OCR path.',
          'Preserve exact PDF page plus OCR region coordinates for every promoted observation.',
          'Do not silently treat missing OCR output as a complete source.'
        ],
        'PHYSICAL_FIXTURE_REQUIRED',
        ['server/tests/ocrParserEvidence.test.ts', 'server/tests/universalSourceEvidenceContract.test.ts']
      ),
""",
"""      caseSpec(
        'CURR-OCR-IMAGE-ONLY-PDF',
        'Page-aware PDF OCR including image-only and mixed native/scanned documents',
        'IMAGE_OCR',
        ['PDF', 'IMAGE_ONLY_PDF', 'MIXED_NATIVE_SCANNED_PDF'],
        ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY'],
        [
          'Detect image-only PDFs and route pages through the local OCR path without inventing native text.',
          'For mixed PDFs, preserve native-text pages and OCR only pages whose native-text inventory is absent.',
          'Preserve the original PDF SHA and physical page number for both native-text and OCR observations.',
          'Allow bounded orientation retry only on an individually selected scanned PDF page and remap OCR coordinates to original PDF page space.',
          'Do not silently treat missing or low-quality OCR output as a complete source; the affected scanned page must fail closed.'
        ],
        'CONTRACT_READY',
        ['services/local_ocr/test_pdf_rasterization.py', 'server/tests/pdfOcrFallback.test.ts', 'server/tests/mixedPdfSelectiveOcr.test.ts', 'server/tests/mixedPdfSelectiveOcrFailClosed.test.ts', 'server/tests/pdfOcrIntegrationWiring.test.ts', 'server/tests/imageOnlyPdfCurriculumAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_MIXED_PDF_SELECTIVE_OCR_ACCEPTANCE.md']
      ),
""")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts','assert.equal(coverage.contractReadyCases, 12);\nassert.equal(coverage.physicalFixturePendingCases, 8);','assert.equal(coverage.contractReadyCases, 13);\nassert.equal(coverage.physicalFixturePendingCases, 7);')
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',
"assert.ok(find('CURR-OCR-SCANNED-INVOICE').expectedSafeguards.join(' ').includes('payment remains BLOCKED'));\n",
"assert.ok(find('CURR-OCR-SCANNED-INVOICE').expectedSafeguards.join(' ').includes('payment remains BLOCKED'));\nassert.equal(find('CURR-OCR-IMAGE-ONLY-PDF').fixtureStatus, 'CONTRACT_READY');\nassert.deepEqual(find('CURR-OCR-IMAGE-ONLY-PDF').targetDimensions, ['SOURCE_COVERAGE', 'SEMANTIC_UNDERSTANDING', 'ACCOUNTING_ACCURACY']);\nassert.ok(find('CURR-OCR-IMAGE-ONLY-PDF').expectedSafeguards.join(' ').includes('mixed PDFs'));\nassert.ok(find('CURR-OCR-IMAGE-ONLY-PDF').validationRefs.includes('server/tests/mixedPdfSelectiveOcr.test.ts'));\n")

print('MIXED_PDF_SELECTIVE_OCR_PATCH_APPLIED')
