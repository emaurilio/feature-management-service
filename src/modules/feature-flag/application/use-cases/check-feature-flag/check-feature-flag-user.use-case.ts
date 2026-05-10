import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/modules/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import { AuditLogService } from '../../services/audit-log.service';
import { Injectable } from '@nestjs/common';
import type { UserFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class CheckFeatureFlagUserUseCase implements CheckFeatureFlagInterface {
  constructor(
    @Inject('UserFeatureFlagRepositoryInterface')
    private readonly userFeatureFlagRepository: UserFeatureFlagRepositoryInterface,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    if (!checkFeatureFlagDto.userId) {
      throw new Error('User ID is required');
    }

    const cacheKey = `${checkFeatureFlagDto.userId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(cacheKey);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_user',
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
        action: 'check_feature_flag_user',
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

    void this.auditLogService.dispatchLog({
      action: 'check_feature_flag_user',
      entity: 'FeatureFlag',
      entityId: checkFeatureFlagDto.userId,
      timestamp: new Date().toISOString(),
      data: {
        feature_name: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        check_result: true,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(cacheKey, true);

    return true;
  }
}
