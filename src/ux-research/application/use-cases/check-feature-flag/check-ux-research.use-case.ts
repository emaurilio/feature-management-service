import { CheckFeatureFlagCompanyUseCase } from './check-feature-flag-company.use-case';
import { CheckFeatureFlagUserUseCase } from './check-feature-flag-user.use-case';
import { CheckFeatureFlagPercentageUseCase } from './check-feature-flag-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from './check-feature-flag-user-percentage.use-case';
import { ModuleRef } from '@nestjs/core';
import { CheckUXResearchDto } from '../../dto/check-feature-flag/check-ux-research.dto';
import { CheckFeatureFlagCompanyPercentageUseCase } from './check-ux-research-company-percentage.use-case';
import { LogService } from '../../services/log.service';
import { Inject } from '@nestjs/common';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';
import { CheckFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { CheckUXResearchValidateDto } from '../../dto/check-ux-research-validate.dto';

export class CheckUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private moduleRef: ModuleRef,
    private readonly logService: LogService,
    private readonly checkFeatureFlagByFlagNameUseCase: CheckFeatureFlagUseCase,
  ) { }

  private strategies = {
    company: CheckFeatureFlagCompanyUseCase,
    user: CheckFeatureFlagUserUseCase,
    percentage: CheckFeatureFlagPercentageUseCase,
    user_percentage: CheckFeatureFlagUserPercentageUseCase,
    company_percentage: CheckFeatureFlagCompanyPercentageUseCase,
  };

  async execute(
    checkUXResearchValidateDto: CheckUXResearchValidateDto,
  ): Promise<boolean> {
    if (!checkUXResearchValidateDto.userId && !checkUXResearchValidateDto.companyId) {
      throw new Error(
        `User ID or Company ID is required`,
      );
    }

    const getUXResearch = await this.uxResearchRepository.findByName(
      checkUXResearchValidateDto.name,
    );

    if (!getUXResearch) {
      void this.logService.dispatchLog({
        action: 'check_ux_research',
        entity: 'UX Research',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchValidateDto.name,
          user_id: checkUXResearchValidateDto.userId,
          error: 'UX Research not found',
          check_method: 'database',
        },
      });

      throw new Error(
        `UX Research ${checkUXResearchValidateDto.name} not found`,
      );
    }

    if (!getUXResearch.isActive) {
      void this.logService.dispatchLog({
        action: 'check_ux_research',
        entity: 'UX Research',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkUXResearchValidateDto.name,
          user_id: checkUXResearchValidateDto.userId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    if (getUXResearch.featureFlagName) {
      const getCurrentFeatureFlag = await this.featureFlagRepository.findByName(
        getUXResearch.featureFlagName,
      );

      if (!getCurrentFeatureFlag) {
        void this.logService.dispatchLog({
          action: 'check_feature_flag',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            featureName: checkUXResearchValidateDto.name,
            user_id: checkUXResearchValidateDto.userId,
            error: 'Feature Flag not found',
            check_method: 'database',
          },
        });

        throw new Error(
          `Feature Flag ${checkUXResearchValidateDto.name} not found`,
        );
      }

      const checkByFeatureFlag = await this.checkFeatureFlagByFlagNameUseCase.execute({
        name: getUXResearch.featureFlagName,
        userId: checkUXResearchValidateDto.userId,
        companyId: checkUXResearchValidateDto.companyId,
      });

      return checkByFeatureFlag;
    }

    const useCaseClass = this.strategies[getUXResearch.type];

    if (!useCaseClass) {
      throw new Error(`Strategy for ${getUXResearch.type} not found`);
    }

    const checkUXResearchDto: CheckUXResearchDto = {
      ...checkUXResearchValidateDto,
      name: getUXResearch.name,
      version: getUXResearch.version,
      featureId: getUXResearch.id || '',
      percentage: getUXResearch.percentage,
    };

    const useCase = this.moduleRef.get(useCaseClass, { strict: false });
    const checkResult = await useCase.execute(checkUXResearchDto);

    void this.logService.dispatchLog({
      action: 'check_feature_flag',
      entity: 'UX Research',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkUXResearchValidateDto.name,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    return checkResult;
  }
}
