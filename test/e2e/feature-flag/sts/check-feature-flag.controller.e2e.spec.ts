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

describe('StsFeatureFlagController CheckFeatureFlag (E2E)', () => {
    let app: INestApplication;

    const mockCheckFeatureFlagUseCase = {
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
                { provide: SearchFeatureFlagUseCase, useValue: {} },
                {
                    provide: CheckFeatureFlagUseCase,
                    useValue: mockCheckFeatureFlagUseCase,
                },
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

    describe('POST /sts/feature-flags/check-feature-flag', () => {
        const checkFeatureFlagDto = {
            name: 'test-feature-flag',
            user_id: 'user-123',
            company_id: 'company-456',
        };

        it('should check feature flag validation successfully (201 Created)', async () => {
            const mockResult = {
                isValid: true,
                message: 'Feature flag is enabled',
            };

            mockCheckFeatureFlagUseCase.execute.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/check-feature-flag')
                .set('Authorization', API_KEY)
                .send(checkFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(mockResult);
            expect(mockCheckFeatureFlagUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: checkFeatureFlagDto.name,
                    userId: checkFeatureFlagDto.user_id,
                    companyId: checkFeatureFlagDto.company_id,
                }),
            );
        });

        it('should return 400 Bad Request if name is missing', async () => {
            const { name, ...invalidDto } = checkFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/check-feature-flag')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Feature Flag Name is required');
        });

        it('should return 400 Bad Request if user_id is not a string', async () => {
            const invalidDto = { ...checkFeatureFlagDto, user_id: 123 };

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/check-feature-flag')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('User id must be a string');
        });

        it('should return 400 Bad Request if company_id is not a string', async () => {
            const invalidDto = { ...checkFeatureFlagDto, company_id: 123 };

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/check-feature-flag')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Company id must be a string');
        });

        it('should return 401 Unauthorized if token is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/check-feature-flag')
                .send(checkFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('should return 401 Unauthorized if token is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/check-feature-flag')
                .set('Authorization', 'wrong-token')
                .send(checkFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });
});
