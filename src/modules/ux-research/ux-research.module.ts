import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';
import { MetricsModule } from '../common/metrics/metrics.module';
import { QueuesModule } from '../common/queues/queues.module';
import { AuditLogService } from './application/services/log.service';
import { UXResearchRepository } from './infraestructure/persistence/repositories/ux-research.repository';
import { CompanyUXResearchRepository } from './infraestructure/persistence/repositories/company-ux-research.repository';
import { UserUXResearchRepository } from './infraestructure/persistence/repositories/user-ux-research.repository';
import { UXResearchResponseRepository } from './infraestructure/persistence/repositories/ux-research-response.repository';
import { StsUXResearchController } from './sts-ux-research.controller';
import { UXResearchController } from './ux-research.controller';
import { AuditUXResearchProcessor } from './processors/audit-logs.processor';
import { DeadletterUXResearchProcessor } from './processors/deadletter-logs.processor';
import { SearchUXResearchUseCase } from './application/use-cases/search-feature-flag.use-case';
import { DisableUXResearchUseCase } from './application/use-cases/disable-ux-research.use-case';
import { ActiveUXResearchUseCase } from './application/use-cases/active-ux-research.use-case';
import { HashUXResearchService } from './application/services/hash-ux-research.service';
import { ImportCompaniesIdsUseCase } from './application/use-cases/import-companies-ids.use-case';
import { CreateUXResearchUseCase } from './application/use-cases/create-ux-research.use-case';
import { ImportUsersIdsUseCase } from './application/use-cases/import-users-ids.use-case';
import { DeleteUXResearchUseCase } from './application/use-cases/delete-ux-research.use-case';
import { UXResearchExistsConstraint } from './infraestructure/validators/ux-research-exists.validator';
import { CheckUXResearchUseCase } from './application/use-cases/check-feature-flag/check-ux-research.use-case';
import { CheckUXResearchUserUseCase } from './application/use-cases/check-feature-flag/check-ux-research-user.use-case';
import { CheckUXResearchCompanyUseCase } from './application/use-cases/check-feature-flag/check-ux-research-company.use-case';
import { CheckUXResearchPercentageUseCase } from './application/use-cases/check-feature-flag/check-ux-research-percentage.use-case';
import { CheckUXResearchCompanyPercentageUseCase } from './application/use-cases/check-feature-flag/check-ux-research-company-percentage.use-case';
import { CheckUXResearchUserPercentageUseCase } from './application/use-cases/check-feature-flag/check-ux-research-user-percentage.use-case';
import { GetUXResearchResponseUseCase } from './application/use-cases/get-ux-research-response.use-case';
import { CreateUXResearchResponseUseCase } from './application/use-cases/create-ux-research-response.use-case';
import { DeleteUXResearchResponseUseCase } from './application/use-cases/delete-ux-research-response.use-case';

@Module({
  imports: [QueuesModule, MetricsModule, FeatureFlagModule],
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
      provide: CompanyUXResearchRepository,
      useFactory: (dataSource: DataSource) => {
        return new CompanyUXResearchRepository(dataSource);
      },
      inject: [DataSource],
    },
    {
      provide: UserUXResearchRepository,
      useFactory: (dataSource: DataSource) => {
        return new UserUXResearchRepository(dataSource);
      },
      inject: [DataSource],
    },
    {
      provide: UXResearchRepository,
      useFactory: (dataSource: DataSource) => {
        return new UXResearchRepository(dataSource);
      },
      inject: [DataSource],
    },
    {
      provide: UXResearchResponseRepository,
      useFactory: (dataSource: DataSource) => {
        return new UXResearchResponseRepository(dataSource);
      },
      inject: [DataSource],
    },
    SearchUXResearchUseCase,
    DisableUXResearchUseCase,
    ActiveUXResearchUseCase,
    AuditLogService,
    HashUXResearchService,
    AuditUXResearchProcessor,
    DeadletterUXResearchProcessor,
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
export class UXResearchModule {}
