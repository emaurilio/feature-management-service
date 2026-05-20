import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { DeleteFeatureFlagDto } from '../dto/delete-feature-flag.dto';
import { DeleteFeatureFlagResponseDto } from '../dto/response/delete-feature-flag-response.dto';
import { DeleteFeatureFlagResponseMapper } from '../mappers/delete-feature-flag-response.mapper';
import {
  isCompanyType,
  isUserType,
} from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import type { UserFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class DeleteFeatureFlagUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    @Inject('CompanyFeatureFlagRepositoryInterface')
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepositoryInterface,
    @Inject('UserFeatureFlagRepositoryInterface')
    private readonly userFeatureFlagRepository: UserFeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(
    deleteFeatureFlagDto: DeleteFeatureFlagDto,
  ): Promise<DeleteFeatureFlagResponseDto> {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        deleteFeatureFlagDto.name,
      );

      if (!featureFlagExists) {
        throw new Error('Feature flag not found');
      }

      const result = await this.featureFlagRepository.softDelete(
        featureFlagExists.id ?? '',
      );

      if (isCompanyType(featureFlagExists.type)) {
        await this.companyFeatureFlagRepository.deleteByFeatureFlagId(
          featureFlagExists.id ?? '',
        );
      }

      if (isUserType(featureFlagExists.type)) {
        await this.userFeatureFlagRepository.deleteByFeatureFlagId(
          featureFlagExists.id ?? '',
        );
      }

      void this.auditLogService.dispatchLog({
        action: 'delete_feature_flag',
        entity: 'FeatureFlag',
        entityId: featureFlagExists.id,
        timestamp: new Date().toISOString(),
        data: {
          user: deleteFeatureFlagDto.userData,
          name: deleteFeatureFlagDto.name,
          type: featureFlagExists.type,
          error: 'Feature flag deleted',
        },
      });

      return DeleteFeatureFlagResponseMapper.toResponse(
        featureFlagExists,
        (result.affected ?? 0) > 0,
      );
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'delete_feature_flag',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          user: deleteFeatureFlagDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
