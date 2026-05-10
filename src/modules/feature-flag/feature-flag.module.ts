import { Module } from '@nestjs/common';
import { AuditLogsProcessor } from './processors/audit-logs.processor';
import { DeadletterLogsProcessor } from './processors/deadletter-logs.processor';
import { MetricsModule } from '../common/metrics/metrics.module';
import { QueuesModule } from '../common/queues/queues.module';
import { DataSource } from 'typeorm';
import { FeatureFlagRepository } from './infraestructure/persistence/repositories/feature-flag.repository';
import { CompanyFeatureFlagRepository } from './infraestructure/persistence/repositories/company-feature-flag.repository';
import { CreateFeatureFlagUseCase } from './application/use-cases/create-feature-flag.use-case';
import { ImportCompaniesIdsUseCase } from './application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from './application/use-cases/import-users-ids.use-case';
import { FeatureFlagExistsConstraint } from './infraestructure/validators/feature-flag-exists.validator';
import { DeleteFeatureFlagUseCase } from './application/use-cases/delete-feature-flag.use-case';
import { UserFeatureFlagRepository } from './infraestructure/persistence/repositories/user-feature-flag.repository';
import { StsFeatureFlagController } from './sts-feature-flag.controller';
import { FeatureFlagController } from './feature-flag.controller';
import { HashFeatureFlagService } from './application/services/hash-feature-flag.service';
import { CheckFeatureFlagUseCase } from './application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { CheckFeatureFlagUserUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-user.use-case';
import { CheckFeatureFlagCompanyUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-company.use-case';
import { CheckFeatureFlagPercentageUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-percentage.use-case';
import { CheckFeatureFlagCompanyPercentageUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-company-percentage.use-case';
import { CheckFeatureFlagUserPercentageUseCase } from './application/use-cases/check-feature-flag/check-feature-flag-user-percentage.use-case';
import { AuditLogService } from './application/services/audit-log.service';
import { ActiveFeatureFlagUseCase } from './application/use-cases/active-feature-flag.use-case';
import { DisableFeatureFlagUseCase } from './application/use-cases/disable-feature-flag.use-case';
import { SearchFeatureFlagUseCase } from './application/use-cases/search-feature-flag.use-case';

@Module({
  imports: [
    QueuesModule,
    MetricsModule,
  ],
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
      useFactory: (dataSource: DataSource) => {
        return new FeatureFlagRepository(dataSource);
      },
      inject: [DataSource],
    },
    {
      provide: CompanyFeatureFlagRepository,
      useFactory: (dataSource: DataSource) => {
        return new CompanyFeatureFlagRepository(dataSource);
      },
      inject: [DataSource],
    },
    {
      provide: UserFeatureFlagRepository,
      useFactory: (dataSource: DataSource) => {
        return new UserFeatureFlagRepository(dataSource);
      },
      inject: [DataSource],
    },
    SearchFeatureFlagUseCase,
    DisableFeatureFlagUseCase,
    ActiveFeatureFlagUseCase,
    AuditLogService,
    HashFeatureFlagService,
    AuditLogsProcessor,
    DeadletterLogsProcessor,
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
    'FeatureFlagRepositoryInterface',
    CheckFeatureFlagUseCase,
  ],
})
export class FeatureFlagModule { }
