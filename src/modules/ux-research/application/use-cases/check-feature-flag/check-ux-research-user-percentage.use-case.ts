import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { AuditLogService } from '../../services/log.service';
import { Injectable } from '@nestjs/common';
import { HashUXResearchService } from '../../services/hash-ux-research.service';
import { CheckUXResearchDto } from '../../dto/check-ux-research/check-ux-research.dto';
import type { CheckUXResearchInterface } from 'src/modules/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { UserUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';

@Injectable()
export class CheckUXResearchUserPercentageUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('UserUXResearchRepositoryInterface')
    private readonly userUXResearchRepository: UserUXResearchRepositoryInterface,
    private readonly hashUXResearch: HashUXResearchService,
    @Inject(CACHE_SERVICE)
    private readonly CacheServiceInterface: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    if (!checkUXResearchDto.userId) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          error: 'User ID is required',
        },
      });

      throw new Error('User ID is required');
    }

    const hashName = `${checkUXResearchDto.userId}-${checkUXResearchDto.name}-${checkUXResearchDto.version}`;

    const cacheResult = await this.CacheServiceInterface.get(hashName);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: checkUXResearchDto.userId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }
    const userUXResearch = await this.userUXResearchRepository.findByUserIdAndUXResearchId(
      checkUXResearchDto.userId ?? '',
      checkUXResearchDto.uxResearchId ?? ''
    );

    if (userUXResearch === null) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: checkUXResearchDto.userId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const hashUXResearch = this.hashUXResearch.calculateHash(hashName);

    const checkResult = hashUXResearch < checkUXResearchDto.percentage;

    void this.auditLogService.dispatchLog({
      action: 'check_ux_research_user_percentage',
      entity: 'UXResearch',
      entityId: checkUXResearchDto.userId,
      timestamp: new Date().toISOString(),
      data: {
        ux_research_name: checkUXResearchDto.name,
        version: checkUXResearchDto.version,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.CacheServiceInterface.set(hashName, checkResult);

    return checkResult;
  }
}
