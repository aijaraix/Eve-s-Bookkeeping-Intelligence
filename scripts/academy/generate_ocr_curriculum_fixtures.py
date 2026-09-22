#!/usr/bin/env python3
"""Generate deterministic synthetic receipt/invoice images for Academy OCR cases.

Requires Pillow 12.3.0 and the DejaVu Mono fonts at the paths below. These
fixtures contain no customer data. Generation is deliberately separate from
production application dependencies.
"""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import PIL
from PIL import Image, ImageDraw, ImageFilter, ImageFont

EXPECTED_PILLOW = '12.3.0'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'


def font(path: str, size: int):
    return ImageFont.truetype(path, size)


def write_image(path: Path, width: int, height: int, rows):
    image = Image.new('L', (width, height), 255)
    draw = ImageDraw.Draw(image)
    y = 60 if width == 900 else 55
    for text, font_path, size in rows:
        draw.text((60 if width == 900 else 55, y), text, font=font(font_path, size), fill=0)
        y += size + (18 if width == 900 else 20)
    data = BytesIO()
    image.save(data, 'PNG', optimize=True)
    payload = data.getvalue()
    path.write_bytes(payload)
    return hashlib.sha256(payload).hexdigest(), len(payload)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('output_dir')
    parser.add_argument('--include-degraded', action='store_true', help='also generate deterministic receipt degradation/orientation fixtures')
    args = parser.parse_args()
    if PIL.__version__ != EXPECTED_PILLOW:
        raise SystemExit(f'Pillow {EXPECTED_PILLOW} required for fixture reproducibility; found {PIL.__version__}')
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)

    receipt = [
        ('EVE TEST MARKET', BOLD, 42), ('123 ACADEMY WAY', FONT, 30), ('MIAMI FL 33101', FONT, 30),
        ('RECEIPT R-2026-0916', FONT, 30), ('DATE 09/16/2026', FONT, 30),
        ('OFFICE SUPPLIES $24.50', FONT, 30), ('PRINTER PAPER $18.00', FONT, 30), ('COFFEE $7.25', FONT, 30),
        ('SUBTOTAL $49.75', FONT, 30), ('SALES TAX $3.48', FONT, 30), ('TOTAL $53.23', BOLD, 40), ('VISA 4242 $53.23', FONT, 30),
    ]
    invoice = [
        ('SYNTHETIC OFFICE SUPPLY CO.', BOLD, 36), ('INVOICE INV-260916-1042', BOLD, 34),
        ('INVOICE DATE 09/16/2026', FONT, 28), ('DUE DATE 10/16/2026', FONT, 28),
        ('BILL TO EVE ACADEMY TEST CLIENT', FONT, 28), ('ACCOUNTING BINDERS 2 x $35.00 = $70.00', FONT, 26),
        ('ARCHIVE BOXES 5 x $12.00 = $60.00', FONT, 26), ('DOCUMENT BAGS 3 x $15.00 = $45.00', FONT, 26),
        ('SUBTOTAL $175.00', FONT, 30), ('SALES TAX $12.25', FONT, 30), ('TOTAL DUE $187.25', BOLD, 38),
        ('PURCHASE ORDER PO-EVE-1001', FONT, 28), ('CURRENCY USD', FONT, 28),
    ]
    for name, w, h, rows in [('receipt.png', 900, 1000, receipt), ('invoice.png', 1200, 1200, invoice)]:
        sha, size = write_image(out / name, w, h, rows)
        print(f'{name}\tbytes={size}\tsha256={sha}')

    if args.include_degraded:
        base = Image.open(out / 'receipt.png').convert('L')
        variants = []

        # Low-quality scan: downsample, mild blur, then aggressive JPEG compression.
        low_quality = base.resize((405, 450), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.7))
        variants.append(('receipt_low_quality.jpg', low_quality, 'JPEG', {'quality': 32, 'optimize': True}))

        # Orientation stress: a full 90-degree rotation with no EXIF correction hint.
        variants.append(('receipt_rotated_90.png', base.rotate(90, expand=True, fillcolor=255), 'PNG', {'optimize': True}))

        # Mild skew: retain all source content while rotating by six degrees.
        variants.append(('receipt_skewed_6deg.png', base.rotate(6, expand=True, fillcolor=255), 'PNG', {'optimize': True}))

        # Material glare/occlusion: cover the actual subtotal/tax/total block.
        glare = base.copy()
        ImageDraw.Draw(glare).rectangle((40, 445, 860, 610), fill=255)
        variants.append(('receipt_glare_totals.png', glare, 'PNG', {'optimize': True}))

        # Material crop: remove the receipt from immediately before subtotal onward.
        cropped = base.crop((0, 0, 900, 450))
        variants.append(('receipt_cropped_before_totals.png', cropped, 'PNG', {'optimize': True}))

        for name, image, image_format, options in variants:
            data = BytesIO()
            image.save(data, image_format, **options)
            payload = data.getvalue()
            (out / name).write_bytes(payload)
            print(f'{name}\twidth={image.width}\theight={image.height}\tbytes={len(payload)}\tsha256={hashlib.sha256(payload).hexdigest()}')


if __name__ == '__main__':
    main()
