from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'MISSING_PATCH_MARKER:{label}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------------
# services/local_ocr/app.py
# ---------------------------------------------------------------------------
p = Path('services/local_ocr/app.py')
text = p.read_text()
text = replace_once(text, 'APP_VERSION = "1.1.0"', 'APP_VERSION = "1.2.0"', 'app-version')
text = replace_once(
    text,
    '    sourceSha256: str | None = Field(default=None, pattern=r"^[a-fA-F0-9]{64}$")\n',
    '    sourceSha256: str | None = Field(default=None, pattern=r"^[a-fA-F0-9]{64}$")\n    rotationDegrees: int = Field(default=0)\n',
    'request-rotation-field',
)
helpers = r'''

def normalize_rotation_degrees(value: int | None) -> int:
    degrees = int(value or 0)
    if degrees not in {0, 90, 180, 270}:
        raise HTTPException(status_code=422, detail=f"OCR_ROTATION_UNSUPPORTED:{degrees}")
    return degrees


def inverse_rotate_normalized_point(x: float, y: float, rotation_degrees: int) -> tuple[float, float]:
    """Map a point from the rotated OCR working copy back into original-source normalized space."""
    x = clamp01(x)
    y = clamp01(y)
    degrees = normalize_rotation_degrees(rotation_degrees)
    if degrees == 90:
        return clamp01(1.0 - y), clamp01(x)
    if degrees == 180:
        return clamp01(1.0 - x), clamp01(1.0 - y)
    if degrees == 270:
        return clamp01(y), clamp01(1.0 - x)
    return x, y


def remap_bbox_to_original(box: dict[str, Any], rotation_degrees: int) -> dict[str, Any]:
    x0 = clamp01(box.get("x"))
    y0 = clamp01(box.get("y"))
    x1 = clamp01(x0 + clamp01(box.get("width")))
    y1 = clamp01(y0 + clamp01(box.get("height")))
    points = [
        inverse_rotate_normalized_point(x0, y0, rotation_degrees),
        inverse_rotate_normalized_point(x1, y0, rotation_degrees),
        inverse_rotate_normalized_point(x1, y1, rotation_degrees),
        inverse_rotate_normalized_point(x0, y1, rotation_degrees),
    ]
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    left, right = min(xs), max(xs)
    top, bottom = min(ys), max(ys)
    return {
        "x": left,
        "y": top,
        "width": max(0.0, right - left),
        "height": max(0.0, bottom - top),
        "unit": "NORMALIZED",
    }


def remap_result_to_original(
    result: dict[str, Any],
    rotation_degrees: int,
    original_width: int,
    original_height: int,
) -> dict[str, Any]:
    degrees = normalize_rotation_degrees(rotation_degrees)
    mapped = dict(result)
    mapped_pages: list[dict[str, Any]] = []
    for page in result.get("pages") or []:
        mapped_page = dict(page)
        mapped_page["workingImageWidth"] = int(page.get("width") or 0)
        mapped_page["workingImageHeight"] = int(page.get("height") or 0)
        mapped_page["width"] = int(original_width)
        mapped_page["height"] = int(original_height)
        mapped_regions: list[dict[str, Any]] = []
        for region in page.get("regions") or []:
            mapped_region = dict(region)
            box = region.get("boundingBox") or {}
            mapped_region["boundingBox"] = remap_bbox_to_original(box, degrees)
            polygon = region.get("polygon") or []
            if polygon:
                mapped_region["polygon"] = [
                    list(inverse_rotate_normalized_point(float(point[0]), float(point[1]), degrees))
                    for point in polygon
                    if isinstance(point, (list, tuple)) and len(point) >= 2
                ]
            mapped_regions.append(mapped_region)
        mapped_page["regions"] = mapped_regions
        mapped_pages.append(mapped_page)
    mapped["pages"] = mapped_pages
    mapped["appliedRotationDegrees"] = degrees
    mapped["coordinateSpace"] = "ORIGINAL_SOURCE"
    warnings = list(mapped.get("warnings") or [])
    if degrees:
        warnings.append(f"OCR_ORIENTATION_WORKING_COPY:{degrees}")
        warnings.append("OCR_COORDINATES_REMAPPED_TO_ORIGINAL_SOURCE")
    mapped["warnings"] = list(dict.fromkeys(warnings))
    return mapped

'''
text = replace_once(
    text,
    '\ndef render_pdf_pages(pdf_path: str, output_dir: str) -> list[dict[str, Any]]:\n',
    helpers + '\ndef render_pdf_pages(pdf_path: str, output_dir: str) -> list[dict[str, Any]]:\n',
    'orientation-helpers',
)
text = replace_once(
    text,
    '    source_kind, suffix = ensure_supported_source(req, payload)\n    started = time.perf_counter()\n',
    '    source_kind, suffix = ensure_supported_source(req, payload)\n    rotation_degrees = normalize_rotation_degrees(req.rotationDegrees)\n    if source_kind == "pdf" and rotation_degrees != 0:\n        raise HTTPException(status_code=422, detail="OCR_ROTATION_RETRY_IMAGE_ONLY")\n    started = time.perf_counter()\n',
    'recognize-rotation-guard',
)
text = replace_once(
    text,
    '''        else:\n            with Image.open(path) as image:\n                width, height = image.size\n            out = ocr_single_image(path, width, height)\n\n        out["sourceSha256"] = digest\n''',
    '''        else:\n            with Image.open(path) as image:\n                width, height = image.size\n                if rotation_degrees:\n                    with tempfile.TemporaryDirectory(prefix="eve-ocr-rotate-") as rotation_dir:\n                        working = image.convert("RGB").rotate(\n                            rotation_degrees,\n                            expand=True,\n                            fillcolor=(255, 255, 255),\n                        )\n                        rotated_path = os.path.join(rotation_dir, f"rotation-{rotation_degrees}.png")\n                        working.save(rotated_path, "PNG", optimize=True)\n                        out = ocr_single_image(rotated_path, working.width, working.height)\n                else:\n                    out = ocr_single_image(path, width, height)\n            out = remap_result_to_original(out, rotation_degrees, width, height)\n\n        if "appliedRotationDegrees" not in out:\n            out["appliedRotationDegrees"] = 0\n        if "coordinateSpace" not in out:\n            out["coordinateSpace"] = "ORIGINAL_SOURCE"\n        out["sourceSha256"] = digest\n''',
    'recognize-direct-image-rotation',
)
p.write_text(text)

