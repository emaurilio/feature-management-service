import { Inject, Injectable } from '@nestjs/common';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { DeleteFeatureFlagUseCase } from './delete-feature-flag.use-case';
import { isPercentageType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';

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
        return await this.createNewVersion(createFeatureFlagDto, featureFlagExists);
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
        action: 'create_feature_flag',
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
        action: 'create_feature_flag',
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

  private async createNewVersion(
    createFeatureFlagDto: CreateFeatureFlagDto,
    existingFeatureFlag: FeatureFlag,
  ) {
    const newVersion = existingFeatureFlag.version + 1;
    const newFeatureFlag = new FeatureFlag(
      `${createFeatureFlagDto.name}-${newVersion}`,
      createFeatureFlagDto.name,
      createFeatureFlagDto.percentage || 0,
      newVersion,
      true,
      createFeatureFlagDto.type,
    );

    const isAlreadySoftDeleted = existingFeatureFlag.deletedAt != null;

    if (!isAlreadySoftDeleted) {
      const deleteOldFeatureFlag = await this.deleteFeatureFlagUseCase.execute({
        name: existingFeatureFlag.name,
        userData: createFeatureFlagDto.userData,
      });

      if (!deleteOldFeatureFlag.deleted) {
        throw new Error('Failed to delete old feature flag');
      }
    }

    const result =
      await this.featureFlagRepository.createFeatureFlag(newFeatureFlag);

    void this.auditLogService.dispatchLog({
      action: 'create_feature_flag',
      entity: 'FeatureFlag',
      entityId: result.id,
      timestamp: new Date().toISOString(),
      data: {
        user: createFeatureFlagDto.userData,
        name: createFeatureFlagDto.name,
        percentage: createFeatureFlagDto.percentage,
        version: newVersion,
        active: true,
        type: createFeatureFlagDto.type,
      },
    });

    return result;
  }
}
