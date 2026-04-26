import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { METRICS_OBSERVER } from 'src/common/metrics/metrics.observer';
import type { MetricsObserver } from 'src/common/metrics/metrics.observer';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { CacheServiceInterface } from './cache-service.interface';

@Injectable()
export class AppCacheService implements CacheServiceInterface {
  private readonly logger = new Logger(AppCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: import('cache-manager').Cache,
    @Inject(METRICS_OBSERVER)
    private readonly metricsObserver: MetricsObserver,
  ) { }

  async get(key: string): Promise<boolean | null> {
    const getCacheResult = await this.cacheManager.get<boolean>(key);

    if (getCacheResult === undefined || getCacheResult === null) {
      return null;
    }

    return getCacheResult;
  }

  async set(key: string, value: boolean, ttl: number = 3600): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to save cache for key ${key}`, errorMessage);
      this.metricsObserver.recordCacheFailure('set', key, errorMessage);
    }
  }

  async invalidateCacheEntityFlags(
    version: string,
    featureName: string,
    entitiesId: string[],
  ): Promise<void> {
    try {
      await Promise.all(
        entitiesId.map((entityId) =>
          this.cacheManager.del(`${entityId}-${featureName}-${version}`),
        ),
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to invalidate cache for key ${featureName} v${version}`,
        errorMessage,
      );
      this.metricsObserver.recordCacheInvalidationFailure(
        featureName,
        version,
        errorMessage,
      );
    }
  }
}
