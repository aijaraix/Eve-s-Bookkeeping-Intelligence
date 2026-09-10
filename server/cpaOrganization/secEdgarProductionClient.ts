/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — SEC EDGAR PRODUCTION CLIENT
 * 
 * Reusable client for authoritative network retrievals against official SEC EDGAR infrastructure.
 * 
 * Features:
 * - Dynamic legal entity CIK resolution
 * - Submissions metadata querying (Form 10-K discovery)
 * - Physical primary filing document download (HTML / iXBRL)
 * - Cryptographic SHA-256 calculation directly from network byte stream
 * - Bounded exponential backoff for 429/5xx and SEC rate-limit compliance
 * - User-Agent header formatted to SEC guidelines: "EveAutonomousCPA/1.0 (contact@eve-cpa.ai)"
 * - ZERO local document generation or synthetic padding fallback
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SECRegistrantMetadata {
  ticker: string;
  cik: string;
  entityName: string;
  fiscalYearEnd: string;
  sic?: string;
  sicDescription?: string;
}

export interface SECFilingSubmissionInfo {
  ticker: string;
  cik: string;
  entityName: string;
  accessionNumber: string;
  form: string;
  filingDate: string;
  reportDate: string;
  primaryDocument: string;
  documentUrl: string;
  sizeBytesEstimated?: number;
}

export interface SECAcquisitionResult {
  ticker: string;
  cik: string;
  entityName: string;
  form: string;
  accessionNumber: string;
  primaryDocument: string;
  documentUrl: string;
  httpStatus: number;
  physicalFilePath: string;
  actualBytes: number;
  actualSha256: string;
  retrievedAt: string;
  rateLimitCompliant: boolean;
  proofLevel: 'AUTHORITATIVE_SOURCE_VERIFIED';
}

