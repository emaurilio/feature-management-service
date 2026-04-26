import { Inject, Injectable } from '@nestjs/common';
import { LogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import type { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import { UserFeatureFlag } from 'src/feature-flag/domain/entities/UserFeatureFlag';
import { ImportUXResearchUsersIdsDto } from '../dto/import-users-ids.dto';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import { UXResearchCacheService } from '../services/ux-research-cache.service';

@Injectable()
export class ImportUsersIdsUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    @Inject('UserUXResearchRepositoryInterface')
    private readonly userRepository: UserFeatureFlagRepositoryInterface,
    private readonly logService: LogService,
    private readonly uxResearchCacheService: UXResearchCacheService,
  ) { }

  async execute(importUXResearchUsersIdsDto: ImportUXResearchUsersIdsDto) {
    try {
      const uxResearchExists = await this.uxResearchRepository.findByName(
        importUXResearchUsersIdsDto.uxResearchName,
      );

      if (!uxResearchExists) {
        void this.logService.dispatchLog({
          action: 'import',
          entity: 'UX Research',
          timestamp: new Date().toISOString(),
          data: {
            user: importUXResearchUsersIdsDto.userData,
            uxResearchName: importUXResearchUsersIdsDto.uxResearchName,
            error: 'UX Research not found',
          },
        });
        throw new Error('UX Research not found');
      }

      const id = uxResearchExists.id;

      const usersFeatureFlag = await Promise.all(
        importUXResearchUsersIdsDto.usersIds.map(async (userId) => {
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
        entity: 'UX Research',
        timestamp: new Date().toISOString(),
        data: {
          uxResearchName: importUXResearchUsersIdsDto.uxResearchName,
          usersIds: importUXResearchUsersIdsDto.usersIds,
          user: importUXResearchUsersIdsDto.userData,
        },
      });

      void this.uxResearchCacheService.invalidateCacheEntityFlags(
        uxResearchExists.version.toString(),
        importUXResearchUsersIdsDto.uxResearchName,
        importUXResearchUsersIdsDto.usersIds,
      );

      return result;
    } catch (error) {
      void this.logService.dispatchLog({
        action: 'import',
        entity: 'UX Research',
        timestamp: new Date().toISOString(),
        data: {
          uxResearchName: importUXResearchUsersIdsDto.uxResearchName,
          error: getErrorMessage(error),
          user: importUXResearchUsersIdsDto.userData,
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
