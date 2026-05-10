import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { StsUXResearchController } from 'src/modules/ux-research/sts-ux-research.controller';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
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
import { SimpleTokenGuard } from 'src/modules/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';
import { CreateUXResearchDto } from 'src/modules/ux-research/application/dto/create-ux-research.dto';

describe('StsUXResearchController - Create (e2e)', () => {
  let app: INestApplication;

  const mockCreateUXResearchUseCase = {
    execute: jest.fn(),
  };

  const API_KEY = 'test-api-key';

  beforeAll(async () => {
    process.env.API_KEY = API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StsUXResearchController],
      providers: [
        { provide: CreateUXResearchUseCase, useValue: mockCreateUXResearchUseCase },
        { provide: ImportCompaniesIdsUseCase, useValue: {} },
        { provide: ImportUsersIdsUseCase, useValue: {} },
        { provide: DeleteUXResearchUseCase, useValue: {} },
        { provide: SearchUXResearchUseCase, useValue: {} },
        { provide: CheckUXResearchUseCase, useValue: {} },
        { provide: DisableUXResearchUseCase, useValue: {} },
        { provide: ActiveUXResearchUseCase, useValue: {} },
        { provide: GetUXResearchResponseUseCase, useValue: {} },
        { provide: CreateUXResearchResponseUseCase, useValue: {} },
        { provide: DeleteUXResearchResponseUseCase, useValue: {} },
        {
          provide: 'FeatureFlagExistsConstraint',
          useValue: {
            validate: jest.fn().mockImplementation(async (value?: string) => value !== 'non-existent-feature'),
            defaultMessage: jest.fn(),
          },
        },
        {
          provide: require('src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator').FeatureFlagExistsConstraint,
          useValue: {
            validate: jest.fn().mockImplementation(async (value?: string) => value !== 'non-existent-feature'),
            defaultMessage: jest.fn(),
          },
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

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /sts/ux-research/create', () => {
    const wireUser = {
      userId: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    };

    /** Corpo HTTP: campos com @Expose no DTO usam snake_case */
    const validCreateBody = {
      name: 'Test UX Research',
      type: UXResearchType.PERCENTAGE,
      percentage: 50,
      start_date: '2023-01-01T00:00:00.000Z',
      end_date: '2023-01-31T00:00:00.000Z',
      feature_flag_name: 'test-feature',
      user_data: wireUser,
    };

    it('should create UX research successfully with valid data', () => {
      mockCreateUXResearchUseCase.execute.mockResolvedValue({
        id: 'ux-research-1',
        name: validCreateBody.name,
        type: validCreateBody.type,
        percentage: validCreateBody.percentage,
        startDate: new Date(validCreateBody.start_date),
        endDate: new Date(validCreateBody.end_date),
        featureFlagName: validCreateBody.feature_flag_name,
        userData: validCreateBody.user_data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(validCreateBody)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.name).toBe(validCreateBody.name);
          expect(res.body.type).toBe(validCreateBody.type);
          expect(res.body.percentage).toBe(validCreateBody.percentage);
        });
    });

    it('should return 401 without authorization token', () => {
      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .send(validCreateBody)
        .expect(401);
    });

    it('should return 400 when name is missing', () => {
      const invalidDto = { ...validCreateBody } as Record<string, unknown>;
      delete invalidDto.name;

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('UX Research Name is required');
        });
    });

    it('should return 400 when type is missing', () => {
      const invalidDto = { ...validCreateBody } as Record<string, unknown>;
      delete invalidDto.type;

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Type is required');
        });
    });

    it('should return 400 when percentage is invalid', () => {
      const invalidDto = {
        ...validCreateBody,
        type: UXResearchType.PERCENTAGE,
        percentage: 150,
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Percentage must be at most 100');
        });
    });

    it('should return 400 when percentage is negative', () => {
      const invalidDto = {
        ...validCreateBody,
        type: UXResearchType.PERCENTAGE,
        percentage: -10,
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Percentage must be at least 0');
        });
    });

    it('should return 400 when user data is missing', () => {
      const invalidDto = { ...validCreateBody } as Record<string, unknown>;
      delete invalidDto.user_data;

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('User data is required');
        });
    });

    it('should return 400 when user data is not an object', () => {
      const invalidDto = {
        ...validCreateBody,
        user_data: 'invalid-string',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('User data must be an object');
        });
    });

    it('should create UX research successfully with minimal data', () => {
      const minimalBody = {
        name: 'Minimal UX Research',
        type: UXResearchType.COMPANY,
        user_data: {
          userId: 'user-2',
          email: 'user2@example.com',
          name: 'Second User',
        },
      };

      mockCreateUXResearchUseCase.execute.mockResolvedValue({
        id: 'ux-research-2',
        name: minimalBody.name,
        type: minimalBody.type,
        userData: minimalBody.user_data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(minimalBody)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.name).toBe(minimalBody.name);
          expect(res.body.type).toBe(minimalBody.type);
          expect(res.body.userData).toEqual(minimalBody.user_data);
        });
    });

    it('should return 400 when start date is invalid', () => {
      const invalidDto = {
        ...validCreateBody,
        start_date: 'invalid-date',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Start date must be a date');
        });
    });

    it('should return 400 when end date is invalid', () => {
      const invalidDto = {
        ...validCreateBody,
        end_date: 'invalid-date',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('End date must be a date');
        });
    });

    it('should return 400 when feature flag name is not found', () => {
      const invalidDto = {
        ...validCreateBody,
        feature_flag_name: 'non-existent-feature',
      };

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Feature Flag not found');
        });
    });

    it('should work with different UX research types', () => {
      const featureFlagBody = {
        name: 'Feature Flag UX Research',
        type: UXResearchType.COMPANY,
        feature_flag_name: 'test-feature',
        user_data: {
          userId: 'user-3',
          email: 'user3@example.com',
          name: 'Third User',
        },
      };

      mockCreateUXResearchUseCase.execute.mockResolvedValue({
        id: 'ux-research-3',
        name: featureFlagBody.name,
        type: featureFlagBody.type,
        featureFlagName: featureFlagBody.feature_flag_name,
        userData: featureFlagBody.user_data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(featureFlagBody)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.type).toBe(UXResearchType.COMPANY);
        });
    });

    it('should work with special characters in name', async () => {
      const specialCharsBody = {
        name: 'Test UX Research & Special Characters! @#$%',
        type: UXResearchType.PERCENTAGE,
        percentage: 25,
        user_data: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      mockCreateUXResearchUseCase.execute.mockResolvedValue({
        id: 'ux-research-4',
        name: specialCharsBody.name,
        type: specialCharsBody.type,
        percentage: specialCharsBody.percentage,
        userData: specialCharsBody.user_data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .post('/sts/ux-research/create')
        .set('Authorization', 'test-api-key')
        .send(specialCharsBody);

      expect(res.status).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.name).toBe(specialCharsBody.name);
    });
  });
});