import { Inject, Injectable } from '@nestjs/common';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { DeleteFeatureFlagUseCase } from './delete-feature-flag.use-case';
import { isPercentageType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class CreateFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
    private readonly deleteFeatureFlagUseCase: DeleteFeatureFlagUseCase,
  ) { }

  async execute(createFeatureFlagDto: CreateFeatureFlagDto) {
    try {
      if (
        isPercentageType(createFeatureFlagDto.type) &&
        createFeatureFlagDto.percentage == null
      ) {
        throw new Error(
          'Percentage value is not allowed for this feature flag type',
        );
      }
      const featureFlagExists = await this.featureFlagRepository.findByName(
        createFeatureFlagDto.name,
        true,
      );

      if (featureFlagExists) {
        const newVersion = featureFlagExists.version + 1;
        const newFeatureFlag = new FeatureFlag(
          `${createFeatureFlagDto.name}-${newVersion}`,
          createFeatureFlagDto.name,
          createFeatureFlagDto.percentage || 0,
          newVersion,
          true,
          createFeatureFlagDto.type,
        );

        const deleteOldFeatureFlag =
          await this.deleteFeatureFlagUseCase.execute({
            name: featureFlagExists.name,
            userData: createFeatureFlagDto.userData,
          });

        if (!deleteOldFeatureFlag) {
          throw new Error('Failed to delete old feature flag');
        }

        const result =
          await this.featureFlagRepository.createFeatureFlag(newFeatureFlag);

        void this.auditLogService.dispatchLog({
          action: 'create',
          entity: 'FeatureFlag',
          entityId: result.id,
          timestamp: new Date().toISOString(),
          data: {
            user: createFeatureFlagDto.userData,
            name: createFeatureFlagDto.name,
            percentage: createFeatureFlagDto.percentage,
            version: 1,
            active: true,
            type: createFeatureFlagDto.type,
          },
        });

        return result;
      }
      const newFeatureFlag = new FeatureFlag(
        `${createFeatureFlagDto.name}-1`,
        createFeatureFlagDto.name,
        createFeatureFlagDto.percentage || 0,
        1,
        true,
        createFeatureFlagDto.type,
      );
      const result =
        await this.featureFlagRepository.createFeatureFlag(newFeatureFlag);

      void this.auditLogService.dispatchLog({
        action: 'create',
        entity: 'FeatureFlag',
        entityId: result.id,
        timestamp: new Date().toISOString(),
        data: {
          user: createFeatureFlagDto.userData,
          name: createFeatureFlagDto.name,
          percentage: createFeatureFlagDto.percentage,
          version: 1,
          active: true,
          type: createFeatureFlagDto.type,
        },
      });

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'create',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: createFeatureFlagDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
