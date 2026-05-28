/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StsFeatureFlagController } from '../../../../src/modules/feature-flag/sts-feature-flag.controller';
import { CreateFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/create-feature-flag.use-case';
import { SimpleTokenGuard } from '../../../../src/modules/common/guards/simple-token.guard';
import { FeatureFlagRepository } from '../../../../src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagExistsConstraint } from '../../../../src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import { useContainer } from 'class-validator';
import { ImportCompaniesIdsUseCase } from '../../../../src/modules/feature-flag/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from '../../../../src/modules/feature-flag/application/use-cases/import-users-ids.use-case';
import { DeleteFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { SearchFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/search-feature-flag.use-case';
import { CheckFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { DisableFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/disable-feature-flag.use-case';
import { ActiveFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/active-feature-flag.use-case';

describe('FeatureFlagController Import Companies (E2E)', () => {
  let app: INestApplication;

  const mockImportCompaniesIdsUseCase = {
    execute: jest.fn(),
  };

  const mockImportUsersIdsUseCase = {
    execute: jest.fn(),
  };

  const mockCreateFeatureFlagUseCase = {
    execute: jest.fn(),
  };

  const mockFeatureFlagRepository = {
    findByName: jest.fn(),
  };

  const API_KEY = 'test-api-key';

  beforeAll(async () => {
    process.env.API_KEY = API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StsFeatureFlagController],
      providers: [
        {
          provide: CreateFeatureFlagUseCase,
          useValue: mockCreateFeatureFlagUseCase,
        },
        {
          provide: ImportCompaniesIdsUseCase,
          useValue: mockImportCompaniesIdsUseCase,
        },
        {
          provide: ImportUsersIdsUseCase,
          useValue: mockImportUsersIdsUseCase,
        },
        {
          provide: FeatureFlagRepository,
          useValue: mockFeatureFlagRepository,
        },
        { provide: DeleteFeatureFlagUseCase, useValue: {} },
        { provide: SearchFeatureFlagUseCase, useValue: {} },
        { provide: CheckFeatureFlagUseCase, useValue: {} },
        { provide: DisableFeatureFlagUseCase, useValue: {} },
        { provide: ActiveFeatureFlagUseCase, useValue: {} },
        FeatureFlagExistsConstraint,
        SimpleTokenGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );

    useContainer(app, { fallbackOnErrors: true });

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /feature-flags/import-companies-ids', () => {
    const importCompanyIdsDto = {
      feature_flag_name: 'test-feature-flag',
      companies_ids: ['company-1', 'company-2'],
      user_data: {
        userId: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
      },
    };

    it('should import company ids (200 OK)', async () => {
      const mockResult = {
        featureFlagName: 'test-feature-flag',
        totalReceived: 2,
        imported: 2,
        skipped: 0,
      };
      mockFeatureFlagRepository.findByName.mockResolvedValue({
        id: 'some-id',
        name: 'test-feature-flag',
      });

      mockImportCompaniesIdsUseCase.execute.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .post('/sts/feature-flag/import-companies-ids')
        .set('Authorization', API_KEY)
        .send(importCompanyIdsDto);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(mockResult);
    });

    it('should return 400 if feature flag does not exist', async () => {
      mockFeatureFlagRepository.findByName.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/sts/feature-flag/import-companies-ids')
        .set('Authorization', API_KEY)
        .send(importCompanyIdsDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message[0]).toContain('Feature Flag not found');
    });

    it('should return 401 Unauthorized if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/feature-flag/import-companies-ids')
        .send(importCompanyIdsDto);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
