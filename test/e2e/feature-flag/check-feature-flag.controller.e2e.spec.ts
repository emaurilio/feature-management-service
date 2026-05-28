/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import {
    INestApplication,
    HttpStatus,
    ValidationPipe,
    VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import { JwtAuthGuard } from 'src/modules/common/guards/jwt.guard';
import { JwtService } from 'src/modules/common/auth/services/jwt.service';
import { ActiveFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/active-feature-flag.use-case';
import { CheckFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { CreateFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/create-feature-flag.use-case';
import { DeleteFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { DisableFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/disable-feature-flag.use-case';
import { ImportCompaniesIdsUseCase } from 'src/modules/feature-flag/application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from 'src/modules/feature-flag/application/use-cases/import-users-ids.use-case';
import { SearchFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/search-feature-flag.use-case';
import { FeatureFlagController } from 'src/modules/feature-flag/feature-flag.controller';

describe('FeatureFlagController CheckFeatureFlag (E2E)', () => {
    let app: INestApplication;

    const mockCheckFeatureFlagUseCase = {
        execute: jest.fn(),
    };

    const mockJwtService = {
        verifyTokenAsync: jest.fn(),
    };

    const VALID_TOKEN = 'valid-jwt-token';
    const BEARER_TOKEN = `Bearer ${VALID_TOKEN}`;

    beforeAll(async () => {

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [FeatureFlagController],
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

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('POST /v1/feature-flag/check-feature-flag', () => {
        const checkFeatureFlagDto = {
            name: 'test-feature-flag',
            user_id: 'user-123',
            company_id: 'company-456',
        };

        it('should check feature flag validation successfully (200 OK)', async () => {
            const mockResult = {
                id: 'flag-id',
                name: 'test-feature-flag',
                nameVersion: 'test-feature-flag-1',
                type: 'percentage',
                percentage: 50,
                version: 1,
                isActive: true,
                checkFeatureFlag: true,
            };

            mockJwtService.verifyTokenAsync.mockResolvedValue(true);
            mockCheckFeatureFlagUseCase.execute.mockResolvedValue(mockResult);

            const response = await request(app.getHttpServer())
                .post('/v1/feature-flag/check-feature-flag')
                .set('Authorization', BEARER_TOKEN)
                .send(checkFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toEqual(mockResult);
            expect(response.body.checkFeatureFlag).toBe(true);
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

            mockJwtService.verifyTokenAsync.mockResolvedValue(true);
            const response = await request(app.getHttpServer())
                .post('/v1/feature-flag/check-feature-flag')
                .set('Authorization', BEARER_TOKEN)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Feature Flag Name is required');
        });

        it('should return 400 Bad Request if user_id is not a string', async () => {
            const invalidDto = { ...checkFeatureFlagDto, user_id: 123 };

            mockJwtService.verifyTokenAsync.mockResolvedValue(true);
            const response = await request(app.getHttpServer())
                .post('/v1/feature-flag/check-feature-flag')
                .set('Authorization', BEARER_TOKEN)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('User id must be a string');
        });

        it('should return 400 Bad Request if company_id is not a string', async () => {
            const invalidDto = { ...checkFeatureFlagDto, company_id: 123 };

            mockJwtService.verifyTokenAsync.mockResolvedValue(true);
            const response = await request(app.getHttpServer())
                .post('/v1/feature-flag/check-feature-flag')
                .set('Authorization', BEARER_TOKEN)
                .send(invalidDto);

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body.message).toContain('Company id must be a string');
        });

        it('should return 401 Unauthorized if token is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/v1/feature-flag/check-feature-flag')
                .send(checkFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('should return 401 Unauthorized if token is invalid', async () => {
            mockJwtService.verifyTokenAsync.mockRejectedValue(new Error('Invalid token'));
            const response = await request(app.getHttpServer())
                .post('/v1/feature-flag/check-feature-flag')
                .set('Authorization', 'Bearer wrong-token')
                .send(checkFeatureFlagDto);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });
});
