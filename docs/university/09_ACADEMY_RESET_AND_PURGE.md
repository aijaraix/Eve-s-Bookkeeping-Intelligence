# Academy Reset and Purge

Academy/test data must be explicitly classified and removable without touching production tenants.

Provide a governed purge/reset process for ACADEMY_SYNTHETIC, ACADEMY_PUBLIC_DATA and INTERNAL_ACCEPTANCE tenants, documents, messages, jobs, reports and generated artifacts.

Before purge, preserve only the non-customer artifacts intentionally retained for regression: examination definitions, lawful source references/checksums where permitted, anonymized/synthetic fixtures, defect taxonomy, capability evidence and learning history.

Never delete or mutate PRODUCTION_CUSTOMER data through Academy purge.

Purge must support dry-run inventory, tenant-scope verification, audit record, bounded execution and post-purge verification. No direct ad-hoc deletion as the normal lifecycle.
