# Eve Local OCR Services

This directory contains the self-hosted OCR boundary used by Eve Bookkeeping.

## Architecture

Two independent CPU-local services expose the same API:

- PaddleOCR (`Dockerfile.paddle`) — primary OCR engine.
- docTR (`Dockerfile.doctr`) — fallback / disagreement engine.

Eve's Node application never consumes vendor-specific OCR result shapes. It calls `POST /v1/ocr` and receives normalized pages, regions, confidence and bounding boxes. `src/lib/ocr/localOcrClient.ts` owns routing between the primary and fallback services.

## Request

`POST /v1/ocr`

```json
{
  "filename": "receipt.png",
  "mimeType": "image/png",
  "dataBase64": "...",
  "sourceSha256": "64-hex-source-hash"
}
```

The service recomputes SHA-256 and rejects a mismatched hash.

## Response

Each engine returns the same shape:

```json
{
  "engine": "paddleocr",
  "engineVersion": "3.7.0",
  "model": "PP-OCRv6-medium",
  "sourceSha256": "...",
  "elapsedMs": 123,
  "pages": [
    {
      "pageNumber": 1,
      "width": 1200,
      "height": 1800,
      "regions": [
        {
          "regionId": "p1-r1",
          "text": "TOTAL $57.05",
          "confidence": 0.99,
          "boundingBox": {
            "x": 0.61,
            "y": 0.82,
            "width": 0.24,
            "height": 0.04,
            "unit": "NORMALIZED"
          }
        }
      ]
    }
  ]
}
```

## CPU constraints verified on Eve

Current Eve host: 4 vCPU, ~14 GB RAM, no NVIDIA GPU.

Physical smoke tests on 2026-09-16 verified both engines locally on that profile.

PaddleOCR requires the CPU-safe settings used in `app.py`:

- `device=cpu`
- `engine=paddle_static`
- `enable_mkldnn=False`
- bounded CPU threads

The default oneDNN/PIR path failed on the current host, so do not remove that setting without a new physical runtime verification.

docTR uses CPU-only PyTorch wheels. Do not replace the CPU index with generic CUDA-capable PyTorch wheels on the current server.

## Runtime configuration

Eve Node process:

- `EVE_OCR_PADDLE_URL=http://<paddle-service>:8765`
- `EVE_OCR_DOCTR_URL=http://<doctr-service>:8765`
- `EVE_OCR_TIMEOUT_MS=120000`
- `EVE_OCR_AVG_CONFIDENCE_FLOOR=0.90`
- `EVE_OCR_MATERIAL_CONFIDENCE_FLOOR=0.85`
- `EVE_OCR_FALLBACK_IMPROVEMENT_MARGIN=0.02`

OCR services:

- `OCR_CPU_THREADS=2`
- `OCR_MAX_INPUT_BYTES=26214400`

Optional Paddle model overrides:

- `PADDLE_OCR_DET_MODEL`
- `PADDLE_OCR_REC_MODEL`
- `PADDLE_OCR_MODEL_LABEL`

## Routing policy

PaddleOCR is called first. docTR is called only when the primary service fails, returns no regions, has low average confidence, has low confidence on accounting-like numeric/material text, or returns warnings. Eve preserves both attempts when fallback is invoked and selects the fallback only when it materially improves the quality score.

This is deliberately not a majority-vote system. Downstream accounting reconciliation and clarification rules remain responsible for unresolved semantic/numeric ambiguity.

## Evidence contract

`OCRParser` converts selected OCR regions into `ImageSourceCoordinate` + `SourceValueProvenance` records. Every promoted value must retain:

- original source SHA-256
- image dimensions
- exact normalized bounding box
- OCR literal
- confidence
- engine + version
- parent provenance IDs through fact/calculation/render lineage

The real customer/operator UI must preserve these coordinates through the fact persistence boundary and display them in the Source-to-Pixel Provenance drawer.

## Current format scope

This implementation establishes first-class direct image OCR (`PNG/JPEG/WEBP/TIFF/BMP`). Native-text PDF parsing remains deterministic in `AnyDocParser`. Image-only/scanned PDF page rendering into this same OCR contract is a follow-on integration and must not be represented as complete until physically verified.
