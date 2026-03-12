import { Module, MiddlewareConsumer } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FeatureFlagService } from './feature-flag.service';
import { AuditLogsProcessor } from './processors/audit-logs.processor';
import { DeadletterLogsProcessor } from './processors/deadletter-logs.processor';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { AuditService } from './application/services/audit.service';
import { MetricsModule } from '../common/metrics/metrics.module';
import { PrometheusInterceptor } from '../common/metrics/prometheus.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlagRepository } from './infraestructure/persistence/repositories/feature-flag.repository';
import { UserFeatureFlagRepository } from './infraestructure/persistence/repositories/user-feature-flag.respository';
import { CompanyFeatureFlagRepository } from './infraestructure/persistence/repositories/company-feature-flag.repository';
import { CreateFeatureFlagUseCase } from './application/usecase/create-feature-flag.use-case';

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
    TypeOrmModule.forFeature([CompanyFeatureFlagRepository]),
    TypeOrmModule.forFeature([FeatureFlagRepository]),
    TypeOrmModule.forFeature([UserFeatureFlagRepository]),
  ],
  providers: [
    FeatureFlagService,
    AuditService,
    AuditLogsProcessor,
    DeadletterLogsProcessor,
    CreateFeatureFlagUseCase,
  ],
})
export class FeatureFlagModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PrometheusInterceptor).forRoutes('*');
  }
}
