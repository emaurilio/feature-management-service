import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data-source';
import { FeatureFlagModule } from './FeatureFlagModule/feature-flag.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { AuthModule } from './common/auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusInterceptor } from './common/metrics/prometheus.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    AuthModule,
    FeatureFlagModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
  ],
})
export class AppModule {}
