import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { ImportUXResearchCompaniesIdsDto } from '../dto/import-companies-ids.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import { CompanyUXResearch } from 'src/modules/ux-research/domain/entites/CompanyUXResearch';
import { mapWithConcurrencyLimit } from 'src/modules/common/utils/concurrency-limit.util';

@Injectable()
export class ImportCompaniesIdsUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uXResearchRepository: UXResearchRepositoryInterface,
    @Inject('CompanyUXResearchRepositoryInterface')
    private readonly companyRepository: CompanyUXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
    @Inject(CACHE_SERVICE)
    private readonly uxResearchCacheService: CacheServiceInterface,
  ) { }

  async execute(importUXResearchCompaniesIdsDto: ImportUXResearchCompaniesIdsDto) {
    try {
      const uxResearchExists = await this.uXResearchRepository.findByName(
        importUXResearchCompaniesIdsDto.uxResearchName,
      );

      if (!uxResearchExists) {
        void this.auditLogService.dispatchLog({
          action: 'import_companies_ids',
          entity: 'UX Research',
          timestamp: new Date().toISOString(),
          data: {
            user: importUXResearchCompaniesIdsDto.userData,
            uxResearchName: importUXResearchCompaniesIdsDto.uxResearchName,
            error: 'UX Research not found',
          },
        });
        throw new Error('UX Research not found');
      }

      const id = uxResearchExists.id;

      const companiesUXResearch = await mapWithConcurrencyLimit(
        importUXResearchCompaniesIdsDto.companiesIds,
        50,
        async (companyId) => {
          const existing =
            await this.companyRepository.findByCompanyIdAndUXResearchId(
              companyId,
              id ?? '',
            );

          if (existing) return existing;

          return new CompanyUXResearch(id ?? '', companyId);
        },
      );

      const result =
        await this.companyRepository.createMany(companiesUXResearch);

      void this.auditLogService.dispatchLog({
        action: 'import_companies_ids',
        entity: 'UX Research',
        timestamp: new Date().toISOString(),
        data: {
          uxResearchName: importUXResearchCompaniesIdsDto.uxResearchName,
          companiesIds: importUXResearchCompaniesIdsDto.companiesIds,
          user: importUXResearchCompaniesIdsDto.userData,
        },
      });

      void this.uxResearchCacheService.invalidateCacheEntityFlags(
        uxResearchExists.version.toString(),
        importUXResearchCompaniesIdsDto.uxResearchName,
        importUXResearchCompaniesIdsDto.companiesIds,
      );

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'import_companies_ids',
        entity: 'UX Research',
        timestamp: new Date().toISOString(),
        data: {
          uxResearchName: importUXResearchCompaniesIdsDto.uxResearchName,
          error: getErrorMessage(error),
          user: importUXResearchCompaniesIdsDto.userData,
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
