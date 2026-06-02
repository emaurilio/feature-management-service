import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { SearchUXResearchDto } from '../dto/search-ux-research.dto';
import { SearchUxResearchPaginatedResponseDto } from '../dto/dto-response/search-ux-research-response.dto';
import { SearchUxResearchResponseMapper } from '../mappers/search-ux-research-response.mapper';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';

@Injectable()
export class SearchUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(
    searchUXResearchDto: SearchUXResearchDto,
  ): Promise<SearchUxResearchPaginatedResponseDto> {
    const limit = searchUXResearchDto.limit || 15;
    const page = searchUXResearchDto.page || 1;

    try {
      const { data, total } = await this.uxResearchRepository.searchByNamePaginated(
        searchUXResearchDto.name,
        page,
        limit,
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

      return SearchUxResearchResponseMapper.toResponse(
        data,
        total,
        page,
        limit,
      );
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

      throw error;
    }
  }
}
