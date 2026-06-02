import { Inject, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { UserFeatureFlag } from 'src/modules/feature-flag/domain/entities/UserFeatureFlag';
import { ImportUsersIdsDto } from '../dto/import-users-ids.dto';
import { ImportFeatureFlagIdsResponseDto } from '../dto/dto-response/import-feature-flag-ids-response.dto';
import { ImportFeatureFlagIdsResponseMapper } from '../mappers/import-feature-flag-ids-response.mapper';
import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { mapWithConcurrencyLimit } from 'src/modules/common/utils/concurrency-limit.util';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';
import type { UserFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';

@Injectable()
export class ImportUsersIdsUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    @Inject('UserFeatureFlagRepositoryInterface')
    private readonly userRepository: UserFeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
  ) { }

  async execute(
    importUsersIdsDto: ImportUsersIdsDto,
  ): Promise<ImportFeatureFlagIdsResponseDto> {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        importUsersIdsDto.featureFlagName,
      );

      if (!featureFlagExists) {
        void this.auditLogService.dispatchLog({
          action: 'import_users_ids',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            user: importUsersIdsDto.userData,
            featureFlagName: importUsersIdsDto.featureFlagName,
            error: 'FeatureFlag not found',
          },
        });
        throw new NotFoundException('Feature flag not found');
      }

      const id = featureFlagExists.id;
      const toCreate: UserFeatureFlag[] = [];
      let skipped = 0;

      await mapWithConcurrencyLimit(
        importUsersIdsDto.usersIds,
        50,
        async (userId) => {
          const existing =
            await this.userRepository.findByUserIdAndFeatureFlagId(
              userId,
              id ?? '',
            );

          if (existing) {
            skipped++;
            return;
          }

          toCreate.push(new UserFeatureFlag(id ?? '', userId));
        },
      );

      if (toCreate.length > 0) {
        await this.userRepository.createMany(toCreate);
      }

      void this.auditLogService.dispatchLog({
        action: 'import_users_ids',
        entity: 'FeatureFlag',
        entityId: id,
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

      return ImportFeatureFlagIdsResponseMapper.toResponse({
        featureFlagName: importUsersIdsDto.featureFlagName,
        totalReceived: importUsersIdsDto.usersIds.length,
        imported: toCreate.length,
        skipped,
      });
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'import_users_ids',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureFlagName: importUsersIdsDto.featureFlagName,
          error: getErrorMessage(error),
          user: importUsersIdsDto.userData,
        },
      });

      throw error;
    }
  }
}
