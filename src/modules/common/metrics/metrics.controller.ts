import { Controller, Get, Header, VERSION_NEUTRAL } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';

@Controller({ path: 'metrics', version: VERSION_NEUTRAL })
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}
