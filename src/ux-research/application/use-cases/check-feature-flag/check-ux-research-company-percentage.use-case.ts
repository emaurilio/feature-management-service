import { LogService } from '../../services/log.service';
import { Inject, Injectable } from '@nestjs/common';
import type { CheckUXResearchInterface } from 'src/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import { HashUXResearchService } from '../../services/hash-ux-research.service';
import { UXResearchCacheService } from '../../services/ux-research-cache.service';
import { CheckUXResearchDto } from '../../dto/check-feature-flag/check-ux-research.dto';
import type { CompanyUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';

@Injectable()
export class CheckUXResearchCompanyPercentageUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('CompanyUXResearchRepositoryInterface')
    private readonly uxResearchRepository: CompanyUXResearchRepositoryInterface,
    private readonly hashUXResearchService: HashUXResearchService,
    private readonly uxResearchCacheService: UXResearchCacheService,
    private readonly logService: LogService,
  ) { }

  async execute(checkUXResearchCompanyPercentageDto: CheckUXResearchDto): Promise<boolean> {
    const hashName = `${checkUXResearchCompanyPercentageDto.companyId}-
      ${checkUXResearchCompanyPercentageDto.name}-
      ${checkUXResearchCompanyPercentageDto.version}`;

    const cacheResult = await this.uxResearchCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_company_percentage',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchCompanyPercentageDto.name,
          version: checkUXResearchCompanyPercentageDto.version,
          company_id: checkUXResearchCompanyPercentageDto.companyId,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }

    const uxResearch = await this.uxResearchRepository.findByCompanyIdAndUXResearchId(
      checkUXResearchCompanyPercentageDto.companyId ?? '',
      checkUXResearchCompanyPercentageDto.featureId ?? '',
    );

    if (uxResearch === null) {
      void this.logService.dispatchLog({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          uxResearchName: checkUXResearchCompanyPercentageDto.name,
          version: checkUXResearchCompanyPercentageDto.version,
          company_id: checkUXResearchCompanyPercentageDto.companyId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const hashCompanyFeatureFlag = this.hashUXResearchService.calculateHash(hashName);

    const checkResult = hashCompanyFeatureFlag < checkUXResearchCompanyPercentageDto.percentage;

    void this.logService.dispatchLog({
      action: 'check_ux_research_company_percentage',
      entity: 'UXResearch',
      timestamp: new Date().toISOString(),
      data: {
        uxResearchName: checkUXResearchCompanyPercentageDto.name,
        version: checkUXResearchCompanyPercentageDto.version,
        company_id: checkUXResearchCompanyPercentageDto.companyId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.uxResearchCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
