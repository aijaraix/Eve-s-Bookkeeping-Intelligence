import crypto from "crypto";
import { CanonicalDocumentModel, FileInspectionResult } from "./types.js";
import { localOcrClient, LocalOcrClient, LocalOcrCompositeResult } from "../ocr/localOcrClient.js";
import { ImageSourceCoordinate, SourceValueProvenance } from "../evidence/universalSourceEvidence.js";

interface OcrLineEvidence {
  provenanceId: string;
  pageNumber: number;
  text: string;
  confidence: number;
  coordinate: ImageSourceCoordinate;
}

export class OCRParser {
  constructor(private readonly client: Pick<LocalOcrClient, "recognize"> = localOcrClient) {}

  public async parse(
    fileInput: {
      filename?: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
      buffer?: Buffer;
      [key: string]: any;
    },
    inspection?: FileInspectionResult | any
  ): Promise<CanonicalDocumentModel> {
    const filename = fileInput.filename || fileInput.originalName || "image.png";
    const originalName = fileInput.originalName || filename;
    const buffer = Buffer.isBuffer(fileInput.buffer) ? fileInput.buffer : Buffer.alloc(0);
    if (!buffer.length) throw new Error("OCR_SOURCE_BYTES_REQUIRED");

    const sourceSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const sourceArtifactId = `artifact-image-${sourceSha256.slice(0, 24)}`;
    const docId = `doc-ocr-${sourceSha256.slice(0, 16)}-${Date.now()}`;
    const mimeType = fileInput.mimeType || inspection?.mimeType || "application/octet-stream";

    const result: LocalOcrCompositeResult = await this.client.recognize({
      filename: originalName,
      mimeType,
      buffer,
      sourceSha256,
    });

    const sourceValueProvenance: SourceValueProvenance[] = [];
    const ocrLines: OcrLineEvidence[] = [];
    const pages: Array<{ page_number: number; text: string; tables: any[] }> = [];
    const sourceBlocks: any[] = [];
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const page of result.pages) {
      const pageLines: string[] = [];
      for (const region of page.regions) {
        const text = String(region.text || "").trim();
        if (!text) continue;
        const safeRegionId = String(region.regionId || `p${page.pageNumber}-r${ocrLines.length + 1}`).replace(/[^a-zA-Z0-9_.-]/g, "-");
        const coordinateId = `coord-${sourceSha256.slice(0, 16)}-p${page.pageNumber}-${safeRegionId}`;
        const provenanceId = `prov-${sourceSha256.slice(0, 16)}-p${page.pageNumber}-${safeRegionId}`;
        const coordinate: ImageSourceCoordinate = {
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
        const provenance: SourceValueProvenance = {
          provenanceId,
          lineageKind: "SOURCE_OBSERVATION",
          materiality: "UNKNOWN",
          coordinates: [coordinate],
          parentProvenanceIds: [],
          rawLiteral: text,
          normalizedValue: text,
          transformationSteps: [{
            stepId: `step-ocr-${provenanceId}`,
            operation: "OCR",
            inputLiteral: sourceSha256,
            outputLiteral: text,
            engine: result.engine,
            engineVersion: result.engineVersion,
            notes: result.model ? `model=${result.model}` : undefined,
          }],
          verificationState: region.confidence >= 0.90 ? "VERIFIED" : "REVIEW_REQUIRED",
          presentationUsages: [],
          createdAt: new Date().toISOString(),
        };
        sourceValueProvenance.push(provenance);
        ocrLines.push({ provenanceId, pageNumber: page.pageNumber, text, confidence: region.confidence, coordinate });
        sourceBlocks.push({
          source_block_id: `SB-${docId}-P${page.pageNumber}-${safeRegionId}`,
          document_id: docId,
          page_number: page.pageNumber,
          section: "OCR Text Region",
          raw_text: text,
          text_content: text,
          evidence_scope: "OCR_REGION",
          source_format: inspection?.detectedType || "image",
          source_artifact_id: sourceArtifactId,
          source_sha256: sourceSha256,
          source_provenance_id: provenanceId,
          source_coordinate: coordinate,
          confidence: region.confidence,
          ocr_engine: result.engine,
          ocr_engine_version: result.engineVersion,
        });
        pageLines.push(text);
        totalConfidence += Number(region.confidence) || 0;
        confidenceCount++;
      }
      pages.push({ page_number: page.pageNumber, text: pageLines.join("\n"), tables: [] });
    }

    const text = pages.map(page => page.text).filter(Boolean).join("\n");
    const averageConfidence = confidenceCount ? totalConfidence / confidenceCount : 0;

    return {
      document_id: docId,
      source: {
        filename,
        originalName,
        format: inspection?.detectedType || "image",
        hash: sourceSha256,
        sourceArtifactId,
        access_timestamp: new Date().toISOString()
      },
      parser: {
        engine: "eve-local-ocr-router",
        version: "1.0",
        ocr_used: true,
        confidence: averageConfidence,
        selectedEngine: result.engine,
        selectedEngineVersion: result.engineVersion,
        selectedModel: result.model,
        fallbackInvoked: result.routingDecision.fallbackInvoked,
        fallbackReasons: result.routingDecision.reasons,
      },
      metadata: {
        entityName: filename.replace(/\.[^/.]+$/, ""),
        page_count: pages.length || 1,
        pages: pages.length || 1,
        detectedType: "ocr_image",
        ocrEngine: result.engine,
        ocrEngineVersion: result.engineVersion,
        ocrModel: result.model,
        ocrAverageConfidence: averageConfidence,
        ocrRegions: ocrLines.length,
      },
      raw_text: text,
      markdown: text,
      pages,
      page_count: pages.length || 1,
      pageManifests: (pages.length ? pages : [{ page_number: 1, text: "", tables: [] }]).map(page => ({
        page_number: page.page_number,
        native_text_available: false,
        ocr_used: true,
        ocr_engine: result.engine,
      })),
      tables: [],
      sourceBlocks,
      source_blocks: sourceBlocks,
      sourceValueProvenance,
      ocrLines,
      ocrRoutingDecision: result.routingDecision,
      ocrEngineResults: result.attempts.map(attempt => ({
        engine: attempt.engine,
        selected: attempt.selected,
        score: attempt.score,
        averageConfidence: attempt.averageConfidence,
        materialMinimumConfidence: attempt.materialMinimumConfidence,
        regionCount: attempt.regionCount,
        error: attempt.error,
        result: attempt.result,
      })),
      sections: pages.filter(page => page.text).map(page => ({ title: `OCR Page ${page.page_number}`, text: page.text, page: page.page_number }))
    };
  }
}
