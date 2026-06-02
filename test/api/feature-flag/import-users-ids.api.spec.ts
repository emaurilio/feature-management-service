/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  createFeatureFlagViaSts,
  defaultUserData,
  importUsersViaSts,
} from '../helpers/feature-flag.helper';

describe('POST import-users-ids (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/feature-flag/import-users-ids', () => {
    it('deve importar usuários para uma flag existente (201)', async () => {
      const flagName = `import-users-${Date.now()}`;
      const users = [`user-a-${Date.now()}`, `user-b-${Date.now()}`];

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await importUsersViaSts(app, apiKey, flagName, users).expect(
        HttpStatus.CREATED,
      );

      expect(response.body.data.featureFlagName).toBe(flagName);
      expect(response.body.data.totalReceived).toBe(2);
      expect(response.body.data.imported).toBe(2);
      expect(response.body.data.skipped).toBe(0);
    });

    it('deve ignorar usuários já importados na reimportação', async () => {
      const flagName = `import-users-dup-${Date.now()}`;
      const userId = `user-dup-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      await importUsersViaSts(app, apiKey, flagName, [userId]).expect(
        HttpStatus.CREATED,
      );

      const response = await importUsersViaSts(app, apiKey, flagName, [
        userId,
        `user-novo-${Date.now()}`,
      ]).expect(HttpStatus.CREATED);

      expect(response.body.data.imported).toBe(1);
      expect(response.body.data.skipped).toBe(1);
      expect(response.body.data.totalReceived).toBe(2);
    });

    it('deve retornar 400 quando a feature flag não existe', async () => {
      const response = await importUsersViaSts(app, apiKey, 'flag-inexistente', [
        'user-1',
      ]);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('Feature Flag not found');
    });

    it('deve retornar 401 sem API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/import-users-ids')
        .send({
          feature_flag_name: 'qualquer',
          users_ids: ['user-1'],
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
