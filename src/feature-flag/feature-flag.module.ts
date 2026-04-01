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
import { CompanyFeatureFlagRepository } from './infraestructure/persistence/repositories/company-feature-flag.repository';
import { CreateFeatureFlagUseCase } from './application/use-cases/create-feature-flag.use-case';
import { ImportCompaniesIdsUseCase } from './application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from './application/use-cases/import-users-ids.use-case';
import { FeatureFlagExistsConstraint } from './infraestructure/validators/feature-flag-exists.validator';
import { DeleteFeatureFlagUseCase } from './application/use-cases/delete-feature-flag.use-case';
import { UserFeatureFlagRepository } from './infraestructure/persistence/repositories/user-feature-flag.repository';
import { StsFeatureFlagController } from './sts-feature-flag.controller';
import { FeatureFlagController } from './feature-flag.controller';
import { HashFeatureFlagService } from './application/services/hash-feature-flag.service';
import { CheckFeatureFlagUseCase } from './application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { CheckFeatureFlagUserUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-user.use-case';
import { CheckFeatureFlagCompanyUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-company.use-case';
import { CheckFeatureFlagPercentageUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-percentage.use-case';
import { CheckFeatureFlagCompanyPercentageUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-company-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-user-percentage.use-case';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'audit-logs' },
      { name: 'deadletter-logs' },
    ),
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    }),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
          ttl: 3600,
        }),
      }),
    }),
    MetricsModule,
    TypeOrmModule.forFeature([CompanyFeatureFlagRepository]),
    TypeOrmModule.forFeature([FeatureFlagRepository]),
    TypeOrmModule.forFeature([UserFeatureFlagRepository]),
  ],
  providers: [
    FeatureFlagService,
    AuditService,
    HashFeatureFlagService,
    AuditLogsProcessor,
    DeadletterLogsProcessor,
    CreateFeatureFlagUseCase,
    ImportCompaniesIdsUseCase,
    ImportUsersIdsUseCase,
    DeleteFeatureFlagUseCase,
    FeatureFlagExistsConstraint,
    CheckFeatureFlagUseCase,
    CheckFeatureFlagUserUseCase,
    CheckFeatureFlagCompanyUseCase,
    CheckFeatureFlagPercentageUseCase,
    CheckFeatureFlagCompanyPercentageUseCase,
    CheckFeatureFlagUserPercentageUseCase,
  ],
  controllers: [FeatureFlagController, StsFeatureFlagController],
})
export class FeatureFlagModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PrometheusInterceptor).forRoutes('*');
  }
}
