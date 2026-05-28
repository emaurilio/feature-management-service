import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { SearchFeatureFlagPaginatedResponseDto } from '../dto/dto-response/search-feature-flag-response.dto';
import { GetFeatureFlagResponseMapper } from './get-feature-flag-response.mapper';

export class SearchFeatureFlagResponseMapper {
  static toResponse(
    items: FeatureFlag[],
    total: number,
    page: number,
    limit: number,
  ): SearchFeatureFlagPaginatedResponseDto {
    return {
      items: items.map((item) => GetFeatureFlagResponseMapper.toResponse(item)),
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
