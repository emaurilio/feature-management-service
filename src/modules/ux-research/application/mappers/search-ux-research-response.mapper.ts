import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { SearchUxResearchPaginatedResponseDto } from '../dto/dto-response/search-ux-research-response.dto';
import { GetUxResearchResponseMapper } from './get-ux-research-response.mapper';

export class SearchUxResearchResponseMapper {
  static toResponse(
    items: UXResearch[],
    total: number,
    page: number,
    limit: number,
  ): SearchUxResearchPaginatedResponseDto {
    return {
      items: items.map((item) => GetUxResearchResponseMapper.toResponse(item)),
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
