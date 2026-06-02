/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  activeFeatureFlagViaSts,
  checkFeatureFlagViaSts,
  createFeatureFlagViaSts,
  disableFeatureFlagViaSts,
  importUsersViaSts,
} from '../helpers/feature-flag.helper';

describe('PATCH active (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('PATCH /v1/sts/feature-flag/active', () => {
    it('deve reativar uma feature flag desativada (200)', async () => {
      const name = `active-flag-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      await disableFeatureFlagViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const response = await activeFeatureFlagViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.isActive).toBe(true);
    });

    it('deve fazer check voltar a true após reativar', async () => {
      const name = `active-check-${Date.now()}`;
      const userId = `user-active-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      await importUsersViaSts(app, apiKey, name, [userId]).expect(
        HttpStatus.CREATED,
      );

      await disableFeatureFlagViaSts(app, apiKey, name).expect(HttpStatus.OK);
      await activeFeatureFlagViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const check = await checkFeatureFlagViaSts(app, apiKey, {
        name,
        userId,
      }).expect(HttpStatus.OK);

      expect(check.body.data.checkFeatureFlag).toBe(true);
    });

    it('deve retornar 400 quando a feature flag não existe', async () => {
      const response = await activeFeatureFlagViaSts(
        app,
        apiKey,
        'flag-inexistente-active',
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('Feature Flag not found');
    });
  });
});
