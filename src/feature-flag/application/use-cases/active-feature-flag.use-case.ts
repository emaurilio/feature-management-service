import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { LogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { ActiveFeatureFlagDto } from '../dto/active-feature-flag.dto';

@Injectable()
export class ActiveFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly logService: LogService,
  ) {}

  async execute(activeFeatureFlagDto: ActiveFeatureFlagDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        activeFeatureFlagDto.featureFlagName,
      );

      if (!featureFlagExists) {
        void this.logService.dispatchLog({
          action: 'activate',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            user: activeFeatureFlagDto.userData,
            error: 'Feature Flag not found',
          },
        });

        throw new Error('Feature Flag not found');
      }

      const result = await this.featureFlagRepository.update(
        featureFlagExists.id ?? '',
        {
          isActive: true,
        },
      );

      void this.logService.dispatchLog({
        action: 'activate',
        entity: 'FeatureFlag',
        entityId: featureFlagExists.id ?? '',
        timestamp: new Date().toISOString(),
        data: {
          user: activeFeatureFlagDto.userData,
          name: activeFeatureFlagDto.featureFlagName,
        },
      });

      return result;
    } catch (error) {
      void this.logService.dispatchLog({
        action: 'activate',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: activeFeatureFlagDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
