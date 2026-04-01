import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditService } from '../services/audit.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { DeleteFeatureFlagDto } from '../dto/delete-feature-flag.dto';
import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import {
  isCompanyType,
  isUserType,
} from 'src/feature-flag/domain/enums/feature-flag-type.enum';

@Injectable()
export class DeleteFeatureFlagUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepository,
    private readonly userFeatureFlagRepository: UserFeatureFlagRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(deleteFeatureFlagDto: DeleteFeatureFlagDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        deleteFeatureFlagDto.name,
      );

      if (!featureFlagExists) {
        void this.auditService.dispatchLog({
          action: 'delete',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            user: deleteFeatureFlagDto.userData,
            name: deleteFeatureFlagDto.name,
            error: 'Feature flag not found',
          },
        });

        throw new Error('Feature flag not found');
      }

      const result = await this.featureFlagRepository.delete(
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

      void this.auditService.dispatchLog({
        action: 'delete',
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

      return result;
    } catch (error) {
      void this.auditService.dispatchLog({
        action: 'delete',
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
