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
import { AcademyDashboardTruthAuditor } from './academyDashboardTruthAuditor';

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
  academyEvidence?: any;
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
  private bundledChromeCandidates(): string[] {
    const root = '/opt/hermes/.playwright';
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root).filter(name => /^chromium_headless_shell-\d+$/.test(name))
      .sort((a, b) => Number(b.split('-').pop()) - Number(a.split('-').pop()))
      .map(name => path.join(root, name, 'chrome-headless-shell-linux64', 'chrome-headless-shell'));
  }

  public resolveChromeExecutablePath(): string {
    const candidates = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN,
      process.env.CHROME_PATH,
      ...this.bundledChromeCandidates(),
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/app/applet/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell'
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      try { fs.accessSync(candidate, fs.constants.X_OK); return candidate; } catch {}
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
    viewport?: { width: number; height: number; isMobile?: boolean };
    /** Read from protected runtime configuration; never retained in journey evidence. */
    operatorPin?: string;
    academy?: { evidenceDir: string; processingTimeoutMs?: number; resumeIntakeId?: string; expectedMetrics?: Record<string, Record<string, number>>; retryUnavailableLexicon?: boolean };
  }): Promise<RealBrowserJourneyResult> {
    if (params.academy && params.routingMode === 'EXISTING_ENGAGEMENT') throw new Error('ACADEMY_REQUIRES_NEW_ISOLATED_INTAKE');
    if (params.routingMode === 'EXISTING_ENGAGEMENT' && !params.targetWorkspaceId) {
      throw new Error('EXPLICIT_WORKSPACE_REQUIRED: Existing intake must select an exact workspace.');
    }
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const journeyId = `cj-browser-${params.ticker.toLowerCase()}-${Date.now()}`;
    const priorCheckpoint = params.academy?.resumeIntakeId ? JSON.parse(fs.readFileSync(path.join(params.academy.evidenceDir, 'checkpoint.json'), 'utf8')) : null;
    const steps: BrowserStepProof[] = priorCheckpoint?.steps || [];
    let academyEvidence: any;
    const checkpoint = (state: any) => {
      if (!params.academy) return;
      fs.mkdirSync(params.academy.evidenceDir, { recursive: true });
      const file = path.join(params.academy.evidenceDir, 'checkpoint.json');
      const temporary = file + '.tmp';
      fs.writeFileSync(temporary, JSON.stringify({ ...priorCheckpoint, journeyId, steps, ...state }, null, 2), { mode: 0o600 });
      const fd = fs.openSync(temporary, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.renameSync(temporary, file);
      const directory = fs.openSync(path.dirname(file), 'r'); try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
    };
    if (params.academy && !params.academy.resumeIntakeId && fs.existsSync(path.join(params.academy.evidenceDir, 'checkpoint.json'))) {
      throw new Error('EXISTING_CASE_CHECKPOINT: Resume its saved intake; automatic duplicate upload is prohibited.');
    }

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
    const stagedFilename = path.basename(fullSourcePath);
    const stagingDir = path.join(this.customerStagingDir, sourceSha256);
    fs.mkdirSync(stagingDir, { recursive: true });
    const stagingPath = path.join(stagingDir, stagedFilename);
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
        headless: true,
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
      await page.setViewport(params.viewport || { width: 1280, height: 800 });

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

      // Supported operator authentication is a real form submission, never cookie injection.
      if (await page.$('form[action="/operator-login"] input#pin')) {
        const pin = params.operatorPin || process.env.EVE_OPERATOR_PIN;
        if (!pin) throw new Error('OPERATOR_PIN_REQUIRED: Configure the existing operator credential in the protected runtime.');
        await page.type('form[action="/operator-login"] input#pin', pin);
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
          page.click('form[action="/operator-login"] button[type="submit"]')
        ]);
        if (await page.$('form[action="/operator-login"]')) throw new Error('OPERATOR_AUTHENTICATION_REJECTED');
        recordStep(2, 'Authenticate through operator form', '/operator-login', 'Product form accepted operator session', tNav);
      }

      if (params.academy) {
        const grader = new AcademyDashboardTruthAuditor(page, baseUrl);
        const health = await grader.readJson('/api/health');
        const queue = await grader.readJson('/api/queue/jobs');
        if (health.status !== 'ok' || !Array.isArray(queue.jobs)) throw new Error('ACADEMY_HEALTH_GATE_FAILED');
        if (queue.jobs.some((j: any) => j.classification !== 'ACADEMY' && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status))) {
          throw new Error('CUSTOMER_PRIORITY_PREEMPTED');
        }
      }

      // Step 3: Click Real Product Header Button to Open Modal
      const tHeader = Date.now();
      const headerBtn = await page.waitForSelector('[data-eve-action-id="intake.open.header"]', { visible: true, timeout: 10000 });
      if (!headerBtn) {
        throw new Error(`[RealBrowserCustomerSimulator] Required product control '[data-eve-action-id="intake.open.header"]' not found in DOM.`);
      }
      await headerBtn.click();
      recordStep(3, 'Click Header Upload Intake Button', '[data-eve-action-id="intake.open.header"]', 'Clicked [data-eve-action-id="intake.open.header"] in real UI', tHeader);

      // Step 4: Wait for Real Product Modal Container
      const tModal = Date.now();
      const modalContainer = await page.waitForSelector('#upload-modal-container', { visible: true, timeout: 10000 });
      if (!modalContainer) {
        throw new Error(`[RealBrowserCustomerSimulator] Required product container '#upload-modal-container' not found in DOM.`);
      }
      recordStep(4, 'Wait for Upload Modal Container', '#upload-modal-container', 'Modal container displayed and active in DOM', tModal);

      let intakeSessionId = '', intakeSha256 = '', serverReceivedSha256 = '';
      let hashContinuityVerified = false;
      if (params.academy?.resumeIntakeId) {
        const id = params.academy.resumeIntakeId;
        await page.waitForSelector(`[data-eve-action-id="intake.saved.select"] option[value="${id}"]`, { timeout: 15000 });
        await page.select('[data-eve-action-id="intake.saved.select"]', id);
        await page.click('[data-eve-action-id="intake.saved.resume"]');
        const grader = new AcademyDashboardTruthAuditor(page, baseUrl);
        const saved = (await grader.readJson(`/api/intake/${encodeURIComponent(id)}`)).intakeSession;
        if (saved?.classification !== 'ACADEMY' || saved?.uploadedFiles?.length !== 1) throw new Error('SAVED_INTAKE_SCOPE_MISMATCH');
        let savedHash = saved.uploadedFiles[0].sha256;
        if (!savedHash && saved.promotedProjectId && priorCheckpoint?.sourceSha256 === sourceSha256 && priorCheckpoint?.serverReceivedSha256 === sourceSha256) {
          const inventory = await grader.readJson('/api/cpa/engagements/universal');
          const record = (inventory.engagements || inventory).find((e: any) => e.workspaceId === saved.promotedProjectId && e.classification === 'ACADEMY');
          if (!record) throw new Error('SAVED_INTAKE_WORKSPACE_MISSING');
          const detail = (await grader.readJson(`/api/cpa/engagements/${encodeURIComponent(record.engagementId)}`)).engagement;
          if (detail?.workspaceId !== saved.promotedProjectId) throw new Error('SAVED_INTAKE_WORKSPACE_MISMATCH');
          savedHash = detail.documents?.find((d: any) => d.id === saved.uploadedFiles[0].documentId)?.sha256;
        }
        if (savedHash !== sourceSha256) throw new Error('SAVED_INTAKE_HASH_MISMATCH');
        intakeSessionId = id; intakeSha256 = savedHash; serverReceivedSha256 = intakeSha256;
        hashContinuityVerified = sourceSha256 === stagingSha256 && stagingSha256 === intakeSha256;
        recordStep(5, 'Resume saved intake through UI', '[data-eve-action-id="intake.saved.resume"]', 'Observed original intake without resubmission', Date.now());
      } else {
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
        const engagementName = params.engagementName || `Bookkeeping - ${params.clientName}`;
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
        if (params.academy) await page.click('[data-eve-action-id="intake.academy"]');

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
          if (new URL(url).origin === new URL(baseUrl).origin && new URL(url).pathname === '/api/documents/upload' && response.request().method() === 'POST') {
            try {
              if (!response.ok()) throw new Error(`Upload HTTP ${response.status()}`);
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
          if (new URL(url).origin === new URL(baseUrl).origin && new URL(url).pathname === '/api/documents/upload' && req.method() === 'POST') {
            observedRequest = {
              url,
              method: req.method()
            };
          }
        });

        page.on('response', onResponse);
      });

      // Physically click #start-analysis-button
      checkpoint({ state: 'SUBMISSION_UNCERTAIN', sourceSha256, stagedFilename });
      await startBtn.click();
      recordStep(8, 'Click Start Analysis Button', '#start-analysis-button', 'Clicked #start-analysis-button in DOM to initiate real frontend submission', tStart);

      // Step 9: Observe Frontend Network Request & Capture Matching Intake Response
      const tNet = Date.now();
      const uploadResult = await networkPromise;

      // Authoritative validation of server response — fail closed, no manufactured fallbacks
      ({ intakeSessionId, intakeSha256 } = this.validateUploadAcknowledgement(uploadResult));
      serverReceivedSha256 = intakeSha256;
      checkpoint({ state: 'INTAKE_ACKNOWLEDGED', intakeSessionId, sourceSha256, serverReceivedSha256 });

      recordStep(
        9,
        'Observe Frontend Network Request & Intake Response',
        observedRequest?.url || '/api/documents/upload',
        `Observed frontend request ${observedRequest?.method || 'POST'} -> Response HTTP OK, IntakeSession: ${intakeSessionId}`,
        tNet
      );

      // Verify cryptographic hash continuity across 3 independently measured boundaries:
      // SOURCE_BYTES_SHA -> STAGED_FILE_SHA -> SERVER_RECEIVED_BYTES_SHA
      hashContinuityVerified =
        (sourceSha256 === stagingSha256) &&
        (stagingSha256 === serverReceivedSha256);

      if (!hashContinuityVerified) {
        throw new Error(`[RealBrowserCustomerSimulator] Cryptographic hash continuity check failed: source=${sourceSha256}, staging=${stagingSha256}, serverReceived=${serverReceivedSha256}`);
      }

      }

      if (params.academy) {
        const evidenceDir = params.academy.evidenceDir;
        const auditor = new AcademyDashboardTruthAuditor(page, baseUrl);
        const receipt = (await auditor.readJson(`/api/intake/${encodeURIComponent(intakeSessionId)}`)).intakeSession;
        if (receipt?.classification !== 'ACADEMY' || (receipt?.targetProjectId && !receipt?.promotedProjectId)) throw new Error('ACADEMY_RECEIPT_ISOLATION_FAILED');
        await page.screenshot({ path: path.join(evidenceDir, 'processing.png'), fullPage: true });
        const checkCustomerPriority = async () => {
          const queue = await auditor.readJson('/api/queue/jobs');
          if (!Array.isArray(queue.jobs) || queue.jobs.some((j: any) => j.classification !== 'ACADEMY' && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status))) {
            checkpoint({ state: 'PAUSED_CUSTOMER_PRIORITY', intakeSessionId });
            throw new Error('CUSTOMER_PRIORITY_PREEMPTED');
          }
        };
        const waitWithPriority = async (selector: string, timeout: number) => {
          const deadline = Date.now() + timeout;
          while (true) {
            await checkCustomerPriority();
            if (await page.$(selector)) return;
            if (Date.now() >= deadline) throw new Error('UI_STATE_TIMEOUT:' + selector);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        };
        await waitWithPriority('#upload-modal-container[data-eve-intake-phase="COMPLETE"]', params.academy.processingTimeoutMs || 1200000);
        await page.click('[data-eve-action-id="intake.close"]');
        const workspaceId = await page.$eval('[data-eve-workspace-id]', (el: any) => el.dataset.eveWorkspaceId);
        const completed = (await auditor.readJson(`/api/intake/${encodeURIComponent(intakeSessionId)}`)).intakeSession;
        if (!workspaceId || completed.promotedProjectId !== workspaceId || completed.classification !== 'ACADEMY') throw new Error('ACADEMY_PROMOTION_SCOPE_FAILED');
        const inventory = await auditor.readJson('/api/cpa/engagements/universal');
        const engagements = inventory.engagements || inventory;
        const record = engagements.find((e: any) => e.workspaceId === workspaceId);
        if (!record || record.classification !== 'ACADEMY') throw new Error('ACADEMY_WORKSPACE_CLASSIFICATION_FAILED');
        const detail = async () => (await auditor.readJson(`/api/cpa/engagements/${encodeURIComponent(record.engagementId)}`)).engagement;
        const navigate = async (view: string) => {
          const queue = await auditor.readJson('/api/queue/jobs');
          if (!Array.isArray(queue.jobs) || queue.jobs.some((j: any) => j.classification !== 'ACADEMY' && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status))) {
            checkpoint({ state: 'PAUSED_CUSTOMER_PRIORITY', intakeSessionId, workspaceId });
            throw new Error('CUSTOMER_PRIORITY_PREEMPTED');
          }
          if ((page.viewport()?.width || 1280) < 768) await page.click('[data-eve-action-id="nav.mobile.open"]');
          const selector = `[data-eve-action-id="nav.${view}"]`;
          await page.locator(selector).click();
          await page.waitForSelector(`[data-eve-view="${view}"]`);
          recordStep(steps.length + 1, `Navigate ${view}`, selector, 'Visible product navigation used', Date.now());
        };
        const grades: any[] = [];
        for (const view of ['financials-income', 'financials-balance']) {
          await navigate(view);
          // The route marker changes before its asynchronous accounting rows render.
          // Wait for real cells; the grader still rejects missing or unsupported values.
          await waitWithPriority('[data-eve-financial-value="true"]', 30000);
          const screenshot = path.join(evidenceDir, `${view}.png`);
          await page.screenshot({ path: screenshot, fullPage: true });
          const grade = await auditor.gradeFinancialScreen(await detail(), screenshot, params.academy.expectedMetrics?.[view] || {});
          grades.push(grade);
          if (!grade.pass) { checkpoint({ state: 'TRUTH_FAILED', intakeSessionId, workspaceId, grades }); throw new Error('RENDERED_VALUE_TRUTH_FAILED'); }
        }
        const factControl = await page.$('[data-eve-financial-value="true"][data-canonical-fact-id]');
        if (!factControl) throw new Error('PROVENANCE_CONTROL_MISSING');
        await factControl.click();
        await page.waitForSelector('[data-eve-action-id="evidence.close"]', { visible: true });
        await page.screenshot({ path: path.join(evidenceDir, 'provenance.png'), fullPage: true });
        await page.click('[data-eve-action-id="evidence.close"]');
        for (const view of ['engagement-evidence', 'engagement-findings', 'engagement-deliverables']) {
          await navigate(view);
          await page.screenshot({ path: path.join(evidenceDir, `${view}.png`), fullPage: true });
        }
        if (params.academy.retryUnavailableLexicon) {
          await waitWithPriority('[data-eve-action-id="draft.retry.lexicon"]', 30000);
          await checkCustomerPriority();
          const acknowledgement = page.waitForResponse((r: any) => new URL(r.url()).origin === new URL(baseUrl).origin &&
            new URL(r.url()).pathname === '/api/academy/ui/retry-lexicon' && r.request().method() === 'POST', { timeout: 30000 });
          await page.click('[data-eve-action-id="draft.retry.lexicon"]');
          const response = await acknowledgement;
          if (!response.ok()) throw new Error('SPECIALIST_RETRY_UI_REJECTED');
          recordStep(steps.length + 1, 'Retry unavailable Lexicon and update draft', '[data-eve-action-id="draft.retry.lexicon"]',
            'Actual product request accepted; prior work retained', Date.now());
          checkpoint({ state: 'SPECIALIST_RETRY_REQUESTED', intakeSessionId, workspaceId });
          const retryDeadline = Date.now() + 240000;
          const updatedPdf = '[data-eve-action-id="draft.download.pdf"][data-eve-action-target$=".r1"]';
          while (!(await page.$(updatedPdf))) {
            await checkCustomerPriority();
            if (Date.now() > retryDeadline) throw new Error('SPECIALIST_RETRY_TIMEOUT');
            await new Promise(resolve => setTimeout(resolve, 5000));
            if (!(await page.$(updatedPdf))) await page.click('[data-eve-action-id="draft.refresh"]');
          }
          if (!(await detail()).continuation?.specialistSummary?.allJobsSucceeded) throw new Error('SPECIALIST_RETRY_INCOMPLETE');
        }
        const specialistDeadline = Date.now() + 900000;
        do {
          if (await page.$('[data-eve-action-id="draft.download.pdf"]')) break;
          await waitWithPriority('[data-eve-action-id="draft.prepare"]:not([disabled]), [data-eve-action-id="draft.download.pdf"]', 600000);
        if (!(await page.$('[data-eve-action-id="draft.download.pdf"]'))) {
          await checkCustomerPriority();
          await page.click('[data-eve-action-id="draft.prepare"]');
          recordStep(steps.length + 1, 'Prepare AI draft', '[data-eve-action-id="draft.prepare"]', 'Actual UI draft request', Date.now());
          checkpoint({ state: 'DRAFT_REQUESTED', intakeSessionId, workspaceId });
        }
          try { await page.waitForSelector('[data-eve-draft-requested="true"]', { timeout: 10000 }); break; }
          catch { if (Date.now() > specialistDeadline) throw new Error('SPECIALIST_PROCESSING_TIMEOUT'); }
        } while (true);
        const deadline = Date.now() + 600000;
        while (!(await page.$('[data-eve-action-id="draft.download.pdf"]'))) {
          await checkCustomerPriority();
          if (Date.now() > deadline) throw new Error('DRAFT_GENERATION_TIMEOUT');
          await new Promise(resolve => setTimeout(resolve, 5000));
          // Refresh clears the list while its request is in flight. Observe the
          // completed response before another refresh can erase the download control.
          if (!(await page.$('[data-eve-action-id="draft.download.pdf"]'))) {
            await page.click('[data-eve-action-id="draft.refresh"]');
          }
        }
        const downloadDir = path.join(evidenceDir, 'downloads', crypto.randomUUID());
        fs.mkdirSync(downloadDir, { recursive: true });
        const session = await page.createCDPSession();
        await session.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true });
        await checkCustomerPriority();
        await page.click('[data-eve-action-id="draft.download.pdf"]');
        let downloaded = '';
        const downloadDeadline = Date.now() + 60000;
        while (!downloaded) {
          downloaded = fs.readdirSync(downloadDir).find(name => name.endsWith('.pdf')) || '';
          if (Date.now() > downloadDeadline) throw new Error('UI_DOWNLOAD_TIMEOUT');
          if (!downloaded) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const selectedDownload = await page.$eval('[data-eve-action-id="draft.download.pdf"]', (el: any) => el.dataset.eveActionTarget);
        const finalDetail = await detail();
        const report = finalDetail.reports.find((r: any) => `${r.reportId}:${r.version}` === selectedDownload);
        const bytes = fs.readFileSync(path.join(downloadDir, downloaded));
        if (!report?.formats?.pdf?.sha256 || report.formats.pdf.sha256 !== crypto.createHash('sha256').update(bytes).digest('hex')) throw new Error('DOWNLOAD_EVIDENCE_HASH_MISMATCH');
        if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('DOWNLOADED_ARTIFACT_INVALID');
        academyEvidence = { workspaceId, intakeSessionId, grades, download: { filename: downloaded,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length }, viewport: page.viewport(),
          continuation: (await detail()).continuation, status: 'UI_JOURNEY_EXECUTED_PENDING_ACCEPTANCE' };
        checkpoint({ state: 'UI_JOURNEY_EXECUTED_PENDING_ACCEPTANCE', ...academyEvidence });
      }

      await browser.close();
      browser = null;

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      return {
        academyEvidence,
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
      if (params.academy) {
        const dir = params.academy.evidenceDir;
        fs.mkdirSync(dir, { recursive: true });
        if (browser) {
          try {
            const pages = await browser.pages();
            const active = pages[pages.length - 1];
            if (active && !(await active.$('form[action="/operator-login"]'))) await active.screenshot({ path: path.join(dir, `failure-${journeyId}.png`), fullPage: true });
          } catch {}
        }
        fs.writeFileSync(path.join(dir, `failure-${journeyId}.json`), JSON.stringify({ journeyId, startedAt, failedAt: new Date().toISOString(),
          sourceSha256, steps, error: error.message, status: 'FAILED', score: 0 }, null, 2), { mode: 0o600 });
      }
      if (browser) {
        try { await browser.close(); } catch (_) {}
      }
      throw new Error(`[RealBrowserCustomerSimulator] Browser journey failed: ${error.message}`);
    }
  }
}

export const realBrowserCustomerSimulatorEngine = RealBrowserCustomerSimulatorEngine.getInstance();
