export interface AuditLogPayload {
  action: string;
  entity: string;
  entityId?: string;
  timestamp: string;
  data?: object;
}
