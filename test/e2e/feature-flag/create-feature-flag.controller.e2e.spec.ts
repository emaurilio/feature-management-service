/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CreateFeatureFlagDto } from 'src/FeatureFlagModule/application/dto/CreateFeatureFlag.dto';
import { FeatureFlagController } from 'src/FeatureFlagModule/feature-flag.controller';
import { CreateFeatureFlagUseCase } from 'src/FeatureFlagModule/application/usecase/create-feature-flag.use-case';
import { FeatureFlagType } from 'src/FeatureFlagModule/domain/enums/feature-flag-type.enum';
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';

describe('CreateFeatureFlagController', () => {
  let app: INestApplication;
  let createFeatureFlagDto: CreateFeatureFlagDto;

  const mockCreateFeatureFlagUseCase = {
    execute: jest.fn(),
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
        SimpleTokenGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    createFeatureFlagDto = {
      name: 'test-feature-flag',
      percentage: 50,
      type: FeatureFlagType.PERCENTAGE,
      userData: {
        userId: 'user-id',
        email: 'user@example.com',
        name: 'User Name',
      },
    };
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

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
    expect(response.body).toHaveProperty('id');
    expect(response.body.nameVersion).toBe(`${createFeatureFlagDto.name}-1`);
    expect(response.body.isActive).toBe(true);
    expect(response.body.percentage).toBe(createFeatureFlagDto.percentage);
    expect(response.body.type).toBe(createFeatureFlagDto.type);
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
    const { userData, ...invalidDto } = createFeatureFlagDto;
    const response = await request(app.getHttpServer())
      .post('/feature-flags/create')
      .set('Authorization', API_KEY)
      .send(invalidDto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toContain('User data is required');
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
