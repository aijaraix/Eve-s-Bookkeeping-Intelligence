export type SupportCaseStatus = 'OPEN'|'WAITING_ON_CUSTOMER'|'INVESTIGATING'|'RESOLVED'|'CLOSED';
export type SupportSeverity = 'NORMAL'|'HIGH'|'URGENT';
export type SupportVisibility = 'CUSTOMER_VISIBLE'|'INTERNAL_ONLY';
export interface SupportCase { id:string; tenantId:string; workspaceId:string|null; subject:string; status:SupportCaseStatus; severity:SupportSeverity; createdByUserId:string; assignedOperatorUserId:string|null; createdAt:string; updatedAt:string; }
export interface SupportMessage { id:string; caseId:string; actorUserId:string; actorKind:'CUSTOMER'|'OPERATOR'; body:string; visibility:SupportVisibility; createdAt:string; }
export interface SupportSession { id:string; operatorUserId:string; tenantId:string; caseId:string; reason:string; createdAt:string; expiresAt:string; endedAt:string|null; mode:'READ_ONLY'; }
export interface SupportAudit { id:string; at:string; actorUserId:string; tenantId:string; caseId:string|null; sessionId:string|null; event:'SUPPORT_CASE_CREATED'|'SUPPORT_MESSAGE_SENT'|'SUPPORT_INTERNAL_NOTE_ADDED'|'SUPPORT_SESSION_STARTED'|'SUPPORT_SESSION_ENDED'|'SUPPORT_OBJECT_VIEWED'; }
export interface SupportState { version:1; cases:SupportCase[]; messages:SupportMessage[]; sessions:SupportSession[]; audit:SupportAudit[]; }
