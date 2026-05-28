import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { AuditLogService } from '../../services/log.service';
import { Injectable } from '@nestjs/common';
import { HashUXResearchService } from '../../services/hash-ux-research.service';
import { CheckUXResearchDto } from '../../dto/check-ux-research.dto';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { CheckUXResearchInterface } from 'src/modules/ux-research/domain/use-cases/check-ux-research.use-case.interface';

@Injectable()
export class CheckUXResearchPercentageUseCase implements CheckUXResearchInterface {
  constructor(
    private readonly hashUXResearch: HashUXResearchService,
    @Inject(CACHE_SERVICE)
    private readonly uxResearchCacheService: CacheServiceInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    const entityId =
      checkUXResearchDto.companyId || checkUXResearchDto.userId;

    const hashName = `${entityId}-${checkUXResearchDto.name}-${checkUXResearchDto.version}`;

    const cacheResult = await this.uxResearchCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research_percentage',
        entity: 'UXResearch',
        entityId: entityId,
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

    const hashUXResearch = this.hashUXResearch.calculateHash(hashName);

    const checkResult = hashUXResearch < checkUXResearchDto.percentage;

    void this.auditLogService.dispatchLog({
      action: 'check_ux_research_percentage',
      entity: 'UXResearch',
      entityId: entityId,
      timestamp: new Date().toISOString(),
      data: {
        ux_research_name: checkUXResearchDto.name,
        version: checkUXResearchDto.version,
        check_result: checkResult,
        check_method: 'cache',
      },
    });

    void this.uxResearchCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
