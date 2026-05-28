/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { INestApplication, HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StsFeatureFlagController } from '../../../../src/modules/feature-flag/sts-feature-flag.controller';
import { SimpleTokenGuard } from '../../../../src/modules/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';
import { CreateFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/create-feature-flag.use-case';
import { ImportUsersIdsUseCase } from '../../../../src/modules/feature-flag/application/use-cases/import-users-ids.use-case';
import { ImportCompaniesIdsUseCase } from '../../../../src/modules/feature-flag/application/use-cases/import-companies-ids.use-case';
import { DeleteFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { SearchFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/search-feature-flag.use-case';
import { CheckFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { DisableFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/disable-feature-flag.use-case';
import { ActiveFeatureFlagUseCase } from '../../../../src/modules/feature-flag/application/use-cases/active-feature-flag.use-case';
import { FeatureFlagRepository } from '../../../../src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagExistsConstraint } from '../../../../src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';

describe('StsFeatureFlagController Disable (E2E)', () => {
    let app: INestApplication;

    const mockDisableFeatureFlagUseCase = {
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
                { provide: CreateFeatureFlagUseCase, useValue: {} },
                { provide: ImportCompaniesIdsUseCase, useValue: {} },
                { provide: ImportUsersIdsUseCase, useValue: {} },
                { provide: DeleteFeatureFlagUseCase, useValue: {} },
                { provide: SearchFeatureFlagUseCase, useValue: {} },
                { provide: CheckFeatureFlagUseCase, useValue: {} },
                {
                    provide: DisableFeatureFlagUseCase,
                    useValue: mockDisableFeatureFlagUseCase,
                },
                { provide: ActiveFeatureFlagUseCase, useValue: {} },
                {
                    provide: FeatureFlagRepository,
                    useValue: mockFeatureFlagRepository,
                },
                FeatureFlagExistsConstraint,
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

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('PATCH /v1/sts/feature-flag/disable', () => {
        const disableFeatureFlagDto = {
            feature_flag_name: 'test-feature-flag',
            user_data: {
                userId: 'user-123',
                email: 'test@test.com',
                name: 'Test User',
            },
        };

        it('should disable a feature flag (200 OK)', async () => {
            const mockResult = {
                id: 'flag-id',
                name: 'test-feature-flag',
                isActive: false,
            };

            mockFeatureFlagRepository.findByName.mockResolvedValue({
                id: 'some-id',
                name: 'test-feature-flag',
            });
            mockDisableFeatureFlagUseCase.execute.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .patch('/v1/sts/feature-flag/disable')
                .set('Authorization', API_KEY)
                .send(disableFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toEqual(mockResult);
            expect(mockDisableFeatureFlagUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    featureFlagName: disableFeatureFlagDto.feature_flag_name,
                    userData: expect.any(Object),
                }),
            );
        });

        it('should return 400 Bad Request if feature flag does not exist', async () => {
            mockFeatureFlagRepository.findByName.mockResolvedValue(null);

            const response = await request(app.getHttpServer())
                .patch('/v1/sts/feature-flag/disable')
                .set('Authorization', API_KEY)
                .send(disableFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message[0]).toContain('Feature Flag not found');
        });

        it('should return 400 Bad Request if feature_flag_name is missing', async () => {
            const { feature_flag_name, ...invalidDto } = disableFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .patch('/v1/sts/feature-flag/disable')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Name is required');
        });

        it('should return 400 Bad Request if user_data is missing', async () => {
            const { user_data, ...invalidDto } = disableFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .patch('/v1/sts/feature-flag/disable')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('User data is required');
        });

        it('should return 401 Unauthorized if token is missing', async () => {
            const response = await request(app.getHttpServer())
                .patch('/v1/sts/feature-flag/disable')
                .send(disableFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('should return 401 Unauthorized if token is invalid', async () => {
            const response = await request(app.getHttpServer())
                .patch('/v1/sts/feature-flag/disable')
                .set('Authorization', 'wrong-token')
                .send(disableFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });
});
