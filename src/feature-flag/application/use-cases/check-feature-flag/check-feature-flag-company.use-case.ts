import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { LogService } from '../../services/log.service';
import { FeatureFlagCacheService } from '../../services/feature-flag-cache.service';

export class CheckFeatureFlagCompanyUseCase implements CheckFeatureFlagInterface {
  constructor(
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepository,
    private readonly logService: LogService,
    private readonly featureFlagCacheService: FeatureFlagCacheService,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const cacheKey = `${checkFeatureFlagDto.companyId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const cacheResult = await this.featureFlagCacheService.get(cacheKey);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
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

    const companyFeatureFlag = await this.companyFeatureFlagRepository.findOne({
      where: {
        featureId: checkFeatureFlagDto.featureId,
        companyId: checkFeatureFlagDto.companyId,
      },
    });

    if (companyFeatureFlag === null) {
      void this.logService.dispatchLog({
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

      void this.logService.dispatchLog({
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

    void this.logService.dispatchLog({
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
