import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { DisableFeatureFlagDto } from '../dto/desable-feature-flag.dto';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class DisableFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(disableFeatureFlagDto: DisableFeatureFlagDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        disableFeatureFlagDto.featureFlagName,
      );

      if (!featureFlagExists) {
        throw new Error('Feature Flag not found');
      }

      const result = await this.featureFlagRepository.updateFeatureFlag(
        featureFlagExists.id ?? '',
        {
          isActive: false,
        },
      );

      void this.auditLogService.dispatchLog({
        action: 'disable',
        entity: 'FeatureFlag',
        entityId: featureFlagExists.id ?? '',
        timestamp: new Date().toISOString(),
        data: {
          user: disableFeatureFlagDto.userData,
          name: disableFeatureFlagDto.featureFlagName,
        },
      });

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'disable',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: disableFeatureFlagDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
