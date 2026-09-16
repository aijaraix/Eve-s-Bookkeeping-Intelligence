import base64
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
