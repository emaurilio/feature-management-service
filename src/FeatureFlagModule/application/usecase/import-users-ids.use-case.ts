import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/FeatureFlagModule/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditService } from '../services/audit.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { UserFeatureFlagRepository } from 'src/FeatureFlagModule/infraestructure/persistence/repositories/user-feature-flag.repository';
import { UserFeatureFlag } from 'src/FeatureFlagModule/domain/entities/UserFeatureFlag';
import { ImportUsersIdsDto } from '../dto/import-users-ids.dto';

@Injectable()
export class ImportUsersIdsUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly userRepository: UserFeatureFlagRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(importUsersIdsDto: ImportUsersIdsDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        importUsersIdsDto.featureFlagName,
      );

      if (!featureFlagExists) {
        void this.auditService.dispatchLog({
          action: 'import',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            featureFlagName: importUsersIdsDto.featureFlagName,
            error: 'FeatureFlag not found',
            user: importUsersIdsDto.userData,
          },
        });
        return null;
      }

      const id = featureFlagExists.id;

      const usersFeatureFlag = await Promise.all(
        importUsersIdsDto.usersIds.map(async (userId) => {
          const existing =
            await this.userRepository.findByUserIdAndFeatureFlagId(
              userId,
              id ?? '',
            );

          if (existing) return existing;

          return new UserFeatureFlag(id ?? '', userId);
        }),
      );

      const result = await this.userRepository.createMany(usersFeatureFlag);

      void this.auditService.dispatchLog({
        action: 'import',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureFlagName: importUsersIdsDto.featureFlagName,
          usersIds: importUsersIdsDto.usersIds,
          user: importUsersIdsDto.userData,
        },
      });

      return result;
    } catch (error) {
      void this.auditService.dispatchLog({
        action: 'import',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureFlagName: importUsersIdsDto.featureFlagName,
          error: getErrorMessage(error),
          user: importUsersIdsDto.userData,
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
