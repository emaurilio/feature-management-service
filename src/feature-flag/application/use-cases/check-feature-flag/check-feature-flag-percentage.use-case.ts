import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { FeatureFlagCacheService } from '../../services/feature-flag-cache.service';
import { LogService } from '../../services/log.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckFeatureFlagPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    private readonly hashFeatureFlag: HashFeatureFlagService,
    private readonly featureFlagCacheService: FeatureFlagCacheService,
    private readonly logService: LogService,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const entityId =
      checkFeatureFlagDto.companyId || checkFeatureFlagDto.userId;

    const hashName = `${entityId}-${checkFeatureFlagDto.featureName}-${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_percentage',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          entityId: entityId,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }

    const hashFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    const checkResult = hashFeatureFlag < checkFeatureFlagDto.percentage;

    void this.logService.dispatchLog({
      action: 'check_feature_flag_percentage',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        entityId: entityId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
