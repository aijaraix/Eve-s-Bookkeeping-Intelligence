import base64
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
