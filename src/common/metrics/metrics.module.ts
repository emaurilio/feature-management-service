import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { MetricsController } from './metrics.controller';
import { PrometheusInterceptor } from './prometheus.interceptor';
import { METRICS_OBSERVER } from './metrics.observer';

@Module({
  providers: [
    PrometheusService,
    {
      provide: METRICS_OBSERVER,
      useExisting: PrometheusService,
    },
    PrometheusInterceptor,
  ],
  controllers: [MetricsController],
  exports: [PrometheusService, PrometheusInterceptor, METRICS_OBSERVER],
})
export class MetricsModule {}
