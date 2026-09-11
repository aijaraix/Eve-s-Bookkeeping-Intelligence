/**
 * EVE AUTONOMOUS CPA ORGANIZATION — ROUTE BOUNDARY GUARD & PATH CLASSIFIER
 * 
 * Implements Package B3 Requirements 11, 12, 13:
 * - Route path classification:
 *   - PRODUCTION
 *   - INTERNAL_OPERATOR
 *   - ACADEMY_ONLY
 *   - TEST_ONLY
 *   - FORENSIC
 *   - LEGACY
 * - Enforces physical isolation of non-production paths:
 *   - TEST_ONLY / ACADEMY_ONLY / LEGACY / FORENSIC paths cannot write customer canonical truth,
 *     reports, or affect production metrics.
 * - Restricts /journey/execute and synthetic simulation routes to test authorization.
 */

import { Request, Response, NextFunction } from 'express';

export type RouteClassification =
  | 'PRODUCTION'
  | 'INTERNAL_OPERATOR'
  | 'ACADEMY_ONLY'
  | 'TEST_ONLY'
  | 'FORENSIC'
  | 'LEGACY';

export interface RouteClassificationMetadata {
  path: string;
  classification: RouteClassification;
  description: string;
  allowsProductionWrite: boolean;
  requiresTestAuth: boolean;
}

export class RouteBoundaryGuard {
  private static instance: RouteBoundaryGuard | null = null;
  private classifications: Map<string, RouteClassificationMetadata> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): RouteBoundaryGuard {
    if (!RouteBoundaryGuard.instance) {
      RouteBoundaryGuard.instance = new RouteBoundaryGuard();
    }
    return RouteBoundaryGuard.instance;
  }

  private registerDefaults(): void {
    // 1. Production Routes
    const prodRoutes: string[] = [
      '/api/cpa/intake/upload',
      '/api/cpa/reports/library',
      '/api/cpa/deliverables/library',
      '/api/cpa/report/download-pdf',
      '/api/cpa/report/download-xlsx',
      '/api/cpa/report/download-csv',
      '/api/cpa/report/download-json',
      '/api/cpa/report/signoff'
    ];
    for (const r of prodRoutes) {
      this.classifications.set(r, {
        path: r,
        classification: 'PRODUCTION',
        description: 'Customer production route for authoritative work.',
        allowsProductionWrite: true,
        requiresTestAuth: false
      });
    }

    // 2. Internal Operator Routes
    const operatorRoutes: string[] = [
      '/api/cpa/operator/overview',
      '/api/cpa/operator/attention',
      '/api/cpa/operator/learning',
      '/api/cpa/observatory/events',
      '/api/cpa/internal-audit/report'
    ];
    for (const r of operatorRoutes) {
      this.classifications.set(r, {
        path: r,
        classification: 'INTERNAL_OPERATOR',
        description: 'Internal CPA firm operator observability & controls.',
        allowsProductionWrite: false,
        requiresTestAuth: false
      });
    }

    // 3. Academy Only Routes
    const academyRoutes: string[] = [
      '/api/cpa/academy/cases',
      '/api/cpa/academy/evaluate',
      '/api/cpa/academy/curriculum'
    ];
    for (const r of academyRoutes) {
      this.classifications.set(r, {
        path: r,
        classification: 'ACADEMY_ONLY',
        description: 'Academy curriculum and evaluation environment.',
        allowsProductionWrite: false,
        requiresTestAuth: false
      });
    }

    // 4. Test Only / Legacy Simulation Routes
    const testRoutes: string[] = [
      '/api/cpa/journey/execute',
      '/api/cpa/journey/history',
      '/api/cpa/simulators/canary',
      '/api/cpa/simulators/advance'
    ];
    for (const r of testRoutes) {
      this.classifications.set(r, {
        path: r,
        classification: 'TEST_ONLY',
        description: 'Legacy synthetic customer journey or canary simulator.',
        allowsProductionWrite: false,
        requiresTestAuth: true
      });
    }
  }

  public classifyPath(pathStr: string): RouteClassification {
    const exact = this.classifications.get(pathStr);
    if (exact) return exact.classification;

    if (pathStr.includes('/journey/execute') || pathStr.includes('/journey/history') || pathStr.includes('/simulators/')) {
      return 'TEST_ONLY';
    }
    if (pathStr.includes('/academy/')) {
      return 'ACADEMY_ONLY';
    }
    if (pathStr.includes('/operator/') || pathStr.includes('/observatory/') || pathStr.includes('/internal-audit/')) {
      return 'INTERNAL_OPERATOR';
    }
    if (pathStr.includes('/forensic/')) {
      return 'FORENSIC';
    }
    if (pathStr.includes('/legacy/')) {
      return 'LEGACY';
    }

    return 'PRODUCTION';
  }

  /**
   * Enforces boundary check on request.
   * If a non-production path attempts to assert production canonical authority, it is blocked.
   */
  public enforceBoundary(req: Request, res: Response, next: NextFunction): void {
    const classification = this.classifyPath(req.path);
    res.setHeader('X-Eve-Route-Classification', classification);

    if (classification === 'TEST_ONLY') {
      const isTestEnv = process.env.NODE_ENV === 'test' || process.env.IS_SCRIPT === 'true';
      const hasTestHeader = req.headers['x-eve-test-authorization'] === 'TEST_AUTHORIZED' || req.headers['x-eve-execution-boundary'] === 'TEST_ONLY';

      if (!isTestEnv && !hasTestHeader) {
        res.status(403).json({
          error: 'FORBIDDEN_LEGACY_SYNTHETIC_ROUTE',
          message: `Route '${req.path}' is classified as TEST_ONLY and restricted from direct production customer access.`,
          classification: 'TEST_ONLY'
        });
        return;
      }
    }

    next();
  }

  /**
   * Package B3 Requirement 11:
   * Programmatic route boundary check for HTTP method, route path, and target environment.
   */
  public enforceRouteBoundary(method: string, pathStr: string, targetEnvironment: string = 'PRODUCTION'): {
    allowed: boolean;
    classification: RouteClassification;
    reason?: string;
  } {
    const classification = this.classifyPath(pathStr);
    if (targetEnvironment === 'PRODUCTION') {
      if (classification !== 'PRODUCTION') {
        return {
          allowed: false,
          classification,
          reason: `Path '${pathStr}' is classified as ${classification} and cannot mutate ${targetEnvironment} canonical state.`
        };
      }
    }
    return {
      allowed: true,
      classification
    };
  }

  /**
   * Asserts whether a given context is permitted to write production canonical truth.
   */
  public assertProductionWriteAllowed(classification: RouteClassification): { allowed: boolean; reason?: string } {
    if (classification !== 'PRODUCTION') {
      return {
        allowed: false,
        reason: `Write rejected: Path classification '${classification}' is prohibited from establishing customer canonical truth.`
      };
    }
    return { allowed: true };
  }
}

export const routeBoundaryGuard = RouteBoundaryGuard.getInstance();
