import base64
import hashlib
import importlib.metadata
import os
import tempfile
import time
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from PIL import Image

APP_VERSION = "1.0.0"
ENGINE = os.getenv("OCR_ENGINE", "paddle").strip().lower()
MAX_INPUT_BYTES = int(os.getenv("OCR_MAX_INPUT_BYTES", str(25 * 1024 * 1024)))
CPU_THREADS = max(1, int(os.getenv("OCR_CPU_THREADS", "2")))

app = FastAPI(title="Eve Local OCR", version=APP_VERSION)
_model: Any = None


class OcrRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    mimeType: str = Field(default="application/octet-stream", max_length=128)
    dataBase64: str = Field(min_length=1)
    sourceSha256: str | None = Field(default=None, pattern=r"^[a-fA-F0-9]{64}$")


def package_version(name: str) -> str:
    try:
        return importlib.metadata.version(name)
    except Exception:
        return "unknown"


def clamp01(value: Any) -> float:
    try:
        return max(0.0, min(1.0, float(value)))
    except Exception:
        return 0.0


def normalize_bbox(x0: float, y0: float, x1: float, y1: float, width: int, height: int) -> dict[str, Any]:
    if width <= 0 or height <= 0:
        raise ValueError("Invalid image dimensions")
    x0n = max(0.0, min(1.0, x0 / width))
    y0n = max(0.0, min(1.0, y0 / height))
    x1n = max(0.0, min(1.0, x1 / width))
    y1n = max(0.0, min(1.0, y1 / height))
    return {
        "x": x0n,
        "y": y0n,
        "width": max(0.0, x1n - x0n),
        "height": max(0.0, y1n - y0n),
        "unit": "NORMALIZED",
    }


def decode_request(req: OcrRequest) -> tuple[bytes, str]:
    try:
        payload = base64.b64decode(req.dataBase64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="INVALID_BASE64") from exc
    if not payload:
        raise HTTPException(status_code=400, detail="EMPTY_INPUT")
    if len(payload) > MAX_INPUT_BYTES:
        raise HTTPException(status_code=413, detail="OCR_INPUT_TOO_LARGE")
    digest = hashlib.sha256(payload).hexdigest()
    if req.sourceSha256 and digest.lower() != req.sourceSha256.lower():
        raise HTTPException(status_code=409, detail="SOURCE_HASH_MISMATCH")
    return payload, digest


def ensure_supported_image(req: OcrRequest, payload: bytes) -> tuple[int, int, str]:
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


def get_paddle_model() -> Any:
    global _model
    if _model is not None:
        return _model
    from paddleocr import PaddleOCR

    det_name = os.getenv("PADDLE_OCR_DET_MODEL") or None
    rec_name = os.getenv("PADDLE_OCR_REC_MODEL") or None
    kwargs: dict[str, Any] = {
        "lang": os.getenv("PADDLE_OCR_LANG", "en"),
        "device": "cpu",
        "engine": "paddle_static",
        # Physically required on Eve's current CPU host; default oneDNN/PIR path failed.
        "enable_mkldnn": False,
        "cpu_threads": CPU_THREADS,
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,
        "use_textline_orientation": False,
    }
    if det_name:
        kwargs["text_detection_model_name"] = det_name
    if rec_name:
        kwargs["text_recognition_model_name"] = rec_name
    _model = PaddleOCR(**kwargs)
    return _model


