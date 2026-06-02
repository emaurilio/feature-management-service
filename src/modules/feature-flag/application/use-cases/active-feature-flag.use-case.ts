import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { ActiveFeatureFlagDto } from '../dto/active-feature-flag.dto';
import { GetFeatureFlagResponseDto } from '../dto/dto-response/get-feature-flag-response.dto';
import { GetFeatureFlagResponseMapper } from '../mappers/get-feature-flag-response.mapper';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class ActiveFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(
    activeFeatureFlagDto: ActiveFeatureFlagDto,
  ): Promise<GetFeatureFlagResponseDto> {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        activeFeatureFlagDto.featureFlagName,
      );

      if (!featureFlagExists) {
        throw new NotFoundException('Feature flag not found');
      }

      const result = await this.featureFlagRepository.updateFeatureFlag(
        featureFlagExists.id ?? '',
        {
          isActive: true,
        },
      );

      void this.auditLogService.dispatchLog({
        action: 'activate_feature_flag',
        entity: 'FeatureFlag',
        entityId: featureFlagExists.id ?? '',
        timestamp: new Date().toISOString(),
        data: {
          user: activeFeatureFlagDto.userData,
          name: activeFeatureFlagDto.featureFlagName,
        },
      });

      return GetFeatureFlagResponseMapper.toResponse(result);
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'activate_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: activeFeatureFlagDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw error;
    }
  }
}
