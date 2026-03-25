import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/FeatureFlagModule/infraestructure/persistence/repositories/feature-flag.repository';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { AuditService } from '../services/audit.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { FeatureFlag } from 'src/FeatureFlagModule/domain/entities/FeatureFlag';
import { DeleteFeatureFlagUseCase } from './delete-feature-flag.use-case';

@Injectable()
export class CreateFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly auditService: AuditService,
    private readonly deleteFeatureFlagUseCase: DeleteFeatureFlagUseCase,
  ) {}

  async execute(createFeatureFlagDto: CreateFeatureFlagDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        createFeatureFlagDto.name,
      );

      if (featureFlagExists) {
        const newVersion = featureFlagExists.version + 1;
        const newFeatureFlag = new FeatureFlag(
          `${createFeatureFlagDto.name}-${newVersion}`,
          createFeatureFlagDto.name,
          createFeatureFlagDto.percentage,
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
          void this.auditService.dispatchLog({
            action: 'create',
            entity: 'FeatureFlag',
            timestamp: new Date().toISOString(),
            data: {
              user: createFeatureFlagDto.userData,
              error: 'Failed to delete old feature flag',
            },
          });
          throw new Error('Failed to delete old feature flag');
        }

        const result =
          await this.featureFlagRepository.createFeatureFlag(newFeatureFlag);

        void this.auditService.dispatchLog({
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
        createFeatureFlagDto.percentage,
        1,
        true,
        createFeatureFlagDto.type,
      );
      const result =
        await this.featureFlagRepository.createFeatureFlag(newFeatureFlag);

      void this.auditService.dispatchLog({
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
      void this.auditService.dispatchLog({
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
