import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { AuditLogService } from '../../services/log.service';
import { Injectable } from '@nestjs/common';
import { HashUXResearchService } from '../../services/hash-ux-research.service';
import { CheckUXResearchDto } from '../../dto/check-ux-research/check-ux-research.dto';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { CheckUXResearchInterface } from 'src/modules/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';

@Injectable()
export class CheckUXResearchCompanyPercentageUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('CompanyUXResearchRepositoryInterface')
    private readonly uxResearchRepository: CompanyUXResearchRepositoryInterface,
    private readonly hashUXResearchService: HashUXResearchService,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkUXResearchCompanyPercentageDto: CheckUXResearchDto): Promise<boolean> {
    if (!checkUXResearchCompanyPercentageDto.companyId) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        entityId: checkUXResearchCompanyPercentageDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchCompanyPercentageDto.name,
          version: checkUXResearchCompanyPercentageDto.version,
          error: 'Company ID is required',
        },
      });

      throw new Error('Company ID is required');
    }

    const hashName = `${checkUXResearchCompanyPercentageDto.companyId}-${checkUXResearchCompanyPercentageDto.name}-${checkUXResearchCompanyPercentageDto.version}`;

    const cacheResult = await this.cacheService.get(hashName);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchCompanyPercentageDto.name,
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
      checkUXResearchCompanyPercentageDto.uxResearchId ?? '',
    );

    if (uxResearch === null) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchCompanyPercentageDto.name,
          version: checkUXResearchCompanyPercentageDto.version,
          company_id: checkUXResearchCompanyPercentageDto.companyId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const hashUXResearch = this.hashUXResearchService.calculateHash(hashName);

    const checkResult = hashUXResearch < checkUXResearchCompanyPercentageDto.percentage;

    void this.auditLogService.dispatchLog({
      action: 'check_ux_research_company_percentage',
      entity: 'UXResearch',
      timestamp: new Date().toISOString(),
      data: {
        ux_research_name: checkUXResearchCompanyPercentageDto.name,
        version: checkUXResearchCompanyPercentageDto.version,
        company_id: checkUXResearchCompanyPercentageDto.companyId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.cacheService.set(hashName, checkResult);

    return checkResult;
  }
}
