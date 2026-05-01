import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data-source';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { UXResearchModule } from './ux-research/ux-research.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { AuthModule } from './common/auth/auth.module';
import { LoggingModule } from './common/logging/logging.module';
import { CacheRedisModule } from './common/cache/cache.module';
import { ElasticsearchIntegrationModule } from './common/elasticsearch/elasticsearch-integration.module';
import { RequestLoggingInterceptor } from './common/logging/request-logging.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusInterceptor } from './common/metrics/prometheus.interceptor';

@Module({
  imports: [
    ElasticsearchIntegrationModule,
    TypeOrmModule.forRoot(AppDataSource.options),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    AuthModule,
    FeatureFlagModule,
    UXResearchModule,
    MetricsModule,
    LoggingModule,
    CacheRedisModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
  ],
})
export class AppModule { }
