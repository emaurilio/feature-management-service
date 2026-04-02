import { Injectable, Logger } from '@nestjs/common';
import { LoggingServiceInterface } from './logging-service.interface';

@Injectable()
export class LoggingService implements LoggingServiceInterface {
  private readonly logger = new Logger(LoggingService.name);

  logRequest(method: string, path: string, query: string, body: string): void {
    this.logger.log(
      `Request: method=${method} path=${path} query=${query} body=${body}`,
    );
  }

  logResponse(statusCode: number, durationMs: number): void {
    this.logger.log(`Response: status=${statusCode} durationMs=${durationMs}`);
  }

  logError(error: Error, context = ''): void {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);
    this.logger.error(
      `Error${context ? ` [${context}]` : ''}: ${message}`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}
