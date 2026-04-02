import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { AuditService } from '../../services/log.service';
import { FeatureFlagCacheService } from '../../services/feature-flag-cache.service';

export class CheckFeatureFlagUserPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    private readonly hashFeatureFlag: HashFeatureFlagService,
    private readonly userFeatureFlagRepository: UserFeatureFlagRepository,
    private readonly featureFlagCacheService: FeatureFlagCacheService,
    private readonly auditService: AuditService,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const hashName = `${checkFeatureFlagDto.userId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.auditService.dispatchLog({
        action: 'check_feature_flag_user_percentage',
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
      void this.auditService.dispatchLog({
        action: 'check_feature_flag_user_percentage',
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

    const hashUserFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    const checkResult = hashUserFeatureFlag < checkFeatureFlagDto.percentage;

    void this.auditService.dispatchLog({
      action: 'check_feature_flag_user_percentage',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        user_id: checkFeatureFlagDto.userId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
