/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  createFeatureFlagViaSts,
  defaultUserData,
  deleteFeatureFlagViaSts,
  searchFeatureFlagViaSts,
} from '../helpers/feature-flag.helper';

describe('DELETE delete (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('DELETE /v1/sts/feature-flag/delete', () => {
    it('deve soft-deletar uma feature flag existente (200)', async () => {
      const name = `delete-flag-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await deleteFeatureFlagViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(name);
      expect(response.body.data.deleted).toBe(true);
    });

    it('deve remover a flag da busca após o delete', async () => {
      const name = `delete-search-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name,
        type: FeatureFlagType.PERCENTAGE,
        percentage: 100,
      }).expect(HttpStatus.CREATED);

      await deleteFeatureFlagViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const search = await searchFeatureFlagViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(search.body.data.items).toHaveLength(0);
      expect(search.body.data.meta.totalItems).toBe(0);
    });

    it('deve retornar 400 quando a feature flag não existe', async () => {
      const response = await deleteFeatureFlagViaSts(
        app,
        apiKey,
        'flag-que-nao-existe-delete',
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('Feature Flag not found');
    });

    it('deve retornar 400 quando name está ausente', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/sts/feature-flag/delete')
        .set('Authorization', apiKey)
        .send({ user_data: defaultUserData });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message).toContain(
        'Feature Flag Name is required',
      );
    });

    it('deve retornar 401 sem API key', async () => {
      const response = await request(app.getHttpServer())
        .delete('/v1/sts/feature-flag/delete')
        .send({ name: 'qualquer', user_data: defaultUserData });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
