import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppCacheService } from './cache.service';
import { CACHE_SERVICE } from './cache-service.interface';
import { MetricsModule } from '../metrics/metrics.module';

@Global()
@Module({
  imports: [
    MetricsModule,
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
          ttl: 3600,
        }),
      }),
    }),
  ],
  providers: [
    {
      provide: CACHE_SERVICE,
      useClass: AppCacheService,
    },
  ],
  exports: [CacheModule, CACHE_SERVICE],
})
export class CacheRedisModule { }

