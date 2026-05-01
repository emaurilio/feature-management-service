export const METRICS_OBSERVER = Symbol('METRICS_OBSERVER');

export interface MetricsObserver {

  recordCacheFailure(
    operation: string,
    cacheKey: string,
    errorType: string,
  ): void;

  recordCacheInvalidationFailure(
    featureName: string,
    version: string,
    errorType: string,
  ): void;

  recordElasticsearchFailure(flagName: string, errorType: string): void;

  setFallbackPendingCount(count: number): void;

  recordProcessingTime(
    flagName: string,
    status: 'success' | 'failure',
    durationMs: number,
  ): void;
}
