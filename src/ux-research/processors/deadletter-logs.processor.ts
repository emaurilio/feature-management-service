import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { getErrorMessage } from '../../common/utils/error.utils';
import { DeadLetterLogPayload } from './types/deadletter-logs.types';

@Processor('deadletter-ux-research')
@Injectable()
export class DeadletterUXResearchProcessor extends WorkerHost {
  private readonly logger = new Logger(DeadletterUXResearchProcessor.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {
    super();
  }

  async process(job: Job<DeadLetterLogPayload, void, string>): Promise<void> {
    this.logger.warn(
      `Processando deadletter para flag: ${job.data.originalPayload.entity}`,
    );

    try {
      return await this.sendDeadLetterToElastic(job.data);
    } catch (error) {
      this.logger.error(
        `Erro ao processar deadletter ${job.id}:`,
        getErrorMessage(error),
      );
      throw error;
    }
  }

  private async sendDeadLetterToElastic(
    data: DeadLetterLogPayload,
  ): Promise<void> {
    await this.elasticsearchService.index({
      index: 'deadletter-audit-feature-flags',
      document: {
        ...data,
        processedAt: new Date().toISOString(),
      },
    });

    this.logger.log(
      `Deadletter salvo em Elasticsearch para flag: ${data.originalPayload.entity}`,
    );
  }
}
