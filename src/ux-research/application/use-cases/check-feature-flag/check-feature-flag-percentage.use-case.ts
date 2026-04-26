import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { LogService } from '../../services/log.service';
import { Injectable } from '@nestjs/common';
import { HashUXResearchService } from '../../services/hash-ux-research.service';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { CheckUXResearchDto } from '../../dto/check-feature-flag/check-ux-research.dto';
import type { CheckUXResearchInterface } from 'src/ux-research/domain/use-cases/check-ux-research.use-case.interface';

@Injectable()
export class CheckFeatureFlagPercentageUseCase implements CheckUXResearchInterface {
  constructor(
    private readonly hashUXResearch: HashUXResearchService,
    @Inject(CACHE_SERVICE)
    private readonly uxResearchCacheService: CacheServiceInterface,
    private readonly logService: LogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    const entityId =
      checkUXResearchDto.companyId || checkUXResearchDto.userId;

    const hashName = `${entityId}-${checkUXResearchDto.name}-${checkUXResearchDto.version}`;

    const cacheResult = await this.uxResearchCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_percentage',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          entityId: entityId,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }

    const hashFeatureFlag = this.hashUXResearch.calculateHash(hashName);

    const checkResult = hashFeatureFlag < checkUXResearchDto.percentage;

    void this.logService.dispatchLog({
      action: 'check_feature_flag_percentage',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkUXResearchDto.name,
        version: checkUXResearchDto.version,
        entityId: entityId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.uxResearchCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
