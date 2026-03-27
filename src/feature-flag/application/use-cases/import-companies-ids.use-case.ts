import { Injectable } from '@nestjs/common';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditService } from '../services/audit.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { ImportCompaniesIdsDto } from '../dto/import-companies-ids.dto';
import { CompanyFeatureFlag } from 'src/feature-flag/domain/entities/CompanyFeatureFlag';

@Injectable()
export class ImportCompaniesIdsUseCase {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly companyRepository: CompanyFeatureFlagRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(importCompanyIdsDto: ImportCompaniesIdsDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        importCompanyIdsDto.featureFlagName,
      );

      if (!featureFlagExists) {
        void this.auditService.dispatchLog({
          action: 'import',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            user: importCompanyIdsDto.userData,
            featureFlagName: importCompanyIdsDto.featureFlagName,
            error: 'FeatureFlag not found',
          },
        });
        return null;
      }

      const id = featureFlagExists.id;

      const companiesFeatureFlag = await Promise.all(
        importCompanyIdsDto.companiesIds.map(async (companyId) => {
          const existing =
            await this.companyRepository.findByCompanyIdAndFeatureFlagId(
              companyId,
              id ?? '',
            );

          if (existing) return existing;

          return new CompanyFeatureFlag(id ?? '', companyId);
        }),
      );

      const result =
        await this.companyRepository.createMany(companiesFeatureFlag);

      void this.auditService.dispatchLog({
        action: 'import',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureFlagName: importCompanyIdsDto.featureFlagName,
          companiesIds: importCompanyIdsDto.companiesIds,
          user: importCompanyIdsDto.userData,
        },
      });

      return result;
    } catch (error) {
      void this.auditService.dispatchLog({
        action: 'import',
        entity: 'FeatureFlag',
        timestamp: new Date().toISOString(),
        data: {
          featureFlagName: importCompanyIdsDto.featureFlagName,
          error: getErrorMessage(error),
          user: importCompanyIdsDto.userData,
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
