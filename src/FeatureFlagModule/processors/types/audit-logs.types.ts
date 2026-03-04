export interface AuditLogPayload {
  flagName: string;
  flagId: string;
  newValue: boolean;
  updatedBy: number;
  timestamp: string;
}
