import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditLogPayload } from 'src/ux-research/processors/types/audit-logs.types';
import { LOGGING_SERVICE } from 'src/common/logging/logging-service.interface';
import type { LoggingServiceInterface } from 'src/common/logging/logging-service.interface';

@Injectable()
export class LogService {
  constructor(
    @InjectQueue('audit-ux-research') private readonly auditQueue: Queue,
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
    } catch {
      this.loggingService.logError(
        new Error(`Falha ao enfileirar log para entidade: ${payload.entity}`),
        `${payload.entity}`,
      );
      return false;
    }
  }
}
