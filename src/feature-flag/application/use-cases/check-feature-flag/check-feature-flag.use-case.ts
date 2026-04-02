import { CheckFeatureFlagCompanyUseCase } from './check-feature-flag-company.use-case';
import { CheckFeatureFlagUserUseCase } from './check-feature-flag-user.use-case';
import { CheckFeatureFlagPercentageUseCase } from './check-feature-flag-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from './check-feature-flag-user-percentage.use-case';
import { ModuleRef } from '@nestjs/core';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { CheckFeatureFlagValidateDto } from '../../dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagCompanyPercentageUseCase } from './check-feature-flag-company-percentage.use-case';
import { LogService } from '../../services/log.service';

export class CheckFeatureFlagUseCase {
  constructor(
    private moduleRef: ModuleRef,
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly logService: LogService,
  ) {}

  private strategies = {
    company: CheckFeatureFlagCompanyUseCase,
    user: CheckFeatureFlagUserUseCase,
    percentage: CheckFeatureFlagPercentageUseCase,
    user_percentage: CheckFeatureFlagUserPercentageUseCase,
    company_percentage: CheckFeatureFlagCompanyPercentageUseCase,
  };

  async execute(
    checkFeatureFlagValidateDto: CheckFeatureFlagValidateDto,
  ): Promise<boolean> {
    const getUseCase = await this.featureFlagRepository.findByName(
      checkFeatureFlagValidateDto.name,
    );

    if (!getUseCase) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagValidateDto.name,
          user_id: checkFeatureFlagValidateDto.userId,
          check_result: false,
          check_method: 'database',
        },
      });

      throw new Error(
        `Feature Flag ${checkFeatureFlagValidateDto.name} not found`,
      );
    }

    if (!getUseCase.isActive) {
      void this.logService.dispatchLog({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagValidateDto.name,
          user_id: checkFeatureFlagValidateDto.userId,
          check_result: false,
          check_method: 'database',
        },
      });

      return false;
    }

    const useCaseClass = this.strategies[getUseCase.type];

    if (!useCaseClass) {
      throw new Error(`Strategy for ${getUseCase.type} not found`);
    }

    const checkFeatureFlagDto: CheckFeatureFlagDto = {
      ...checkFeatureFlagValidateDto,
      featureName: getUseCase.name,
      version: getUseCase.version,
      featureId: getUseCase.id || '',
      percentage: getUseCase.percentage,
    };

    const useCase = this.moduleRef.get(useCaseClass, { strict: false });
    const checkResult = await useCase.execute(checkFeatureFlagDto);

    void this.logService.dispatchLog({
      action: 'check_feature_flag',
      entity: 'FeatureFlag',
      timestamp: new Date().toISOString(),
      data: {
        featureName: checkFeatureFlagValidateDto.name,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    return checkResult;
  }
}
