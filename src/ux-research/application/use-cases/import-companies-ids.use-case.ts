import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { ImportUXResearchCompaniesIdsDto } from '../dto/import-companies-ids.dto';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { CompanyUXResearch } from 'src/ux-research/domain/entites/CompanyUXResearch';

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
          action: 'import',
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

      const companiesUXResearch = await Promise.all(
        importUXResearchCompaniesIdsDto.companiesIds.map(async (companyId) => {
          const existing =
            await this.companyRepository.findByCompanyIdAndUXResearchId(
              companyId,
              id ?? '',
            );

          if (existing) return existing;

          return new CompanyUXResearch(id ?? '', companyId);
        }),
      );

      const result =
        await this.companyRepository.createMany(companiesUXResearch);

      void this.auditLogService.dispatchLog({
        action: 'import',
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
        action: 'import',
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
