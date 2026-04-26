import { Module } from '@nestjs/common';
import { AppController } from './ux-research.controller';
import { AppService } from './ux-research.service';
import { MetricsModule } from '../common/metrics/metrics.module';
import { AuthModule } from '../common/auth/auth.module';
import { LoggingModule } from '../common/logging/logging.module';
import { RequestLoggingInterceptor } from '../common/logging/request-logging.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusInterceptor } from '../common/metrics/prometheus.interceptor';
import { FeatureFlagModule } from 'src/feature-flag/feature-flag.module';

@Module({
  imports: [
    AuthModule,
    FeatureFlagModule,
    MetricsModule,
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
