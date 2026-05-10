/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
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

describe('StsFeatureFlagController Search (E2E)', () => {
    let app: INestApplication;

    const mockSearchFeatureFlagUseCase = {
        execute: jest.fn(),
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
                {
                    provide: SearchFeatureFlagUseCase,
                    useValue: mockSearchFeatureFlagUseCase,
                },
                { provide: CheckFeatureFlagUseCase, useValue: {} },
                { provide: DisableFeatureFlagUseCase, useValue: {} },
                { provide: ActiveFeatureFlagUseCase, useValue: {} },
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

    describe('POST /sts/feature-flags/search', () => {
        const searchFeatureFlagDto = {
            name: 'test-feature-flag',
            page: 1,
            user_data: {
                userId: 'user-123',
                email: 'test@test.com',
                name: 'Test User',
            },
        };

        it('should search for feature flags (201 Created)', async () => {
            const mockResult = {
                data: [
                    {
                        id: 'flag-id',
                        name: 'test-feature-flag',
                        percentage: 50,
                        type: 'PERCENTAGE',
                    },
                ],
                total: 1,
            };

            mockSearchFeatureFlagUseCase.execute.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/search')
                .set('Authorization', API_KEY)
                .send(searchFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(mockResult);
            expect(mockSearchFeatureFlagUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: searchFeatureFlagDto.name,
                    page: searchFeatureFlagDto.page,
                    userData: expect.any(Object),
                }),
            );
        });

        it('should return 400 Bad Request if name is missing', async () => {
            const { name, ...invalidDto } = searchFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/search')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Feature Flag Name is required');
        });

        it('should return 400 Bad Request if user_data is missing', async () => {
            const { user_data, ...invalidDto } = searchFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/search')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('User data is required');
        });

        it('should return 401 Unauthorized if token is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/search')
                .send(searchFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('should return 401 Unauthorized if token is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/search')
                .set('Authorization', 'wrong-token')
                .send(searchFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });
});