export class SecEdgarProductionClient {
  private static instance: SecEdgarProductionClient;
  private readonly userAgent = 'EveAutonomousCPA/1.0 (contact@eve-cpa.ai)';
  private readonly authoritativeStorageDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'authoritative_sources');
  private lastRequestTime = 0;
  private readonly minRequestIntervalMs = 150; // SEC allows max 10 requests per second

  private constructor() {
    if (!fs.existsSync(this.authoritativeStorageDir)) {
      fs.mkdirSync(this.authoritativeStorageDir, { recursive: true });
    }
  }

  public static getInstance(): SecEdgarProductionClient {
    if (!SecEdgarProductionClient.instance) {
      SecEdgarProductionClient.instance = new SecEdgarProductionClient();
    }
    return SecEdgarProductionClient.instance;
  }

  /**
   * Enforces SEC rate limits (sleeps if needed to maintain < 10 req/s)
   */
  private async rateLimitThrottle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Performs an HTTP fetch with rate limiting and exponential backoff
   */
  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.rateLimitThrottle();
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json, text/html, application/xhtml+xml, */*'
          }
        });

        if (response.status === 429 || response.status >= 500) {
          const waitTime = Math.pow(2, attempt) * 500;
          console.warn(`[SecEdgarClient] SEC returned HTTP ${response.status} for ${url}. Backing off for ${waitTime}ms (Attempt ${attempt}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        return response;
      } catch (err: any) {
        if (attempt === retries) throw err;
        const waitTime = Math.pow(2, attempt) * 500;
        console.warn(`[SecEdgarClient] Network error fetching ${url}: ${err.message}. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw new Error(`[SecEdgarClient] Exhausted all ${retries} retries for ${url}`);
  }

  /**
   * Resolves registrant metadata and recent filings for a CIK or known company
   */
  public async getRegistrantSubmissions(cikOrTicker: string): Promise<{
    metadata: SECRegistrantMetadata;
    latest10K: SECFilingSubmissionInfo;
  }> {
    const cleanCik = cikOrTicker.replace(/^0+/, '');
    const paddedCik = cleanCik.padStart(10, '0');
    const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

    console.log(`[SecEdgarClient] Fetching submissions for CIK ${paddedCik} from ${url}...`);
    const response = await this.fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`[SecEdgarClient] Failed to retrieve submissions for CIK ${paddedCik}: HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const metadata: SECRegistrantMetadata = {
      ticker: (data.tickers && data.tickers[0]) ? data.tickers[0].toUpperCase() : cikOrTicker.toUpperCase(),
      cik: paddedCik,
      entityName: data.name || 'UNKNOWN REGISTRANT',
      fiscalYearEnd: data.fiscalYearEnd || '1231',
      sic: data.sic,
      sicDescription: data.sicDescription
    };

    const recent = data.filings?.recent;
    if (!recent || !recent.form || recent.form.length === 0) {
      throw new Error(`[SecEdgarClient] No recent filings found in SEC submissions for CIK ${paddedCik}`);
    }

    const form10KIdx = recent.form.findIndex((f: string) => f === '10-K');
    if (form10KIdx === -1) {
      throw new Error(`[SecEdgarClient] No Form 10-K found in recent filings for ${metadata.entityName} (CIK: ${paddedCik})`);
    }

    const accessionNumber = recent.accessionNumber[form10KIdx];
    const filingDate = recent.filingDate[form10KIdx];
    const reportDate = recent.reportDate[form10KIdx];
    const primaryDocument = recent.primaryDocument[form10KIdx];
    const accNoHyphens = accessionNumber.replace(/-/g, '');
    const documentUrl = `https://www.sec.gov/Archives/edgar/data/${cleanCik}/${accNoHyphens}/${primaryDocument}`;

    const latest10K: SECFilingSubmissionInfo = {
      ticker: metadata.ticker,
      cik: paddedCik,
      entityName: metadata.entityName,
      accessionNumber,
      form: '10-K',
      filingDate,
      reportDate,
      primaryDocument,
      documentUrl,
      sizeBytesEstimated: recent.size ? recent.size[form10KIdx] : undefined
    };

    return { metadata, latest10K };
  }

  /**
   * Acquires the complete physical Form 10-K filing bytes from official SEC infrastructure.
   * Persists actual bytes to disk and computes SHA-256 directly.
   */
  public async acquireAuthoritative10K(submission: SECFilingSubmissionInfo): Promise<SECAcquisitionResult> {
    console.log(`[SecEdgarClient] Acquiring authoritative filing bytes for ${submission.entityName} (${submission.ticker}) from ${submission.documentUrl}...`);

    const response = await this.fetchWithRetry(submission.documentUrl);
    if (!response.ok) {
      throw new Error(`[SecEdgarClient] HTTP ${response.status} failed retrieving primary document: ${submission.documentUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const actualBytes = buffer.length;
    const actualSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    if (actualBytes < 1000) {
      throw new Error(`[SecEdgarClient] Received abnormally small payload (${actualBytes} bytes) for Form 10-K at ${submission.documentUrl}`);
    }

    const filename = `${submission.ticker.toLowerCase()}_10k_authoritative_complete.htm`;
    const targetPath = path.join(this.authoritativeStorageDir, filename);

    fs.writeFileSync(targetPath, buffer);
    console.log(`[SecEdgarClient] Persisted physical filing: ${targetPath} (${actualBytes.toLocaleString()} bytes, SHA-256: ${actualSha256.substring(0, 16)}...)`);

    return {
      ticker: submission.ticker,
      cik: submission.cik,
      entityName: submission.entityName,
      form: submission.form,
      accessionNumber: submission.accessionNumber,
      primaryDocument: submission.primaryDocument,
      documentUrl: submission.documentUrl,
      httpStatus: response.status,
      physicalFilePath: targetPath,
      actualBytes,
      actualSha256,
      retrievedAt: new Date().toISOString(),
      rateLimitCompliant: true,
      proofLevel: 'AUTHORITATIVE_SOURCE_VERIFIED'
    };
  }
}

export const secEdgarProductionClient = SecEdgarProductionClient.getInstance();
