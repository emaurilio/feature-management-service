/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  createFeatureFlagViaSts,
  defaultUserData,
  searchFeatureFlagViaSts,
} from '../helpers/feature-flag.helper';

describe('POST search (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/feature-flag/search', () => {
    it('deve retornar flags que correspondem ao filtro de nome (200)', async () => {
      const prefix = `search-prefix-${Date.now()}`;
      const flagName = `${prefix}-exact`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.PERCENTAGE,
        percentage: 30,
      }).expect(HttpStatus.CREATED);

      const response = await searchFeatureFlagViaSts(app, apiKey, prefix).expect(
        HttpStatus.OK,
      );

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.items.some(
          (item: { name: string }) => item.name === flagName,
        ),
      ).toBe(true);
      expect(response.body.data.meta.totalItems).toBeGreaterThanOrEqual(1);
      expect(response.body.data.meta.currentPage).toBe(1);
    });

    it('deve retornar lista vazia quando nenhuma flag corresponde', async () => {
      const response = await searchFeatureFlagViaSts(
        app,
        apiKey,
        `nao-existe-${Date.now()}`,
      ).expect(HttpStatus.OK);

      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.meta.totalItems).toBe(0);
    });

    it('deve retornar 400 quando name está ausente', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/search')
        .set('Authorization', apiKey)
        .send({ user_data: defaultUserData });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message).toContain(
        'Feature Flag Name is required',
      );
    });

    it('deve retornar 401 sem API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/feature-flag/search')
        .send({ name: 'qualquer', user_data: defaultUserData });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
