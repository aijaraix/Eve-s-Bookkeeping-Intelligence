/**
 * EVE AUTONOMOUS CPA ORGANIZATION — PERSISTENT AGENT MEMORY
 * 
 * Implements isolated hierarchical memory namespaces for the 13 Named CPA Agents:
 * - Namespace: `eve/<agent_id>/...`
 * - Memory layers:
 *   1. Working Memory: Active engagement/session state, transient scratchpads.
 *   2. Episodic Memory: Completed engagements, historical cases, encountered edge cases.
 *   3. Semantic Memory: Accounting rules, jurisdiction precedents, firm preferences.
 *   4. Procedural Memory: Verified tool chains, extraction heuristics, regex templates.
 *   5. Firm Memory: Shared across all agents, read-only for line agents, managed by HERMES/SENTINEL.
 * 
 * Backed by durable local disk storage in `storage/cpa_memory/` so restarts never wipe knowledge.
 */

import fs from 'fs';
import path from 'path';

export type MemoryType = 'WORKING' | 'EPISODIC' | 'SEMANTIC' | 'PROCEDURAL' | 'FIRM_SHARED';

export type DataClassification =
  | 'EXAMINER_SEALED'
  | 'ACADEMY_TRAINING'
  | 'ACADEMY_HOLDOUT'
  | 'PRODUCTION_CUSTOMER'
  | 'PUBLIC_REFERENCE'
  | 'FORENSIC'
  | 'CANARY'
  | 'TEST'
  | 'LEGACY';

export interface MemoryEntry {
  id: string;
  namespace: string;
  type: MemoryType;
  key: string;
  value: any;
  tags: string[];
  classification?: DataClassification;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  confidence: number;
}

export class PersistentAgentMemory {
  private static instance: PersistentAgentMemory | null = null;
  private storageDir: string;
  private memoryStore: Map<string, MemoryEntry> = new Map();

  private constructor() {
    this.storageDir = process.env.HERMES_PERSISTENT_DATA_DIR || 
      (fs.existsSync('/opt/data') ? '/opt/data/cpa_organization' : path.join(process.cwd(), 'storage', 'cpa_memory'));
    this.ensureStorage();
    this.loadFromDisk();
    this.seedDefaultFirmMemory();
  }

  public static getInstance(): PersistentAgentMemory {
    if (!PersistentAgentMemory.instance) {
      PersistentAgentMemory.instance = new PersistentAgentMemory();
    }
    return PersistentAgentMemory.instance;
  }

  private ensureStorage() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getStoreFilePath(): string {
    return path.join(this.storageDir, 'agent_memory_store.json');
  }

