import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { MetricsController } from './metrics.controller';
import { PrometheusInterceptor } from './prometheus.interceptor';

@Module({
  providers: [PrometheusService, PrometheusInterceptor],
  controllers: [MetricsController],
  exports: [PrometheusService, PrometheusInterceptor],
})
export class MetricsModule {}
