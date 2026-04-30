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
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';

describe('StsUXResearchController - Check UX Research (e2e)', () => {
  let app: INestApplication;

  const mockCheckUXResearchUseCase = {
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
        { provide: CheckUXResearchUseCase, useValue: mockCheckUXResearchUseCase },
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

  describe('POST /sts/ux-research/check-ux-research', () => {
    const checkBody = {
      name: 'test-ux-research',
      user_id: 'user-123',
      company_id: 'company-456',
    };

    it('should check UX research successfully (201 Created)', async () => {
      mockCheckUXResearchUseCase.execute.mockImplementation(async () => true);

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', API_KEY)
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(JSON.parse(response.text)).toBe(true);
      expect(mockCheckUXResearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: checkBody.name,
          userId: checkBody.user_id,
          companyId: checkBody.company_id,
        }),
      );
    });

    it('should return 201 with false when use case resolves false', async () => {
      mockCheckUXResearchUseCase.execute.mockImplementation(async () => false);

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', API_KEY)
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(JSON.parse(response.text)).toBe(false);
    });

    it('should accept only user_id', async () => {
      mockCheckUXResearchUseCase.execute.mockImplementation(async () => true);
      const body = {
        name: 'test-ux-research',
        user_id: 'user-only',
      };

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', API_KEY)
        .send(body);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(mockCheckUXResearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: body.name,
          userId: body.user_id,
        }),
      );
    });

    it('should accept only company_id', async () => {
      mockCheckUXResearchUseCase.execute.mockImplementation(async () => true);
      const body = {
        name: 'test-ux-research',
        company_id: 'company-only',
      };

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', API_KEY)
        .send(body);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(mockCheckUXResearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: body.name,
          companyId: body.company_id,
        }),
      );
    });

    it('should return 400 if name is missing', async () => {
      const invalidBody = { ...checkBody };
      delete (invalidBody as { name?: string }).name;

      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', API_KEY)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('UX Research Name is required');
    });

    it('should return 400 if user_id is not a string', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', API_KEY)
        .send({ ...checkBody, user_id: 123 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User id must be a string');
    });

    it('should return 400 if company_id is not a string', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', API_KEY)
        .send({ ...checkBody, company_id: 456 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Company id must be a string');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/ux-research/check-ux-research')
        .set('Authorization', 'wrong-token')
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
