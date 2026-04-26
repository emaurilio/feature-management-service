import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { LogService } from '../../services/log.service';
import { Injectable } from '@nestjs/common';
import { CheckUXResearchDto } from '../../dto/check-feature-flag/check-ux-research.dto';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import type { CheckUXResearchInterface } from 'src/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import type { UserUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';

@Injectable()
export class CheckUXResearchUserUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('UserUXResearchRepositoryInterface')
    private readonly userUXResearchRepository: UserUXResearchRepositoryInterface,
    @Inject(CACHE_SERVICE)
    private readonly CacheServiceInterface: CacheServiceInterface,
    private readonly logService: LogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    const cacheKey = `${checkUXResearchDto.userId}-
      ${checkUXResearchDto.name}-
      ${checkUXResearchDto.version}`;

    const cacheResult = await this.CacheServiceInterface.get(cacheKey);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_ux_research_user',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          user_id: checkUXResearchDto.userId,
          check_result: cacheResult,
          check_method: 'cache',
        },
      });

      return cacheResult;
    }

    const userUXResearch = await this.userUXResearchRepository.findByUserIdAndUXResearchId(
      checkUXResearchDto.userId ?? '',
      checkUXResearchDto.featureId ?? ''
    );

    if (userUXResearch === null) {
      void this.logService.dispatchLog({
        action: 'check_ux_research_user',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          user_id: checkUXResearchDto.userId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    void this.logService.dispatchLog({
      action: 'check_ux_research_user',
      entity: 'UXResearch',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkUXResearchDto.name,
        version: checkUXResearchDto.version,
        user_id: checkUXResearchDto.userId,
        check_result: true,
        check_method: 'database',
      },
    });

    void this.CacheServiceInterface.set(cacheKey, true);

    return true;
  }
}
