/**
 * EVE AUTONOMOUS CPA ORGANIZATION — SOLVER EXECUTION REGISTRY
 * 
 * Implements B4.1 Requirements 3, 5 & 6:
 * - Persists authoritative solver execution packages (solverExecutionId, solverOutputs, tool receipts, memory receipts).
 * - Persists authoritative physical document census artifacts (documentId, table/row/cell/XBRL counts).
 * - Used by Minerva Examiner to evaluate benchmark cases without trusting caller-supplied expected answers or tool declarations.
 */

import fs from 'fs';
import path from 'path';

export interface SolverExecutionPackage {
  solverExecutionId: string;
  timestamp: string;
  agentId: string;
  benchmarkId?: string;
  solverOutputs: Record<string, any>;
  allowedEvidenceStores: string[];
  toolAccessReceipt: string[];
  memoryAccessReceipt: string[];
  documentId?: string;
  questionId?: string;
}

export interface DocumentCensusArtifact {
  documentId: string;
  totalTables: number;
  totalRows: number;
  totalCells: number;
  totalXbrlTags: number;
  totalCensusCount: number;
  sha256?: string;
  filePath?: string;
}

export class SolverExecutionRegistry {
  private static instance: SolverExecutionRegistry | null = null;
  private executions: Map<string, SolverExecutionPackage> = new Map();
  private censusArtifacts: Map<string, DocumentCensusArtifact> = new Map();
  private storageFile: string;

  private constructor() {
    const storageDir = process.env.HERMES_PERSISTENT_DATA_DIR ||
      (fs.existsSync('/opt/data') ? '/opt/data/cpa_organization' : path.join(process.cwd(), 'storage', 'cpa_memory'));
    if (!fs.existsSync(storageDir)) {
      try { fs.mkdirSync(storageDir, { recursive: true }); } catch (err) {}
    }
    this.storageFile = path.join(storageDir, 'solver_execution_registry.json');
    this.loadFromDisk();
  }

  public static getInstance(): SolverExecutionRegistry {
    if (!SolverExecutionRegistry.instance) {
      SolverExecutionRegistry.instance = new SolverExecutionRegistry();
    }
    return SolverExecutionRegistry.instance;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf-8'));
        if (data && typeof data === 'object') {
          if (Array.isArray(data.executions)) {
            for (const exec of data.executions) {
              this.executions.set(exec.solverExecutionId, exec);
            }
          }
          if (Array.isArray(data.censusArtifacts)) {
            for (const art of data.censusArtifacts) {
              this.censusArtifacts.set(art.documentId, art);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[SolverExecutionRegistry] Could not load from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const payload = {
        executions: Array.from(this.executions.values()),
        censusArtifacts: Array.from(this.censusArtifacts.values())
      };
      const tmpFile = `${this.storageFile}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');
      const fd = fs.openSync(tmpFile, 'r+');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fs.renameSync(tmpFile, this.storageFile);
    } catch (err) {
      console.error('[SolverExecutionRegistry] Failed to save to disk:', err);
    }
  }

  public registerExecutionPackage(pkg: Partial<SolverExecutionPackage> & { executionId?: string; toolUsageReceipts?: string[]; outputFacts?: any[]; outputs?: any }): SolverExecutionPackage {
    const id = pkg.solverExecutionId || pkg.executionId || `exec-${Date.now()}`;
    const fullPkg: SolverExecutionPackage = {
      solverExecutionId: id,
      timestamp: pkg.timestamp || new Date().toISOString(),
      agentId: pkg.agentId || 'HERMES',
      benchmarkId: pkg.benchmarkId,
      solverOutputs: pkg.solverOutputs || pkg.outputs || { facts: pkg.outputFacts || [] },
      allowedEvidenceStores: pkg.allowedEvidenceStores || [],
      toolAccessReceipt: pkg.toolAccessReceipt || pkg.toolUsageReceipts || [],
      memoryAccessReceipt: pkg.memoryAccessReceipt || [],
      documentId: pkg.documentId,
      questionId: pkg.questionId
    };
    this.executions.set(id, fullPkg);
    this.saveToDisk();
    return fullPkg;
  }

  public getExecutionPackage(solverExecutionId: string): SolverExecutionPackage | undefined {
    return this.executions.get(solverExecutionId);
  }

  public registerCensusArtifact(art: (Partial<DocumentCensusArtifact> & { documentId: string }) | string, maybeArt?: Partial<DocumentCensusArtifact>): DocumentCensusArtifact {
    const fullArt: DocumentCensusArtifact = typeof art === 'string' ? {
      documentId: art,
      totalTables: maybeArt?.totalTables || 0,
      totalRows: maybeArt?.totalRows || 0,
      totalCells: maybeArt?.totalCells || 0,
      totalXbrlTags: maybeArt?.totalXbrlTags || 0,
      totalCensusCount: maybeArt?.totalCensusCount || maybeArt?.totalCells || ((maybeArt?.totalTables || 0) + (maybeArt?.totalRows || 0) + (maybeArt?.totalCells || 0) + (maybeArt?.totalXbrlTags || 0)),
      sha256: maybeArt?.sha256,
      filePath: maybeArt?.filePath
    } : {
      documentId: art.documentId,
      totalTables: art.totalTables || 0,
      totalRows: art.totalRows || 0,
      totalCells: art.totalCells || 0,
      totalXbrlTags: art.totalXbrlTags || 0,
      totalCensusCount: art.totalCensusCount || art.totalCells || ((art.totalTables || 0) + (art.totalRows || 0) + (art.totalCells || 0) + (art.totalXbrlTags || 0)),
      sha256: art.sha256,
      filePath: art.filePath
    };
    this.censusArtifacts.set(fullArt.documentId, fullArt);
    this.saveToDisk();
    return fullArt;
  }

  public getCensusArtifact(documentId: string): DocumentCensusArtifact | undefined {
    return this.censusArtifacts.get(documentId);
  }
}

export const solverExecutionRegistry = SolverExecutionRegistry.getInstance();
