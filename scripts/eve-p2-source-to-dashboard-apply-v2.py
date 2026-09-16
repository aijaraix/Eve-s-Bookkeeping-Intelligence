#!/usr/bin/env python3
from pathlib import Path
import runpy

try:
    runpy.run_path('scripts/eve-p2-source-to-dashboard-apply.py', run_name='__main__')
except SystemExit as exc:
    message = str(exc)
    if 'PATCH_ANCHOR_MISSING:server/cpaOrganization/academyMinervaLab.ts' not in message:
        raise


def replace_once(path, old, new):
    p=Path(path); text=p.read_text()
    if old not in text: raise SystemExit(f'V2_PATCH_ANCHOR_MISSING:{path}:{old[:100]!r}')
    if text.count(old)!=1: raise SystemExit(f'V2_PATCH_ANCHOR_NOT_UNIQUE:{path}:{text.count(old)}')
    p.write_text(text.replace(old,new,1))

replace_once('server/cpaOrganization/academyMinervaLab.ts',
"""        'PHYSICAL_FIXTURE_REQUIRED',
        ['docs/launch/evidence/2026-09-16_SPREADSHEET_SOURCE_TO_PIXEL_LINEAGE_ACCEPTANCE.md', 'docs/launch/evidence/2026-09-16_LOCAL_OCR_SOURCE_TO_PIXEL_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-DELIVERABLE-FINAL-LINEAGE',
""",
"""        'CONTRACT_READY',
        ['server/tests/sourceToDashboardPresentationIntegrity.test.ts', 'server/tests/sourceToDashboardProductTruthBrowser.test.ts', 'server/tests/sourceToDashboardCurriculumAcceptance.test.ts', 'docs/launch/evidence/2026-09-16_P2_SOURCE_TO_DASHBOARD_PRODUCT_TRUTH_ACCEPTANCE.md']
      ),
      caseSpec(
        'CURR-DELIVERABLE-FINAL-LINEAGE',
""")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',
"assert.equal(coverage.contractReadyCases, 18);\nassert.equal(coverage.physicalFixturePendingCases, 2);",
"assert.equal(coverage.contractReadyCases, 19);\nassert.equal(coverage.physicalFixturePendingCases, 1);")
replace_once('server/tests/fiveDimensionAcademyCurriculum.test.ts',
"assert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').expectedSafeguards.join(' ').includes('actual browser-rendered value'));",
"assert.equal(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').fixtureStatus, 'CONTRACT_READY');\nassert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').expectedSafeguards.join(' ').includes('actual browser-rendered value'));\nassert.ok(find('CURR-PRODUCT-SOURCE-TO-DASHBOARD').validationRefs.includes('server/tests/sourceToDashboardProductTruthBrowser.test.ts'));")
print('SOURCE_TO_DASHBOARD_PATCH_V2_APPLIED')
