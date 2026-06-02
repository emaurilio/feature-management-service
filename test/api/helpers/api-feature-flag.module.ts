import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MetricsModule } from 'src/modules/common/metrics/metrics.module';
import { FeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { CompanyFeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { UserFeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { CreateFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/create-feature-flag.use-case';
import { ImportCompaniesIdsUseCase } from 'src/modules/feature-flag/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from 'src/modules/feature-flag/application/use-cases/import-users-ids.use-case';
import { DeleteFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { SearchFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/search-feature-flag.use-case';
import { DisableFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/disable-feature-flag.use-case';
import { ActiveFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/active-feature-flag.use-case';
import { FeatureFlagExistsConstraint } from 'src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import { HashFeatureFlagService } from 'src/modules/feature-flag/application/services/hash-feature-flag.service';
import { CheckFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { CheckFeatureFlagUserUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-user.use-case';
import { CheckFeatureFlagCompanyUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-company.use-case';
import { CheckFeatureFlagPercentageUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-percentage.use-case';
import { CheckFeatureFlagCompanyPercentageUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-company-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-user-percentage.use-case';
import { AuditLogService } from 'src/modules/feature-flag/application/services/audit-log.service';
import { FeatureFlagController } from 'src/modules/feature-flag/feature-flag.controller';
import { StsFeatureFlagController } from 'src/modules/feature-flag/sts-feature-flag.controller';

const noopAuditLogService = {
  dispatchLog: async () => true,
};

@Module({
  imports: [MetricsModule],
  providers: [
    {
      provide: 'FeatureFlagRepositoryInterface',
      useExisting: FeatureFlagRepository,
    },
    {
      provide: 'CompanyFeatureFlagRepositoryInterface',
      useExisting: CompanyFeatureFlagRepository,
    },
    {
      provide: 'UserFeatureFlagRepositoryInterface',
      useExisting: UserFeatureFlagRepository,
    },
    {
      provide: FeatureFlagRepository,
      useFactory: (dataSource: DataSource) => new FeatureFlagRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: CompanyFeatureFlagRepository,
      useFactory: (dataSource: DataSource) =>
        new CompanyFeatureFlagRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: UserFeatureFlagRepository,
      useFactory: (dataSource: DataSource) => new UserFeatureFlagRepository(dataSource),
      inject: [DataSource],
    },
    { provide: AuditLogService, useValue: noopAuditLogService },
    SearchFeatureFlagUseCase,
    DisableFeatureFlagUseCase,
    ActiveFeatureFlagUseCase,
    HashFeatureFlagService,
    CreateFeatureFlagUseCase,
    ImportCompaniesIdsUseCase,
    ImportUsersIdsUseCase,
    DeleteFeatureFlagUseCase,
    FeatureFlagExistsConstraint,
    CheckFeatureFlagUseCase,
    CheckFeatureFlagUserUseCase,
    CheckFeatureFlagCompanyUseCase,
    CheckFeatureFlagPercentageUseCase,
    CheckFeatureFlagCompanyPercentageUseCase,
    CheckFeatureFlagUserPercentageUseCase,
  ],
  controllers: [FeatureFlagController, StsFeatureFlagController],
  exports: [
    CheckFeatureFlagUseCase,
    'FeatureFlagRepositoryInterface',
    FeatureFlagExistsConstraint,
  ],
})
export class ApiFeatureFlagModule {}