  private loadFromDisk() {
    try {
      const file = this.getStoreFilePath();
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (Array.isArray(data)) {
          for (const entry of data) {
            // Examiner vs Solver Isolation (Doc 35): Do not load sealed benchmark answers into solver memory
            if (entry.id?.includes('golden_fixture') || entry.tags?.includes('golden_standard')) {
              continue;
            }
            this.memoryStore.set(entry.id, entry);
          }
        }
      }
    } catch (err) {
      console.warn('[PersistentAgentMemory] Could not load persisted memory from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const file = this.getStoreFilePath();
      const data = Array.from(this.memoryStore.values());
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PersistentAgentMemory] Failed to save memory to disk:', err);
    }
  }

  private seedDefaultFirmMemory() {
    // Seed general accounting equation rules and identities (deterministic GAAP/IFRS taxonomy configuration)
    this.store({
      namespace: 'eve/firm',
      type: 'SEMANTIC',
      key: 'fundamental_accounting_identities',
      value: {
        balanceSheet: 'Assets == Liabilities + Equity',
        cashFlow: 'Beginning Cash + Operating + Investing + Financing == Ending Cash',
        netIncome: 'Gross Margin - Operating Expenses - Tax - Financial Expense == Net Income'
      },
      tags: ['rules', 'gaap', 'ifrs', 'equations'],
      confidence: 1.0
    });

    // Note (Doc 35 Section 3): Examiner sealed golden benchmarks are strictly forbidden in firm shared memory.
    // Minerva sealed truth is isolated in AcademyMinervaLab (EXAMINER_VAULT != SOLVER_KNOWLEDGE).
  }

  public store(params: {
    namespace: string;
    type: MemoryType;
    key: string;
    value: any;
    tags?: string[];
    classification?: DataClassification;
    confidence?: number;
  }): MemoryEntry {
    const classification = params.classification || 
      (params.tags?.includes('EXAMINER_SEALED') || params.tags?.includes('golden_standard') ? 'EXAMINER_SEALED' : 'PUBLIC_REFERENCE');

    // Rule 1: Examiner Sealed Isolation (Doc 35 Requirements 1, 2, 3 & 18)
    const isSolverNamespace = !params.namespace.startsWith('eve/examiner') && !params.namespace.startsWith('eve/minerva');
    const isSealedContent = classification === 'EXAMINER_SEALED' || 
      params.tags?.includes('EXAMINER_SEALED') || 
      params.tags?.includes('golden_standard') || 
      params.key.includes('sealed_answer');

    if (isSolverNamespace && isSealedContent) {
      throw new Error(`EXAMINER_SEALED_ISOLATION_VIOLATION: Cannot write examiner sealed benchmark answers into solver agent namespace '${params.namespace}'.`);
    }

    // Rule 2: Customer Data Isolation (Doc 35 Requirement 5)
    const isCustomerData = classification === 'PRODUCTION_CUSTOMER' || params.tags?.includes('customer_raw') || params.namespace.includes('tenant-');
    const isGlobalAcademyNamespace = params.namespace === 'eve/firm' || params.namespace === 'eve/academy/global';

    if (isCustomerData && isGlobalAcademyNamespace && classification !== 'ACADEMY_TRAINING') {
      throw new Error(`CUSTOMER_DATA_ISOLATION_VIOLATION: Cannot publish customer engagement data into global Academy memory without explicit de-identification and ACADEMY_TRAINING classification.`);
    }

    const id = `${params.namespace}:${params.key}`;
    const now = new Date().toISOString();

    const existing = this.memoryStore.get(id);
    const entry: MemoryEntry = {
      id,
      namespace: params.namespace,
      type: params.type,
      key: params.key,
      value: params.value,
      tags: params.tags || [],
      classification,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      accessCount: existing ? existing.accessCount + 1 : 1,
      confidence: params.confidence !== undefined ? params.confidence : 0.95
    };

    this.memoryStore.set(id, entry);
    this.saveToDisk();
    return entry;
  }

  public writeMemory(params: {
    agentId?: string;
    namespace: string;
    type?: MemoryType;
    key: string;
    value: any;
    confidence?: number;
    provenanceSource?: string;
    tags?: string[];
  }): MemoryEntry {
    return this.store({
      namespace: params.namespace,
      type: params.type || 'EPISODIC',
      key: params.key,
      value: params.value,
      tags: params.tags || (params.provenanceSource ? [params.provenanceSource] : []),
      confidence: params.confidence !== undefined ? params.confidence : 1.0
    });
  }

  public retrieve(namespace: string, key: string, requesterAgentId?: string): MemoryEntry | null {
    const id = `${namespace}:${key}`;
    const entry = this.memoryStore.get(id);
    if (entry) {
      const requester = (requesterAgentId || '').toUpperCase();
      const isExaminer = requester === 'MINERVA' || requester === 'EXAMINER';
      if (entry.classification === 'EXAMINER_SEALED' && !isExaminer) {
        return null; // Deny access to solver contexts
      }
      entry.accessCount++;
      return entry;
    }
    return null;
  }

  public query(params: {
    namespace?: string;
    type?: MemoryType;
    tag?: string;
    searchTerm?: string;
    requesterAgentId?: string;
  }): MemoryEntry[] {
    let results = Array.from(this.memoryStore.values());
    const requester = (params.requesterAgentId || '').toUpperCase();
    const isExaminer = requester === 'MINERVA' || requester === 'EXAMINER';

    if (!isExaminer) {
      results = results.filter(e => e.classification !== 'EXAMINER_SEALED' && !e.tags.includes('EXAMINER_SEALED'));
    }

    if (params.namespace) {
      results = results.filter(e => e.namespace === params.namespace || e.namespace.startsWith(`${params.namespace}/`));
    }
    if (params.type) {
      results = results.filter(e => e.type === params.type);
    }
    if (params.tag) {
      results = results.filter(e => e.tags.includes(params.tag!));
    }
    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      results = results.filter(e =>
        e.key.toLowerCase().includes(term) ||
        JSON.stringify(e.value).toLowerCase().includes(term)
      );
    }

    return results;
  }

  public getAgentMemories(agentId: string): MemoryEntry[] {
    const ns = `eve/${agentId.replace(/^eve-/, '')}`;
    return this.query({ namespace: ns });
  }

  public getAllMemories(): MemoryEntry[] {
    return Array.from(this.memoryStore.values());
  }
}

export const persistentAgentMemory = PersistentAgentMemory.getInstance();
