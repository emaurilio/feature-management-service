import { CheckFeatureFlagCompanyUseCase } from './check-feature-flag-company.use-case';
import { CheckFeatureFlagUserUseCase } from './check-feature-flag-user.use-case';
import { CheckFeatureFlagPercentageUseCase } from './check-feature-flag-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from './check-feature-flag-user-percentage.use-case';
import { ModuleRef } from '@nestjs/core';
import { CheckFeatureFlagValidateDto } from '../../dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagCompanyPercentageUseCase } from './check-feature-flag-company-percentage.use-case';
import { AuditLogService } from '../../services/audit-log.service';
import { Inject } from '@nestjs/common';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';

export class CheckFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private moduleRef: ModuleRef,
    private readonly auditLogService: AuditLogService,
  ) { }

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
    if (!checkFeatureFlagValidateDto.userId && !checkFeatureFlagValidateDto.companyId) {
      throw new Error(
        `User ID or Company ID is required`,
      );
    }

    const getFeatureFlag = await this.featureFlagRepository.findByName(
      checkFeatureFlagValidateDto.name,
    );

    if (!getFeatureFlag) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagValidateDto.name,
          user_id: checkFeatureFlagValidateDto.userId,
          error: 'Feature Flag not found',
          check_method: 'database',
        },
      });

      throw new Error(
        `Feature Flag ${checkFeatureFlagValidateDto.name} not found`,
      );
    }

    if (!getFeatureFlag.isActive) {
      void this.auditLogService.dispatchLog({
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

    const useCaseClass = this.strategies[getFeatureFlag.type];

    if (!useCaseClass) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureName: checkFeatureFlagValidateDto.name,
          user_id: checkFeatureFlagValidateDto.userId,
          error: 'Strategy not found',
          check_method: 'database',
        },
      });
      throw new Error(`Strategy for ${getFeatureFlag.type} not found`);
    }

    const checkFeatureFlagDto: CheckFeatureFlagDto = {
      ...checkFeatureFlagValidateDto,
      featureName: getFeatureFlag.name,
      version: getFeatureFlag.version,
      featureId: getFeatureFlag.id || '',
      percentage: getFeatureFlag.percentage,
    };

    const useCase = this.moduleRef.get(useCaseClass, { strict: false });
    const checkResult = await useCase.execute(checkFeatureFlagDto);

    void this.auditLogService.dispatchLog({
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
