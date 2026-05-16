import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import { ImportCompaniesIdsDto } from '../dto/import-companies-ids.dto';
import { CompanyFeatureFlag } from 'src/modules/feature-flag/domain/entities/CompanyFeatureFlag';
import { mapWithConcurrencyLimit } from 'src/modules/common/utils/concurrency-limit.util';

@Injectable()
export class ImportCompaniesIdsUseCase {
  constructor(
    @Inject('FeatureFlagRepositoryInterface')
    private readonly featureFlagRepository: FeatureFlagRepositoryInterface,
    @Inject('CompanyFeatureFlagRepositoryInterface')
    private readonly companyRepository: CompanyFeatureFlagRepositoryInterface,
    private readonly auditLogService: AuditLogService,
    @Inject(CACHE_SERVICE)
    private readonly featureFlagCacheService: CacheServiceInterface,
  ) { }

  async execute(importCompanyIdsDto: ImportCompaniesIdsDto) {
    try {
      const featureFlagExists = await this.featureFlagRepository.findByName(
        importCompanyIdsDto.featureFlagName,
      );

      if (!featureFlagExists) {
        void this.auditLogService.dispatchLog({
          action: 'import_companies_ids',
          entity: 'FeatureFlag',
          timestamp: new Date().toISOString(),
          data: {
            user: importCompanyIdsDto.userData,
            featureFlagName: importCompanyIdsDto.featureFlagName,
            error: 'Feature Flag not found',
          },
        });
        throw new Error('Feature Flag not found');
      }

      const id = featureFlagExists.id;
      const companiesFeatureFlag = await mapWithConcurrencyLimit(
        importCompanyIdsDto.companiesIds,
        50,
        async (companyId) => {
          const existing =
            await this.companyRepository.findByCompanyIdAndFeatureFlagId(
              companyId,
              id ?? '',
            );

          if (existing) return existing;

          return new CompanyFeatureFlag(id ?? '', companyId);
        },
      );

      const result =
        await this.companyRepository.createMany(companiesFeatureFlag);

      void this.auditLogService.dispatchLog({
        action: 'import_companies_ids',
        entity: 'FeatureFlag',
        entityId: id,
        timestamp: new Date().toISOString(),
        data: {
          featureFlagName: importCompanyIdsDto.featureFlagName,
          companiesIds: importCompanyIdsDto.companiesIds,
          user: importCompanyIdsDto.userData,
        },
      });

      void this.featureFlagCacheService.invalidateCacheEntityFlags(
        featureFlagExists.version.toString(),
        importCompanyIdsDto.featureFlagName,
        importCompanyIdsDto.companiesIds,
      );

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'import_companies_ids',
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
