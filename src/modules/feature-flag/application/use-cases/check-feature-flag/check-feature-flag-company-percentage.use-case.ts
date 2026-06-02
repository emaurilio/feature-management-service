import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/modules/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { AuditLogService } from '../../services/audit-log.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';

@Injectable()
export class CheckFeatureFlagCompanyPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    @Inject('CompanyFeatureFlagRepositoryInterface')
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepositoryInterface,
    private readonly hashFeatureFlag: HashFeatureFlagService,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    if (!checkFeatureFlagDto.companyId) {
      throw new BadRequestException('Company ID is required');
    }

    const hashName = `${checkFeatureFlagDto.companyId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag_company_percentage',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagDto.featureName,
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
        action: 'check_feature_flag_company_percentage',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagDto.featureName,
          version: checkFeatureFlagDto.version,
          company_id: checkFeatureFlagDto.companyId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const hashCompanyFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    const checkResult = hashCompanyFeatureFlag < checkFeatureFlagDto.percentage;

    void this.auditLogService.dispatchLog({
      action: 'check_feature_flag_company_percentage',
      entity: 'FeatureFlag',
      entityId: checkFeatureFlagDto.companyId,
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
