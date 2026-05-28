import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { StsUXResearchController } from 'src/modules/ux-research/sts-ux-research.controller';
import { CreateUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/create-ux-research.use-case';
import { ImportCompaniesIdsUseCase } from 'src/modules/ux-research/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from 'src/modules/ux-research/application/use-cases/import-users-ids.use-case';
import { DeleteUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/delete-ux-research.use-case';
import { SearchUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/search-feature-flag.use-case';
import { CheckUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research.use-case';
import { DisableUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/disable-ux-research.use-case';
import { ActiveUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/active-ux-research.use-case';
import { GetUXResearchResponseUseCase } from 'src/modules/ux-research/application/use-cases/get-ux-research-response.use-case';
import { CreateUXResearchResponseUseCase } from 'src/modules/ux-research/application/use-cases/create-ux-research-response.use-case';
import { DeleteUXResearchResponseUseCase } from 'src/modules/ux-research/application/use-cases/delete-ux-research-response.use-case';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { UXResearchExistsConstraint } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';
import { SimpleTokenGuard } from 'src/modules/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';

describe('StsUXResearchController - Import Companies IDs (e2e)', () => {
  let app: INestApplication;

  const mockImportCompaniesIdsUseCase = {
    execute: jest.fn(),
  };

  const API_KEY = 'test-api-key';

  beforeAll(async () => {
    process.env.API_KEY = API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StsUXResearchController],
      providers: [
        { provide: CreateUXResearchUseCase, useValue: {} },
        { provide: ImportCompaniesIdsUseCase, useValue: mockImportCompaniesIdsUseCase },
        { provide: ImportUsersIdsUseCase, useValue: {} },
        { provide: DeleteUXResearchUseCase, useValue: {} },
        { provide: SearchUXResearchUseCase, useValue: {} },
        { provide: CheckUXResearchUseCase, useValue: {} },
        { provide: DisableUXResearchUseCase, useValue: {} },
        { provide: ActiveUXResearchUseCase, useValue: {} },
        { provide: GetUXResearchResponseUseCase, useValue: {} },
        { provide: CreateUXResearchResponseUseCase, useValue: {} },
        { provide: DeleteUXResearchResponseUseCase, useValue: {} },
        { provide: 'UXResearchRepositoryInterface', useValue: { findByName: jest.fn().mockResolvedValue({ id: 'ux-research-1', version: 1 }) } },
        { provide: 'CompanyUXResearchRepositoryInterface', useValue: { findByCompanyIdAndUXResearchId: jest.fn().mockResolvedValue(null), createMany: jest.fn().mockResolvedValue({ message: 'Companies IDs imported successfully', importedCount: 1 }) } },
        { provide: AuditLogService, useValue: { dispatchLog: jest.fn().mockResolvedValue(true) } },
        { provide: 'CACHE_SERVICE', useValue: { invalidateCacheEntityFlags: jest.fn().mockResolvedValue(undefined) } },
        {
          provide: 'FeatureFlagExistsConstraint',
          useValue: { validate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: require('src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator').FeatureFlagExistsConstraint,
          useValue: { validate: jest.fn().mockResolvedValue(true), defaultMessage: jest.fn() },
        },
        {
          provide: 'UXResearchRepository',
          useValue: { findByName: jest.fn().mockResolvedValue({ id: 'ux-research-1', version: 1 }) },
        },
        {
          provide: UXResearchExistsConstraint,
          useFactory: () => ({
            validate: jest.fn().mockImplementation(async (value: string) => {
              if (value === 'Non-existent UX Research') return false;
              return !!value;
            }),
            defaultMessage: jest.fn().mockReturnValue('UX Research exists'),
          }),
        },
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockImportCompaniesIdsUseCase.execute.mockResolvedValue({
      message: 'Companies IDs imported successfully',
      importedCount: 1,
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /sts/ux-research/import-companies-ids', () => {
    const validImportDto = {
      ux_research_name: 'Test UX Research',
      companies_ids: ['company-1', 'company-2', 'company-3'],
      user_data: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };

    it('should import companies IDs successfully with valid data', () => {
      mockImportCompaniesIdsUseCase.execute.mockResolvedValue({
        uxResearchName: 'Test UX Research',
        totalReceived: validImportDto.companies_ids.length,
        imported: validImportDto.companies_ids.length,
        skipped: 0,
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(validImportDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            uxResearchName: 'Test UX Research',
            totalReceived: validImportDto.companies_ids.length,
            imported: validImportDto.companies_ids.length,
            skipped: 0,
          });
        });
    });

    it('should return 401 without authorization token', () => {
      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .send(validImportDto)
        .expect(401);
    });

    it('should return 400 when UX research name is missing', () => {
      const invalidDto = { ...validImportDto } as Record<string, unknown>;
      delete invalidDto.ux_research_name;

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Name is required');
        });
    });

    it('should return 400 when UX research name is empty', () => {
      const invalidDto = {
        ...validImportDto,
        ux_research_name: '',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Name is required');
        });
    });

    it('should return 400 when companies IDs array is missing', () => {
      const invalidDto = { ...validImportDto } as Record<string, unknown>;
      delete invalidDto.companies_ids;

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Companies IDs is required');
        });
    });

    it('should return 400 when companies IDs is not an array', () => {
      const invalidDto = {
        ...validImportDto,
        companies_ids: 'not-an-array',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Companies IDs must be an array');
        });
    });

    it('should return 400 when companies IDs array is empty', () => {
      const invalidDto = {
        ...validImportDto,
        companies_ids: [],
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Companies IDs is required');
        });
    });

    it('should return 400 when user data is missing', () => {
      const invalidDto = { ...validImportDto } as Record<string, unknown>;
      delete invalidDto.user_data;

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('User data is required');
        });
    });

    it('should return 400 when user data is not an object', () => {
      const invalidDto = {
        ...validImportDto,
        user_data: 'invalid-string',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('User data must be an object');
        });
    });

    it('should return 400 when UX research is not found', () => {
      const invalidDto = {
        ...validImportDto,
        ux_research_name: 'Non-existent UX Research',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('UX Research not found');
        });
    });

    it('should work with single company ID', () => {
      const singleCompanyDto = {
        ux_research_name: 'Test UX Research',
        companies_ids: ['company-single'],
        user_data: {
          userId: 'user-2',
          email: 'user2@example.com',
          name: 'Second User',
        },
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(singleCompanyDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.message).toContain('Companies IDs imported successfully');
        });
    });

    it('should work with many company IDs', () => {
      const manyCompaniesDto = {
        ux_research_name: 'Test UX Research',
        companies_ids: [
          'company-1',
          'company-2',
          'company-3',
          'company-4',
          'company-5',
          'company-6',
          'company-7',
          'company-8',
          'company-9',
          'company-10',
        ],
        user_data: {
          userId: 'user-3',
          email: 'user3@example.com',
          name: 'Third User',
        },
      };

      mockImportCompaniesIdsUseCase.execute.mockResolvedValue({
        message: 'Companies IDs imported successfully',
        importedCount: 10,
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(manyCompaniesDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.message).toContain('Companies IDs imported successfully');
        });
    });

    it('should work with special characters in UX research name', () => {
      const specialCharsDto = {
        ux_research_name: 'Test UX Research & Special Characters! @#$%',
        companies_ids: ['company-special'],
        user_data: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(specialCharsDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.message).toContain('Companies IDs imported successfully');
        });
    });

    it('should work with company IDs containing special characters', () => {
      const specialIdsDto = {
        ux_research_name: 'Test UX Research',
        companies_ids: ['company-1', 'company-2@domain', 'company-3#special'],
        user_data: {
          userId: 'user-4',
          email: 'user4@example.com',
          name: 'Fourth User',
        },
      };

      mockImportCompaniesIdsUseCase.execute.mockResolvedValue({
        message: 'Companies IDs imported successfully',
        importedCount: 3,
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(specialIdsDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.message).toContain('Companies IDs imported successfully');
        });
    });

    it('should work with numeric company IDs as strings', () => {
      const numericIdsDto = {
        ux_research_name: 'Test UX Research',
        companies_ids: ['123', '456', '789'],
        user_data: {
          userId: 'user-5',
          email: 'user5@example.com',
          name: 'Fifth User',
        },
      };

      mockImportCompaniesIdsUseCase.execute.mockResolvedValue({
        message: 'Companies IDs imported successfully',
        importedCount: 3,
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(numericIdsDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.message).toContain('Companies IDs imported successfully');
        });
    });

    it('should work with UUID company IDs', () => {
      const uuidIdsDto = {
        ux_research_name: 'Test UX Research',
        companies_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
        ],
        user_data: {
          userId: 'user-6',
          email: 'user6@example.com',
          name: 'Sixth User',
        },
      };

      mockImportCompaniesIdsUseCase.execute.mockResolvedValue({
        message: 'Companies IDs imported successfully',
        importedCount: 2,
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(uuidIdsDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.message).toContain('Companies IDs imported successfully');
        });
    });

    it('should return 400 when companies IDs contains non-string values', () => {
      const invalidDto = {
        ...validImportDto,
        companies_ids: ['company-1', 123, true, null],
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 when companies IDs contains empty strings', () => {
      const invalidDto = {
        ...validImportDto,
        companies_ids: ['company-1', '', 'company-3'],
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400);
    });

    it('should work with user data containing special characters', () => {
      const specialUserDto = {
        ux_research_name: 'Test UX Research',
        companies_ids: ['company-1'],
        user_data: {
          userId: 'user-éñç',
          email: 'user+test@domain.co.uk',
          name: 'José María García',
        },
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/import-companies-ids')
        .set('Authorization', 'test-api-key')
        .send(specialUserDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.message).toContain('Companies IDs imported successfully');
        });
    });
  });
});