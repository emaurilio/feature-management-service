import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { SearchFeatureFlagDto } from '../dto/search-feature-flag.dto';
import { SearchFeatureFlagPaginatedResponseDto } from '../dto/dto-response/search-feature-flag-response.dto';
import { SearchFeatureFlagResponseMapper } from '../mappers/search-feature-flag-response.mapper';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class SearchFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(
    searchFeatureFlagDto: SearchFeatureFlagDto,
  ): Promise<SearchFeatureFlagPaginatedResponseDto> {
    const limit = 15;
    const page = searchFeatureFlagDto.page || 1;

    try {
      const { data, total } = await this.featureFlagRepository.searchByNamePaginated(
        searchFeatureFlagDto.name,
        page,
        limit,
      );

      void this.auditLogService.dispatchLog({
        action: 'search_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: searchFeatureFlagDto.userData,
          name: searchFeatureFlagDto.name,
          result: {
            items: data,
            meta: {
              totalItems: total,
            },
          },
        },
      });

      return SearchFeatureFlagResponseMapper.toResponse(
        data,
        total,
        page,
        limit,
      );
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'search_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: searchFeatureFlagDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
