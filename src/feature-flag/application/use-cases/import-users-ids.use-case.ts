import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { UserFeatureFlag } from 'src/feature-flag/domain/entities/UserFeatureFlag';
import { ImportUsersIdsDto } from '../dto/import-users-ids.dto';
import { FeatureFlagCacheService } from '../services/feature-flag-cache.service';

@Injectable()
export class ImportUsersIdsUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly userRepository: UserFeatureFlagRepository,
    private readonly auditService: AuditService,
    private readonly featureFlagCacheService: FeatureFlagCacheService,
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
            user: importUsersIdsDto.userData,
            featureFlagName: importUsersIdsDto.featureFlagName,
            error: 'FeatureFlag not found',
          },
        });
        throw new Error('Feature Flag not found');
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

      void this.featureFlagCacheService.invalidateCacheEntityFlags(
        featureFlagExists.version.toString(),
        importUsersIdsDto.featureFlagName,
        importUsersIdsDto.usersIds,
      );

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
