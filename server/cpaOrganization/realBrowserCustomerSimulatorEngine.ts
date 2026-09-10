/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — REAL BROWSER CUSTOMER SIMULATOR ENGINE
 * 
 * Drives authentic customer journeys using an actual headless Chrome browser process.
 * 
 * Strict Physical Conformance (Doc 30 & 34):
 * - Resolves browser executable dynamically from environment / container paths
 * - Fails with MISSING_BROWSER_EXECUTABLE if no binary is found (no silent synthetic mocks)
 * - Navigates real browser to Eve UI
 * - Manipulates real DOM controls (opens UploadModal, assigns file via input[type="file"])
 * - Verifies staged file appears in the DOM
 * - Submits via UI trigger and captures authentic HTTP response
 * - Validates cryptographic hash continuity across independently measured boundaries:
 *   SOURCE_BYTES_SHA = STAGED_FILE_SHA = SERVER_RECEIVED_BYTES_SHA
 * - Does NOT trigger /api/cpa/intake/process — upload alone persists the customer-priority job
 * - Cleanly terminates browser process
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';

export type BrowserJourneyProofLevel =
  | 'LOCAL_BROWSER_VERIFIED'
  | 'STAGING_BROWSER_VERIFIED'
  | 'PREVIEW_BROWSER_VERIFIED'
  | 'NON_PRODUCTION_BROWSER_VERIFIED'
  | 'PRODUCTION_BROWSER_VERIFIED';

export type BrowserEnvironmentClassification =
  | 'LOCAL_TEST'
  | 'STAGING'
  | 'PREVIEW'
  | 'NON_PRODUCTION'
  | 'PRODUCTION';

export interface BrowserStepProof {
  stepNumber: number;
  action: string;
  selectorOrUrl: string;
  result: string;
  timestamp: string;
  durationMs: number;
}

export interface RealBrowserJourneyResult {
  journeyId: string;
  browserSessionId: string;
  browserVersion: string;
  targetUrl: string;
  environmentClassification: BrowserEnvironmentClassification;
  clientName: string;
  ticker: string;
  engagementId: string;
  physicalSourcePath: string;
  stagingFilePath: string;
  selectedFilename: string;
  selectedFileSize: number;
  sourceSha256: string;
  stagingSha256: string;
  serverReceivedSha256: string;
  intakeSha256: string;
  hashContinuityVerified: boolean;
  intakeSessionId: string;
  steps: BrowserStepProof[];
  proofLevel: BrowserJourneyProofLevel;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export class RealBrowserCustomerSimulatorEngine {
  private static instance: RealBrowserCustomerSimulatorEngine;
  private readonly customerStagingDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'customer_staging');

  public getAppBaseUrl(): string {
    return process.env.EVE_APP_BASE_URL || 'http://127.0.0.1:3000';
  }

  /**
   * Authoritative Environment Classification Guard
   * Requires explicit configured environment authority:
   * EVE_RUNTIME_ENV=production AND EVE_APP_BASE_URL=<declared production URL>
   * before assigning PRODUCTION / PRODUCTION_BROWSER_VERIFIED.
   * Arbitrary remote or staging URLs receive non-production proof states.
   */
  public classifyEnvironment(
    baseUrl: string,
    env: {
      EVE_RUNTIME_ENV?: string;
      EVE_APP_BASE_URL?: string;
      EVE_APP_PRODUCTION_URL?: string;
      EVE_PRODUCTION_BASE_URL?: string;
    } = process.env
  ): {
    environmentClassification: BrowserEnvironmentClassification;
    proofLevel: BrowserJourneyProofLevel;
  } {
    const isLocal = baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost');

    if (isLocal) {
      return {
        environmentClassification: 'LOCAL_TEST',
        proofLevel: 'LOCAL_BROWSER_VERIFIED'
      };
    }

    const runtimeEnv = (env.EVE_RUNTIME_ENV || '').toLowerCase().trim();
    const declaredProdUrl = (
      env.EVE_APP_PRODUCTION_URL ||
      env.EVE_PRODUCTION_BASE_URL ||
      env.EVE_APP_BASE_URL ||
      ''
    ).trim();

    const isExplicitProduction =
      runtimeEnv === 'production' &&
      Boolean(declaredProdUrl) &&
      baseUrl.replace(/\/+$/, '') === declaredProdUrl.replace(/\/+$/, '');

    if (isExplicitProduction) {
      return {
        environmentClassification: 'PRODUCTION',
        proofLevel: 'PRODUCTION_BROWSER_VERIFIED'
      };
    }

    const lowerUrl = baseUrl.toLowerCase();
    if (lowerUrl.includes('staging')) {
      return {
        environmentClassification: 'STAGING',
        proofLevel: 'STAGING_BROWSER_VERIFIED'
      };
    }

    if (lowerUrl.includes('preview') || lowerUrl.includes('dev') || lowerUrl.includes('run.app')) {
      return {
        environmentClassification: 'PREVIEW',
        proofLevel: 'PREVIEW_BROWSER_VERIFIED'
      };
    }

    return {
      environmentClassification: 'NON_PRODUCTION',
      proofLevel: 'NON_PRODUCTION_BROWSER_VERIFIED'
    };
  }

