import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/FeatureFlagModule/infraestructure/persistence/repositories/feature-flag.repository';
import { CreateFeatureFlagDto } from '../dto/CreateFeatureFlag.dto';
import { AuditService } from '../services/audit.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { FeatureFlag } from 'src/FeatureFlagModule/domain/entities/FeatureFlag';

@Injectable()
export class CreateFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRespository: FeatureFlagRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(createFeatureFlagDto: CreateFeatureFlagDto) {
    try {
      const featureFlagExists = await this.featureFlagRespository.findByName(
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
        const result =
          await this.featureFlagRespository.createFeatureFlag(newFeatureFlag);

        await this.auditService.dispatchLog({
          action: 'create',
          entity: 'FeatureFlag',
          entityId: result.id,
          timestamp: new Date().toISOString(),
          data: {
            user: {
              userId: createFeatureFlagDto.userData.userId,
              email: createFeatureFlagDto.userData.email,
              name: createFeatureFlagDto.userData.name,
            },
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
        await this.featureFlagRespository.createFeatureFlag(newFeatureFlag);

      await this.auditService.dispatchLog({
        action: 'create',
        entity: 'FeatureFlag',
        entityId: result.id,
        timestamp: new Date().toISOString(),
        data: {
          user: {
            userId: createFeatureFlagDto.userData.userId,
            email: createFeatureFlagDto.userData.email,
            name: createFeatureFlagDto.userData.name,
          },
        },
      });

      return result;
    } catch (error) {
      await this.auditService.dispatchLog({
        action: 'create',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: {
            userId: createFeatureFlagDto.userData.userId,
            email: createFeatureFlagDto.userData.email,
            name: createFeatureFlagDto.userData.name,
          },
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
