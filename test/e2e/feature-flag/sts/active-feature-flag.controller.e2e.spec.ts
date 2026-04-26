/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { StsFeatureFlagController } from '../../../../src/feature-flag/sts-feature-flag.controller';
import { SimpleTokenGuard } from '../../../../src/common/guards/simple-token.guard';
import { useContainer } from 'class-validator';
import { CreateFeatureFlagUseCase } from '../../../../src/feature-flag/application/use-cases/create-feature-flag.use-case';
import { ImportUsersIdsUseCase } from '../../../../src/feature-flag/application/use-cases/import-users-ids.use-case';
import { ImportCompaniesIdsUseCase } from '../../../../src/feature-flag/application/use-cases/import-companies-ids.use-case';
import { DeleteFeatureFlagUseCase } from '../../../../src/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { SearchFeatureFlagUseCase } from '../../../../src/feature-flag/application/use-cases/search-feature-flag.use-case';
import { CheckFeatureFlagUseCase } from '../../../../src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { DisableFeatureFlagUseCase } from '../../../../src/feature-flag/application/use-cases/disable-feature-flag.use-case';
import { ActiveFeatureFlagUseCase } from '../../../../src/feature-flag/application/use-cases/active-feature-flag.use-case';
import { FeatureFlagRepository } from '../../../../src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagExistsConstraint } from '../../../../src/feature-flag/infraestructure/validators/feature-flag-exists.validator';

describe('StsFeatureFlagController Active (E2E)', () => {
    let app: INestApplication;

    const mockActiveFeatureFlagUseCase = {
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
                { provide: DisableFeatureFlagUseCase, useValue: {} },
                {
                    provide: ActiveFeatureFlagUseCase,
                    useValue: mockActiveFeatureFlagUseCase,
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

        useContainer(app, { fallbackOnErrors: true });

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('POST /sts/feature-flags/active', () => {
        // Controller uses DisableFeatureFlagDto which maps exactly to these fields
        const activeFeatureFlagDto = {
            feature_flag_name: 'test-feature-flag',
            user_data: {
                userId: 'user-123',
                email: 'test@test.com',
                name: 'Test User',
            },
        };

        it('should active a feature flag (201 Created)', async () => {
            const mockResult = {
                id: 'flag-id',
                name: 'test-feature-flag',
                isActive: true,
            };

            mockFeatureFlagRepository.findByName.mockResolvedValue({
                id: 'some-id',
                name: 'test-feature-flag',
            });
            mockActiveFeatureFlagUseCase.execute.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/active')
                .set('Authorization', API_KEY)
                .send(activeFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(mockResult);
            expect(mockActiveFeatureFlagUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    featureFlagName: activeFeatureFlagDto.feature_flag_name,
                    userData: expect.any(Object),
                }),
            );
        });

        it('should return 400 Bad Request if feature flag does not exist', async () => {
            mockFeatureFlagRepository.findByName.mockResolvedValue(null);

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/active')
                .set('Authorization', API_KEY)
                .send(activeFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message[0]).toContain('Feature Flag not found');
        });

        it('should return 400 Bad Request if feature_flag_name is missing', async () => {
            const { feature_flag_name, ...invalidDto } = activeFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/active')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Name is required');
        });

        it('should return 400 Bad Request if user_data is missing', async () => {
            const { user_data, ...invalidDto } = activeFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/active')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('User data is required');
        });

        it('should return 401 Unauthorized if token is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/active')
                .send(activeFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('should return 401 Unauthorized if token is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/active')
                .set('Authorization', 'wrong-token')
                .send(activeFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });
});
