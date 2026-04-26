import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { LogService } from '../../services/log.service';
import { Inject, Injectable } from '@nestjs/common';
import { UXResearchCacheService } from '../../services/ux-research-cache.service';
import type { CheckUXResearchInterface } from 'src/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import type { UserUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';
import { CheckUXResearchDto } from '../../dto/check-feature-flag/check-ux-research.dto';

@Injectable()
export class CheckUXResearchUserUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('UserUXResearchRepositoryInterface')
    private readonly userUXResearchRepository: UserUXResearchRepositoryInterface,
    private readonly UXResearchCacheService: UXResearchCacheService,
    private readonly logService: LogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    const cacheKey = `${checkUXResearchDto.userId}-
      ${checkUXResearchDto.name}-
      ${checkUXResearchDto.version}`;

    const cacheResult = await this.UXResearchCacheService.get(cacheKey);

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

    void this.UXResearchCacheService.set(cacheKey, true);

    return true;
  }
}
