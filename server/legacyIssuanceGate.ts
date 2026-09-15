import type { Request, Response } from 'express';

// Deliberately has no storage, report generation, or approval dependencies.
export function rejectLegacyIssuance(_req: Request, res: Response) {
  return res.status(409).json({
    success: false,
    error: 'LEGACY_ISSUANCE_DISABLED',
    message: 'Legacy issuance is disabled. Open Company 1 in Engagements and use its existing draft review package; professional release requires the authorized human approval workflow.',
  });
}

export function projectFirmBranding(configured: Record<string, unknown> = {}) {
  return {
    firmName: '',
    partnerName: '',
    licenseNumber: '',
    firmAddress: '',
    phone: '',
    email: '',
    accentColor: '#1e3a8a',
    logoUrl: '',
    opinionType: 'Pending Review',
    disclaimer: '',
    ...configured,
    // Caller-provided letterhead cannot establish approval or credentials.
    authorityStatus: 'CONFIGURATION_ONLY_NOT_PROFESSIONAL_AUTHORITY',
  };
}
