import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
import { SimpleTokenGuard } from 'src/modules/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';

describe('StsUXResearchController - Get UX Research Responses (e2e)', () => {
  let app: INestApplication;

  const mockGetUXResearchResponseUseCase = {
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
        { provide: GetUXResearchResponseUseCase, useValue: mockGetUXResearchResponseUseCase },
        { provide: CreateUXResearchResponseUseCase, useValue: {} },
        { provide: DeleteUXResearchResponseUseCase, useValue: {} },
        {
          provide: 'FeatureFlagExistsConstraint',
          useValue: { validate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: require('src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator').FeatureFlagExistsConstraint,
          useValue: { validate: jest.fn().mockResolvedValue(true), defaultMessage: jest.fn() },
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

  describe('POST /sts/ux-research/get-responses', () => {
    const validBody = {
      name: 'Test UX Research',
      page: 1,
      limit: 15,
      user_data: {
        userId: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
      },
    };

    const mockPaginatedResult = {
      items: [
        {
          id: 'response-1',
          response: '{"ok":true}',
          uxResearchId: 'ux-research-1',
        },
      ],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 15,
        totalPages: 1,
        currentPage: 1,
      },
    };

    it('should return UX research responses (200 OK)', async () => {
      mockGetUXResearchResponseUseCase.execute.mockImplementation(async () => mockPaginatedResult);

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', API_KEY)
        .send(validBody);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(mockPaginatedResult);
      expect(mockGetUXResearchResponseUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validBody.name,
          page: validBody.page,
          limit: validBody.limit,
          userData: validBody.user_data,
        }),
      );
    });

    it('should return 400 if name is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.name;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('UX Research Name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          name: '',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('UX Research Name is required');
    });

    it('should return 400 if user_data is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.user_data;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data is required');
    });

    it('should return 400 if user_data is not an object', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          user_data: 'invalid',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data must be an object');
    });

    it('should return 400 if page is not a number', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          page: 'not-a-number',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 if limit is not a number', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          limit: 'invalid',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/get-responses')
        .set('Authorization', 'wrong-token')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