# ---------------------------------------------------------------------------
# src/lib/ocr/localOcrClient.ts
# ---------------------------------------------------------------------------
p = Path('src/lib/ocr/localOcrClient.ts')
text = p.read_text()
text = replace_once(
    text,
    '  warnings?: string[];\n}\n',
    "  warnings?: string[];\n  appliedRotationDegrees?: number;\n  coordinateSpace?: 'ORIGINAL_SOURCE';\n}\n",
    'engine-result-rotation-fields',
)
text = replace_once(
    text,
    '  url: string;\n  selected: boolean;\n',
    '  url: string;\n  rotationDegrees: number;\n  selected: boolean;\n',
    'attempt-rotation-field',
)
text = replace_once(
    text,
    '  fallbackScore: number | null;\n}\n',
    '  fallbackScore: number | null;\n  orientationRetryInvoked: boolean;\n  selectedRotationDegrees: number;\n}\n',
    'routing-rotation-fields',
)
text = replace_once(
    text,
    '  forceFallbackEvaluation?: boolean;\n  fetchImpl?: typeof fetch;\n',
    '  forceFallbackEvaluation?: boolean;\n  orientationRetryEnabled?: boolean;\n  orientationRetryAngles?: number[];\n  fetchImpl?: typeof fetch;\n',
    'options-rotation-fields',
)
text = replace_once(
    text,
    '''function envNumber(name: string, fallback: number): number {\n  const raw = Number(process.env[name]);\n  return Number.isFinite(raw) ? raw : fallback;\n}\n\n''',
    '''function envNumber(name: string, fallback: number): number {\n  const raw = Number(process.env[name]);\n  return Number.isFinite(raw) ? raw : fallback;\n}\n\nfunction envBoolean(name: string, fallback: boolean): boolean {\n  const raw = String(process.env[name] ?? '').trim().toLowerCase();\n  if (!raw) return fallback;\n  if (['0', 'false', 'no', 'off'].includes(raw)) return false;\n  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;\n  return fallback;\n}\n\n''',
    'env-boolean',
)
text = replace_once(
    text,
    '''  private fallbackImprovementMargin: number;\n  private forceFallbackEvaluation: boolean;\n  private fetchImpl: typeof fetch;\n''',
    '''  private fallbackImprovementMargin: number;\n  private forceFallbackEvaluation: boolean;\n  private orientationRetryEnabled: boolean;\n  private orientationRetryAngles: number[];\n  private fetchImpl: typeof fetch;\n''',
    'client-fields',
)
text = replace_once(
    text,
    '''    this.fallbackImprovementMargin = options.fallbackImprovementMargin ?? envNumber('EVE_OCR_FALLBACK_IMPROVEMENT_MARGIN', DEFAULT_IMPROVEMENT_MARGIN);\n    this.forceFallbackEvaluation = options.forceFallbackEvaluation === true;\n    this.fetchImpl = options.fetchImpl ?? fetch;\n''',
    '''    this.fallbackImprovementMargin = options.fallbackImprovementMargin ?? envNumber('EVE_OCR_FALLBACK_IMPROVEMENT_MARGIN', DEFAULT_IMPROVEMENT_MARGIN);\n    this.forceFallbackEvaluation = options.forceFallbackEvaluation === true;\n    this.orientationRetryEnabled = options.orientationRetryEnabled ?? envBoolean('EVE_OCR_ORIENTATION_RETRY_ENABLED', true);\n    const configuredAngles = options.orientationRetryAngles?.length ? options.orientationRetryAngles : [90, 270, 180];\n    this.orientationRetryAngles = Array.from(new Set(configuredAngles.map(Number).filter(angle => [90, 180, 270].includes(angle))));\n    this.fetchImpl = options.fetchImpl ?? fetch;\n''',
    'constructor-orientation',
)
text = replace_once(
    text,
    '  private async call(url: string, input: LocalOcrInput): Promise<LocalOcrEngineResult> {\n',
    '  private async call(url: string, input: LocalOcrInput, rotationDegrees = 0): Promise<LocalOcrEngineResult> {\n',
    'call-signature',
)
text = replace_once(
    text,
    '''          dataBase64: input.buffer.toString('base64'),\n          sourceSha256: input.sourceSha256,\n''',
    '''          dataBase64: input.buffer.toString('base64'),\n          sourceSha256: input.sourceSha256,\n          rotationDegrees,\n''',
    'call-body-rotation',
)
text = replace_once(
    text,
    '''  return payload as LocalOcrEngineResult;\n}\n''',
    '''  const rotationDegrees = Number(payload.appliedRotationDegrees ?? 0);\n  if (![0, 90, 180, 270].includes(rotationDegrees)) throw new Error('OCR_SERVICE_INVALID_ROTATION');\n  if (rotationDegrees !== 0 && payload.coordinateSpace !== 'ORIGINAL_SOURCE') {\n    throw new Error('OCR_SERVICE_ROTATED_COORDINATE_SPACE_NOT_ORIGINAL');\n  }\n  return payload as LocalOcrEngineResult;\n}\n''',
    'service-result-rotation-validation',
)
text = replace_once(text, '          engine: primary.engine,\n          url: this.primaryUrl,\n          selected: false,\n', '          engine: primary.engine,\n          url: this.primaryUrl,\n          rotationDegrees: 0,\n          selected: false,\n', 'primary-attempt-rotation')
text = replace_once(text, "          engine: 'paddleocr', url: this.primaryUrl, selected: false, score: null,\n", "          engine: 'paddleocr', url: this.primaryUrl, rotationDegrees: 0, selected: false, score: null,\n", 'primary-error-rotation')
text = replace_once(text, '          engine: fallback.engine,\n          url: this.fallbackUrl,\n          selected: false,\n', '          engine: fallback.engine,\n          url: this.fallbackUrl,\n          rotationDegrees: 0,\n          selected: false,\n', 'fallback-attempt-rotation')
text = replace_once(text, "          engine: 'doctr', url: this.fallbackUrl, selected: false, score: null,\n", "          engine: 'doctr', url: this.fallbackUrl, rotationDegrees: 0, selected: false, score: null,\n", 'fallback-error-rotation')
start_marker = '    for (const attempt of attempts) attempt.selected = attempt.result === selected;\n'
end_marker = '  }\n}\n\nexport const localOcrClient = new LocalOcrClient();\n'
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('MISSING_PATCH_MARKER:recognize-tail')
new_tail = r'''    let chosenQuality = assessOcrQuality(selected);
    const routingDecision: LocalOcrRoutingDecision = {
      selectedEngine: selected.engine,
      fallbackInvoked: shouldInvokeFallback,
      reasons,
      primaryScore: primaryQuality?.score ?? null,
      fallbackScore: fallbackQuality?.score ?? null,
      orientationRetryInvoked: false,
      selectedRotationDegrees: Number(selected.appliedRotationDegrees ?? 0),
    };
    let finalQualityReasons = this.finalQualityReasons(chosenQuality);

    const isDirectImage = input.mimeType.toLowerCase().startsWith('image/') || /\.(?:png|jpe?g|webp|tiff?|bmp)$/i.test(input.filename);
    if (finalQualityReasons.length > 0 && this.orientationRetryEnabled && isDirectImage && this.orientationRetryAngles.length > 0) {
      routingDecision.orientationRetryInvoked = true;
      reasons.push('ORIENTATION_RETRY_AFTER_INSUFFICIENT_QUALITY');
      const passingCandidates: Array<{ result: LocalOcrEngineResult; quality: OcrQualityAssessment; rotationDegrees: number }> = [];

      const evaluateRotations = async (url: string, nominalEngine: OcrEngineName) => {
        for (const rotationDegrees of this.orientationRetryAngles) {
          try {
            const rotatedResult = await this.call(url, input, rotationDegrees);
            const rotatedQuality = assessOcrQuality(rotatedResult);
            attempts.push({
              engine: rotatedResult.engine,
              url,
              rotationDegrees,
              selected: false,
              score: rotatedQuality.score,
              averageConfidence: rotatedQuality.averageConfidence,
              materialMinimumConfidence: rotatedQuality.materialMinimumConfidence,
              regionCount: rotatedQuality.regionCount,
              result: rotatedResult,
            });
            if (this.finalQualityReasons(rotatedQuality).length === 0) {
              passingCandidates.push({ result: rotatedResult, quality: rotatedQuality, rotationDegrees });
            }
          } catch (error: any) {
            attempts.push({
              engine: nominalEngine,
              url,
              rotationDegrees,
              selected: false,
              score: null,
              averageConfidence: null,
              materialMinimumConfidence: null,
              regionCount: 0,
              error: error?.message || String(error),
            });
          }
        }
      };

      if (this.primaryUrl) await evaluateRotations(this.primaryUrl, 'paddleocr');
      if (!passingCandidates.length && this.fallbackUrl) {
        routingDecision.fallbackInvoked = true;
        await evaluateRotations(this.fallbackUrl, 'doctr');
      }

      if (passingCandidates.length) {
        passingCandidates.sort((a, b) => b.quality.score - a.quality.score);
        const winner = passingCandidates[0];
        selected = winner.result;
        chosenQuality = winner.quality;
        finalQualityReasons = [];
        routingDecision.selectedEngine = selected.engine;
        routingDecision.selectedRotationDegrees = winner.rotationDegrees;
        reasons.push(`ORIENTATION_RETRY_SELECTED_${winner.rotationDegrees}`);
      } else {
        reasons.push('ORIENTATION_RETRY_NO_ACCEPTABLE_RESULT');
      }
    }

    for (const attempt of attempts) attempt.selected = attempt.result === selected;
    if (finalQualityReasons.length > 0) {
      throw new LocalOcrInsufficientQualityError({
        selectedEngine: selected.engine,
        reasons: finalQualityReasons,
        quality: chosenQuality,
        attempts,
        routingDecision,
        selectedResult: selected,
      });
    }
    return {
      ...selected,
      routingDecision,
      attempts,
      warnings: [
        ...(selected.warnings || []),
        ...(primary && shouldInvokeFallback ? ['OCR_FALLBACK_EVALUATED'] : []),
        ...(selected.engine === 'doctr' ? ['OCR_FALLBACK_SELECTED'] : []),
        ...(routingDecision.orientationRetryInvoked ? ['OCR_ORIENTATION_RETRY_EVALUATED'] : []),
        ...(routingDecision.selectedRotationDegrees ? [`OCR_ORIENTATION_RETRY_SELECTED:${routingDecision.selectedRotationDegrees}`] : []),
        ...(chosenQuality.regionCount === 0 ? ['OCR_NO_TEXT_REGIONS'] : []),
      ],
    };
'''
text = text[:start] + new_tail + text[end:]
p.write_text(text)

