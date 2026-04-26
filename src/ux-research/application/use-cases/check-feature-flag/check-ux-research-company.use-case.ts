import { AuditLogService } from '../../services/log.service';
import { Inject, Injectable } from '@nestjs/common';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import type { CheckUXResearchInterface } from 'src/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import { CheckUXResearchDto } from '../../dto/check-feature-flag/check-ux-research.dto';

@Injectable()
export class CheckUXResearchCompanyUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('CompanyFeatureFlagRepositoryInterface')
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepositoryInterface,
    private readonly featureFlagCacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    const cacheKey = `${checkUXResearchDto.companyId}-${checkUXResearchDto.name}-${checkUXResearchDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(cacheKey);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          company_id: checkUXResearchDto.companyId,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }

    const companyFeatureFlag = await this.companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId(
      checkUXResearchDto.companyId ?? '',
      checkUXResearchDto.featureId ?? ''
    );

    if (companyFeatureFlag === null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          company_id: checkUXResearchDto.companyId,
          check_result: false,
          check_method: 'database',
        },
      });

      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          company_id: checkUXResearchDto.companyId,
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
        featureName: checkUXResearchDto.name,
        version: checkUXResearchDto.version,
        company_id: checkUXResearchDto.companyId,
        check_result: true,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(cacheKey, true);

    return true;
  }
}
