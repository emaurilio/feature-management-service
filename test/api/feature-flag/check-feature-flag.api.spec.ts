/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  createFeatureFlagViaSts,
  disableFeatureFlagViaSts,
  expectedPercentageResult,
  importCompaniesViaSts,
  importUsersViaSts,
} from '../helpers/feature-flag.helper';

describe('POST check-feature-flag (API real)', () => {
  let app: INestApplication;
  let apiKey: string;
  let bearerToken: string;

  beforeAll(async () => {
    ({ app, apiKey, bearerToken } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/feature-flag/check-feature-flag (JWT)', () => {
    it('deve retornar 401 quando o token JWT não é enviado', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .send({
          name: 'qualquer-flag',
          user_id: 'user-1',
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar 400 quando name está ausente', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({ user_id: 'user-1' });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(
        'Feature Flag Name is required',
      );
    });

    it('deve retornar 400 quando user_id e company_id estão ausentes', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({ name: 'flag-inexistente' });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(
        'User ID or Company ID is required',
      );
    });

    it('deve retornar 404 quando a feature flag não existe', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({
          name: 'flag-que-nao-existe-api-test',
          user_id: 'user-1',
        });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    it('deve retornar checkFeatureFlag false quando a flag está inativa', async () => {
      const flagName = `inactive-flag-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      await disableFeatureFlagViaSts(app, apiKey, flagName).expect(
        HttpStatus.OK,
      );

      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({
          name: flagName,
          user_id: 'user-qualquer',
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(flagName);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.data.checkFeatureFlag).toBe(false);
    });

    it('deve retornar true para usuário importado (tipo user)', async () => {
      const flagName = `user-flag-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      await importUsersViaSts(app, apiKey, flagName, [userId]).expect(
        HttpStatus.CREATED,
      );

      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({
          name: flagName,
          user_id: userId,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.checkFeatureFlag).toBe(true);
      expect(response.body.data.type).toBe(FeatureFlagType.USER);
    });

    it('deve retornar false para usuário não importado (tipo user)', async () => {
      const flagName = `user-flag-missing-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({
          name: flagName,
          user_id: 'usuario-nao-importado',
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.checkFeatureFlag).toBe(false);
    });

    it('deve calcular corretamente o rollout por percentual (tipo percentage)', async () => {
      const flagName = `percentage-flag-${Date.now()}`;
      const userId = `user-pct-${Date.now()}`;
      const percentage = 75;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.PERCENTAGE,
        percentage,
      }).expect(HttpStatus.CREATED);

      const expected = expectedPercentageResult(userId, flagName, 1, percentage);

      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({
          name: flagName,
          user_id: userId,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.checkFeatureFlag).toBe(expected);
      expect(response.body.data.percentage).toBe(percentage);
    });

    it('deve retornar true para empresa importada (tipo company)', async () => {
      const flagName = `company-flag-${Date.now()}`;
      const companyId = `company-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.COMPANY,
      }).expect(HttpStatus.CREATED);

      await importCompaniesViaSts(app, apiKey, flagName, [companyId]).expect(
        HttpStatus.CREATED,
      );

      const response = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({
          name: flagName,
          company_id: companyId,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.checkFeatureFlag).toBe(true);
      expect(response.body.data.type).toBe(FeatureFlagType.COMPANY);
    });
  });

  describe('POST /v1/sts/feature-flag/check-feature-flag (API Key)', () => {
    it('deve retornar 401 quando a API key não é enviada', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/check-feature-flag')
        .send({
          name: 'qualquer',
          user_id: 'user-1',
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar o mesmo resultado do endpoint público para a mesma flag', async () => {
      const flagName = `sts-check-${Date.now()}`;
      const userId = `user-sts-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      await importUsersViaSts(app, apiKey, flagName, [userId]).expect(
        HttpStatus.CREATED,
      );

      const publicResponse = await request(app.getHttpServer())
        .post('/v1/feature-flag/check-feature-flag')
        .set('Authorization', bearerToken)
        .send({ name: flagName, user_id: userId });

      const stsResponse = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/check-feature-flag')
        .set('Authorization', apiKey)
        .send({ name: flagName, user_id: userId });

      expect(publicResponse.status).toBe(HttpStatus.OK);
      expect(stsResponse.status).toBe(HttpStatus.OK);
      expect(stsResponse.body.data.checkFeatureFlag).toBe(
        publicResponse.body.data.checkFeatureFlag,
      );
      expect(stsResponse.body.data.id).toBe(publicResponse.body.data.id);
    });
  });
});
