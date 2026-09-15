import type { Page } from 'puppeteer-core';

/** Grader only: read-only evidence retrieval. Student actions never call these APIs. */
export class AcademyDashboardTruthAuditor {
  constructor(private page: Page, private baseUrl: string) {}

  async readJson(route: string): Promise<any> {
    const url = new URL(route, this.baseUrl);
    if (url.origin !== new URL(this.baseUrl).origin || !url.pathname.startsWith('/api/')) throw new Error('GRADER_SCOPE_VIOLATION');
    const cookies = (await this.page.browserContext().cookies()).filter(c => { const host = url.hostname; const domain = c.domain.replace(/^\./, ''); return host === domain || host.endsWith('.' + domain); });
    const response = await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') } });
    if (!response.ok) throw new Error(`GRADER_READ_HTTP_${response.status}`);
    return response.json();
  }

  async gradeFinancialScreen(engagement: any, screenshot: string, requiredMetrics: Record<string, number> = {}) {
    const rows = await this.page.$$eval('[data-eve-financial-value="true"]', elements => elements.map(element => {
      const e = element as HTMLElement;
      return { label: e.closest('tr')?.querySelector('td span')?.textContent?.trim(), declaredLabel: e.dataset.eveVisibleLabel, visibleValue: e.innerText.trim(), period: e.dataset.period,
        currency: e.dataset.currency, scale: e.dataset.scale, factId: e.dataset.canonicalFactId,
        factLineageId: e.dataset.factLineageId, metric: e.dataset.canonicalMetric, renderId: e.dataset.renderId,
        verification: e.dataset.provenanceStatus, derivationId: e.dataset.derivationId,
        operands: (e.dataset.operandFactIds || '').split(',').filter(Boolean) };
    }));
    if (!rows.length) throw new Error('FALSE_EMPTY_FINANCIAL_SCREEN');
    const facts = engagement.facts || [];
    const eligible = (f: any) => f && String(f.status).toUpperCase() === 'APPROVED' &&
      String(f.verificationStatus || f.verification_status).toUpperCase() === 'VERIFIED' &&
      String(f.evidenceStatus || f.evidence_status).toUpperCase() === 'CONFIRMED' && String(f.sourceText || f.source_text || '').trim();
    const numeric = (f: any) => Number(String(f.valueFunctional ?? f.valueOriginal).replace(/,/g, ''));
    const period = (v: any) => String(v || '').trim().toUpperCase().replace(/^FY\s*/, '');
    const key = (v: any) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const results = rows.map(row => {
      const errors: string[] = [];
      const selected = row.factId ? facts.filter((f: any) => f.id === row.factId) : row.operands.map(id => facts.find((f: any) => f.id === id));
      if (!row.renderId || (!row.factId && !row.derivationId)) errors.push('MISSING_LINEAGE');
      if (!selected.length || selected.some((f: any) => !eligible(f))) errors.push('UNSUPPORTED_EVIDENCE');
      const sources = selected.map((f: any) => engagement.documents?.find((d: any) => d.id === (f?.documentId || f?.document_id)));
      if (sources.some((d: any) => !d?.sha256)) errors.push('SOURCE_IDENTITY_MISSING');
      if (selected.some((f: any) => period(f?.reportingPeriod || f?.period) !== period(row.period))) errors.push('WRONG_PERIOD');
      if (selected.some((f: any) => (f?.functionalCurrency || f?.currencyFunctional || f?.currencyOriginal || f?.currency) !== row.currency)) errors.push('WRONG_CURRENCY');
      if (row.label !== row.declaredLabel) errors.push('VISIBLE_LABEL_MISMATCH');
      if (row.factId && selected.some((f: any) => row.label !== (f.labelNormalized || f.labelOriginal))) errors.push('SOURCE_LABEL_MISMATCH');
      if (row.factId && selected.some((f: any) => (f.scale || f.scaleOriginal || f.unitScale || 'Source units') !== row.scale)) errors.push('WRONG_SCALE');
      const values = selected.map(numeric);
      if (row.factId && new Set(values).size !== 1) errors.push('CONFLICTING_FACT_ID');
      if (!/[0-9]/.test(row.visibleValue)) errors.push('MISSING_VISIBLE_NUMBER');
      let expected = values[0];
      if (!row.factId) {
        if (row.metric === 'gross_profit' && values.length === 2) expected = values[0] - values[1];
        else if (row.metric === 'total_liabilities_and_equity' && values.length === 2) expected = values[0] + values[1];
        else errors.push('UNSUPPORTED_CALCULATION');
        if (row.verification !== 'calculated') errors.push('UNSUPPORTED_VERIFICATION_LABEL');
      } else if (row.verification === 'verified' && selected.some((f: any) => !eligible(f))) errors.push('UNSUPPORTED_VERIFICATION_LABEL');
      const displayed = Number(row.visibleValue.replace(/[^0-9.\-]/g, '')) * (row.visibleValue.includes('(') ? -1 : 1);
      if (!Number.isFinite(expected) || !Number.isFinite(displayed) || Math.abs(displayed - expected) > 0.000001) errors.push('WRONG_VALUE_OR_SCALE');
      if (!row.scale) errors.push('MISSING_SCALE');
      if (row.metric in requiredMetrics && Math.abs(displayed - requiredMetrics[row.metric]) > 0.000001) errors.push('FIXTURE_TRUTH_DISAGREEMENT');
      return { ...row, expected, displayed, sources: sources.map((d: any) => ({ id: d?.id, sha256: d?.sha256 })),
        sourceQuotes: selected.map((f: any) => f?.sourceText || f?.source_text), screenshot, errors, pass: errors.length === 0 };
    });
    const missingMetrics = Object.keys(requiredMetrics).filter(metric => !rows.some(row => row.metric === metric));
    return { route: this.page.url(), viewport: this.page.viewport(), results, missingMetrics, pass: !missingMetrics.length && results.every(r => r.pass) };
  }
}
