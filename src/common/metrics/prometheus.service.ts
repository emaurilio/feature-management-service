import { Injectable } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  register,
  collectDefaultMetrics,
} from 'prom-client';
import { MetricsObserver } from './metrics.observer';

@Injectable()
export class PrometheusService implements MetricsObserver {
  private elasticsearchFailures: Counter;
  private auditLogsFallback: Gauge;
  private auditLogProcessingTime: Histogram;
  private featureFlagCacheFailures: Counter;
  private featureFlagCacheInvalidationFailures: Counter;

  constructor() {
    collectDefaultMetrics({ prefix: 'nodejs_' });

    this.elasticsearchFailures = new Counter({
      name: 'elasticsearch_failures_total',
      help: 'Total de falhas ao enviar logs pro Elasticsearch',
      labelNames: ['flag_name', 'error_type'],
      registers: [register],
    });

    this.auditLogsFallback = new Gauge({
      name: 'audit_logs_fallback_pending',
      help: 'Quantidade de logs em fallback aguardando sincronização',
      registers: [register],
    });

    this.auditLogProcessingTime = new Histogram({
      name: 'audit_log_processing_duration_seconds',
      help: 'Tempo de processamento de cada audit log em segundos',
      labelNames: ['flag_name', 'status'],
      registers: [register],
    });

    this.featureFlagCacheFailures = new Counter({
      name: 'feature_flag_cache_failures_total',
      help: 'Total de falhas ao gravar cache de feature flag',
      labelNames: ['operation', 'cache_key', 'error_type'],
      registers: [register],
    });

    this.featureFlagCacheInvalidationFailures = new Counter({
      name: 'feature_flag_cache_invalidation_failures_total',
      help: 'Total de falhas ao invalidar cache de feature flag',
      labelNames: ['feature_name', 'version', 'error_type'],
      registers: [register],
    });
  }

  recordElasticsearchFailure(flagName: string, errorType: string): void {
    this.elasticsearchFailures.labels(flagName, errorType).inc();
  }

  recordCacheFailure(
    operation: string,
    cacheKey: string,
    errorType: string,
  ): void {
    this.featureFlagCacheFailures.labels(operation, cacheKey, errorType).inc();
  }

  recordCacheInvalidationFailure(
    featureName: string,
    version: string,
    errorType: string,
  ): void {
    this.featureFlagCacheInvalidationFailures
      .labels(featureName, version, errorType)
      .inc();
  }

  setFallbackPendingCount(count: number): void {
    this.auditLogsFallback.set(count);
  }

  recordProcessingTime(
    flagName: string,
    status: 'success' | 'failure',
    durationMs: number,
  ): void {
    this.auditLogProcessingTime
      .labels(flagName, status)
      .observe(durationMs / 1000);
  }
}
