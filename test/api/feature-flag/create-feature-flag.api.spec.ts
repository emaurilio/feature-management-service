/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import { createFeatureFlagViaSts, defaultUserData } from '../helpers/feature-flag.helper';

describe('POST create (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/feature-flag/create', () => {
    it('deve criar uma feature flag do tipo percentage (201)', async () => {
      const name = `create-pct-${Date.now()}`;

      const response = await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.PERCENTAGE,
        percentage: 50,
      }).expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(name);
      expect(response.body.data.nameVersion).toBe(`${name}-1`);
      expect(response.body.data.version).toBe(1);
      expect(response.body.data.percentage).toBe(50);
      expect(response.body.data.type).toBe(FeatureFlagType.PERCENTAGE);
      expect(response.body.data.isActive).toBe(true);
    });

    it('deve criar uma feature flag do tipo user sem percentage', async () => {
      const name = `create-user-${Date.now()}`;

      const response = await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      expect(response.body.data.type).toBe(FeatureFlagType.USER);
      expect(response.body.data.percentage).toBe(0);
    });

    it('deve incrementar a versão ao recriar uma flag com o mesmo nome', async () => {
      const name = `create-version-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      expect(response.body.data.version).toBe(2);
      expect(response.body.data.nameVersion).toBe(`${name}-2`);
    });

    it('deve retornar 400 quando percentage é obrigatório e está ausente', async () => {
      const response = await createFeatureFlagViaSts(app, apiKey, {
        name: `create-no-pct-${Date.now()}`,
        type: FeatureFlagType.PERCENTAGE,
      });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message).toContain(
        'Percentage is required for this feature flag type',
      );
    });

    it('deve retornar 400 quando name está ausente', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/create')
        .set('Authorization', apiKey)
        .send({
          type: FeatureFlagType.USER,
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message).toContain(
        'Feature Flag Name is required',
      );
    });

    it('deve retornar 400 quando type está ausente', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/create')
        .set('Authorization', apiKey)
        .send({
          name: 'flag-sem-type',
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message).toContain('Type is required');
    });

    it('deve retornar 401 quando a API key não é enviada', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/create')
        .send({
          name: 'flag-sem-auth',
          type: FeatureFlagType.USER,
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar 401 quando a API key é inválida', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/create')
        .set('Authorization', 'chave-invalida')
        .send({
          name: 'flag-auth-invalida',
          type: FeatureFlagType.USER,
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