# ---------------------------------------------------------------------------
# src/lib/parser/ocrParser.ts
# ---------------------------------------------------------------------------
p = Path('src/lib/parser/ocrParser.ts')
text = p.read_text()
text = replace_once(
    text,
    '''              ocrRegionId: safeRegionId,\n              rawLiteral: text,\n''',
    '''              ocrRegionId: safeRegionId,\n              transformId: result.appliedRotationDegrees ? `ocr-rotation-${result.appliedRotationDegrees}-remapped-to-original` : undefined,\n              rawLiteral: text,\n''',
    'image-coordinate-transform-id',
)
text = replace_once(
    text,
    '''            notes: result.model ? `model=${result.model}` : undefined,\n''',
    '''            notes: [\n              result.model ? `model=${result.model}` : '',\n              result.appliedRotationDegrees ? `orientationRetryDegrees=${result.appliedRotationDegrees}` : '',\n              result.appliedRotationDegrees ? 'coordinates=original-source' : '',\n            ].filter(Boolean).join('; ') || undefined,\n''',
    'provenance-orientation-notes',
)
text = replace_once(
    text,
    '''          ocr_engine_version: result.engineVersion,\n        });\n''',
    '''          ocr_engine_version: result.engineVersion,\n          ocr_rotation_degrees: Number(result.appliedRotationDegrees || 0),\n        });\n''',
    'source-block-rotation',
)
text = replace_once(
    text,
    '''        fallbackReasons: result.routingDecision.reasons,\n      },\n''',
    '''        fallbackReasons: result.routingDecision.reasons,\n        orientationRetryInvoked: result.routingDecision.orientationRetryInvoked,\n        selectedRotationDegrees: result.routingDecision.selectedRotationDegrees,\n      },\n''',
    'parser-routing-metadata',
)
text = replace_once(
    text,
    '''        ocrRegions: ocrLines.length,\n      },\n''',
    '''        ocrRegions: ocrLines.length,\n        ocrRotationDegrees: Number(result.appliedRotationDegrees || 0),\n      },\n''',
    'document-metadata-rotation',
)
text = replace_once(
    text,
    '''        engine: attempt.engine,\n        selected: attempt.selected,\n''',
    '''        engine: attempt.engine,\n        rotationDegrees: attempt.rotationDegrees,\n        selected: attempt.selected,\n''',
    'engine-results-rotation',
)
p.write_text(text)

