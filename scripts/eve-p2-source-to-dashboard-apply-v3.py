#!/usr/bin/env python3
from pathlib import Path
import runpy
runpy.run_path('scripts/eve-p2-source-to-dashboard-apply-v2.py', run_name='__main__')
p=Path('server/tests/sourceToDashboardProductTruthBrowser.test.ts'); text=p.read_text()
old="""await page.click(receiptCell.sel);await page.waitForSelector('[role=\"dialog\"]',{visible:true,timeout:10000});text=await page.$eval('[role=\"dialog\"]',el=>(el as HTMLElement).innerText);"""
new="""await page.click(receiptCell.sel);await page.waitForSelector('[role=\"dialog\"]',{visible:true,timeout:10000});await page.click('[data-eve-action-id=\"evidence.summary\"]');text=await page.$eval('[role=\"dialog\"]',el=>(el as HTMLElement).innerText);"""
if old not in text: raise SystemExit('BROWSER_TAB_PATCH_ANCHOR_MISSING')
p.write_text(text.replace(old,new,1))
print('SOURCE_TO_DASHBOARD_PATCH_V3_APPLIED')
