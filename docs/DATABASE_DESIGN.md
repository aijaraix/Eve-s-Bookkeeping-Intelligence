# Database Design: AI CPA Core

## Entity Relationship Overview
- **Tenancy**: `users`, `organizations`, `workspaces`, `workspace_members`
- **Company Structure**: `companies`, `legal_entities`, `reporting_periods`, `fiscal_calendars`
- **Documents**: `documents`, `document_versions`, `document_pages`, `document_tables`, `document_chunks`, `document_processing_runs`
- **Financial Facts**: `extracted_facts`, `proposed_transactions`, `account_balances`, `audit_events`
- **AI & Chat**: `conversations`, `messages`, `citations`, `generated_reports`

All monetary fields use fixed-precision decimal representations. Every record is strictly scoped by organization and workspace.
