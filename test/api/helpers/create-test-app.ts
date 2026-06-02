import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpErrorFilter } from 'src/modules/common/filter/http-error.filter';
import { TransformInterceptor } from 'src/modules/common/interceptors/transform.interceptor';
import { AuthModule } from 'src/modules/common/auth/auth.module';
import { FeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { UserFeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';
import { CompanyFeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/CompanyFeatureFlag.entity';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { UserUXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/user-ux-resarch.entity';
import { CompanyUXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/company-ux-research.entity';
import { UXResearchResponseEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research-response.entity';
import { ApiFeatureFlagModule } from './api-feature-flag.module';
import { ApiUxResearchModule } from './api-ux-research.module';
import { InMemoryCacheModule } from './in-memory-cache.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [
          FeatureFlagEntity,
          UserFeatureFlagEntity,
          CompanyFeatureFlagEntity,
          UXResearchEntity,
          UserUXResearchEntity,
          CompanyUXResearchEntity,
          UXResearchResponseEntity,
        ],
        synchronize: true,
      }),
      InMemoryCacheModule,
      AuthModule,
      ApiFeatureFlagModule,
      ApiUxResearchModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  useContainer(app.select(ApiFeatureFlagModule), { fallbackOnErrors: true });
  useContainer(app.select(ApiUxResearchModule), { fallbackOnErrors: true });

  await app.init();

  return app;
}