def paddle_ocr(path: str, image_width: int, image_height: int) -> dict[str, Any]:
    model = get_paddle_model()
    raw_results = list(model.predict(path))
    pages: list[dict[str, Any]] = []
    for page_idx, result in enumerate(raw_results, start=1):
        payload = getattr(result, "json", None)
        if callable(payload):
            payload = payload()
        if not isinstance(payload, dict):
            try:
                payload = dict(result)
            except Exception:
                payload = {}
        res = payload.get("res", payload)
        texts = list(res.get("rec_texts") or [])
        scores = list(res.get("rec_scores") or [])
        boxes = list(res.get("rec_boxes") or [])
        polys = list(res.get("rec_polys") or res.get("dt_polys") or [])
        regions: list[dict[str, Any]] = []
        for idx, text in enumerate(texts):
            if not str(text).strip():
                continue
            if idx < len(boxes) and len(boxes[idx]) >= 4:
                x0, y0, x1, y1 = [float(v) for v in boxes[idx][:4]]
            elif idx < len(polys) and polys[idx]:
                xs = [float(p[0]) for p in polys[idx]]
                ys = [float(p[1]) for p in polys[idx]]
                x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
            else:
                continue
            polygon = []
            if idx < len(polys) and polys[idx]:
                polygon = [[float(p[0]) / image_width, float(p[1]) / image_height] for p in polys[idx]]
            regions.append(
                {
                    "regionId": f"p{page_idx}-r{idx + 1}",
                    "text": str(text),
                    "confidence": clamp01(scores[idx] if idx < len(scores) else 0.0),
                    "boundingBox": normalize_bbox(x0, y0, x1, y1, image_width, image_height),
                    "polygon": polygon,
                }
            )
        pages.append(
            {
                "pageNumber": int(res.get("page_index") or (page_idx - 1)) + 1,
                "width": image_width,
                "height": image_height,
                "regions": regions,
            }
        )
    return {
        "engine": "paddleocr",
        "engineVersion": package_version("paddleocr"),
        "model": os.getenv("PADDLE_OCR_MODEL_LABEL", "PP-OCRv6-medium"),
        "pages": pages,
        "warnings": [],
    }


def get_doctr_model() -> Any:
    global _model
    if _model is not None:
        return _model
    from doctr.models import ocr_predictor

    _model = ocr_predictor(pretrained=True, assume_straight_pages=True)
    return _model


def doctr_ocr(path: str) -> dict[str, Any]:
    from doctr.io import DocumentFile

    model = get_doctr_model()
    result = model(DocumentFile.from_images(path)).export()
    pages: list[dict[str, Any]] = []
    for page_idx, page in enumerate(result.get("pages") or [], start=1):
        dims = page.get("dimensions") or (0, 0)
        height, width = int(dims[0] or 0), int(dims[1] or 0)
        regions: list[dict[str, Any]] = []
        region_idx = 0
        for block in page.get("blocks") or []:
            for line in block.get("lines") or []:
                words = line.get("words") or []
                if not words:
                    continue
                region_idx += 1
                text = " ".join(str(w.get("value") or "") for w in words).strip()
                confidences = [clamp01(w.get("confidence")) for w in words if w.get("confidence") is not None]
                confidence = sum(confidences) / len(confidences) if confidences else 0.0
                geometry = line.get("geometry")
                if geometry and len(geometry) == 2:
                    (x0, y0), (x1, y1) = geometry
                    bbox = {
                        "x": clamp01(x0),
                        "y": clamp01(y0),
                        "width": max(0.0, clamp01(x1) - clamp01(x0)),
                        "height": max(0.0, clamp01(y1) - clamp01(y0)),
                        "unit": "NORMALIZED",
                    }
                else:
                    # A line without geometry is not usable as source-to-pixel evidence.
                    continue
                regions.append(
                    {
                        "regionId": f"p{page_idx}-r{region_idx}",
                        "text": text,
                        "confidence": confidence,
                        "boundingBox": bbox,
                        "polygon": [],
                    }
                )
        pages.append({"pageNumber": page_idx, "width": width, "height": height, "regions": regions})
    return {
        "engine": "doctr",
        "engineVersion": package_version("python-doctr"),
        "model": os.getenv("DOCTR_OCR_MODEL_LABEL", "fast_base+crnn_vgg16_bn"),
        "pages": pages,
        "warnings": [],
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "eve-local-ocr",
        "version": APP_VERSION,
        "engine": ENGINE,
        "modelLoaded": _model is not None,
        "cpuThreads": CPU_THREADS,
    }


@app.post("/v1/ocr")
def recognize(req: OcrRequest) -> dict[str, Any]:
    payload, digest = decode_request(req)
    _, _, suffix = ensure_supported_image(req, payload)
    started = time.perf_counter()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as fh:
        fh.write(payload)
        path = fh.name
    try:
        with Image.open(path) as image:
            width, height = image.size
        if ENGINE == "paddle":
            out = paddle_ocr(path, width, height)
        elif ENGINE == "doctr":
            out = doctr_ocr(path)
        else:
            raise HTTPException(status_code=500, detail=f"UNSUPPORTED_OCR_ENGINE:{ENGINE}")
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
