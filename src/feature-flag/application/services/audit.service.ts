import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditLogPayload } from 'src/feature-flag/processors/types/audit-logs.types';
import { getErrorMessage } from 'src/common/utils/error.utils';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectQueue('audit-logs') private readonly auditQueue: Queue) {}

  async dispatchLog(payload: AuditLogPayload): Promise<boolean> {
    try {
      await this.auditQueue.add('log-update', payload, {
        attempts: 3,
        backoff: 5000,
      });
      return true;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Falha ao enfileirar log para entidade: ${payload.entity}`,
        errorMessage,
      );
      return false;
    }
  }
}
