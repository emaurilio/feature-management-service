import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/modules/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../../services/audit-log.service';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';

@Injectable()
export class CheckFeatureFlagCompanyUseCase implements CheckFeatureFlagInterface {
  constructor(
    @Inject('CompanyFeatureFlagRepositoryInterface')
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepositoryInterface,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    if (!checkFeatureFlagDto.companyId) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        entityId: checkFeatureFlagDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          error: 'Company ID is required',
        },
      });
  
      throw new Error('Company ID is required');
    }

    const cacheKey = `${checkFeatureFlagDto.companyId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(cacheKey);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        entityId: checkFeatureFlagDto.companyId,
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

    const companyFeatureFlag = await this.companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId(
      checkFeatureFlagDto.companyId ?? '',
      checkFeatureFlagDto.featureId ?? ''
    );

    if (companyFeatureFlag === null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        entityId: checkFeatureFlagDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          check_result: false,
          check_method: 'database',
        },
      });

      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        entityId: checkFeatureFlagDto.companyId,
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
      action: 'check_feature_flag_company',
      entity: 'FeatureFlag',
      entityId: checkFeatureFlagDto.companyId,
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
