#!/usr/bin/env bash
set -euo pipefail
python3 scripts/eve-p2-mixed-source-batch-apply.py
python3 scripts/eve-p2-mixed-source-batch-fix1.py
python3 scripts/eve-p2-mixed-source-batch-fix2.py
git diff --check
npm ci
python3 -m pip install --user --quiet 'Pillow==12.3.0'

rm -rf "$MIXED_SOURCE_BATCH_ACCEPTANCE_EVIDENCE_DIR"
mkdir -p "$MIXED_SOURCE_BATCH_ACCEPTANCE_EVIDENCE_DIR"
python3 scripts/academy/generate_ocr_curriculum_fixtures.py "$MIXED_SOURCE_BATCH_ACCEPTANCE_EVIDENCE_DIR" >"$MIXED_SOURCE_BATCH_ACCEPTANCE_EVIDENCE_DIR/receipt-generation.txt"
python3 - <<'PY'
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import hashlib, json, os
root=Path(os.environ['MIXED_SOURCE_BATCH_ACCEPTANCE_EVIDENCE_DIR']); receipt=root/'receipt.png'
sha=hashlib.sha256(receipt.read_bytes()).hexdigest(); assert sha=='bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436'
draw=ImageDraw.Draw(Image.open(receipt).convert('L')); font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',40); x0,y0,x1,y1=draw.textbbox((60,552),'TOTAL $53.23',font=font)
(root/'source-region.json').write_text(json.dumps({'marker':'RECEIPT_FIXTURE_SOURCE_REGION=PASS','sourceSha256':sha,'filename':'receipt.png','imageWidth':900,'imageHeight':1000,'pixelBoundingBox':{'x':x0,'y':y0,'width':x1-x0,'height':y1-y0},'normalizedBoundingBox':{'x':x0/900,'y':y0/1000,'width':(x1-x0)/900,'height':(y1-y0)/1000,'unit':'NORMALIZED'},'rawLiteral':'TOTAL $53.23','transformId':'academy-fixture-glyph-bbox-v1'},indent=2))
print('MIXED_BATCH_RECEIPT_EXACT_SOURCE=PASS')
PY

npx tsx server/tests/generateMixedSourceBatchFixtures.ts
npx tsx server/tests/mixedSourceBatchEvidenceEngine.test.ts
npx tsx server/tests/mixedSourceBatchDeliverableTruth.test.ts

REG=/tmp/eve-mixed-spreadsheet-receipt-batch-regression
rm -rf "$REG" && mkdir -p "$REG"
python3 scripts/academy/generate_ocr_curriculum_fixtures.py "$REG" >/dev/null
REG="$REG" python3 - <<'PY'
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os, hashlib, json
root=Path(os.environ['REG']); receipt=root/'receipt.png'; sha=hashlib.sha256(receipt.read_bytes()).hexdigest(); assert sha=='bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436'
draw=ImageDraw.Draw(Image.open(receipt).convert('L')); font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',40); x0,y0,x1,y1=draw.textbbox((60,552),'TOTAL $53.23',font=font)
(root/'source-region.json').write_text(json.dumps({'marker':'RECEIPT_FIXTURE_SOURCE_REGION=PASS','sourceSha256':sha,'filename':'receipt.png','imageWidth':900,'imageHeight':1000,'pixelBoundingBox':{'x':x0,'y':y0,'width':x1-x0,'height':y1-y0},'normalizedBoundingBox':{'x':x0/900,'y':y0/1000,'width':(x1-x0)/900,'height':(y1-y0)/1000,'unit':'NORMALIZED'},'rawLiteral':'TOTAL $53.23','transformId':'academy-fixture-glyph-bbox-v1'},indent=2))
PY
MIXED_SOURCE_ACCEPTANCE_EVIDENCE_DIR="$REG" RECEIPT_ACCEPTANCE_EVIDENCE_DIR="$REG" npx tsx server/tests/generateMixedSpreadsheetReceiptFixtures.ts
MIXED_SOURCE_ACCEPTANCE_EVIDENCE_DIR="$REG" RECEIPT_ACCEPTANCE_EVIDENCE_DIR="$REG" npx tsx server/tests/mixedSpreadsheetReceiptReconciliation.test.ts
MIXED_SOURCE_ACCEPTANCE_EVIDENCE_DIR="$REG" RECEIPT_ACCEPTANCE_EVIDENCE_DIR="$REG" npx tsx server/tests/mixedSpreadsheetReceiptDeliverableTruth.test.ts

