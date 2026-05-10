export const CACHE_SERVICE = 'CACHE_SERVICE';

export interface CacheServiceInterface {

  get(key: string): Promise<boolean | null>;

  set(key: string, value: boolean, ttl?: number): Promise<void>;

  invalidateCacheEntityFlags(
    version: string,
    featureName: string,
    entitiesId: string[],
  ): Promise<void>;
}
