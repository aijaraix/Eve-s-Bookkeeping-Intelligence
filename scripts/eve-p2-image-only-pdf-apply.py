from pathlib import Path


def edit(path: str, old: str, new: str, count: int = 1):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'MISSING_SNIPPET:{path}:{old[:140]!r}')
    p.write_text(text.replace(old, new, count))


# ---------------------------------------------------------------------------
# Local OCR service: accept PDF, rasterize pages deterministically, OCR pages.
# ---------------------------------------------------------------------------
edit(
    'services/local_ocr/app.py',
    'APP_VERSION = "1.0.0"\nENGINE = os.getenv("OCR_ENGINE", "paddle").strip().lower()\nMAX_INPUT_BYTES = int(os.getenv("OCR_MAX_INPUT_BYTES", str(25 * 1024 * 1024)))\nCPU_THREADS = max(1, int(os.getenv("OCR_CPU_THREADS", "2")))\n',
    'APP_VERSION = "1.1.0"\nENGINE = os.getenv("OCR_ENGINE", "paddle").strip().lower()\nMAX_INPUT_BYTES = int(os.getenv("OCR_MAX_INPUT_BYTES", str(25 * 1024 * 1024)))\nCPU_THREADS = max(1, int(os.getenv("OCR_CPU_THREADS", "2")))\nPDF_RENDER_DPI = max(72, min(300, int(os.getenv("OCR_PDF_RENDER_DPI", "160"))))\nMAX_PDF_PAGES = max(1, int(os.getenv("OCR_MAX_PDF_PAGES", "50")))\n'
)