export TRIAL_BALANCE_ACCEPTANCE_EVIDENCE_DIR=/tmp/eve-trial-balance-batch-regression
rm -rf "$TRIAL_BALANCE_ACCEPTANCE_EVIDENCE_DIR"
npx tsx server/tests/generateTrialBalanceCurriculumFixtures.ts
npx tsx server/tests/spreadsheetSourceToPixelLineage.test.ts
npx tsx server/tests/trialBalanceInterpretationEngine.test.ts
npx tsx server/tests/trialBalanceDeliverableTruth.test.ts
npx tsx server/tests/trialBalanceRuntimeIntegration.test.ts
npx tsx server/tests/trialBalanceContinuationRuntime.test.ts

REG=/tmp/eve-receipt-batch-regression
rm -rf "$REG" && mkdir -p "$REG"
python3 scripts/academy/generate_ocr_curriculum_fixtures.py "$REG" >/dev/null
REG="$REG" python3 - <<'PY'
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os, hashlib, json
root=Path(os.environ['REG']); receipt=root/'receipt.png'; sha=hashlib.sha256(receipt.read_bytes()).hexdigest(); assert sha=='bdd93a72a51d82cc5df6c6a8989db023e9b45b1f18344e43054647851e173436'
draw=ImageDraw.Draw(Image.open(receipt).convert('L')); font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',40); x0,y0,x1,y1=draw.textbbox((60,552),'TOTAL $53.23',font=font)
(root/'source-region.json').write_text(json.dumps({'marker':'RECEIPT_FIXTURE_SOURCE_REGION=PASS','sourceSha256':sha,'filename':'receipt.png','imageWidth':900,'imageHeight':1000,'pixelBoundingBox':{'x':x0,'y':y0,'width':x1-x0,'height':y1-y0},'normalizedBoundingBox':{'x':x0/900,'y':y0/1000,'width':(x1-x0)/900,'height':(y1-y0)/1000,'unit':'NORMALIZED'},'rawLiteral':'TOTAL $53.23','transformId':'academy-fixture-glyph-bbox-v1'},indent=2))
PY
RECEIPT_ACCEPTANCE_EVIDENCE_DIR="$REG" npx tsx server/tests/receiptDeliverableTruth.test.ts

export BANK_STATEMENT_ACCEPTANCE_EVIDENCE_DIR=/tmp/eve-bank-batch-regression
rm -rf "$BANK_STATEMENT_ACCEPTANCE_EVIDENCE_DIR"
npx tsx server/tests/generateBankStatementCurriculumFixtures.ts
npx tsx server/tests/bankStatementCompletenessAdapter.test.ts
npx tsx server/tests/bankStatementDeliverableTruth.test.ts
npx tsx server/tests/invoiceApInterpretationEngine.test.ts
npx tsx server/tests/documentIntelligenceInvoiceTruth.test.ts
npx tsx server/tests/invoiceApDeliverableTruth.test.ts

npx tsx server/tests/taskEvidenceSufficiency.test.ts
npx tsx server/tests/sufficiencyClarificationCoordinator.test.ts
timeout 30s npx tsx server/tests/sufficiencyClarificationRoutes.test.ts
npx tsx server/tests/fiveDimensionAcademyCurriculum.test.ts
npx tsx server/tests/fiveDimensionAcademyGrading.test.ts
npx tsx server/tests/academyOcrCurriculumRunner.test.ts
npx tsx server/tests/ocrParserEvidence.test.ts
npx tsx server/tests/ocrOrientationRetry.test.ts
npx tsx server/tests/ocrFailClosedQualityGate.test.ts
npx tsx server/tests/pdfOcrFallback.test.ts
npx tsx server/tests/universalSourceEvidenceContract.test.ts
npx tsx server/tests/academySpecialistRetry.test.ts
npx tsx server/tests/phasePackageB2RealAgentExecution.test.ts
npx tsx src/adapters/presentationAdapters.test.ts
npx tsx server/tests/academyDashboardTruthAuditor.test.ts
npm run build

CHROME_BIN="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)"
if [ -z "$CHROME_BIN" ]; then echo MISSING_BROWSER_EXECUTABLE; exit 1; fi
export CHROME_BIN
npx vite preview --host 127.0.0.1 --port 4173 >/tmp/eve-batch-preview.log 2>&1 &
PREVIEW_PID=$!
trap 'kill $PREVIEW_PID 2>/dev/null || true' EXIT
for i in $(seq 1 30); do if curl -fsS http://127.0.0.1:4173/ >/dev/null; then break; fi; sleep 1; done
curl -fsS http://127.0.0.1:4173/ >/dev/null
npx tsx server/tests/mixedSourceBatchProductTruthBrowser.test.ts
kill $PREVIEW_PID 2>/dev/null || true
wait $PREVIEW_PID 2>/dev/null || true
trap - EXIT
npx tsx server/tests/mixedSourceBatchFiveDimensionAcceptance.test.ts