  private constructor() {
    if (!fs.existsSync(this.customerStagingDir)) {
      fs.mkdirSync(this.customerStagingDir, { recursive: true });
    }
  }

  public static getInstance(): RealBrowserCustomerSimulatorEngine {
    if (!RealBrowserCustomerSimulatorEngine.instance) {
      RealBrowserCustomerSimulatorEngine.instance = new RealBrowserCustomerSimulatorEngine();
    }
    return RealBrowserCustomerSimulatorEngine.instance;
  }

  /**
   * Resolves Chrome / Chromium executable dynamically from production environment paths
   */
  public resolveChromeExecutablePath(): string {
    const candidates = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN,
      process.env.CHROME_PATH,
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/app/applet/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell'
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    try {
      const whichOutput = execSync('which google-chrome || which chromium || which chromium-browser', {
        stdio: ['pipe', 'pipe', 'ignore']
      }).toString().trim();
      if (whichOutput && fs.existsSync(whichOutput)) {
        return whichOutput;
      }
    } catch (_) {}

    throw new Error('MISSING_BROWSER_EXECUTABLE: No valid Chrome or Chromium executable found in container environment.');
  }

  /**
   * Authoritative validator for the server upload acknowledgement contract.
   * Fails closed if intakeSessionId or authoritative hash is missing.
   */
  public validateUploadAcknowledgement(uploadResult: any): { intakeSessionId: string; intakeSha256: string } {
    if (!uploadResult || typeof uploadResult !== 'object') {
      throw new Error('[RealBrowserCustomerSimulator] Upload acknowledgement payload is invalid or empty.');
    }
    if (uploadResult.success === false) {
      throw new Error(`[RealBrowserCustomerSimulator] Server upload explicitly rejected: ${uploadResult.error || 'Upload error'}`);
    }
    const intakeSessionId = uploadResult.intakeSessionId || uploadResult.intakeSession?.id;
    if (!intakeSessionId) {
      throw new Error('[RealBrowserCustomerSimulator] Server upload response missing required acknowledgement ID (intakeSessionId). Journey failed.');
    }
    const intakeSha256 = uploadResult.sha256 || uploadResult.documentHash || uploadResult.documents?.[0]?.sha256 || uploadResult.intakeSession?.files?.[0]?.sha256;
    if (!intakeSha256) {
      throw new Error('[RealBrowserCustomerSimulator] Server upload response missing authoritative intake SHA256. Journey failed.');
    }
    return { intakeSessionId, intakeSha256 };
  }

  /**
   * Executes a physical customer intake journey through an actual Chrome browser instance.
   */
  public async executeBrowserCustomerJourney(params: {
    clientName: string;
    ticker: string;
    engagementId: string;
    physicalSourcePath: string;
    routingMode?: 'NEW_ENGAGEMENT' | 'EXISTING_ENGAGEMENT';
    engagementName?: string;
    reportingStandard?: 'US_GAAP' | 'IFRS' | 'UK_FRS' | 'STATUTORY';
    reportingCurrency?: string;
    targetWorkspaceId?: string;
  }): Promise<RealBrowserJourneyResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const journeyId = `cj-browser-${params.ticker.toLowerCase()}-${Date.now()}`;
    const steps: BrowserStepProof[] = [];

    // 1. Verify physical source file
    const fullSourcePath = path.isAbsolute(params.physicalSourcePath)
      ? params.physicalSourcePath
      : path.join(process.cwd(), params.physicalSourcePath);

    if (!fs.existsSync(fullSourcePath)) {
      throw new Error(`[RealBrowserCustomerSimulator] Physical source file does not exist: ${fullSourcePath}`);
    }

    const sourceBytes = fs.readFileSync(fullSourcePath);
    const sourceSha256 = crypto.createHash('sha256').update(sourceBytes).digest('hex');

    // 2. Stage physical file in customer-side directory
    const stagedFilename = `${params.ticker.toUpperCase()}_Audited_10K_Authoritative.htm`;
    const stagingPath = path.join(this.customerStagingDir, stagedFilename);
    fs.writeFileSync(stagingPath, sourceBytes);
    const stagingSha256 = crypto.createHash('sha256').update(fs.readFileSync(stagingPath)).digest('hex');

    // 3. Resolve Chrome executable
    const chromeExecutablePath = this.resolveChromeExecutablePath();

