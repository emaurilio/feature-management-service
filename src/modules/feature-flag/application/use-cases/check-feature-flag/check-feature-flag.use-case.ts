import { CheckFeatureFlagCompanyUseCase } from './check-feature-flag-company.use-case';
import { CheckFeatureFlagUserUseCase } from './check-feature-flag-user.use-case';
import { CheckFeatureFlagPercentageUseCase } from './check-feature-flag-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from './check-feature-flag-user-percentage.use-case';
import { ModuleRef } from '@nestjs/core';
import { CheckFeatureFlagValidateDto } from '../../dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag.dto';
import { CheckFeatureFlagResponseDto } from '../../dto/response/check-feature-flag-response.dto';
import { CheckFeatureFlagCompanyPercentageUseCase } from './check-feature-flag-company-percentage.use-case';
import { AuditLogService } from '../../services/audit-log.service';
import { Inject } from '@nestjs/common';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';
import { CheckFeatureFlagResponseMapper } from '../../mappers/check-feature-flag-response.mapper';
import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';

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
  ): Promise<CheckFeatureFlagResponseDto> {
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
        entityId: checkFeatureFlagValidateDto.userId || checkFeatureFlagValidateDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagValidateDto.name,
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
        entityId: checkFeatureFlagValidateDto.userId || checkFeatureFlagValidateDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagValidateDto.name,
          check_result: false,
          check_method: 'database',
        },
      });

      return this.buildResponse(getFeatureFlag, false);
    }

    const useCaseClass = this.strategies[getFeatureFlag.type];

    if (!useCaseClass) {
      void this.auditLogService.dispatchLog({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        entityId: checkFeatureFlagValidateDto.userId || checkFeatureFlagValidateDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          feature_name: checkFeatureFlagValidateDto.name,
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
      entityId: checkFeatureFlagValidateDto.userId || checkFeatureFlagValidateDto.companyId,
      timestamp: new Date().toISOString(),
      data: {
        feature_name: checkFeatureFlagValidateDto.name,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    return this.buildResponse(getFeatureFlag, checkResult);
  }

  private buildResponse(
    featureFlag: FeatureFlag,
    checkFeatureFlag: boolean,
  ): CheckFeatureFlagResponseDto {
    return CheckFeatureFlagResponseMapper.toResponse(featureFlag, checkFeatureFlag);
  }
}
