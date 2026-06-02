import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MetricsModule } from 'src/modules/common/metrics/metrics.module';
import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { AppCacheService } from 'src/modules/common/cache/cache.service';

@Global()
@Module({
  imports: [CacheModule.register({ isGlobal: true }), MetricsModule],
  providers: [
    {
      provide: CACHE_SERVICE,
      useClass: AppCacheService,
    },
  ],
  exports: [CACHE_SERVICE, CacheModule, MetricsModule],
})
export class InMemoryCacheModule {}