# ---------------------------------------------------------------------------
# Existing fail-closed test keeps orientation retry disabled so it continues to
# prove the underlying reject-before-provenance rule independently.
# ---------------------------------------------------------------------------
p = Path('server/tests/localOcrRouting.test.ts')
text = p.read_text()
text = replace_once(
    text,
    '''  const client = new LocalOcrClient({\n    primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchImpl as typeof fetch,\n    primaryAverageConfidenceFloor: 0.90, materialConfidenceFloor: 0.85,\n  });\n  await assert.rejects(\n    () => client.recognize({ filename: 'rotated-receipt.png', mimeType: 'image/png', buffer, sourceSha256 }),\n''',
    '''  const client = new LocalOcrClient({\n    primaryUrl: 'http://paddle', fallbackUrl: 'http://doctr', fetchImpl: fetchImpl as typeof fetch,\n    primaryAverageConfidenceFloor: 0.90, materialConfidenceFloor: 0.85,\n    orientationRetryEnabled: false,\n  });\n  await assert.rejects(\n    () => client.recognize({ filename: 'rotated-receipt.png', mimeType: 'image/png', buffer, sourceSha256 }),\n''',
    'preserve-fail-closed-isolation',
)
p.write_text(text)

# ---------------------------------------------------------------------------
# New orientation geometry test (service-side original-coordinate remap).
# ---------------------------------------------------------------------------
Path('services/local_ocr/test_orientation_geometry.py').write_text(r'''from app import remap_result_to_original, normalize_rotation_degrees


def close(a, b, eps=1e-9):
    assert abs(float(a) - float(b)) <= eps, (a, b)


base = {
    "engine": "paddleocr",
    "pages": [{
        "pageNumber": 1,
        "width": 1000,
        "height": 900,
        "regions": [{
            "regionId": "p1-r1",
            "text": "TOTAL $53.23",
            "confidence": 0.99,
            "boundingBox": {"x": 0.2, "y": 0.1, "width": 0.3, "height": 0.2, "unit": "NORMALIZED"},
            "polygon": [[0.2, 0.1], [0.5, 0.1], [0.5, 0.3], [0.2, 0.3]],
        }],
    }],
    "warnings": [],
}

mapped90 = remap_result_to_original(base, 90, 900, 1000)
page = mapped90["pages"][0]
box = page["regions"][0]["boundingBox"]
assert page["width"] == 900 and page["height"] == 1000
assert page["workingImageWidth"] == 1000 and page["workingImageHeight"] == 900
close(box["x"], 0.7); close(box["y"], 0.2); close(box["width"], 0.2); close(box["height"], 0.3)
assert mapped90["appliedRotationDegrees"] == 90
assert mapped90["coordinateSpace"] == "ORIGINAL_SOURCE"
assert "OCR_COORDINATES_REMAPPED_TO_ORIGINAL_SOURCE" in mapped90["warnings"]

mapped180 = remap_result_to_original(base, 180, 900, 1000)
box180 = mapped180["pages"][0]["regions"][0]["boundingBox"]
close(box180["x"], 0.5); close(box180["y"], 0.7); close(box180["width"], 0.3); close(box180["height"], 0.2)

mapped270 = remap_result_to_original(base, 270, 900, 1000)
box270 = mapped270["pages"][0]["regions"][0]["boundingBox"]
close(box270["x"], 0.1); close(box270["y"], 0.5); close(box270["width"], 0.2); close(box270["height"], 0.3)

try:
    normalize_rotation_degrees(45)
    raise AssertionError("45 degrees should fail closed")
except Exception as exc:
    assert "OCR_ROTATION_UNSUPPORTED" in str(exc)

print("OCR_ORIENTATION_GEOMETRY_TESTS=PASS")
''')

