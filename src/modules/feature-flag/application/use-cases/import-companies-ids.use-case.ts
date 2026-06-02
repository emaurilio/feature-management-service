import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Inject, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { ImportCompaniesIdsDto } from '../dto/import-companies-ids.dto';
import { ImportFeatureFlagIdsResponseDto } from '../dto/dto-response/import-feature-flag-ids-response.dto';
import { ImportFeatureFlagIdsResponseMapper } from '../mappers/import-feature-flag-ids-response.mapper';
import { CompanyFeatureFlag } from 'src/modules/feature-flag/domain/entities/CompanyFeatureFlag';
import { mapWithConcurrencyLimit } from 'src/modules/common/utils/concurrency-limit.util';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/company-feature-flag.repository.interface';

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

  async execute(
    importCompanyIdsDto: ImportCompaniesIdsDto,
  ): Promise<ImportFeatureFlagIdsResponseDto> {
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
        throw new NotFoundException('Feature flag not found');
      }

      const id = featureFlagExists.id;
      const toCreate: CompanyFeatureFlag[] = [];
      let skipped = 0;

      await mapWithConcurrencyLimit(
        importCompanyIdsDto.companiesIds,
        50,
        async (companyId) => {
          const existing =
            await this.companyRepository.findByCompanyIdAndFeatureFlagId(
              companyId,
              id ?? '',
            );

          if (existing) {
            skipped++;
            return;
          }

          toCreate.push(new CompanyFeatureFlag(id ?? '', companyId));
        },
      );

      if (toCreate.length > 0) {
        await this.companyRepository.createMany(toCreate);
      }

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

      return ImportFeatureFlagIdsResponseMapper.toResponse({
        featureFlagName: importCompanyIdsDto.featureFlagName,
        totalReceived: importCompanyIdsDto.companiesIds.length,
        imported: toCreate.length,
        skipped,
      });
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

      throw error;
    }
  }
}
