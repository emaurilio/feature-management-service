import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { SearchUXResearchDto } from '../dto/search-ux-research.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';

@Injectable()
export class SearchUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(searchUXResearchDto: SearchUXResearchDto) {
    try {
      const { data, total } = await this.uxResearchRepository.searchByNamePaginated(
        searchUXResearchDto.name,
        searchUXResearchDto.page || 1,
        searchUXResearchDto.limit || 15,
      );

      void this.auditLogService.dispatchLog({
        action: 'search_ux_research',
        entity: 'UX-Research',
        timestamp: new Date().toISOString(),
        data: {
          user: searchUXResearchDto.userData,
          name: searchUXResearchDto.name,
          result: {
            items: data,
            meta: {
              totalItems: total,
            },
          },
        },
      });

      return {
        items: data,
        meta: {
          totalItems: total,
          itemCount: data.length,
          itemsPerPage: searchUXResearchDto.limit || 15,
          totalPages: Math.ceil(total / (searchUXResearchDto.limit || 15)),
          currentPage: searchUXResearchDto.page || 1,
        },
      };
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'search_ux_research',
        entity: 'UX-Research',
        timestamp: new Date().toISOString(),
        data: {
          user: searchUXResearchDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
