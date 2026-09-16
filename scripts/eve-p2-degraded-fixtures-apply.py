from pathlib import Path

p = Path('scripts/academy/generate_ocr_curriculum_fixtures.py')
text = p.read_text()
text = text.replace('from PIL import Image, ImageDraw, ImageFont', 'from PIL import Image, ImageDraw, ImageFilter, ImageFont')
text = text.replace(
"""    parser = argparse.ArgumentParser()
    parser.add_argument('output_dir')
    args = parser.parse_args()
""",
"""    parser = argparse.ArgumentParser()
    parser.add_argument('output_dir')
    parser.add_argument('--include-degraded', action='store_true', help='also generate deterministic receipt degradation/orientation fixtures')
    args = parser.parse_args()
""")
text = text.replace(
"""    for name, w, h, rows in [('receipt.png', 900, 1000, receipt), ('invoice.png', 1200, 1200, invoice)]:
        sha, size = write_image(out / name, w, h, rows)
        print(f'{name}\\tbytes={size}\\tsha256={sha}')


if __name__ == '__main__':
""",
"""    for name, w, h, rows in [('receipt.png', 900, 1000, receipt), ('invoice.png', 1200, 1200, invoice)]:
        sha, size = write_image(out / name, w, h, rows)
        print(f'{name}\\tbytes={size}\\tsha256={sha}')

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
            print(f'{name}\\twidth={image.width}\\theight={image.height}\\tbytes={len(payload)}\\tsha256={hashlib.sha256(payload).hexdigest()}')


if __name__ == '__main__':
""")
p.write_text(text)

Path('server/tests/degradedOcrFixtureGenerator.test.ts').write_text(r'''import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync('scripts/academy/generate_ocr_curriculum_fixtures.py', 'utf8');
for (const required of [
  '--include-degraded',
  'receipt_low_quality.jpg',
  'receipt_rotated_90.png',
  'receipt_skewed_6deg.png',
  'receipt_glare_totals.png',
  'receipt_cropped_before_totals.png',
  'GaussianBlur(0.7)',
  'rectangle((40, 445, 860, 610)',
  'crop((0, 0, 900, 450))',
]) {
  assert.ok(generator.includes(required), `missing deterministic degraded fixture recipe: ${required}`);
}
assert.ok(generator.includes("EXPECTED_PILLOW = '12.3.0'"));
console.log('DEGRADED_OCR_FIXTURE_GENERATOR_TESTS=PASS');
''')

print('DEGRADED_OCR_FIXTURE_PATCH_APPLIED')
