import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { getErrorMessage } from '../../common/utils/error.utils';
import { PrometheusService } from '../../common/metrics/prometheus.service';
import { AuditLogPayload } from './types/audit-logs.types';

@Processor('audit-logs')
@Injectable()
export class AuditLogsProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditLogsProcessor.name);

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectQueue('deadletter-logs') private readonly deadletterQueue: Queue,
    private readonly prometheusService: PrometheusService,
  ) {
    super();
  }

  async process(job: Job<AuditLogPayload, void, string>): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processando log para a flag: ${job.data.flagName}`);

    try {
      await this.sendToElastic(job.data);
      const duration = Date.now() - startTime;
      this.prometheusService.recordProcessingTime(
        job.data.flagName,
        'success',
        duration,
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Erro ao processar job ${job.id}: ${errorMessage}`);

      const duration = Date.now() - startTime;
      this.prometheusService.recordProcessingTime(
        job.data.flagName,
        'failure',
        duration,
      );

      this.prometheusService.recordElasticsearchFailure(
        job.data.flagName,
        error instanceof Error ? error.constructor.name : 'Unknown',
      );

      const maxAttempts = job.opts.attempts ?? 1;
      if (job.attemptsMade >= maxAttempts) {
        await this.sendToDeadLetter(job.data, errorMessage);
      }

      throw error;
    }
  }

  private async sendToElastic(data: AuditLogPayload): Promise<void> {
    await this.elasticsearchService.index({
      index: 'audit-feature-flags',
      document: {
        ...data,
        processedAt: new Date().toISOString(),
      },
    });
  }

  private async sendToDeadLetter(
    payload: AuditLogPayload,
    error: string,
  ): Promise<void> {
    try {
      await this.deadletterQueue.add('failed-log', {
        originalPayload: payload,
        error,
        failedAt: new Date().toISOString(),
      });
      this.logger.warn(`Log enviado para deadletter: ${payload.flagName}`);
    } catch (deadletterError) {
      this.logger.error(
        'Falha crítica ao enviar para deadletter',
        getErrorMessage(deadletterError),
      );
    }
  }
}