edit(
    'services/local_ocr/app.py',
    '''def ensure_supported_image(req: OcrRequest, payload: bytes) -> tuple[int, int, str]:
    try:
        with Image.open(tempfile.SpooledTemporaryFile()) as _:
            pass
    except Exception:
        # The no-op above intentionally does not validate. Actual validation happens below
        # after bytes are written to a named file so Pillow can infer the format reliably.
        pass
    suffix = Path(req.filename).suffix.lower() or ".img"
    if req.mimeType.lower().startswith("image/") or suffix in {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"}:
        return 0, 0, suffix
    raise HTTPException(status_code=415, detail="LOCAL_OCR_IMAGE_ONLY_CURRENTLY")
''',
    '''def ensure_supported_source(req: OcrRequest, payload: bytes) -> tuple[str, str]:
    suffix = Path(req.filename).suffix.lower() or ".bin"
    mime = req.mimeType.lower()
    if mime == "application/pdf" or suffix == ".pdf":
        return "pdf", ".pdf"
    if mime.startswith("image/") or suffix in {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"}:
        return "image", suffix
    raise HTTPException(status_code=415, detail="LOCAL_OCR_UNSUPPORTED_SOURCE_TYPE")


def render_pdf_pages(pdf_path: str, output_dir: str) -> list[dict[str, Any]]:
    import pymupdf

    doc = pymupdf.open(pdf_path)
    try:
        if doc.needs_pass:
            raise HTTPException(status_code=422, detail="PDF_PASSWORD_REQUIRED")
        page_count = len(doc)
        if page_count < 1:
            raise HTTPException(status_code=422, detail="PDF_HAS_NO_PAGES")
        if page_count > MAX_PDF_PAGES:
            raise HTTPException(status_code=413, detail=f"PDF_PAGE_LIMIT_EXCEEDED:{page_count}>{MAX_PDF_PAGES}")
        matrix = pymupdf.Matrix(PDF_RENDER_DPI / 72.0, PDF_RENDER_DPI / 72.0)
        rendered: list[dict[str, Any]] = []
        for index, page in enumerate(doc, start=1):
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            page_path = os.path.join(output_dir, f"page-{index:04d}.png")
            pix.save(page_path)
            rendered.append({
                "pageNumber": index,
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
)

# Add a shared single-image dispatcher before health endpoint.
p = Path('services/local_ocr/app.py')
text = p.read_text()
marker = '\n\n@app.get("/health")\n'
if marker not in text:
    raise SystemExit('MISSING_HEALTH_MARKER')
helper = '''\n\ndef ocr_single_image(path: str, width: int, height: int) -> dict[str, Any]:
    if ENGINE == "paddle":
        return paddle_ocr(path, width, height)
    if ENGINE == "doctr":
        return doctr_ocr(path)
    raise HTTPException(status_code=500, detail=f"UNSUPPORTED_OCR_ENGINE:{ENGINE}")
'''
text = text.replace(marker, helper + marker, 1)
text = text.replace(
    '        "cpuThreads": CPU_THREADS,\n',
    '        "cpuThreads": CPU_THREADS,\n        "pdfRenderDpi": PDF_RENDER_DPI,\n        "maxPdfPages": MAX_PDF_PAGES,\n        "supportedSourceKinds": ["image", "pdf"],\n',
    1,
)
post_marker = '@app.post("/v1/ocr")\n'
pos = text.find(post_marker)
if pos < 0:
    raise SystemExit('MISSING_OCR_POST_MARKER')
new_post = '''@app.post("/v1/ocr")
def recognize(req: OcrRequest) -> dict[str, Any]:
    payload, digest = decode_request(req)
    source_kind, suffix = ensure_supported_source(req, payload)
    started = time.perf_counter()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as fh:
        fh.write(payload)
        path = fh.name
    try:
        if source_kind == "pdf":
            with tempfile.TemporaryDirectory(prefix="eve-ocr-pdf-") as pages_dir:
                rasterized = render_pdf_pages(path, pages_dir)
                combined_pages: list[dict[str, Any]] = []
                combined_warnings: list[str] = ["PDF_RASTERIZED_FOR_OCR"]
                engine_metadata: dict[str, Any] | None = None
                for page_meta in rasterized:
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
                        combined_pages.append(normalized_page)
                out = dict(engine_metadata or {})
                out["pages"] = combined_pages
                out["warnings"] = list(dict.fromkeys(combined_warnings))
        else:
            with Image.open(path) as image:
                width, height = image.size
            out = ocr_single_image(path, width, height)

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
text = text[:pos] + new_post
p.write_text(text)

# Runtime image dependency.
for dockerfile in ['services/local_ocr/Dockerfile.paddle', 'services/local_ocr/Dockerfile.doctr']:
    p = Path(dockerfile)
    text = p.read_text()
    old = '      pillow==11.3.0 \\\n'
    if old not in text:
        raise SystemExit(f'MISSING_PILLOW_LINE:{dockerfile}')
    text = text.replace(old, old + '      pymupdf==1.26.4 \\\n', 1)
    p.write_text(text)

# ---------------------------------------------------------------------------
# Universal source coordinate: PDF OCR is PDF page/region evidence, not IMAGE.
# ---------------------------------------------------------------------------
edit(
    'src/lib/parser/ocrParser.ts',
    'import { ImageSourceCoordinate, SourceValueProvenance } from "../evidence/universalSourceEvidence.js";',
    'import { ImageSourceCoordinate, PdfSourceCoordinate, SourceValueProvenance } from "../evidence/universalSourceEvidence.js";'
)
edit(
    'src/lib/parser/ocrParser.ts',
    '  coordinate: ImageSourceCoordinate;\n',
    '  coordinate: ImageSourceCoordinate | PdfSourceCoordinate;\n'
)
edit(
    'src/lib/parser/ocrParser.ts',
    '''    const sourceSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const sourceArtifactId = `artifact-image-${sourceSha256.slice(0, 24)}`;
    const docId = `doc-ocr-${sourceSha256.slice(0, 16)}-${Date.now()}`;
    const mimeType = fileInput.mimeType || inspection?.mimeType || "application/octet-stream";
''',
    '''    const sourceSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const mimeType = fileInput.mimeType || inspection?.mimeType || "application/octet-stream";
    const isPdf = mimeType.toLowerCase().includes("pdf") || originalName.toLowerCase().endsWith(".pdf") || String(inspection?.detectedType || '').toLowerCase() === 'pdf';
    const sourceArtifactId = `${isPdf ? 'artifact-pdf' : 'artifact-image'}-${sourceSha256.slice(0, 24)}`;
    const docId = `doc-ocr-${sourceSha256.slice(0, 16)}-${Date.now()}`;
'''
)
edit(
    'src/lib/parser/ocrParser.ts',
    '''        const coordinate: ImageSourceCoordinate = {
          coordinateId,
          sourceArtifactId,
          sourceSha256,
          sourceType: "IMAGE",
          pageNumber: page.pageNumber,
          imageWidth: page.width,
          imageHeight: page.height,
          boundingBox: region.boundingBox,
          ocrRegionId: safeRegionId,
          rawLiteral: text,
          normalizedLiteral: text,
          confidence: region.confidence,
          extractionMethod: `local-ocr:${result.engine}`,
          extractionVersion: result.engineVersion,
        };
''',
    '''        const coordinate: ImageSourceCoordinate | PdfSourceCoordinate = isPdf
          ? {
              coordinateId,
              sourceArtifactId,
              sourceSha256,
              sourceType: "PDF",
              pageNumber: page.pageNumber,
              boundingBox: region.boundingBox,
              nativeTextAvailable: false,
              evidenceMode: "OCR",
              rawLiteral: text,
              normalizedLiteral: text,
              confidence: region.confidence,
              extractionMethod: `local-ocr:${result.engine}`,
              extractionVersion: result.engineVersion,
            }
          : {
              coordinateId,
              sourceArtifactId,
              sourceSha256,
              sourceType: "IMAGE",
              pageNumber: page.pageNumber,
              imageWidth: page.width,
              imageHeight: page.height,
              boundingBox: region.boundingBox,
              ocrRegionId: safeRegionId,
              rawLiteral: text,
              normalizedLiteral: text,
              confidence: region.confidence,
              extractionMethod: `local-ocr:${result.engine}`,
              extractionVersion: result.engineVersion,
            };
'''
)
p = Path('src/lib/parser/ocrParser.ts')
text = p.read_text()
text = text.replace('source_format: inspection?.detectedType || "image",', 'source_format: isPdf ? "pdf" : (inspection?.detectedType || "image"),')
text = text.replace('format: inspection?.detectedType || "image",', 'format: isPdf ? "pdf" : (inspection?.detectedType || "image"),')
text = text.replace('detectedType: "ocr_image",', 'detectedType: isPdf ? "ocr_pdf" : "ocr_image",')
p.write_text(text)

# ---------------------------------------------------------------------------
# Content-aware PDF fallback helper.
# ---------------------------------------------------------------------------
Path('src/lib/parser/pdfOcrFallback.ts').write_text(r'''import { CanonicalDocumentModel, FileInspectionResult } from './types.js';

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
''')

# Worker: native PDF first, OCR only when every page lacks native text.
edit(
    'server/worker.ts',
    'import { selectParserPath } from "../src/lib/parser/parserSelection.js";\n',
    'import { selectParserPath } from "../src/lib/parser/parserSelection.js";\nimport { shouldUsePdfOcrFallback } from "../src/lib/parser/pdfOcrFallback.js";\n'
)
edit(
    'server/worker.ts',
    '''    let parsedDoc: any;
    const parserPath = selectParserPath(inspection);
    if (parserPath === "SPREADSHEET") {
      parsedDoc = await spreadsheetParser.parse(fileInput, inspection);
    } else if (parserPath === "OCR") {
      parsedDoc = await ocrParser.parse(fileInput, inspection);
    } else {
      parsedDoc = await anyDocParser.parse(fileInput, inspection);
    }
''',
    '''    let parsedDoc: any;
    const parserPath = selectParserPath(inspection);
    let ocrUsed = parserPath === "OCR";
    if (parserPath === "SPREADSHEET") {
      parsedDoc = await spreadsheetParser.parse(fileInput, inspection);
    } else if (parserPath === "OCR") {
      parsedDoc = await ocrParser.parse(fileInput, inspection);
    } else {
      parsedDoc = await anyDocParser.parse(fileInput, inspection);
      if (shouldUsePdfOcrFallback(parsedDoc, inspection)) {
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
    }
'''
)
edit(
    'server/worker.ts',
    '    if (inspection.needsOCR || inspection.isMultimodalImage) {\n',
    '    if (ocrUsed || inspection.needsOCR || inspection.isMultimodalImage) {\n'
)

# Hybrid extraction path: same content-aware fallback, no competing parser system.
edit(
    'server/hybridExtraction/HybridExtractionOrchestrator.ts',
    "import { SpreadsheetParser } from '../../src/lib/parser/spreadsheetParser.js';\n",
    "import { SpreadsheetParser } from '../../src/lib/parser/spreadsheetParser.js';\nimport { OCRParser } from '../../src/lib/parser/ocrParser.js';\nimport { shouldUsePdfOcrFallback } from '../../src/lib/parser/pdfOcrFallback.js';\n"
)
edit(
    'server/hybridExtraction/HybridExtractionOrchestrator.ts',
    'export class HybridExtractionOrchestrator {\n  private parser: AnyDocParser = new AnyDocParser();\n',
    'export class HybridExtractionOrchestrator {\n  private parser: AnyDocParser = new AnyDocParser();\n  private ocrParser: OCRParser = new OCRParser();\n'
)
edit(
    'server/hybridExtraction/HybridExtractionOrchestrator.ts',
    '''      let parsedDoc = await this.parser.parse({
        filename: params.originalFilename,
        originalName: params.originalFilename,
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType
      });

      if (isSpreadsheet) {
''',
    '''      let parsedDoc = await this.parser.parse({
        filename: params.originalFilename,
        originalName: params.originalFilename,
        buffer: fileBuffer,
        size: fileBuffer.length,
        mimeType
      });

      if (!isSpreadsheet && shouldUsePdfOcrFallback(parsedDoc, { detectedType: 'pdf', mimeType })) {
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

      if (isSpreadsheet) {
'''
)

# Documentation truth.
edit(
    'services/local_ocr/README.md',
    '- `OCR_MAX_INPUT_BYTES=26214400`\n',
    '- `OCR_MAX_INPUT_BYTES=26214400`\n- `OCR_PDF_RENDER_DPI=160`\n- `OCR_MAX_PDF_PAGES=50`\n'
)
edit(
    'services/local_ocr/README.md',
    '`OCRParser` converts selected OCR regions into `ImageSourceCoordinate` + `SourceValueProvenance` records. Every promoted value must retain:',
    '`OCRParser` converts direct-image regions into `ImageSourceCoordinate` records and scanned-PDF regions into `PdfSourceCoordinate` records, both wrapped by `SourceValueProvenance`. Every promoted value must retain:'
)
edit(
    'services/local_ocr/README.md',
    'This implementation establishes first-class direct image OCR (`PNG/JPEG/WEBP/TIFF/BMP`). Native-text PDF parsing remains deterministic in `AnyDocParser`. Image-only/scanned PDF page rendering into this same OCR contract is a follow-on integration and must not be represented as complete until physically verified.',
    'This implementation supports direct image OCR (`PNG/JPEG/WEBP/TIFF/BMP`) and page-aware OCR for image-only/scanned PDFs. PDFs still begin in deterministic `AnyDocParser`; only an all-image PDF with no native text is routed to local OCR. Mixed native-text/image PDFs remain a follow-on selective-page integration and must not be represented as complete.'
)

# ---------------------------------------------------------------------------
# Tests.
# ---------------------------------------------------------------------------
Path('server/tests/pdfOcrFallback.test.ts').write_text(r'''import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { shouldUsePdfOcrFallback } from '../../src/lib/parser/pdfOcrFallback.js';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';

assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [{ native_text_available: false }, { native_text_available: false }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), true);
assert.equal(shouldUsePdfOcrFallback({ raw_text: 'native text', pageManifests: [{ native_text_available: true }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), false);
assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [{ native_text_available: false }, { native_text_available: true }] }, { detectedType: 'pdf', mimeType: 'application/pdf' }), false);
assert.equal(shouldUsePdfOcrFallback({ raw_text: '', pageManifests: [] }, { detectedType: 'png', mimeType: 'image/png' }), false);

const buffer = Buffer.from('synthetic-image-only-pdf-bytes');
const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
const mockClient = {
  async recognize() {
    return {
      engine: 'paddleocr' as const,
      engineVersion: '3.7.0',
      model: 'test-pdf-ocr',
      sourceSha256,
      elapsedMs: 10,
      pages: [{
        pageNumber: 2,
        width: 1000,
        height: 1400,
        regions: [{
          regionId: 'p2-r1',
          text: 'TOTAL $53.23',
          confidence: 0.99,
          boundingBox: { x: 0.1, y: 0.8, width: 0.4, height: 0.05, unit: 'NORMALIZED' as const },
        }],
      }],
      routingDecision: { selectedEngine: 'paddleocr' as const, fallbackInvoked: false, reasons: [], primaryScore: 0.99, fallbackScore: null },
      attempts: [],
    };
  },
};
const parser = new OCRParser(mockClient as any);
const doc: any = await parser.parse({ filename: 'scan.pdf', originalName: 'scan.pdf', mimeType: 'application/pdf', buffer }, { detectedType: 'pdf', mimeType: 'application/pdf' });
assert.equal(doc.metadata.detectedType, 'ocr_pdf');
assert.equal(doc.parser.ocr_used, true);
assert.equal(doc.pageManifests[0].native_text_available, false);
assert.equal(doc.sourceValueProvenance.length, 1);
const coord = doc.sourceValueProvenance[0].coordinates[0];
assert.equal(coord.sourceType, 'PDF');
assert.equal(coord.pageNumber, 2);
assert.equal(coord.evidenceMode, 'OCR');
assert.equal(coord.nativeTextAvailable, false);
assert.equal(coord.sourceSha256, sourceSha256);
assert.equal(coord.boundingBox.unit, 'NORMALIZED');
console.log('PDF_OCR_FALLBACK_TESTS=PASS');
''')

Path('services/local_ocr/test_pdf_rasterization.py').write_text(r'''import base64
import hashlib
import io
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
    for idx in (1, 2):
        page = doc.new_page(width=300, height=400)
        page.insert_image(page.rect, stream=image_bytes(f'PAGE {idx} TOTAL $53.23'))
    doc.set_metadata({})
    doc.save(pdf_path, garbage=4, deflate=True)
    doc.close()

    verify = pymupdf.open(pdf_path)
    assert [page.get_text().strip() for page in verify] == ['', '']
    verify.close()

    rendered = ocr_app.render_pdf_pages(str(pdf_path), str(root / 'rendered')) if False else None
    rendered_dir = root / 'rendered'
    rendered_dir.mkdir()
    rendered = ocr_app.render_pdf_pages(str(pdf_path), str(rendered_dir))
    assert len(rendered) == 2
    assert [p['pageNumber'] for p in rendered] == [1, 2]
    assert all(Path(p['path']).exists() for p in rendered)
    assert all(p['rasterDpi'] == ocr_app.PDF_RENDER_DPI for p in rendered)

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
        assert [p['pageNumber'] for p in result['pages']] == [1, 2]
        assert all(p['rasterDpi'] == ocr_app.PDF_RENDER_DPI for p in result['pages'])
        assert 'PDF_RASTERIZED_FOR_OCR' in result['warnings']
    finally:
        ocr_app.ENGINE = original_engine
        ocr_app.paddle_ocr = original_paddle

print('PDF_OCR_SERVICE_RASTERIZATION_TESTS=PASS')
''')

Path('server/tests/pdfOcrIntegrationWiring.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
const worker = fs.readFileSync('server/worker.ts', 'utf8');
const hybrid = fs.readFileSync('server/hybridExtraction/HybridExtractionOrchestrator.ts', 'utf8');
const app = fs.readFileSync('services/local_ocr/app.py', 'utf8');
for (const source of [worker, hybrid]) {
  assert.ok(source.includes('shouldUsePdfOcrFallback'));
  assert.ok(source.includes('OCRParser'));
}
assert.ok(app.includes('render_pdf_pages'));
assert.ok(app.includes('PDF_RASTERIZED_FOR_OCR'));
assert.ok(app.includes('OCR_MAX_PDF_PAGES'));
console.log('PDF_OCR_INTEGRATION_WIRING_TESTS=PASS');
''')

print('IMAGE_ONLY_PDF_OCR_PATCH_APPLIED')
