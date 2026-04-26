import { LogService } from '../../services/log.service';
import { Inject, Injectable } from '@nestjs/common';
import type { UserUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';
import type { CheckUXResearchInterface } from 'src/ux-research/domain/use-cases/check-ux-research.use-case.interface';
import { HashUXResearchService } from '../../services/hash-ux-research.service';
import { UXResearchCacheService } from '../../services/ux-research-cache.service';
import { CheckUXResearchDto } from '../../dto/check-feature-flag/check-ux-research.dto';

@Injectable()
export class CheckUXResearchUserPercentageUseCase implements CheckUXResearchInterface {
  constructor(
    @Inject('UserUXResearchRepositoryInterface')
    private readonly userUXResearchRepository: UserUXResearchRepositoryInterface,
    private readonly hashUXResearch: HashUXResearchService,
    private readonly UXResearchCacheService: UXResearchCacheService,
    private readonly logService: LogService,
  ) { }

  async execute(checkUXResearchDto: CheckUXResearchDto): Promise<boolean> {
    const hashName = `${checkUXResearchDto.userId}-${checkUXResearchDto.name}-${checkUXResearchDto.version}`;

    const cacheResult = await this.UXResearchCacheService.get(hashName);

    if (cacheResult !== null) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag_user_percentage',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          entityId: checkUXResearchDto.userId,
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
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchDto.name,
          version: checkUXResearchDto.version,
          entityId: checkUXResearchDto.userId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const hashUserFeatureFlag = this.hashUXResearch.calculateHash(hashName);

    const checkResult = hashUserFeatureFlag < checkUXResearchDto.percentage;

    void this.logService.dispatchLog({
      action: 'check_ux_research_user_percentage',
      entity: 'UXResearch',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkUXResearchDto.name,
        version: checkUXResearchDto.version,
        entityId: checkUXResearchDto.userId,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    void this.UXResearchCacheService.set(hashName, checkResult);

    return checkResult;
  }
}
