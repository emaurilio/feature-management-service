import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { Injectable } from '@nestjs/common';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import { AuditLogService } from '../../services/audit-log.service';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';

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
    const cacheKey = `${checkFeatureFlagDto.companyId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(cacheKey);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          company_id: checkFeatureFlagDto.companyId,
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
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          company_id: checkFeatureFlagDto.companyId,
          check_result: false,
          check_method: 'database',
        },
      });

      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          company_id: checkFeatureFlagDto.companyId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    void this.auditLogService.dispatchLog({
      action: 'check_feature_flag_company',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        company_id: checkFeatureFlagDto.companyId,
        check_result: true,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(cacheKey, true);

    return true;
  }
}
