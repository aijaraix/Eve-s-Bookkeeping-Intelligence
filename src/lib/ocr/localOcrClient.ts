export type OcrEngineName = 'paddleocr' | 'doctr';

export interface OcrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'NORMALIZED';
}

export interface LocalOcrRegion {
  regionId: string;
  text: string;
  confidence: number;
  boundingBox: OcrBoundingBox;
  polygon?: number[][];
}

export interface LocalOcrPage {
  pageNumber: number;
  width: number;
  height: number;
  regions: LocalOcrRegion[];
}

export interface LocalOcrEngineResult {
  engine: OcrEngineName;
  engineVersion: string;
  serviceVersion?: string;
  model?: string;
  sourceSha256: string;
  elapsedMs: number;
  pages: LocalOcrPage[];
  warnings?: string[];
  appliedRotationDegrees?: number;
  coordinateSpace?: 'ORIGINAL_SOURCE';
}

export interface LocalOcrAttempt {
  engine: OcrEngineName;
  url: string;
  rotationDegrees: number;
  selected: boolean;
  score: number | null;
  averageConfidence: number | null;
  materialMinimumConfidence: number | null;
  regionCount: number;
  result?: LocalOcrEngineResult;
  error?: string;
}

export interface LocalOcrRoutingDecision {
  selectedEngine: OcrEngineName;
  fallbackInvoked: boolean;
  reasons: string[];
  primaryScore: number | null;
  fallbackScore: number | null;
  orientationRetryInvoked: boolean;
  selectedRotationDegrees: number;
}

export interface LocalOcrCompositeResult extends LocalOcrEngineResult {
  routingDecision: LocalOcrRoutingDecision;
  attempts: LocalOcrAttempt[];
}

export interface LocalOcrInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  sourceSha256: string;
}

export interface LocalOcrClientOptions {
  primaryUrl?: string;
  fallbackUrl?: string;
  requestTimeoutMs?: number;
  primaryAverageConfidenceFloor?: number;
  materialConfidenceFloor?: number;
  fallbackImprovementMargin?: number;
  forceFallbackEvaluation?: boolean;
  orientationRetryEnabled?: boolean;
  orientationRetryAngles?: number[];
  fetchImpl?: typeof fetch;
}

export interface OcrQualityAssessment {
  score: number;
  averageConfidence: number;
  materialMinimumConfidence: number | null;
  regionCount: number;
  materialRegionCount: number;
}

export interface LocalOcrQualityFailureDiagnostics {
  selectedEngine: OcrEngineName;
  reasons: string[];
  quality: OcrQualityAssessment;
  attempts: LocalOcrAttempt[];
  routingDecision: LocalOcrRoutingDecision;
  selectedResult: LocalOcrEngineResult;
}

export class LocalOcrInsufficientQualityError extends Error {
  public readonly code = 'LOCAL_OCR_INSUFFICIENT_QUALITY';
  public readonly diagnostics: LocalOcrQualityFailureDiagnostics;

  constructor(diagnostics: LocalOcrQualityFailureDiagnostics) {
    super(`LOCAL_OCR_INSUFFICIENT_QUALITY:${diagnostics.reasons.join(',')}`);
    this.name = 'LocalOcrInsufficientQualityError';
    this.diagnostics = diagnostics;
  }
}

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_AVG_FLOOR = 0.90;
const DEFAULT_MATERIAL_FLOOR = 0.85;
const DEFAULT_IMPROVEMENT_MARGIN = 0.02;

function envNumber(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) ? raw : fallback;
}

function envBoolean(name: string, fallback: boolean): boolean {
  const raw = String(process.env[name] ?? '').trim().toLowerCase();
  if (!raw) return fallback;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  return fallback;
}

function normalizeUrl(value?: string): string {
  return String(value || '').trim().replace(/\/+$/, '');
}