# ---------------------------------------------------------------------------
# New routing + provenance orientation acceptance test.
# ---------------------------------------------------------------------------
Path('server/tests/ocrOrientationRetry.test.ts').write_text(r'''import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { LocalOcrClient } from '../../src/lib/ocr/localOcrClient.js';
import { OCRParser } from '../../src/lib/parser/ocrParser.js';

const buffer = Buffer.from('synthetic-rotated-receipt-source');
const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
const requests: Array<{ url: string; rotationDegrees: number; sourceSha256: string }> = [];

const makeResult = (engine: 'paddleocr' | 'doctr', rotationDegrees: number, confidence: number, text: string) => ({
  engine,
  engineVersion: engine === 'paddleocr' ? '3.7.0-test' : '1.1.0-test',
  serviceVersion: '1.2.0-test',
  model: engine === 'paddleocr' ? 'paddle-test' : 'doctr-test',
  sourceSha256,
  elapsedMs: 5,
  appliedRotationDegrees: rotationDegrees,
  coordinateSpace: 'ORIGINAL_SOURCE' as const,
  pages: [{
    pageNumber: 1,
    width: 900,
    height: 1000,
    regions: [{
      regionId: 'p1-r1',
      text,
      confidence,
      boundingBox: { x: 0.1, y: 0.7, width: 0.5, height: 0.08, unit: 'NORMALIZED' as const },
      polygon: [],
    }],
  }],
  warnings: rotationDegrees ? [`OCR_ORIENTATION_WORKING_COPY:${rotationDegrees}`] : [],
});

let primaryCalls = 0;
let fallbackCalls = 0;
const fetchImpl = async (url: any, init?: any) => {
  const parsed = JSON.parse(String(init?.body || '{}'));
  const rotationDegrees = Number(parsed.rotationDegrees || 0);
  requests.push({ url: String(url), rotationDegrees, sourceSha256: String(parsed.sourceSha256 || '') });
  const isFallback = String(url).includes('doctr');
  if (isFallback) fallbackCalls++; else primaryCalls++;

  let confidence = isFallback ? 0.72 : 0.62;
  let text = isFallback ? 'ROTATED GARBLED 53.23' : 'BAD OCR 53.23';
  if (!isFallback && rotationDegrees === 90) { confidence = 0.45; text = 'UPSIDE DOWN OCR'; }
  if (!isFallback && rotationDegrees === 270) { confidence = 0.995; text = 'TOTAL $53.23'; }
  if (!isFallback && rotationDegrees === 180) { confidence = 0.40; text = 'SIDEWAYS OCR'; }

  return new Response(JSON.stringify(makeResult(isFallback ? 'doctr' : 'paddleocr', rotationDegrees, confidence, text)), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

const client = new LocalOcrClient({
  primaryUrl: 'http://paddle',
  fallbackUrl: 'http://doctr',
  fetchImpl: fetchImpl as typeof fetch,
  primaryAverageConfidenceFloor: 0.90,
  materialConfidenceFloor: 0.85,
  orientationRetryEnabled: true,
  orientationRetryAngles: [90, 270, 180],
});

const result = await client.recognize({ filename: 'receipt-rotated.png', mimeType: 'image/png', buffer, sourceSha256 });
assert.equal(result.engine, 'paddleocr');
assert.equal(result.appliedRotationDegrees, 270);
assert.equal(result.coordinateSpace, 'ORIGINAL_SOURCE');
assert.equal(result.routingDecision.orientationRetryInvoked, true);
assert.equal(result.routingDecision.selectedRotationDegrees, 270);
assert.equal(result.routingDecision.selectedEngine, 'paddleocr');
assert.equal(primaryCalls, 4); // original + 90/270/180 bounded retries
assert.equal(fallbackCalls, 1); // original fallback only; no rotated fallback once Paddle has a passing orientation
assert.equal(result.attempts.length, 5);
assert.equal(result.attempts.filter(attempt => attempt.selected).length, 1);
assert.equal(result.attempts.find(attempt => attempt.selected)?.rotationDegrees, 270);
assert.equal(result.pages[0].regions[0].text, 'TOTAL $53.23');
assert.ok(result.warnings?.includes('OCR_ORIENTATION_RETRY_EVALUATED'));
assert.ok(result.warnings?.includes('OCR_ORIENTATION_RETRY_SELECTED:270'));
assert.ok(requests.every(request => request.sourceSha256 === sourceSha256));
assert.deepEqual(requests.map(request => request.rotationDegrees), [0, 0, 90, 270, 180]);

const parser = new OCRParser({ recognize: async () => result } as any);
const parsedDoc: any = await parser.parse({
  filename: 'receipt-rotated.png',
  originalName: 'receipt-rotated.png',
  mimeType: 'image/png',
  buffer,
  size: buffer.length,
}, { detectedType: 'png', mimeType: 'image/png', needsOCR: true });
assert.equal(parsedDoc.parser.orientationRetryInvoked, true);
assert.equal(parsedDoc.parser.selectedRotationDegrees, 270);
assert.equal(parsedDoc.metadata.ocrRotationDegrees, 270);
assert.equal(parsedDoc.ocrLines[0].coordinate.transformId, 'ocr-rotation-270-remapped-to-original');
assert.equal(parsedDoc.ocrLines[0].coordinate.sourceSha256, sourceSha256);
assert.equal(parsedDoc.sourceBlocks[0].ocr_rotation_degrees, 270);
assert.match(parsedDoc.sourceValueProvenance[0].transformationSteps[0].notes, /orientationRetryDegrees=270/);
assert.match(parsedDoc.sourceValueProvenance[0].transformationSteps[0].notes, /coordinates=original-source/);

console.log('OCR_ORIENTATION_RETRY_TESTS=PASS');
''')

print('OCR_ORIENTATION_RETRY_PATCH_APPLIED')
