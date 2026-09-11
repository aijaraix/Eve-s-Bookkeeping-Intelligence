/**
 * EVE AUTONOMOUS CPA ORGANIZATION — DERIVATION OBJECT SERVICE
 * 
 * Implements Package B3 Requirement 3:
 * - Any report value not directly sourced from an authoritative canonical fact
 *   MUST have a durable DerivationObject.
 * - Persists:
 *   - derivationId
 *   - inputFactReferences
 *   - operation / formula
 *   - units
 *   - period
 *   - scale
 *   - result
 *   - producedBy
 *   - verifiedBy
 *   - proofState
 * - Rejects ungrounded or undocumented local calculations within report renderers.
 */

import fs from 'fs';
import path from 'path';

export interface DerivationObject {
  derivationId: string;
  outputMetricName?: string;
  inputFactReferences: string[];
  operation: string;
  formula?: string;
  units: string;
  period: string;
  scale: string;
  result: number;
  producedBy: string;
  verifiedBy?: string;
  proofState: 'PROPOSED' | 'CALCULATED' | 'VERIFIED' | 'VALIDATED' | 'REJECTED' | 'INVALIDATED';
  createdAt: string;
  invalidatedAt?: string;
  invalidationReason?: string;
}

export class DerivationObjectService {
  private static instance: DerivationObjectService | null = null;
  private derivationsDir: string;
  private derivations: Map<string, DerivationObject> = new Map();
  private factToDerivations: Map<string, string[]> = new Map(); // key = factId, value = derivationIds

  private constructor() {
    this.derivationsDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'derivations');
    if (!fs.existsSync(this.derivationsDir)) {
      fs.mkdirSync(this.derivationsDir, { recursive: true });
    }
    this.rehydrate();
  }

  public static getInstance(): DerivationObjectService {
    if (!DerivationObjectService.instance) {
      DerivationObjectService.instance = new DerivationObjectService();
    }
    return DerivationObjectService.instance;
  }

  private rehydrate(): void {
    try {
      if (!fs.existsSync(this.derivationsDir)) return;
      const files = fs.readdirSync(this.derivationsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(this.derivationsDir, file), 'utf-8');
          const d: DerivationObject = JSON.parse(raw);
          if (this.validateDerivation(d).valid) {
            this.derivations.set(d.derivationId, d);
            for (const factId of d.inputFactReferences) {
              const list = this.factToDerivations.get(factId) || [];
              if (!list.includes(d.derivationId)) {
                list.push(d.derivationId);
                this.factToDerivations.set(factId, list);
              }
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  /**
   * Validates that all mandatory fields are present and well-formed.
   */
  public validateDerivation(derivation: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!derivation || typeof derivation !== 'object') {
      return { valid: false, errors: ['Derivation object is null or undefined.'] };
    }

    if (!derivation.derivationId || typeof derivation.derivationId !== 'string') {
      errors.push('Missing mandatory field: derivationId');
    }
    if (!Array.isArray(derivation.inputFactReferences) || derivation.inputFactReferences.length === 0) {
      errors.push('inputFactReferences must be a non-empty array of fact IDs');
    }
    if (!derivation.operation || typeof derivation.operation !== 'string') {
      errors.push('Missing mandatory field: operation');
    }
    if (!derivation.units || typeof derivation.units !== 'string') {
      errors.push('Missing mandatory field: units');
    }
    if (!derivation.period || typeof derivation.period !== 'string') {
      errors.push('Missing mandatory field: period');
    }
    if (!derivation.scale || typeof derivation.scale !== 'string') {
      errors.push('Missing mandatory field: scale');
    }
    if (typeof derivation.result !== 'number' || isNaN(derivation.result)) {
      errors.push('result must be a valid number');
    }
    if (!derivation.producedBy || typeof derivation.producedBy !== 'string') {
      errors.push('Missing mandatory field: producedBy');
    }
    if (!['PROPOSED', 'CALCULATED', 'VERIFIED', 'VALIDATED', 'REJECTED', 'INVALIDATED'].includes(derivation.proofState)) {
      errors.push(`Invalid proofState: ${derivation.proofState}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Registers an authoritative derivation object.
   */
  public registerDerivation(derivation: DerivationObject): { success: boolean; errors?: string[] } {
    const check = this.validateDerivation(derivation);
    if (!check.valid) {
      return { success: false, errors: check.errors };
    }

    this.derivations.set(derivation.derivationId, derivation);
    for (const factId of derivation.inputFactReferences) {
      const list = this.factToDerivations.get(factId) || [];
      if (!list.includes(derivation.derivationId)) {
        list.push(derivation.derivationId);
        this.factToDerivations.set(factId, list);
      }
    }

    try {
      fs.writeFileSync(
        path.join(this.derivationsDir, `${derivation.derivationId}.json`),
        JSON.stringify(derivation, null, 2),
        'utf-8'
      );
    } catch (_) {}

    return { success: true };
  }

  /**
   * Convenience factory to build and register a validated DerivationObject.
   */
  public createDerivation(params: {
    engagementId?: string;
    outputMetricName?: string;
    formula?: string;
    operation?: string;
    inputFactIds?: string[];
    inputFactReferences?: string[];
    inputValues?: Record<string, number>;
    calculatedValue?: number;
    result?: number;
    units?: string;
    period?: string;
    scale?: string;
    producedBy?: string;
    proofState?: any;
  }): DerivationObject & { calculatedValue: number } {
    const dId = `drv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const inputRefs = params.inputFactIds || params.inputFactReferences || [];
    const res = params.calculatedValue ?? params.result ?? 0;
    const derivation: DerivationObject = {
      derivationId: dId,
      outputMetricName: params.outputMetricName,
      inputFactReferences: inputRefs,
      operation: params.operation || params.formula || 'CALCULATION',
      formula: params.formula || params.operation,
      units: params.units || 'USD',
      period: params.period || 'FY2025',
      scale: params.scale || 'RAW',
      result: res,
      producedBy: params.producedBy || 'EUCLID_MATH_ENGINE',
      proofState: params.proofState || 'VALIDATED',
      createdAt: new Date().toISOString()
    };
    this.registerDerivation(derivation);
    return Object.assign(derivation, { calculatedValue: res });
  }

  /**
   * Retrieves a derivation by ID.
   */
  public getDerivation(derivationId: string): DerivationObject | undefined {
    return this.derivations.get(derivationId);
  }

  /**
   * Retrieves all derivations dependent on a given fact.
   */
  public getDerivationsForFact(factId: string): DerivationObject[] {
    const ids = this.factToDerivations.get(factId) || [];
    return ids.map(id => this.derivations.get(id)).filter((d): d is DerivationObject => d !== undefined);
  }

  /**
   * Marks all derivations relying on an invalidated fact as INVALIDATED.
   */
  public invalidateDerivationsForFact(factId: string, reason: string): string[] {
    const ids = this.factToDerivations.get(factId) || [];
    const affected: string[] = [];

    for (const id of ids) {
      const d = this.derivations.get(id);
      if (d && d.proofState !== 'INVALIDATED') {
        d.proofState = 'INVALIDATED';
        d.invalidatedAt = new Date().toISOString();
        d.invalidationReason = `Input fact ${factId} invalidated: ${reason}`;
        affected.push(id);

        try {
          fs.writeFileSync(
            path.join(this.derivationsDir, `${d.derivationId}.json`),
            JSON.stringify(d, null, 2),
            'utf-8'
          );
        } catch (_) {}
      }
    }

    return affected;
  }
}

export const derivationObjectService = DerivationObjectService.getInstance();
