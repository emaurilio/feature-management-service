import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { UserUXResearch } from 'src/modules/ux-research/domain/entites/UserUXResearch';
import { ImportUXResearchUsersIdsDto } from '../dto/import-users-ids.dto';
import { ImportUxResearchIdsResponseDto } from '../dto/dto-response/import-ux-research-ids-response.dto';
import { ImportUxResearchIdsResponseMapper } from '../mappers/import-ux-research-ids-response.mapper';
import { mapWithConcurrencyLimit } from 'src/modules/common/utils/concurrency-limit.util';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { UserUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';

@Injectable()
export class ImportUsersIdsUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    @Inject('UserUXResearchRepositoryInterface')
    private readonly userUXResearchRepository: UserUXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
    @Inject(CACHE_SERVICE)
    private readonly uxResearchCacheService: CacheServiceInterface,
  ) { }

  async execute(
    importUXResearchUsersIdsDto: ImportUXResearchUsersIdsDto,
  ): Promise<ImportUxResearchIdsResponseDto> {
    try {
      const uxResearchExists = await this.uxResearchRepository.findByName(
        importUXResearchUsersIdsDto.uxResearchName,
      );

      if (!uxResearchExists) {
        void this.auditLogService.dispatchLog({
          action: 'import_users_ids',
          entity: 'UX-Research',
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

      const toCreate: UserUXResearch[] = [];
      let skipped = 0;

      await mapWithConcurrencyLimit(
        importUXResearchUsersIdsDto.usersIds,
        50,
        async (userId) => {
          const existing =
            await this.userUXResearchRepository.findByUserIdAndUXResearchId(
              userId,
              id ?? '',
            );

          if (existing) {
            skipped++;
            return;
          }

          toCreate.push(new UserUXResearch(id ?? '', userId));
        },
      );

      if (toCreate.length > 0) {
        await this.userUXResearchRepository.createMany(toCreate);
      }

      void this.auditLogService.dispatchLog({
        action: 'import_users_ids',
        entity: 'UX-Research',
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

      return ImportUxResearchIdsResponseMapper.toResponse({
        uxResearchName: importUXResearchUsersIdsDto.uxResearchName,
        totalReceived: importUXResearchUsersIdsDto.usersIds.length,
        imported: toCreate.length,
        skipped,
      });
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'import_users_ids',
        entity: 'UX-Research',
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
