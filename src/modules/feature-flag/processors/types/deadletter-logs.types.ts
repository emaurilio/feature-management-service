import { AuditLogPayload } from './audit-logs.types';

export interface DeadLetterLogPayload {
  originalPayload: AuditLogPayload;
  error: string;
  failedAt: string;
}
