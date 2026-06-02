/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  checkFeatureFlagViaSts,
  createFeatureFlagViaSts,
  defaultUserData,
  disableFeatureFlagViaSts,
  importUsersViaSts,
} from '../helpers/feature-flag.helper';

describe('PATCH disable (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('PATCH /v1/sts/feature-flag/disable', () => {
    it('deve desativar uma feature flag (200)', async () => {
      const name = `disable-flag-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await disableFeatureFlagViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.isActive).toBe(false);
    });

    it('deve fazer check retornar false após disable', async () => {
      const name = `disable-check-${Date.now()}`;
      const userId = `user-disable-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      await importUsersViaSts(app, apiKey, name, [userId]).expect(
        HttpStatus.CREATED,
      );

      await disableFeatureFlagViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const check = await checkFeatureFlagViaSts(app, apiKey, {
        name,
        userId,
      }).expect(HttpStatus.OK);

      expect(check.body.data.checkFeatureFlag).toBe(false);
    });

    it('deve retornar 400 quando a feature flag não existe', async () => {
      const response = await disableFeatureFlagViaSts(
        app,
        apiKey,
        'flag-inexistente-disable',
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('Feature Flag not found');
    });

    it('deve retornar 401 sem API key', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/sts/feature-flag/disable')
        .send({
          feature_flag_name: 'qualquer',
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
