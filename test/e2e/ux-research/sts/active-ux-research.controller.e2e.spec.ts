import request from 'supertest';
import { HttpStatus, INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
import { UXResearchExistsConstraint } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';
import { SimpleTokenGuard } from 'src/modules/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';

describe('StsUXResearchController - Active (e2e)', () => {
  let app: INestApplication;

  const mockActiveUXResearchUseCase = {
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
        { provide: ActiveUXResearchUseCase, useValue: mockActiveUXResearchUseCase },
        { provide: GetUXResearchResponseUseCase, useValue: {} },
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
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
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

  describe('PATCH /v1/sts/ux-research/active', () => {
    const activeBody = {
      ux_research_name: 'Test UX Research',
      user_data: {
        userId: 'user-123',
        email: 'test@test.com',
        name: 'Test User',
      },
    };

    it('should activate UX research (200 OK)', async () => {
      const mockResult = {
        id: 'ux-research-id',
        isActive: true,
      };

      mockActiveUXResearchUseCase.execute.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .set('Authorization', API_KEY)
        .send(activeBody);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(mockResult);
      expect(mockActiveUXResearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          uxResearchName: activeBody.ux_research_name,
          userData: expect.any(Object),
        }),
      );
    });

    it('should return 400 if UX research does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .set('Authorization', API_KEY)
        .send({
          ...activeBody,
          ux_research_name: 'Non-existent UX Research',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('UX Research not found')]),
      );
    });

    it('should return 400 if ux_research_name is missing', async () => {
      const { ux_research_name: _name, ...invalidBody } = activeBody;

      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Name is required');
    });

    it('should return 400 if ux_research_name is empty', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .set('Authorization', API_KEY)
        .send({
          ...activeBody,
          ux_research_name: '',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Name is required');
    });

    it('should return 400 if user_data is missing', async () => {
      const { user_data: _user, ...invalidBody } = activeBody;

      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data is required');
    });

    it('should return 400 if user_data is not an object', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .set('Authorization', API_KEY)
        .send({
          ...activeBody,
          user_data: 'not-an-object',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data must be an object');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .send(activeBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/active')
        .set('Authorization', 'wrong-token')
        .send(activeBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
