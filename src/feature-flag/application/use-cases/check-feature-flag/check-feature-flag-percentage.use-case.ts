import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { AuditLogService } from '../../services/audit-log.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckFeatureFlagPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    private readonly hashFeatureFlag: HashFeatureFlagService,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const entityId =
      checkFeatureFlagDto.companyId || checkFeatureFlagDto.userId;

    const hashName = `${entityId}-${checkFeatureFlagDto.featureName}-${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_percentage',
        entity: 'FeatureFlag',
        entityId: entityId,
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

    const hashFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    const checkResult = hashFeatureFlag < checkFeatureFlagDto.percentage;

    void this.auditLogService.dispatchLog({
      action: 'check_feature_flag_percentage',
      entity: 'FeatureFlag',
      entityId: entityId,
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
