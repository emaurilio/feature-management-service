import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { CheckFeatureFlagInterface } from 'src/modules/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { AuditLogService } from '../../services/audit-log.service';
import { Injectable } from '@nestjs/common';
import type { UserFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/user-feature-flag.repository.interface';

@Injectable()
export class CheckFeatureFlagUserPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    @Inject('UserFeatureFlagRepositoryInterface')
    private readonly userFeatureFlagRepository: UserFeatureFlagRepositoryInterface,
    private readonly hashFeatureFlag: HashFeatureFlagService,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    if (!checkFeatureFlagDto.userId) {
      throw new Error('User ID is required');
    }

    const hashName = `${checkFeatureFlagDto.userId}-${checkFeatureFlagDto.featureName}-${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        entityId: checkFeatureFlagDto.userId,
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
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
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        entityId: checkFeatureFlagDto.userId,
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const hashUserFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    const checkResult = hashUserFeatureFlag < checkFeatureFlagDto.percentage;

    void this.auditLogService.dispatchLog({
      action: 'check_feature_flag_user_percentage',
      entity: 'FeatureFlag',
      entityId: checkFeatureFlagDto.userId,
      timestamp: new Date().toISOString(),
      data: {
        feature_name: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
