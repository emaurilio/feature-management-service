import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class FeatureFlagCacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: import('cache-manager').Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    return (await this.cacheManager.get<T>(key)) || null;
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async invalidateFlag(flagName: string, companyId?: string): Promise<void> {
    const keys = [`feature-flag:name:${flagName}`];
    if (companyId) {
      keys.push(`feature-flag:check:company:${companyId}:flag:${flagName}`);
    }
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }
}
