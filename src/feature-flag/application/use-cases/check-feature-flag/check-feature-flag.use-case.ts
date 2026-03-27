import { CheckFeatureFlagCompanyUseCase } from './check-feature-flag-company.use-case';
import { CheckFeatureFlagUserUseCase } from './check-feature-flag-user.use-case';
import { CheckFeatureFlagPercentageUseCase } from './check-feature-flag-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from './check-feature-flag-user-percentage.use-case';
import { ModuleRef } from '@nestjs/core';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { CheckFeatureFlagValidateDto } from '../../dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagCompanyPercentageUseCase } from './check-feature-flag-company-percentage.use-case';

export class CheckFeatureFlagUseCase {
  constructor(
    private moduleRef: ModuleRef,
    private readonly featureFlagRepository: FeatureFlagRepository,
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
      throw new Error(
        `Feature Flag ${checkFeatureFlagValidateDto.name} not found`,
      );
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
    return useCase.execute(checkFeatureFlagDto);
  }
}
