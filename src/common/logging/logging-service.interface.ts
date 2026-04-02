export const LOGGING_SERVICE = 'LOGGING_SERVICE';

export interface LoggingServiceInterface {
  logRequest(method: string, path: string, query: string, body: string): void;
  logResponse(statusCode: number, durationMs: number): void;
  logError(error: Error, context?: string): void;
}