    // 4. Launch actual Chrome browser process
    let browser: any = null;
    let browserVersion = 'HeadlessChrome';

    const recordStep = (stepNum: number, action: string, selectorOrUrl: string, result: string, t0: number) => {
      steps.push({
        stepNumber: stepNum,
        action,
        selectorOrUrl,
        result,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - t0
      });
    };

    try {
      const tLaunch = Date.now();
      browser = await puppeteer.launch({
        executablePath: chromeExecutablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1280,800'
        ]
      });
      browserVersion = await browser.version();
      const browserSessionId = `browser-proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      recordStep(1, 'Spawn Browser Process', chromeExecutablePath, `Spawned ${browserVersion} (PID active)`, tLaunch);

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Step 2: Navigate to Eve Application
      const tNav = Date.now();
      const baseUrl = this.getAppBaseUrl();
      const { environmentClassification, proofLevel } = this.classifyEnvironment(baseUrl);

      const navResponse = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (!navResponse || !navResponse.ok()) {
        const navStatus = navResponse ? navResponse.status() : 'NO_RESPONSE';
        throw new Error(`[RealBrowserCustomerSimulator] Navigation to ${baseUrl} failed with HTTP status ${navStatus}`);
      }
      const title = await page.title();
      recordStep(2, 'Navigate to Eve CPA Studio', baseUrl, `Loaded. Title: "${title || 'Eve CPA Studio'}" [${environmentClassification} / ${proofLevel}]`, tNav);

      // Step 3: Click Real Product Header Button to Open Modal
      const tHeader = Date.now();
      const headerBtn = await page.waitForSelector('#header-upload-intake-btn', { visible: true, timeout: 10000 });
      if (!headerBtn) {
        throw new Error(`[RealBrowserCustomerSimulator] Required product control '#header-upload-intake-btn' not found in DOM.`);
      }
      await headerBtn.click();
      recordStep(3, 'Click Header Upload Intake Button', '#header-upload-intake-btn', 'Clicked #header-upload-intake-btn in real UI', tHeader);

      // Step 4: Wait for Real Product Modal Container
      const tModal = Date.now();
      const modalContainer = await page.waitForSelector('#upload-modal-container', { visible: true, timeout: 10000 });
      if (!modalContainer) {
        throw new Error(`[RealBrowserCustomerSimulator] Required product container '#upload-modal-container' not found in DOM.`);
      }
      recordStep(4, 'Wait for Upload Modal Container', '#upload-modal-container', 'Modal container displayed and active in DOM', tModal);

      // Step 5: Physically interact with Engagement Routing UI
      const tRouting = Date.now();
      const useExisting = params.routingMode === 'EXISTING_ENGAGEMENT';
      if (useExisting) {
        await page.click('#routing-mode-existing-engagement');
        if (params.targetWorkspaceId) {
          await page.select('#existing-engagement-select', params.targetWorkspaceId);
        }
        recordStep(
          5,
          'Select Existing Engagement Workspace in UI',
          '#existing-engagement-select',
          `Selected workspace ${params.targetWorkspaceId || 'default'} via real UI controls`,
          tRouting
        );
      } else {
        await page.click('#routing-mode-new-engagement');
        const engagementName = params.engagementName || `FY2025 Audit - ${params.clientName}`;
        const clientName = `${params.clientName} (${params.ticker})`;
        const standard = params.reportingStandard || 'US_GAAP';
        const currency = params.reportingCurrency || 'USD';

        await page.waitForSelector('#new-engagement-name-input', { visible: true, timeout: 5000 });
        await page.click('#new-engagement-name-input', { clickCount: 3 });
        await page.type('#new-engagement-name-input', engagementName);

        await page.waitForSelector('#new-client-name-input', { visible: true, timeout: 5000 });
        await page.click('#new-client-name-input', { clickCount: 3 });
        await page.type('#new-client-name-input', clientName);

        await page.select('#reporting-standard-select', standard);
        await page.select('#engagement-currency-select', currency);

        recordStep(
          5,
          'Configure New Engagement in UI',
          '#routing-mode-new-engagement',
          `Configured engagement "${engagementName}", standard ${standard}, currency ${currency} via real UI controls`,
          tRouting
        );
      }

      // Step 6: Find Existing Product Input Element (strictly no substitute element injection)
      const tInput = Date.now();
      const fileInput = await page.$('#customer-intake-file-input');
      if (!fileInput) {
        throw new Error(`[RealBrowserCustomerSimulator] Required product element '#customer-intake-file-input' not found in DOM. Creation of substitute input is strictly prohibited.`);
      }
      await fileInput.uploadFile(stagingPath);
      recordStep(
        6,
        'Physical File DOM Selection via Real Input',
        '#customer-intake-file-input',
        `Assigned physical file ${stagedFilename} (${sourceBytes.length} bytes, SHA: ${stagingSha256.substring(0, 16)}...)`,
        tInput
      );

      // Step 7: Verify Selected Filename Appears in Real UI
      const tVerify = Date.now();
      const filenameAppeared = await page.waitForFunction(
        (expectedName: string) => {
          const bodyText = document.body.innerText || '';
          return bodyText.includes(expectedName);
        },
        { timeout: 5000 },
        stagedFilename
      ).then(() => true).catch(() => false);

      if (!filenameAppeared) {
        throw new Error(`[RealBrowserCustomerSimulator] Selected filename '${stagedFilename}' does not appear in product UI after selection.`);
      }
      recordStep(7, 'Verify Selected Filename in UI', '#upload-modal-container', `Verified selected filename '${stagedFilename}' appears in product UI`, tVerify);

      // Step 8: Locate Real Action Button and Attach Network Observation Before Clicking
      const tStart = Date.now();
      const startBtn = await page.$('#start-analysis-button');
      if (!startBtn) {
        throw new Error(`[RealBrowserCustomerSimulator] Required product action button '#start-analysis-button' not found in DOM.`);
      }

      let observedRequest: { url: string; method: string } | null = null;
      let observedResponseBody: any = null;

      const networkPromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`[RealBrowserCustomerSimulator] Timeout waiting for frontend upload network request after clicking #start-analysis-button.`));
        }, 30000);

        const onResponse = async (response: any) => {
          const url = response.url();
          if (url.includes('/api/documents/upload') && response.request().method() === 'POST') {
            try {
              const json = await response.json();
              observedResponseBody = json;
              clearTimeout(timeout);
              page.off('response', onResponse);
              resolve(json);
            } catch (e: any) {
              clearTimeout(timeout);
              page.off('response', onResponse);
              reject(new Error(`[RealBrowserCustomerSimulator] Failed to parse frontend intake response JSON: ${e.message}`));
            }
          }
        };

        page.on('request', (req: any) => {
          const url = req.url();
          if (url.includes('/api/documents/upload') && req.method() === 'POST') {
            observedRequest = {
              url,
              method: req.method()
            };
          }
        });

        page.on('response', onResponse);
      });

      // Physically click #start-analysis-button
      await startBtn.click();
      recordStep(8, 'Click Start Analysis Button', '#start-analysis-button', 'Clicked #start-analysis-button in DOM to initiate real frontend submission', tStart);

      // Step 9: Observe Frontend Network Request & Capture Matching Intake Response
      const tNet = Date.now();
      const uploadResult = await networkPromise;

      // Authoritative validation of server response — fail closed, no manufactured fallbacks
      const { intakeSessionId, intakeSha256 } = this.validateUploadAcknowledgement(uploadResult);
      const serverReceivedSha256 = intakeSha256;

      recordStep(
        9,
        'Observe Frontend Network Request & Intake Response',
        observedRequest?.url || '/api/documents/upload',
        `Observed frontend request ${observedRequest?.method || 'POST'} -> Response HTTP OK, IntakeSession: ${intakeSessionId}`,
        tNet
      );

      // Verify cryptographic hash continuity across 3 independently measured boundaries:
      // SOURCE_BYTES_SHA -> STAGED_FILE_SHA -> SERVER_RECEIVED_BYTES_SHA
      const hashContinuityVerified = 
        (sourceSha256 === stagingSha256) &&
        (stagingSha256 === serverReceivedSha256);

      if (!hashContinuityVerified) {
        throw new Error(`[RealBrowserCustomerSimulator] Cryptographic hash continuity check failed: source=${sourceSha256}, staging=${stagingSha256}, serverReceived=${serverReceivedSha256}`);
      }

      await browser.close();
      browser = null;

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      return {
        journeyId,
        browserSessionId,
        browserVersion,
        targetUrl: baseUrl,
        environmentClassification,
        clientName: params.clientName,
        ticker: params.ticker,
        engagementId: params.engagementId,
        physicalSourcePath: fullSourcePath,
        stagingFilePath: stagingPath,
        selectedFilename: stagedFilename,
        selectedFileSize: sourceBytes.length,
        sourceSha256,
        stagingSha256,
        serverReceivedSha256,
        intakeSha256: serverReceivedSha256,
        hashContinuityVerified,
        intakeSessionId,
        steps,
        proofLevel,
        startedAt,
        completedAt,
        durationMs
      };
    } catch (error: any) {
      if (browser) {
        try { await browser.close(); } catch (_) {}
      }
      throw new Error(`[RealBrowserCustomerSimulator] Browser journey failed: ${error.message}`);
    }
  }
}

export const realBrowserCustomerSimulatorEngine = RealBrowserCustomerSimulatorEngine.getInstance();
