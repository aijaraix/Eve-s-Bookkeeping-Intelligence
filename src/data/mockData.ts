/**
 * DEMO fixtures only. Production views must not import this module.
 * Tagged dataOrigin: "DEMO" so fail-closed guards treat records as unreachable live facts.
 */
import { Company, Project } from '../types';

export const DATA_ORIGIN = 'DEMO' as const;

export const COMPANIES: Array<Company & { dataOrigin: 'DEMO' }> = [
  {
    id: 'demo-unilever',
    workspaceId: 'demo-unilever',
    dataOrigin: 'DEMO',
    name: 'DEMO Unilever PLC (not live)',
    ticker: 'UL',
    country: 'United Kingdom',
    reporting: 'IFRS',
    currency: 'EUR (€)',
    healthScore: 'DEMO',
    status: 'REVIEW_REQUIRED',
    reg: 'DEMO',
    sector: 'DEMO',
    revenue: 'DEMO',
    netIncome: 'DEMO',
    assets: 'DEMO',
    activeProjectsCount: 0
  }
];

export const PROJECTS: Array<Project & { dataOrigin: 'DEMO' }> = [];
