import { ModuleRef } from '@nestjs/core';
import { CheckUXResearchDto } from '../../dto/check-ux-research.dto';
import { AuditLogService } from '../../services/log.service';
import { Inject } from '@nestjs/common';
import { CheckFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { CheckUXResearchValidateDto } from '../../dto/check-ux-research-validate.dto';
import { CheckUxResearchResponseDto } from '../../dto/response/check-ux-research-response.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';
import { CheckUxResearchResponseMapper } from '../../mappers/check-ux-research-response.mapper';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { CheckUXResearchCompanyUseCase } from './check-ux-research-company.use-case';
import { CheckUXResearchUserUseCase } from './check-ux-research-user.use-case';
import { CheckUXResearchUserPercentageUseCase } from './check-ux-research-user-percentage.use-case';
import { CheckUXResearchCompanyPercentageUseCase } from './check-ux-research-company-percentage.use-case';
import { CheckUXResearchPercentageUseCase } from './check-ux-research-percentage.use-case';

export class CheckUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    private moduleRef: ModuleRef,
    private readonly auditLogService: AuditLogService,
    private readonly checkFeatureFlagByFlagNameUseCase: CheckFeatureFlagUseCase,
  ) { }

  private strategies = {
    company: CheckUXResearchCompanyUseCase,
    user: CheckUXResearchUserUseCase,
    percentage: CheckUXResearchPercentageUseCase,
    user_percentage: CheckUXResearchUserPercentageUseCase,
    company_percentage: CheckUXResearchCompanyPercentageUseCase,
  };

  async execute(
    checkUXResearchValidateDto: CheckUXResearchValidateDto,
  ): Promise<CheckUxResearchResponseDto> {
    if (!checkUXResearchValidateDto.userId && !checkUXResearchValidateDto.companyId) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: checkUXResearchValidateDto.userId || checkUXResearchValidateDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchValidateDto.name,
          error: 'User ID or Company ID is required',
        },
      });

      throw new Error(
        `User ID or Company ID is required`,
      );
    }

    const getUXResearch = await this.uxResearchRepository.findByName(
      checkUXResearchValidateDto.name,
    );

    if (!getUXResearch) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: checkUXResearchValidateDto.userId || checkUXResearchValidateDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchValidateDto.name,
          error: 'UX Research not found',
          check_method: 'database',
        },
      });

      throw new Error(
        `UX Research ${checkUXResearchValidateDto.name} not found`,
      );
    }

    if (!getUXResearch.isActive) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: checkUXResearchValidateDto.userId || checkUXResearchValidateDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchValidateDto.name,
          check_result: false,
          check_method: 'database',
        },
      });

      return this.buildResponse(getUXResearch, false);
    }

    if (!this.isWithinResearchPeriod(getUXResearch)) {
      void this.auditLogService.dispatchLog({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: checkUXResearchValidateDto.userId || checkUXResearchValidateDto.companyId,
        timestamp: new Date().toISOString(),
        data: {
          ux_research_name: checkUXResearchValidateDto.name,
          error: 'UX Research is not within the research period',
          check_method: 'database',
        },
      });

      throw new Error(
        `UX Research ${checkUXResearchValidateDto.name} is not within the research period`,
      );
    }

    if (getUXResearch.featureFlagName) {
      const getCurrentFeatureFlag = await this.featureFlagRepository.findByName(
        getUXResearch.featureFlagName,
      );

      if (!getCurrentFeatureFlag) {
        void this.auditLogService.dispatchLog({
          action: 'check_ux_research',
          entity: 'UXResearch',
          entityId: checkUXResearchValidateDto.userId || checkUXResearchValidateDto.companyId,
          timestamp: new Date().toISOString(),
          data: {
            ux_research_name: checkUXResearchValidateDto.name,
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

      return this.buildResponse(
        getUXResearch,
        checkByFeatureFlag.checkFeatureFlag,
      );
    }

    const useCaseClass = this.strategies[getUXResearch.type];

    if (!useCaseClass) {
      throw new Error(`Strategy for ${getUXResearch.type} not found`);
    }

    const checkUXResearchDto: CheckUXResearchDto = {
      ...checkUXResearchValidateDto,
      name: getUXResearch.name,
      version: getUXResearch.version,
      uxResearchId: getUXResearch.id || '',
      percentage: getUXResearch.percentage,
    };

    const useCase = this.moduleRef.get(useCaseClass, { strict: false });
    const checkResult = await useCase.execute(checkUXResearchDto);

    void this.auditLogService.dispatchLog({
      action: 'check_ux_research',
      entity: 'UXResearch',
      entityId: checkUXResearchValidateDto.userId || checkUXResearchValidateDto.companyId,
      timestamp: new Date().toISOString(),
      data: {
        ux_research_name: checkUXResearchValidateDto.name,
        check_result: checkResult,
        check_method: 'database',
      },
    });

    return this.buildResponse(getUXResearch, checkResult);
  }

  private buildResponse(
    uxResearch: UXResearch,
    checkUxResearch: boolean,
  ): CheckUxResearchResponseDto {
    return CheckUxResearchResponseMapper.toResponse(uxResearch, checkUxResearch);
  }

  private isWithinResearchPeriod (getUXResearch): boolean {
    const now = new Date();

    if (getUXResearch.startDate && now < getUXResearch.startDate) {
      return false;
    }

    if (getUXResearch.endDate && now > getUXResearch.endDate) {
      return false;
    }

    return true;
  }
}
