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

describe('StsUXResearchController - Import Users IDs (e2e)', () => {
  let app: INestApplication;

  const mockImportUsersIdsUseCase = {
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
        { provide: ImportUsersIdsUseCase, useValue: mockImportUsersIdsUseCase },
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
          useValue: { validate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: require('src/feature-flag/infraestructure/validators/feature-flag-exists.validator').FeatureFlagExistsConstraint,
          useValue: { validate: jest.fn().mockResolvedValue(true), defaultMessage: jest.fn() },
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
    mockImportUsersIdsUseCase.execute.mockResolvedValue({
      message: 'Users IDs imported successfully',
      importedCount: 1,
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /sts/ux-research/import-users-ids', () => {
    const validBody = {
      ux_research_name: 'Test UX Research',
      users_ids: ['user-1', 'user-2', 'user-3'],
      user_data: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };

    it('should import users IDs successfully with valid data', async () => {
      mockImportUsersIdsUseCase.execute.mockImplementation(async () => ({
        message: 'Users IDs imported successfully',
        importedCount: validBody.users_ids.length,
      }));

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send(validBody);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.message).toContain('Users IDs imported successfully');
      expect(response.body.importedCount).toBe(validBody.users_ids.length);
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 when UX research name is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.ux_research_name;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Name is required');
    });

    it('should return 400 when UX research name is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          ux_research_name: '',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Name is required');
    });

    it('should return 400 when users IDs array is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.users_ids;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Users IDs is required');
    });

    it('should return 400 when users IDs is not an array', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          users_ids: 'not-an-array',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Users IDs must be an array');
    });

    it('should return 400 when users IDs array is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          users_ids: [],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Users IDs is required');
    });

    it('should return 400 when user data is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.user_data;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data is required');
    });

    it('should return 400 when user data is not an object', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          user_data: 'invalid-string',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data must be an object');
    });

    it('should return 400 when UX research is not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
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

    it('should work with single user ID', async () => {
      const body = {
        ux_research_name: 'Test UX Research',
        users_ids: ['user-single'],
        user_data: {
          userId: 'user-2',
          email: 'user2@example.com',
          name: 'Second User',
        },
      };

      mockImportUsersIdsUseCase.execute.mockImplementation(async () => ({
        message: 'Users IDs imported successfully',
        importedCount: 1,
      }));

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send(body);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.message).toContain('Users IDs imported successfully');
    });

    it('should return 400 when users IDs contains non-string values', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          users_ids: ['user-1', 123, true],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when users IDs contains empty strings', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          users_ids: ['user-1', '', 'user-3'],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/import-users-ids')
        .set('Authorization', 'wrong-token')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
