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
import { SimpleTokenGuard } from 'src/modules/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';

describe('StsUXResearchController - Delete UX Research Response (e2e)', () => {
  let app: INestApplication;

  const mockDeleteUXResearchResponseUseCase = {
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
        { provide: CreateUXResearchResponseUseCase, useValue: {} },
        { provide: DeleteUXResearchResponseUseCase, useValue: mockDeleteUXResearchResponseUseCase },
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

  describe('POST /sts/ux-research/delete-ux-research-response', () => {
    const validBody = {
      ux_research_response_id: 'response-uuid-1',
      user_data: {
        userId: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
      },
    };

    it('should delete UX research response (201 Created)', async () => {
      const mockResult = {
        id: 'response-uuid-1',
        uxResearchId: 'ux-research-1',
        userId: 'user-123',
        companyId: 'company-456',
        responseDate: '2024-01-01T00:00:00.000Z',
        deleted: true,
      };
      mockDeleteUXResearchResponseUseCase.execute.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .delete('/v1/sts/ux-research/delete-ux-research-response')
        .set('Authorization', API_KEY)
        .send(validBody);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(mockResult);
      expect(response.body.deleted).toBe(true);
      expect(mockDeleteUXResearchResponseUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          uxResponseId: validBody.ux_research_response_id,
          userData: validBody.user_data,
        }),
      );
    });

    it('should return 400 if ux_research_response_id is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.ux_research_response_id;

      const response = await request(app.getHttpServer())
        .delete('/v1/sts/ux-research/delete-ux-research-response')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('UX Research Name is required');
    });

    it('should return 400 if ux_research_response_id is empty', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/sts/ux-research/delete-ux-research-response')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          ux_research_response_id: '',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('UX Research Name is required');
    });

    it('should return 400 if user_data is missing', async () => {
      const invalidBody = { ...validBody } as Record<string, unknown>;
      delete invalidBody.user_data;

      const response = await request(app.getHttpServer())
        .delete('/v1/sts/ux-research/delete-ux-research-response')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data is required');
    });

    it('should return 400 if user_data is not an object', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/sts/ux-research/delete-ux-research-response')
        .set('Authorization', API_KEY)
        .send({
          ...validBody,
          user_data: 'not-object',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User data must be an object');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/sts/ux-research/delete-ux-research-response')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/sts/ux-research/delete-ux-research-response')
        .set('Authorization', 'wrong-token')
        .send(validBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
