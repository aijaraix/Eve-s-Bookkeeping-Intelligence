#!/usr/bin/env python3
from pathlib import Path
from io import BytesIO
import hashlib
import json
import os
from PIL import Image

OUT = Path(os.environ.get('OCR_EDGE_ACCEPTANCE_DIR', '/tmp/eve-ocr-edge-cases'))
EXPECTED = {
    'receipt.png': 'bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436',
    'invoice.png': '1000426f9989dd8aa2767d57c10248648a770aa05d957d04940fd1463e0cf105',
    'receipt_low_quality.jpg': 'a1f03b9bdda7e8d8eae67d924a62de679a8d5fa6e6d0e94967b2cfd7d417de9c',
    'receipt_rotated_90.png': '9f2496573071e396c8452534bf5afe67ddf0d676a0907919820733418609a698',
    'receipt_skewed_6deg.png': 'ec635a9f1cbb49d89afb0308339e50f591ed2a23d29d44fd8e754279eec4ce0a',
    'receipt_glare_totals.png': '49fac9e0a910f8b8b3f8cd130569cc8732bd15783ddb6611514edb4cd667072a',
    'receipt_cropped_before_totals.png': '017e27b1bdcf1d5045512fe82a2f577cb44e841bdf992405061c55781fa8eaed',
}

def sha(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

manifest = {'marker': 'P2_OCR_EDGE_PHYSICAL_SOURCE_CONTRACT=PASS', 'files': {}}
for name, expected in EXPECTED.items():
    path = OUT / name
    if not path.exists():
        raise SystemExit(f'MISSING_FIXTURE:{name}')
    actual = sha(path)
    if actual != expected:
        raise SystemExit(f'HASH_MISMATCH:{name}:{actual}:{expected}')
    with Image.open(path) as im:
        manifest['files'][name] = {'sha256': actual, 'bytes': path.stat().st_size, 'width': im.width, 'height': im.height}

# The known 90-degree fixture is reversible to the already-live-proven upright bytes.
with Image.open(OUT / 'receipt_rotated_90.png') as im:
    corrected = im.rotate(270, expand=True, fillcolor=255)
    buf = BytesIO()
    corrected.save(buf, 'PNG', optimize=True)
    corrected_bytes = buf.getvalue()
    if corrected_bytes != (OUT / 'receipt.png').read_bytes():
        raise SystemExit('ROTATION_270_DID_NOT_RESTORE_UPRIGHT_BYTES')
manifest['rotation270RestoresAcceptedReceiptBytes'] = True

# Glare fixture physically erases the material subtotal/tax/total region.
with Image.open(OUT / 'receipt_glare_totals.png').convert('L') as glare:
    material = glare.crop((40, 445, 860, 610))
    extrema = material.getextrema()
    if extrema != (255, 255):
        raise SystemExit(f'GLARE_MATERIAL_REGION_NOT_FULLY_OCCLUDED:{extrema}')
manifest['glareMaterialRegion'] = {'bbox': [40, 445, 860, 610], 'extrema': list(extrema), 'fullyOccluded': True}

# Crop fixture physically ends before the subtotal/tax/total block.
with Image.open(OUT / 'receipt_cropped_before_totals.png') as cropped:
    if (cropped.width, cropped.height) != (900, 450):
        raise SystemExit(f'CROP_DIMENSIONS_UNEXPECTED:{cropped.size}')
manifest['crop'] = {'width': 900, 'height': 450, 'materialTotalsPhysicallyAbsent': True}

# Low-quality and skew fixtures remain exact deterministic physical sources.
with Image.open(OUT / 'receipt_low_quality.jpg') as low:
    if (low.width, low.height) != (405, 450):
        raise SystemExit(f'LOW_QUALITY_DIMENSIONS_UNEXPECTED:{low.size}')
manifest['lowQualityDeterministic'] = True
manifest['skewDeterministic'] = True
manifest['durablePhysicalEvidenceRefs'] = [
    'docs/launch/evidence/2026-09-16_P2_DEGRADED_OCR_FIXTURES_ACCEPTANCE.md',
    'docs/launch/evidence/2026-09-16_P2_OCR_ORIENTATION_RETRY_ACCEPTANCE.md',
    'docs/launch/evidence/2026-09-16_P2_OCR_CURRICULUM_RECEIPT_INVOICE_ACCEPTANCE.md',
]
(OUT / 'physical-source-contract.json').write_text(json.dumps(manifest, indent=2))
print('P2_OCR_EDGE_PHYSICAL_SOURCE_CONTRACT=PASS')
