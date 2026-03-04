import { Module, MiddlewareConsumer } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FeatureFlagService } from './feature-flag.service';
import { AuditLogsProcessor } from './processors/audit-logs.processor';
import { DeadletterLogsProcessor } from './processors/deadletter-logs.processor';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { AuditService } from './application/services/audit.service';
import { MetricsModule } from '../common/metrics/metrics.module';
import { PrometheusInterceptor } from '../common/metrics/prometheus.interceptor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'audit-logs' },
      { name: 'deadletter-logs' },
    ),
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    }),
    MetricsModule,
  ],
  providers: [
    FeatureFlagService,
    AuditService,
    AuditLogsProcessor,
    DeadletterLogsProcessor,
  ],
})
export class FeatureFlagModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PrometheusInterceptor).forRoutes('*');
  }
}
