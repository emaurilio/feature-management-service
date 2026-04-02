import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { FeatureFlagCacheService } from '../../services/feature-flag-cache.service';
import { LogService } from '../../services/log.service';

export class CheckFeatureFlagUserUseCase implements CheckFeatureFlagInterface {
  constructor(
    private readonly userFeatureFlagRepository: UserFeatureFlagRepository,
    private readonly featureFlagCacheService: FeatureFlagCacheService,
    private readonly logService: LogService,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const cacheKey = `${checkFeatureFlagDto.userId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(cacheKey);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_user',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          user_id: checkFeatureFlagDto.userId,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }

    const userFeatureFlag = await this.userFeatureFlagRepository.findOne({
      where: {
        featureId: checkFeatureFlagDto.featureId,
        userId: checkFeatureFlagDto.userId,
      },
    });

    if (userFeatureFlag === null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_user',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          user_id: checkFeatureFlagDto.userId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    void this.logService.dispatchLog({
      action: 'check_feature_flag_user',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        user_id: checkFeatureFlagDto.userId,
        check_result: true,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(cacheKey, true);

    return true;
  }
}
