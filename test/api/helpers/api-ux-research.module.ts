import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MetricsModule } from 'src/modules/common/metrics/metrics.module';
import { ApiFeatureFlagModule } from './api-feature-flag.module';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { CompanyUXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/company-ux-research.repository';
import { UserUXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/user-ux-research.repository';
import { UXResearchResponseRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research-response.repository';
import { SearchUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/search-feature-flag.use-case';
import { DisableUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/disable-ux-research.use-case';
import { ActiveUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/active-ux-research.use-case';
import { HashUXResearchService } from 'src/modules/ux-research/application/services/hash-ux-research.service';
import { CreateUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/create-ux-research.use-case';
import { ImportCompaniesIdsUseCase } from 'src/modules/ux-research/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from 'src/modules/ux-research/application/use-cases/import-users-ids.use-case';
import { DeleteUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/delete-ux-research.use-case';
import { UXResearchExistsConstraint } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';
import { CheckUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research.use-case';
import { CheckUXResearchUserUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research-user.use-case';
import { CheckUXResearchCompanyUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research-company.use-case';
import { CheckUXResearchPercentageUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research-percentage.use-case';
import { CheckUXResearchCompanyPercentageUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research-company-percentage.use-case';
import { CheckUXResearchUserPercentageUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research-user-percentage.use-case';
import { GetUXResearchResponseUseCase } from 'src/modules/ux-research/application/use-cases/get-ux-research-response.use-case';
import { CreateUXResearchResponseUseCase } from 'src/modules/ux-research/application/use-cases/create-ux-research-response.use-case';
import { DeleteUXResearchResponseUseCase } from 'src/modules/ux-research/application/use-cases/delete-ux-research-response.use-case';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { UXResearchController } from 'src/modules/ux-research/ux-research.controller';
import { StsUXResearchController } from 'src/modules/ux-research/sts-ux-research.controller';

const noopAuditLogService = {
  dispatchLog: async () => true,
};

@Module({
  imports: [MetricsModule, ApiFeatureFlagModule],
  providers: [
    {
      provide: 'UXResearchRepositoryInterface',
      useExisting: UXResearchRepository,
    },
    {
      provide: 'CompanyUXResearchRepositoryInterface',
      useExisting: CompanyUXResearchRepository,
    },
    {
      provide: 'UserUXResearchRepositoryInterface',
      useExisting: UserUXResearchRepository,
    },
    {
      provide: 'UXResearchResponseRepositoryInterface',
      useExisting: UXResearchResponseRepository,
    },
    {
      provide: UXResearchRepository,
      useFactory: (dataSource: DataSource) => new UXResearchRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: CompanyUXResearchRepository,
      useFactory: (dataSource: DataSource) =>
        new CompanyUXResearchRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: UserUXResearchRepository,
      useFactory: (dataSource: DataSource) => new UserUXResearchRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: UXResearchResponseRepository,
      useFactory: (dataSource: DataSource) =>
        new UXResearchResponseRepository(dataSource),
      inject: [DataSource],
    },
    { provide: AuditLogService, useValue: noopAuditLogService },
    SearchUXResearchUseCase,
    DisableUXResearchUseCase,
    ActiveUXResearchUseCase,
    HashUXResearchService,
    CreateUXResearchUseCase,
    ImportCompaniesIdsUseCase,
    ImportUsersIdsUseCase,
    DeleteUXResearchUseCase,
    UXResearchExistsConstraint,
    CheckUXResearchUseCase,
    CheckUXResearchUserUseCase,
    CheckUXResearchCompanyUseCase,
    CheckUXResearchPercentageUseCase,
    CheckUXResearchCompanyPercentageUseCase,
    CheckUXResearchUserPercentageUseCase,
    GetUXResearchResponseUseCase,
    CreateUXResearchResponseUseCase,
    DeleteUXResearchResponseUseCase,
  ],
  controllers: [UXResearchController, StsUXResearchController],
})
export class ApiUxResearchModule {}
