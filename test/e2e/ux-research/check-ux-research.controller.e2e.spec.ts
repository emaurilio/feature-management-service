import request from 'supertest';
import { HttpStatus, INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UXResearchController } from 'src/modules/ux-research/ux-research.controller';
import { CheckUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research.use-case';
import { JwtAuthGuard } from 'src/modules/common/guards/jwt.guard';
import { JwtService } from 'src/modules/common/auth/services/jwt.service';
import { useContainer } from 'class-validator';

describe('UXResearchController - Check UX Research (e2e)', () => {
  let app: INestApplication;

  const mockCheckUXResearchUseCase = {
    execute: jest.fn(),
  };

  const mockJwtService = {
    verifyTokenAsync: jest.fn(),
  };

  const CHECK_PATH = '/v1/ux-research/check';
  const AUTH_VALID = 'Bearer valid-test-jwt';

  const mockCheckResponse = (checkUxResearch: boolean) => ({
    id: 'ux-research-1',
    name: 'test-ux-research',
    nameVersion: 'test-ux-research-1',
    type: 'percentage',
    percentage: 100,
    version: 1,
    isActive: true,
    checkUxResearch,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UXResearchController],
      providers: [
        { provide: CheckUXResearchUseCase, useValue: mockCheckUXResearchUseCase },
        { provide: JwtService, useValue: mockJwtService },
        JwtAuthGuard,
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
    mockJwtService.verifyTokenAsync.mockResolvedValue({ sub: 'test-user' });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /v1/ux-research/check', () => {
    const checkBody = {
      name: 'test-ux-research',
      user_id: 'user-123',
      company_id: 'company-456',
    };

    it('should check UX research successfully (200 OK)', async () => {
      mockCheckUXResearchUseCase.execute.mockResolvedValue(mockCheckResponse(true));

      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', AUTH_VALID)
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(mockCheckResponse(true));
      expect(response.body.checkUxResearch).toBe(true);
      expect(mockCheckUXResearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: checkBody.name,
          userId: checkBody.user_id,
          companyId: checkBody.company_id,
        }),
      );
    });

    it('should return 200 with false when use case resolves false', async () => {
      mockCheckUXResearchUseCase.execute.mockResolvedValue(mockCheckResponse(false));

      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', AUTH_VALID)
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.checkUxResearch).toBe(false);
    });

    it('should accept only user_id', async () => {
      mockCheckUXResearchUseCase.execute.mockResolvedValue(mockCheckResponse(true));
      const body = {
        name: 'test-ux-research',
        user_id: 'user-only',
      };

      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', AUTH_VALID)
        .send(body);

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockCheckUXResearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: body.name,
          userId: body.user_id,
        }),
      );
    });

    it('should accept only company_id', async () => {
      mockCheckUXResearchUseCase.execute.mockResolvedValue(mockCheckResponse(true));
      const body = {
        name: 'test-ux-research',
        company_id: 'company-only',
      };

      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', AUTH_VALID)
        .send(body);

      expect(response.status).toBe(HttpStatus.OK);
      expect(mockCheckUXResearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: body.name,
          companyId: body.company_id,
        }),
      );
    });

    it('should return 400 if name is missing', async () => {
      const invalidBody = { ...checkBody } as Record<string, unknown>;
      delete invalidBody.name;

      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', AUTH_VALID)
        .send(invalidBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('UX Research Name is required');
    });

    it('should return 400 if user_id is not a string', async () => {
      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', AUTH_VALID)
        .send({ ...checkBody, user_id: 123 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('User id must be a string');
    });

    it('should return 400 if company_id is not a string', async () => {
      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', AUTH_VALID)
        .send({ ...checkBody, company_id: 456 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Company id must be a string');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 if token is invalid', async () => {
      mockJwtService.verifyTokenAsync.mockRejectedValueOnce(new Error('invalid'));

      const response = await request(app.getHttpServer())
        .post(CHECK_PATH)
        .set('Authorization', 'Bearer wrong-token')
        .send(checkBody);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
