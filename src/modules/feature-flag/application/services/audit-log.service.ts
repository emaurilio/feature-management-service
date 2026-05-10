import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditLogPayload } from 'src/modules/feature-flag/processors/types/audit-logs.types';
import { LOGGING_SERVICE } from 'src/modules/common/logging/logging-service.interface';
import type { LoggingServiceInterface } from 'src/modules/common/logging/logging-service.interface';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectQueue('audit-logs') private readonly auditQueue: Queue,
    @Inject(LOGGING_SERVICE)
    private readonly loggingService: LoggingServiceInterface,
  ) { }

  async dispatchLog(payload: AuditLogPayload): Promise<boolean> {
    try {
      await this.auditQueue.add('log-update', payload, {
        attempts: 3,
        backoff: 5000,
      });
      return true;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.loggingService.logError(
        err,
        `AuditLogService - Falha ao enfileirar log para entidade: ${payload.entity}`,
      );
      return false;
    }
  }
}
