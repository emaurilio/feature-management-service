import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { SearchFeatureFlagDto } from '../dto/search-feature-flag.dto';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class SearchFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(searchFeatureFlagDto: SearchFeatureFlagDto) {
    try {
      const { data, total } = await this.featureFlagRepository.searchByNamePaginated(
        searchFeatureFlagDto.name,
        searchFeatureFlagDto.page || 1,
        15,
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

      return {
        items: data,
        meta: {
          totalItems: total,
          itemCount: data.length,
          itemsPerPage: 15,
          totalPages: Math.ceil(total / 15),
          currentPage: searchFeatureFlagDto.page || 1,
        },
      };
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
