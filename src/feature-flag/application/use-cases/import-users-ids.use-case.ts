import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';
import { LogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import type { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import { UserFeatureFlag } from 'src/feature-flag/domain/entities/UserFeatureFlag';
import { ImportUsersIdsDto } from '../dto/import-users-ids.dto';
import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';

@Injectable()
export class ImportUsersIdsUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    @Inject('UserFeatureFlagRepositoryInterface')
    private readonly userRepository: UserFeatureFlagRepositoryInterface,
    private readonly logService: LogService,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
  ) { }

  async execute(importUsersIdsDto: ImportUsersIdsDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        importUsersIdsDto.featureFlagName,
      );

      if (!featureFlagExists) {
        void this.logService.dispatchLog({
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

      void this.logService.dispatchLog({
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
      void this.logService.dispatchLog({
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
