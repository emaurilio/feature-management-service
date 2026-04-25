import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { FeatureFlagCacheService } from '../../services/feature-flag-cache.service';
import { LogService } from '../../services/log.service';
import { Inject, Injectable } from '@nestjs/common';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';

@Injectable()
export class CheckFeatureFlagCompanyPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    @Inject('CompanyFeatureFlagRepositoryInterface')
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepositoryInterface,
    private readonly hashFeatureFlag: HashFeatureFlagService,
    private readonly featureFlagCacheService: FeatureFlagCacheService,
    private readonly logService: LogService,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const hashName = `${checkFeatureFlagDto.companyId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_company_percentage',
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
      void this.logService.dispatchLog({
        action: 'check_feature_flag_company_percentage',
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

    const hashCompanyFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    const checkResult = hashCompanyFeatureFlag < checkFeatureFlagDto.percentage;

    void this.logService.dispatchLog({
      action: 'check_feature_flag_company_percentage',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkFeatureFlagDto.featureName,
        version: checkFeatureFlagDto.version,
        company_id: checkFeatureFlagDto.companyId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.featureFlagCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
