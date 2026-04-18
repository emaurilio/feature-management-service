import { Inject, Injectable } from '@nestjs/common';
import { LogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { ActiveFeatureFlagDto } from '../dto/active-feature-flag.dto';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class ActiveFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private readonly logService: LogService,
  ) {}

  async execute(activeFeatureFlagDto: ActiveFeatureFlagDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        activeFeatureFlagDto.featureFlagName,
      );

      if (!featureFlagExists) {
        throw new Error('Feature Flag not found');
      }

      const result = await this.featureFlagRepository.updateFeatureFlag(
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
