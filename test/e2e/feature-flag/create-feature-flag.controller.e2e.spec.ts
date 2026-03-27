/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CreateFeatureFlagDto } from '../../../src/feature-flag/application/dto/create-feature-flag.dto';
import { FeatureFlagController } from '../../../src/feature-flag/feature-flag.controller';
import { CreateFeatureFlagUseCase } from '../../../src/feature-flag/application/use-cases/create-feature-flag.use-case';
import { ImportCompaniesIdsUseCase } from '../../../src/feature-flag/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from '../../../src/feature-flag/application/use-cases/import-users-ids.use-case';
import { FeatureFlagType } from '../../../src/feature-flag/domain/enums/feature-flag-type.enum';
import { SimpleTokenGuard } from '../../../src/common/guards/simple-token.guard';
import { FeatureFlagRepository } from '../../../src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagExistsConstraint } from '../../../src/feature-flag/infraestructure/validators/feature-flag-exists.validator';

describe('FeatureFlagController', () => {
  let app: INestApplication;
  let createFeatureFlagDto: CreateFeatureFlagDto;

  const mockCreateFeatureFlagUseCase = {
    execute: jest.fn(),
  };

  const mockImportCompaniesIdsUseCase = {
    execute: jest.fn(),
  };

  const mockImportUsersIdsUseCase = {
    execute: jest.fn(),
  };

  const mockFeatureFlagRepository = {
    findByName: jest.fn(),
  };

  const API_KEY = 'test-api-key';

  beforeAll(async () => {
    process.env.API_KEY = API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagController],
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
        FeatureFlagExistsConstraint,
        SimpleTokenGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    createFeatureFlagDto = {
      name: 'test-feature-flag',
      percentage: 50,
      type: FeatureFlagType.PERCENTAGE,
      user_data: {
        userId: 'user-id',
        email: 'user@example.com',
        name: 'User Name',
      },
    } as any;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /feature-flags/create', () => {
    it('should create a new feature flag (201 Created)', async () => {
      const mockResult = {
        id: 'flag-id',
        nameVersion: `${createFeatureFlagDto.name}-1`,
        isActive: true,
        percentage: createFeatureFlagDto.percentage,
        type: createFeatureFlagDto.type,
      };
      mockCreateFeatureFlagUseCase.execute.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .post('/feature-flags/create')
        .set('Authorization', API_KEY)
        .send(createFeatureFlagDto);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(mockResult);
      expect(mockCreateFeatureFlagUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createFeatureFlagDto.name,
          percentage: createFeatureFlagDto.percentage,
          type: createFeatureFlagDto.type,
          userData: expect.any(Object),
        }),
      );
    });

    it('should return 401 Unauthorized if token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/feature-flags/create')
        .send(createFeatureFlagDto);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe('Token not found');
    });

    it('should return 401 Unauthorized if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/feature-flags/create')
        .set('Authorization', 'wrong-token')
        .send(createFeatureFlagDto);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Validation Tests', () => {
    it('should return 400 Bad Request if name is missing', async () => {
      const { name, ...invalidDto } = createFeatureFlagDto;
      const response = await request(app.getHttpServer())
        .post('/feature-flags/create')
        .set('Authorization', API_KEY)
        .send(invalidDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Name is required');
    });

    it('should return 400 Bad Request if type is missing', async () => {
      const { type, ...invalidDto } = createFeatureFlagDto;
      const response = await request(app.getHttpServer())
        .post('/feature-flags/create')
        .set('Authorization', API_KEY)
        .send(invalidDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Type is required');
    });

    it('should return 400 Bad Request if userData is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/feature-flags/create')
        .set('Authorization', API_KEY)
        .send({
          name: 'test',
          type: FeatureFlagType.PERCENTAGE,
          percentage: 50,
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 500 Internal Server Error if UseCase throws', async () => {
      mockCreateFeatureFlagUseCase.execute.mockRejectedValue(
        new Error('Internal DB error'),
      );

      const response = await request(app.getHttpServer())
        .post('/feature-flags/create')
        .set('Authorization', API_KEY)
        .send(createFeatureFlagDto);

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
