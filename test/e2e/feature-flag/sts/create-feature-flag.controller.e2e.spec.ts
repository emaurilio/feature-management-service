/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeatureFlagDto } from '../../../../src/modules/feature-flag/application/dto/create-feature-flag.dto';
import { StsFeatureFlagController } from '../../../../src/modules/feature-flag/sts-feature-flag.controller';
import { CreateFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/create-feature-flag.use-case';
import { ImportCompaniesIdsUseCase } from '../../../../src/modules/feature-flag/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from '../../../../src/modules/feature-flag/application/use-cases/import-users-ids.use-case';
import { FeatureFlagType } from '../../../../src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { SimpleTokenGuard } from '../../../../src/modules/common/guards/simple-token.guard';
import { DeleteFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { SearchFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/search-feature-flag.use-case';
import { CheckFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { DisableFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/disable-feature-flag.use-case';
import { ActiveFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/active-feature-flag.use-case';
import { FeatureFlagRepository } from '../../../../src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagExistsConstraint } from '../../../../src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';

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
      controllers: [StsFeatureFlagController],
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
        { provide: DeleteFeatureFlagUseCase, useValue: {} },
        { provide: SearchFeatureFlagUseCase, useValue: {} },
        { provide: CheckFeatureFlagUseCase, useValue: {} },
        { provide: DisableFeatureFlagUseCase, useValue: {} },
        { provide: ActiveFeatureFlagUseCase, useValue: {} },
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

  describe('POST /feature-flag/create', () => {
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
        .post('/sts/feature-flag/create')
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
        .post('/sts/feature-flag/create')
        .send(createFeatureFlagDto);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe('Token not found');
    });

    it('should return 401 Unauthorized if token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/feature-flag/create')
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
        .post('/sts/feature-flag/create')
        .set('Authorization', API_KEY)
        .send(invalidDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Feature Flag Name is required');
    });

    it('should return 400 Bad Request if type is missing', async () => {
      const { type, ...invalidDto } = createFeatureFlagDto;
      const response = await request(app.getHttpServer())
        .post('/sts/feature-flag/create')
        .set('Authorization', API_KEY)
        .send(invalidDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain('Type is required');
    });

    it('should return 400 Bad Request if userData is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/sts/feature-flag/create')
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
        .post('/sts/feature-flag/create')
        .set('Authorization', API_KEY)
        .send(createFeatureFlagDto);

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
