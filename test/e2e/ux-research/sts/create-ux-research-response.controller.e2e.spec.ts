import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { StsUXResearchController } from 'src/ux-research/sts-ux-research.controller';
import { CreateUXResearchUseCase } from 'src/ux-research/application/use-cases/create-ux-research.use-case';
import { ImportCompaniesIdsUseCase } from 'src/ux-research/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from 'src/ux-research/application/use-cases/import-users-ids.use-case';
import { DeleteUXResearchUseCase } from 'src/ux-research/application/use-cases/delete-ux-research.use-case';
import { SearchUXResearchUseCase } from 'src/ux-research/application/use-cases/search-feature-flag.use-case';
import { CheckUXResearchUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research.use-case';
import { DisableUXResearchUseCase } from 'src/ux-research/application/use-cases/disable-ux-research.use-case';
import { ActiveUXResearchUseCase } from 'src/ux-research/application/use-cases/active-ux-research.use-case';
import { GetUXResearchResponseUseCase } from 'src/ux-research/application/use-cases/get-ux-research-response.use-case';
import { CreateUXResearchResponseUseCase } from 'src/ux-research/application/use-cases/create-ux-research-response.use-case';
import { DeleteUXResearchResponseUseCase } from 'src/ux-research/application/use-cases/delete-ux-research-response.use-case';
import { UXResearchExistsConstraint } from 'src/ux-research/infraestructure/validators/ux-research-exists.validator';
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';

describe('StsUXResearchController - Create UX Research Response (e2e)', () => {
  let app: INestApplication;

  const mockCreateUXResearchResponseUseCase = {
    execute: jest.fn(),
  };

  const API_KEY = 'test-api-key';

  beforeAll(async () => {
    process.env.API_KEY = API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StsUXResearchController],
      providers: [
        { provide: CreateUXResearchUseCase, useValue: {} },
        { provide: ImportCompaniesIdsUseCase, useValue: {} },
        { provide: ImportUsersIdsUseCase, useValue: {} },
        { provide: DeleteUXResearchUseCase, useValue: {} },
        { provide: SearchUXResearchUseCase, useValue: {} },
        { provide: CheckUXResearchUseCase, useValue: {} },
        { provide: DisableUXResearchUseCase, useValue: {} },
        { provide: ActiveUXResearchUseCase, useValue: {} },
        { provide: GetUXResearchResponseUseCase, useValue: {} },
        { provide: CreateUXResearchResponseUseCase, useValue: mockCreateUXResearchResponseUseCase },
        { provide: DeleteUXResearchResponseUseCase, useValue: {} },
        {
          provide: 'FeatureFlagExistsConstraint',
          useValue: {
            validate: jest.fn().mockImplementation(async (value?: string) => value !== 'non-existent-flag'),
            defaultMessage: jest.fn(),
          },
        },
        {
          provide: require('src/feature-flag/infraestructure/validators/feature-flag-exists.validator').FeatureFlagExistsConstraint,
          useValue: {
            validate: jest.fn().mockImplementation(async (value?: string) => value !== 'non-existent-flag'),
            defaultMessage: jest.fn(),
          },
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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /sts/ux-research/create-ux-research-response', () => {
    const wireUser = {
      userId: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
    };

    const validBody = {
      ux_research_name: 'Test UX Research',
      user_id: 'user-1',
      response_data: JSON.stringify({ step: 1, completed: true }),
      response_date: '2024-06-01T12:00:00.000Z',
      user_data: wireUser,
    };

    it('should create UX research response (201 Created)', async () => {
      const mockResult = {
        id: 'response-1',
        response: validBody.response_data,
        uxResearchId: 'ux-1',
        userId: 'user-1',
      };

      mockCreateUXResearchResponseUseCase.execute.mockImplementation(async () => mockResult);

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send(validBody);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(mockResult);
      expect(mockCreateUXResearchResponseUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          uxResearchName: validBody.ux_research_name,
          userId: validBody.user_id,
          responseData: validBody.response_data,
          userData: validBody.user_data,
        }),
      );
    });

    it('should accept company_id instead of user_id', async () => {
      const body = {
        ux_research_name: 'Test UX Research',
        company_id: 'company-99',
        response_data: JSON.stringify({ ok: true }),
        response_date: '2024-06-02T15:30:00.000Z',
        user_data: wireUser,
      };

      mockCreateUXResearchResponseUseCase.execute.mockImplementation(async () => ({
        id: 'response-2',
        companyId: 'company-99',
      }));

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send(body);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(mockCreateUXResearchResponseUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: body.company_id,
        }),
      );
    });

    it('should accept feature_flag_name when UX name omitted', async () => {
      const body = {
        feature_flag_name: 'my-feature-flag',
        user_id: 'user-2',
        response_data: '{}',
        response_date: '2024-01-10T08:00:00.000Z',
        user_data: wireUser,
      };

      mockCreateUXResearchResponseUseCase.execute.mockImplementation(async () => ({ id: 'response-3' }));

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send(body);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(mockCreateUXResearchResponseUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          featureFlagName: body.feature_flag_name,
        }),
      );
    });

    it('should return 400 if UX research name does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          ux_research_name: 'Non-existent UX Research',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('UX Research not found')]),
      );
    });

    it('should return 400 if feature flag name does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send({
          feature_flag_name: 'non-existent-flag',
          user_id: 'user-1',
          response_data: '{}',
          response_date: '2024-06-01T12:00:00.000Z',
          user_data: wireUser,
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('Feature Flag not found')]),
      );
    });

    it('should return 400 if response_data is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.response_data;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Response data is required');
    });

    it('should return 400 if response_data is not valid JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          response_data: 'not-json',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Response data must be a valid JSON string');
    });

    it('should return 400 if response_date is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.response_date;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Response date is required');
    });

    it('should return 400 if user_data is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.user_data;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data is required');
    });

    it('should return 400 if user_data is not an object', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          user_data: 'invalid',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data must be an object');
    });

    it('should return 400 if percentage is above 100', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          percentage: 101,
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Percentage must be at most 100');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/create-ux-research-response')
        .set('Authorization', 'wrong-token')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
