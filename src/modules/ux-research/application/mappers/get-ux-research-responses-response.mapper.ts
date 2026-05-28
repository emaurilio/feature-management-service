import { UXResearchResponse } from 'src/modules/ux-research/domain/entites/UXResearchResponse';
import { GetUxResearchResponsesPaginatedResponseDto } from '../dto/dto-response/response/get-ux-research-responses-paginated-response.dto';
import { GetUxResearchResponseItemMapper } from './get-ux-research-response-item.mapper';

interface PaginatedUxResearchResponses {
  items: UXResearchResponse[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export class GetUxResearchResponsesResponseMapper {
  static toResponse(
    paginated: PaginatedUxResearchResponses,
  ): GetUxResearchResponsesPaginatedResponseDto {
    return {
      items: paginated.items.map((item) =>
        GetUxResearchResponseItemMapper.toResponse(item),
      ),
      meta: paginated.meta,
    };
  }
}
