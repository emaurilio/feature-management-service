import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { DisableFeatureFlagDto } from '../dto/desable-feature-flag.dto';

@Injectable()
export class DisableFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(disableFeatureFlagDto: DisableFeatureFlagDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        disableFeatureFlagDto.featureFlagName,
      );

      if (!featureFlagExists) {
        void this.auditService.dispatchLog({
          action: 'disable',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            user: disableFeatureFlagDto.userData,
            error: 'Feature Flag not found',
          },
        });

        throw new Error('Feature Flag not found');
      }

      const result = await this.featureFlagRepository.update(
        featureFlagExists.id ?? '',
        {
          isActive: false,
        },
      );

      void this.auditService.dispatchLog({
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
      void this.auditService.dispatchLog({
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