function finite01(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

function flattenRegions(result?: LocalOcrEngineResult): LocalOcrRegion[] {
  return (result?.pages || []).flatMap(page => Array.isArray(page.regions) ? page.regions : []);
}

function likelyMaterialRegion(text: string): boolean {
  const t = String(text || '').trim();
  if (!t) return false;
  return /[$€£¥₹]|\b(?:USD|EUR|GBP|JPY|CHF|CAD|AUD)\b/i.test(t) || /\d[\d,.]*\d/.test(t) || /\b(?:total|tax|subtotal|balance|asset|liabilit|equity|revenue|income|expense|cash|amount|date)\b/i.test(t);
}

export function assessOcrQuality(result: LocalOcrEngineResult): OcrQualityAssessment {
  const regions = flattenRegions(result).filter(region => String(region.text || '').trim().length > 0);
  if (!regions.length) {
    return { score: 0, averageConfidence: 0, materialMinimumConfidence: null, regionCount: 0, materialRegionCount: 0 };
  }
  const weighted = regions.reduce((sum, region) => {
    const weight = Math.max(1, String(region.text || '').trim().length);
    return { total: sum.total + finite01(region.confidence) * weight, weight: sum.weight + weight };
  }, { total: 0, weight: 0 });
  const averageConfidence = weighted.weight ? weighted.total / weighted.weight : 0;
  const material = regions.filter(region => likelyMaterialRegion(region.text));
  const materialMinimumConfidence = material.length
    ? Math.min(...material.map(region => finite01(region.confidence)))
    : null;
  const score = materialMinimumConfidence === null
    ? averageConfidence
    : (averageConfidence * 0.75) + (materialMinimumConfidence * 0.25);
  return {
    score,
    averageConfidence,
    materialMinimumConfidence,
    regionCount: regions.length,
    materialRegionCount: material.length,
  };
}

function validateServiceResult(payload: any): LocalOcrEngineResult {
  if (!payload || !['paddleocr', 'doctr'].includes(String(payload.engine))) {
    throw new Error('OCR_SERVICE_INVALID_ENGINE');
  }
  if (!Array.isArray(payload.pages) || !payload.sourceSha256 || !/^[a-f0-9]{64}$/i.test(String(payload.sourceSha256))) {
    throw new Error('OCR_SERVICE_INVALID_RESULT');
  }
  for (const page of payload.pages) {
    if (!Number.isFinite(Number(page.pageNumber)) || !Number.isFinite(Number(page.width)) || !Number.isFinite(Number(page.height)) || !Array.isArray(page.regions)) {
      throw new Error('OCR_SERVICE_INVALID_PAGE');
    }
    for (const region of page.regions) {
      const box = region?.boundingBox;
      if (!region?.regionId || typeof region?.text !== 'string' || !box || box.unit !== 'NORMALIZED') {
        throw new Error('OCR_SERVICE_INVALID_REGION');
      }
      for (const key of ['x', 'y', 'width', 'height'] as const) {
        const n = Number(box[key]);
        if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('OCR_SERVICE_INVALID_BOUNDING_BOX');
      }
    }
  }
  const rotationDegrees = Number(payload.appliedRotationDegrees ?? 0);
  if (![0, 90, 180, 270].includes(rotationDegrees)) throw new Error('OCR_SERVICE_INVALID_ROTATION');
  if (rotationDegrees !== 0 && payload.coordinateSpace !== 'ORIGINAL_SOURCE') {
    throw new Error('OCR_SERVICE_ROTATED_COORDINATE_SPACE_NOT_ORIGINAL');
  }
  return payload as LocalOcrEngineResult;
}

export class LocalOcrClient {
  private primaryUrl: string;
  private fallbackUrl: string;
  private requestTimeoutMs: number;
  private primaryAverageConfidenceFloor: number;
  private materialConfidenceFloor: number;
  private fallbackImprovementMargin: number;
  private forceFallbackEvaluation: boolean;
  private orientationRetryEnabled: boolean;
  private orientationRetryAngles: number[];
  private fetchImpl: typeof fetch;

  constructor(options: LocalOcrClientOptions = {}) {
    this.primaryUrl = normalizeUrl(options.primaryUrl ?? process.env.EVE_OCR_PADDLE_URL);
    this.fallbackUrl = normalizeUrl(options.fallbackUrl ?? process.env.EVE_OCR_DOCTR_URL);
    this.requestTimeoutMs = options.requestTimeoutMs ?? envNumber('EVE_OCR_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
    this.primaryAverageConfidenceFloor = options.primaryAverageConfidenceFloor ?? envNumber('EVE_OCR_AVG_CONFIDENCE_FLOOR', DEFAULT_AVG_FLOOR);
    this.materialConfidenceFloor = options.materialConfidenceFloor ?? envNumber('EVE_OCR_MATERIAL_CONFIDENCE_FLOOR', DEFAULT_MATERIAL_FLOOR);
    this.fallbackImprovementMargin = options.fallbackImprovementMargin ?? envNumber('EVE_OCR_FALLBACK_IMPROVEMENT_MARGIN', DEFAULT_IMPROVEMENT_MARGIN);
    this.forceFallbackEvaluation = options.forceFallbackEvaluation === true;
    this.orientationRetryEnabled = options.orientationRetryEnabled ?? envBoolean('EVE_OCR_ORIENTATION_RETRY_ENABLED', true);
    const configuredAngles = options.orientationRetryAngles?.length ? options.orientationRetryAngles : [90, 270, 180];
    this.orientationRetryAngles = Array.from(new Set(configuredAngles.map(Number).filter(angle => [90, 180, 270].includes(angle))));
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async call(url: string, input: LocalOcrInput, rotationDegrees = 0): Promise<LocalOcrEngineResult> {
    if (!url) throw new Error('LOCAL_OCR_ENDPOINT_NOT_CONFIGURED');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const response = await this.fetchImpl(`${url}/v1/ocr`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: input.filename,
          mimeType: input.mimeType,
          dataBase64: input.buffer.toString('base64'),
          sourceSha256: input.sourceSha256,
          rotationDegrees,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`LOCAL_OCR_HTTP_${response.status}:${body.slice(0, 300)}`);
      }
      const result = validateServiceResult(await response.json());
      if (result.sourceSha256.toLowerCase() !== input.sourceSha256.toLowerCase()) {
        throw new Error('LOCAL_OCR_SOURCE_HASH_MISMATCH');
      }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  private fallbackReasons(primary: LocalOcrEngineResult, quality: OcrQualityAssessment): string[] {
    const reasons: string[] = [];
    if (quality.regionCount === 0) reasons.push('PRIMARY_NO_TEXT_REGIONS');
    if (quality.averageConfidence < this.primaryAverageConfidenceFloor) {
      reasons.push(`PRIMARY_AVERAGE_CONFIDENCE_BELOW_${this.primaryAverageConfidenceFloor}`);
    }
    if (quality.materialMinimumConfidence !== null && quality.materialMinimumConfidence < this.materialConfidenceFloor) {
      reasons.push(`PRIMARY_MATERIAL_CONFIDENCE_BELOW_${this.materialConfidenceFloor}`);
    }
    if ((primary.warnings || []).length > 0) reasons.push('PRIMARY_WARNINGS_PRESENT');
    return reasons;
  }

  private finalQualityReasons(quality: OcrQualityAssessment): string[] {
    const reasons: string[] = [];
    if (quality.regionCount === 0) reasons.push('SELECTED_NO_TEXT_REGIONS');
    if (quality.averageConfidence < this.primaryAverageConfidenceFloor) {
      reasons.push(`SELECTED_AVERAGE_CONFIDENCE_BELOW_${this.primaryAverageConfidenceFloor}`);
    }
    if (quality.materialMinimumConfidence !== null && quality.materialMinimumConfidence < this.materialConfidenceFloor) {
      reasons.push(`SELECTED_MATERIAL_CONFIDENCE_BELOW_${this.materialConfidenceFloor}`);
    }
    return reasons;
  }

  public async recognize(input: LocalOcrInput): Promise<LocalOcrCompositeResult> {
    if (!this.primaryUrl && !this.fallbackUrl) {
      throw new Error('LOCAL_OCR_UNAVAILABLE: configure EVE_OCR_PADDLE_URL and/or EVE_OCR_DOCTR_URL');
    }

    const attempts: LocalOcrAttempt[] = [];
    let primary: LocalOcrEngineResult | undefined;
    let primaryQuality: OcrQualityAssessment | undefined;
    let primaryError: string | undefined;

    if (this.primaryUrl) {
      try {
        primary = await this.call(this.primaryUrl, input);
        primaryQuality = assessOcrQuality(primary);
        attempts.push({
          engine: primary.engine,
          url: this.primaryUrl,
          rotationDegrees: 0,
          selected: false,
          score: primaryQuality.score,
          averageConfidence: primaryQuality.averageConfidence,
          materialMinimumConfidence: primaryQuality.materialMinimumConfidence,
          regionCount: primaryQuality.regionCount,
          result: primary,
        });
      } catch (error: any) {
        primaryError = error?.message || String(error);
        attempts.push({
          engine: 'paddleocr', url: this.primaryUrl, rotationDegrees: 0, selected: false, score: null,
          averageConfidence: null, materialMinimumConfidence: null, regionCount: 0, error: primaryError,
        });
      }
    }

    const reasons = primary && primaryQuality ? this.fallbackReasons(primary, primaryQuality) : ['PRIMARY_UNAVAILABLE'];
    if (this.forceFallbackEvaluation && primary && this.fallbackUrl) reasons.push('FORCED_DUAL_ENGINE_EVALUATION');
    const shouldInvokeFallback = Boolean(this.fallbackUrl) && (this.forceFallbackEvaluation || !primary || reasons.length > 0);
    let fallback: LocalOcrEngineResult | undefined;
    let fallbackQuality: OcrQualityAssessment | undefined;

    if (shouldInvokeFallback) {
      try {
        fallback = await this.call(this.fallbackUrl, input);
        fallbackQuality = assessOcrQuality(fallback);
        attempts.push({
          engine: fallback.engine,
          url: this.fallbackUrl,
          rotationDegrees: 0,
          selected: false,
          score: fallbackQuality.score,
          averageConfidence: fallbackQuality.averageConfidence,
          materialMinimumConfidence: fallbackQuality.materialMinimumConfidence,
          regionCount: fallbackQuality.regionCount,
          result: fallback,
        });
      } catch (error: any) {
        attempts.push({
          engine: 'doctr', url: this.fallbackUrl, rotationDegrees: 0, selected: false, score: null,
          averageConfidence: null, materialMinimumConfidence: null, regionCount: 0,
          error: error?.message || String(error),
        });
      }
    }

    let selected: LocalOcrEngineResult | undefined = primary;
    if (!selected && fallback) selected = fallback;
    else if (selected && fallback && fallbackQuality && primaryQuality) {
      const fallbackMaterialBetter = fallbackQuality.materialMinimumConfidence !== null &&
        (primaryQuality.materialMinimumConfidence === null || fallbackQuality.materialMinimumConfidence >= primaryQuality.materialMinimumConfidence + this.fallbackImprovementMargin);
      const fallbackScoreBetter = fallbackQuality.score >= primaryQuality.score + this.fallbackImprovementMargin;
      if (fallbackMaterialBetter || fallbackScoreBetter) selected = fallback;
    }

    if (!selected) {
      throw new Error(`LOCAL_OCR_FAILED:${primaryError || 'primary unavailable'}; fallback=${attempts.find(a => a.engine === 'doctr')?.error || 'unavailable'}`);
    }

    let chosenQuality = assessOcrQuality(selected);
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
  }
}

export const localOcrClient = new LocalOcrClient();
