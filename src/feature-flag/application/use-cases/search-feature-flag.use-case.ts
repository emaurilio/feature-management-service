import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditService } from '../services/audit.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { SearchFeatureFlagDto } from '../dto/search-feature-flag.dto';

@Injectable()
export class SearchFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(searchFeatureFlagDto: SearchFeatureFlagDto) {
    try {
      const { data, total } = await this.featureFlagRepository.searchForName(
        searchFeatureFlagDto.name,
        searchFeatureFlagDto.page || 1,
        15,
      );

      void this.auditService.dispatchLog({
        action: 'search',
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
      void this.auditService.dispatchLog({
        action: 'search',
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
