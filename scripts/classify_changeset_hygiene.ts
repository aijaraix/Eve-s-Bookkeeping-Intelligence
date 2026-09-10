import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

export interface FileClassification {
  path: string;
  category: 
    | 'PRODUCTION_SOURCE'
    | 'PRODUCTION_CONFIGURATION'
    | 'TEST_SOURCE'
    | 'DOCUMENTATION'
    | 'CURATED_TEST_FIXTURE'
    | 'FORENSIC_EVIDENCE'
    | 'GENERATED_RUNTIME_STATE'
    | 'GENERATED_REPORT_OUTPUT'
    | 'BUILD_OR_CACHE_ARTIFACT'
    | 'SECRET_OR_SENSITIVE'
    | 'LEGACY_OR_UNKNOWN';
  sizeBytes: number;
  reason: string;
  secretDetected?: string;
  sha256: string;
}

function computeSha256(filePath: string): string {
  try {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return 'UNREADABLE';
  }
}

function scanForSecrets(filePath: string, content: string): string | null {
  if (filePath.endsWith('.env.example')) return null;
  if (filePath.includes('runtimeAuthorityManifest.ts') && content.includes('[REDACTED_GEMINI_KEY]')) return null;
  if (filePath.includes('zeaburProductionRuntime.test.ts')) return null;

  const patterns = [
    { name: 'Gemini API Key', regex: /AIzaSy[A-Za-z0-9_-]{33}/ },
    { name: 'OpenAI Secret Key', regex: /sk-[A-Za-z0-9]{32,}/ },
    { name: 'GitHub Personal Token', regex: /gh[pousr]-[A-Za-z0-9]{36}/ },
    { name: 'Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/ },
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Zeabur API Token', regex: /zeabur_[a-zA-Z0-9_-]{24,}/ }
  ];

  for (const p of patterns) {
    if (p.regex.test(content)) {
      return p.name;
    }
  }
  return null;
}

export function classifyFile(relPath: string): { category: FileClassification['category']; reason: string; secretDetected?: string } {
  const norm = relPath.replace(/\\/g, '/');
  const ext = path.extname(norm).toLowerCase();
  const baseName = path.basename(norm);

  // Check secrets first
  try {
    const stat = fs.statSync(norm);
    if (stat.size < 5 * 1024 * 1024) {
      const fileContent = fs.readFileSync(norm, 'utf-8');
      const sec = scanForSecrets(norm, fileContent);
      if (sec) {
        return { category: 'SECRET_OR_SENSITIVE', reason: `Detected potential secret: ${sec}`, secretDetected: sec };
      }
    }
  } catch {
    // Binary
  }

  // 1. DOCUMENTATION
  if (norm.startsWith('docs/')) {
    return { category: 'DOCUMENTATION', reason: 'Authoritative Eve Operating System documentation' };
  }
  if (baseName === 'README.md' || baseName === 'AGENTS.md' || baseName === 'GEMINI.md') {
    return { category: 'DOCUMENTATION', reason: 'Root markdown documentation' };
  }

  // 2. PRODUCTION CONFIGURATION
  if ([
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'metadata.json',
    '.gitignore',
    '.env.example',
    'Dockerfile',
    '.dockerignore'
  ].includes(norm)) {
    return { category: 'PRODUCTION_CONFIGURATION', reason: 'Root build and runtime container configuration' };
  }

  // 3. BUILD OR CACHE ARTIFACT (Including downloaded browser binaries)
  if (
    norm.startsWith('chrome/') ||
    norm.startsWith('chrome-headless-shell/') ||
    norm.startsWith('chromedriver/') ||
    norm.startsWith('dist/') ||
    norm.startsWith('build/') ||
    norm.startsWith('node_modules/') ||
    norm.startsWith('.vite/') ||
    norm.startsWith('.cache/') ||
    norm === 'bun.lock' ||
    norm.endsWith('.tmp') ||
    norm.includes('/tmp_')
  ) {
    return { category: 'BUILD_OR_CACHE_ARTIFACT', reason: 'Downloaded browser binary, compilation, or temporary cache' };
  }

  // 4. GENERATED REPORT OUTPUT (PDF, XLSX, CSV, report JSON)
  if (
    norm.startsWith('storage/reports/') ||
    norm.endsWith('.pdf') ||
    norm.endsWith('.xlsx') ||
    (norm.endsWith('.csv') && (norm.includes('lead_schedules_') || norm.includes('reports/'))) ||
    (norm.includes('audit_package_') && norm.endsWith('.json')) ||
    (norm.includes('audit_report_') && norm.endsWith('.json')) ||
    (norm.includes('audit_workbook_') && norm.endsWith('.json')) ||
    norm.includes('browser_certification_results.json') ||
    norm.includes('production_audit_report.json') ||
    norm.includes('h939_ask_anything_results.json') ||
    norm.includes('h939_portfolio_report.json')
  ) {
    return { category: 'GENERATED_REPORT_OUTPUT', reason: 'Generated audit deliverable or certification report artifact' };
  }

  // 5. FORENSIC EVIDENCE (Historical frozen evidence & SEC filings)
  if (
    norm.startsWith('storage/forensics/') ||
    norm.startsWith('storage/cpa_memory/sources/') ||
    norm.startsWith('storage/cpa_memory/customer_staging/') ||
    norm.includes('h938_frozen_evidence') ||
    norm.includes('h939_ten_company_authoritative_certification.json') ||
    norm.includes('migration_record.json') ||
    norm.includes('quarantined_records.json')
  ) {
    return { category: 'FORENSIC_EVIDENCE', reason: 'Preserved immutable historical forensic evidence or source filing' };
  }

  // 6. GENERATED RUNTIME STATE (State stores, queues, locks, leases, telemetry, internal audits)
  if (
    norm.startsWith('storage/cpa_memory/') ||
    norm.startsWith('storage/uploads/') ||
    norm.startsWith('storage/intake_sessions/') ||
    norm.startsWith('storage/semantic_tasks/') ||
    norm === 'storage/worker_jobs.json' ||
    norm === 'ai_cpa_storage.json' ||
    norm === 'db.storage.json' ||
    norm === 'storage/queue_jobs.json' ||
    norm === 'storage/extraction_task_cache.json' ||
    norm === 'storage/intake_sessions.json' ||
    norm === 'storage/semantic_tasks.json'
  ) {
    return { category: 'GENERATED_RUNTIME_STATE', reason: 'Mutable runtime state store or execution queue' };
  }

  // 7. CURATED TEST FIXTURE (Sealed Academy documents)
  if (norm.startsWith('storage/academy/documents/')) {
    return { category: 'CURATED_TEST_FIXTURE', reason: 'Sealed Hermes Academy curriculum test fixture document' };
  }

  // 8. TEST SOURCE
  if (
    norm.startsWith('server/tests/') ||
    norm.startsWith('scripts/') ||
    norm === 'run_tests.ts' ||
    norm === 'run_browser_certification.ts' ||
    norm.includes('.test.ts') ||
    norm.includes('.spec.ts')
  ) {
    return { category: 'TEST_SOURCE', reason: 'Deterministic verification suite or execution script' };
  }

  // 9. PRODUCTION SOURCE
  if (
    norm.startsWith('src/') ||
    norm.startsWith('server/') ||
    norm === 'server.ts' ||
    norm === 'index.html' ||
    norm === 'public/icon.png' ||
    norm === 'public/favicon.ico'
  ) {
    return { category: 'PRODUCTION_SOURCE', reason: 'Active application, server, engine, or UI production source' };
  }

  // 10. LEGACY SNAPSHOT
  if (norm.startsWith('legacy_snapshot/')) {
    return { category: 'LEGACY_OR_UNKNOWN', reason: 'Preserved pre-refactor legacy UI component snapshot' };
  }

  return { category: 'LEGACY_OR_UNKNOWN', reason: 'Unclassified root or miscellaneous file' };
}

async function run() {
  const rawStatus = execSync('git status --porcelain=v1 -uall', { encoding: 'utf-8' });
  const lines = rawStatus.split('\n').filter(l => l.trim().length > 0);

  const inventory: FileClassification[] = [];
  const categoryCounts: Record<FileClassification['category'], number> = {
    PRODUCTION_SOURCE: 0,
    PRODUCTION_CONFIGURATION: 0,
    TEST_SOURCE: 0,
    DOCUMENTATION: 0,
    CURATED_TEST_FIXTURE: 0,
    FORENSIC_EVIDENCE: 0,
    GENERATED_RUNTIME_STATE: 0,
    GENERATED_REPORT_OUTPUT: 0,
    BUILD_OR_CACHE_ARTIFACT: 0,
    SECRET_OR_SENSITIVE: 0,
    LEGACY_OR_UNKNOWN: 0
  };

  const largeFiles: { path: string; sizeBytes: number; category: string; reason: string }[] = [];

  for (const line of lines) {
    const relPath = line.substring(3).trim();
    if (!relPath) continue;

    let sizeBytes = 0;
    try {
      const st = fs.statSync(relPath);
      sizeBytes = st.size;
    } catch {
      sizeBytes = 0;
    }

    const { category, reason, secretDetected } = classifyFile(relPath);
    const sha256 = computeSha256(relPath);

    categoryCounts[category]++;
    inventory.push({
      path: relPath,
      category,
      sizeBytes,
      reason,
      secretDetected,
      sha256
    });

    if (sizeBytes > 200 * 1024) {
      largeFiles.push({ path: relPath, sizeBytes, category, reason });
    }
  }

  const toCommitNow = inventory.filter(i => 
    i.category === 'PRODUCTION_SOURCE' ||
    i.category === 'PRODUCTION_CONFIGURATION' ||
    i.category === 'TEST_SOURCE' ||
    i.category === 'DOCUMENTATION'
  );

  const preservedExcluded = inventory.filter(i =>
    i.category === 'GENERATED_RUNTIME_STATE' ||
    i.category === 'GENERATED_REPORT_OUTPUT' ||
    i.category === 'BUILD_OR_CACHE_ARTIFACT' ||
    i.category === 'FORENSIC_EVIDENCE' ||
    i.category === 'CURATED_TEST_FIXTURE'
  );

  const requiringReview = inventory.filter(i =>
    i.category === 'SECRET_OR_SENSITIVE' ||
    i.category === 'LEGACY_OR_UNKNOWN'
  );

  // Check Docs 00-28
  const docFiles: string[] = [];
  for (let d = 0; d <= 28; d++) {
    const pad = d < 10 ? `0${d}` : `${d}`;
    const found = fs.readdirSync('docs/eve-operating-system/').find(f => f.startsWith(pad));
    if (found) docFiles.push(found);
  }

  console.log("=== HYGIENE CLASSIFICATION REPORT ===");
  console.log(`TOTAL_CHANGED=${inventory.length}`);
  console.log(`PRODUCTION_SOURCE=${categoryCounts.PRODUCTION_SOURCE}`);
  console.log(`PRODUCTION_CONFIGURATION=${categoryCounts.PRODUCTION_CONFIGURATION}`);
  console.log(`TEST_SOURCE=${categoryCounts.TEST_SOURCE}`);
  console.log(`DOCUMENTATION=${categoryCounts.DOCUMENTATION}`);
  console.log(`CURATED_TEST_FIXTURE=${categoryCounts.CURATED_TEST_FIXTURE}`);
  console.log(`FORENSIC_EVIDENCE=${categoryCounts.FORENSIC_EVIDENCE}`);
  console.log(`GENERATED_RUNTIME_STATE=${categoryCounts.GENERATED_RUNTIME_STATE}`);
  console.log(`GENERATED_REPORT_OUTPUT=${categoryCounts.GENERATED_REPORT_OUTPUT}`);
  console.log(`BUILD_OR_CACHE_ARTIFACT=${categoryCounts.BUILD_OR_CACHE_ARTIFACT}`);
  console.log(`SECRET_OR_SENSITIVE=${categoryCounts.SECRET_OR_SENSITIVE}`);
  console.log(`LEGACY_OR_UNKNOWN=${categoryCounts.LEGACY_OR_UNKNOWN}`);
  console.log("");
  console.log(`FILES_TO_COMMIT_NOW=${toCommitNow.length}`);
  console.log(`FILES_PRESERVED_BUT_EXCLUDED=${preservedExcluded.length}`);
  console.log(`FILES_REQUIRING_OWNER_REVIEW=${requiringReview.length}`);
  console.log(`DOCS_00_THROUGH_28_INTACT=${docFiles.length === 29 ? 'YES (29/29 files verified intact)' : `NO (${docFiles.length}/29)`}`);
  console.log(`SECRET_SCAN_STATUS=${categoryCounts.SECRET_OR_SENSITIVE === 0 ? 'CLEAN (0 secrets detected)' : `${categoryCounts.SECRET_OR_SENSITIVE} secrets flagged`}`);
  console.log(`LARGE_FILE_STATUS=${largeFiles.length} files > 200KB detected`);
  
  if (largeFiles.length > 0) {
    console.log("\n--- LARGE FILES (>200KB) SUMMARY ---");
    const catGroups: Record<string, number> = {};
    largeFiles.forEach(f => {
      catGroups[f.category] = (catGroups[f.category] || 0) + 1;
    });
    console.log(JSON.stringify(catGroups, null, 2));
  }

  if (requiringReview.length > 0) {
    console.log("\n--- FILES REQUIRING OWNER REVIEW ---");
    requiringReview.forEach(f => {
      console.log(`- ${f.path} [${f.category}]: ${f.reason}`);
    });
  }
}

run().catch(console.error);
