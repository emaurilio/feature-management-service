import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { LogService } from '../../services/log.service';
import { FeatureFlagCacheService } from '../../services/feature-flag-cache.service';
import { Inject, Injectable } from '@nestjs/common';
import type { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';

@Injectable()
export class CheckFeatureFlagUserPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    @Inject('UserFeatureFlagRepositoryInterface')
    private readonly userFeatureFlagRepository: UserFeatureFlagRepositoryInterface,
    private readonly hashFeatureFlag: HashFeatureFlagService,
    private readonly featureFlagCacheService: FeatureFlagCacheService,
    private readonly logService: LogService,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const hashName = `${checkFeatureFlagDto.userId}-${checkFeatureFlagDto.featureName}-${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          entityId: checkFeatureFlagDto.userId,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }
    const userFeatureFlag = await this.userFeatureFlagRepository.findByUserIdAndFeatureFlagId(
      checkFeatureFlagDto.userId ?? '',
      checkFeatureFlagDto.featureId ?? ''
    );

    if (userFeatureFlag === null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          entityId: checkFeatureFlagDto.userId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const hashUserFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    const checkResult = hashUserFeatureFlag < checkFeatureFlagDto.percentage;

    void this.logService.dispatchLog({
      action: 'check_feature_flag_user_percentage',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        entityId: checkFeatureFlagDto.userId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
