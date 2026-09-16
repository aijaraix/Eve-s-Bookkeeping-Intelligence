#!/usr/bin/env python3
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
