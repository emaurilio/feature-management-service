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

describe('StsFeatureFlagController Delete (E2E)', () => {
    let app: INestApplication;

    const mockDeleteFeatureFlagUseCase = {
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
                {
                    provide: DeleteFeatureFlagUseCase,
                    useValue: mockDeleteFeatureFlagUseCase,
                },
                { provide: SearchFeatureFlagUseCase, useValue: {} },
                { provide: CheckFeatureFlagUseCase, useValue: {} },
                { provide: DisableFeatureFlagUseCase, useValue: {} },
                { provide: ActiveFeatureFlagUseCase, useValue: {} },
                {
                    provide: 'FeatureFlagExistsConstraint',
                    useValue: { validate: jest.fn().mockResolvedValue(true) },
                },
                {
                    provide: require('../../../../src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator').FeatureFlagExistsConstraint,
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

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('POST /sts/feature-flags/delete', () => {
        const deleteFeatureFlagDto = {
            name: 'test-feature-flag',
            user_data: {
                userId: 'user-123',
                email: 'test@test.com',
                name: 'Test User',
            },
        };

        it('should delete a feature flag (201 Created)', async () => {
            mockDeleteFeatureFlagUseCase.execute.mockResolvedValue(true);

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/delete')
                .set('Authorization', API_KEY)
                .send(deleteFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.text).toBe('true');
            expect(mockDeleteFeatureFlagUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: deleteFeatureFlagDto.name,
                    userData: expect.any(Object),
                }),
            );
        });

        it('should return 400 Bad Request if name is missing', async () => {
            const { name, ...invalidDto } = deleteFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/delete')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Feature Flag Name is required');
        });

        it('should return 400 Bad Request if user_data is missing', async () => {
            const { user_data, ...invalidDto } = deleteFeatureFlagDto;

            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/delete')
                .set('Authorization', API_KEY)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('User data is required');
        });

        it('should return 401 Unauthorized if token is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/delete')
                .send(deleteFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('should return 401 Unauthorized if token is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/sts/feature-flags/delete')
                .set('Authorization', 'wrong-token')
                .send(deleteFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });
});
