# Academy Customer Browser Contract

Academy customers are governed Eve tenants, not backend fixtures.

Required journey:
tenant/workspace lifecycle → login → Documents UI upload → intake/queue → processing → Exceptions/PBC → customer answers when scenario permits → reports/Report Wizard → downloads → support/help when applicable.

Browser operator must use the same authenticated customer-facing routes future customers use. API/database shortcuts may assist diagnostics but cannot certify the journey.

Every exam includes rendered-product truth checks. Backend-correct/UI-wrong is FAIL. Wrong/stale dashboard values, broken evidence links, invisible exceptions, inconsistent exports, unusable mobile flows or broken reverse lineage fail relevant competencies.

Tenant classifications: PRODUCTION_CUSTOMER, ACADEMY_SYNTHETIC, ACADEMY_PUBLIC_DATA, INTERNAL_ACCEPTANCE. Classification controls visibility/lifecycle/cleanup, never an easier accounting pipeline.
