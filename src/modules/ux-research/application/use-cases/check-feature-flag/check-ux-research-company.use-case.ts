import { AuditLogService } from '../../services/log.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CheckUXResearchDto } from '../../dto/check-ux-research.dto';
import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { CheckUXResearchInterface } from 'src/modules/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';

@Injectable()
export class CheckUXResearchCompanyUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('CompanyUXResearchRepositoryInterface')
    private readonly companyUXResearchRepository: CompanyUXResearchRepositoryInterface,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    if (!checkUXResearchDto.companyId) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: checkUXResearchDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          error: 'Company ID is required',
        },
      });

      throw new BadRequestException('Company ID is required');
    }

    const cacheKey = `${checkUXResearchDto.companyId}-${checkUXResearchDto.name}-${checkUXResearchDto.version}`;

    const cacheResult = await this.cacheService.get(cacheKey);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: checkUXResearchDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }

    const uxResearch = await this.companyUXResearchRepository.findByCompanyIdAndUXResearchId(
      checkUXResearchDto.companyId ?? '',
      checkUXResearchDto.uxResearchId ?? ''
    );

    if (uxResearch === null) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: checkUXResearchDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          company_id: checkUXResearchDto.companyId,
          check_result: false,
          check_method: 'database',
        },
      });

      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: checkUXResearchDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    void this.auditLogService.dispatchLog({
      action: 'check_ux_research_company',
      entity: 'UXResearch',
      entityId: checkUXResearchDto.companyId,
      timestamp: new Date().toISOString(),
      data: {
        ux_research_name: checkUXResearchDto.name,
        version: checkUXResearchDto.version,
        check_result: true,
        check_method: 'database',
      },
    });

    void this.cacheService.set(cacheKey, true);

    return true;
  }
}
