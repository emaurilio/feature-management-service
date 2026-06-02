/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import { defaultUserData } from '../helpers/feature-flag.helper';
import { createUxResearchViaSts } from '../helpers/ux-research.helper';

describe('POST create UX Research (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/ux-research/create', () => {
    it('deve criar um UX research do tipo user (201)', async () => {
      const name = `ux-create-${Date.now()}`;

      const response = await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      expect(response.body.data.name).toBe(name);
      expect(response.body.data.version).toBe(1);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.type).toBe(UXResearchType.USER);
    });

    it('deve incrementar versão ao recriar com o mesmo nome', async () => {
      const name = `ux-version-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      expect(response.body.data.version).toBe(2);
    });

    it('deve retornar 400 quando percentage é obrigatório e está ausente', async () => {
      const response = await createUxResearchViaSts(app, apiKey, {
        name: `ux-no-pct-${Date.now()}`,
        type: UXResearchType.PERCENTAGE,
      });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message).toContain(
        'Percentage is required for this ux research type',
      );
    });

    it('deve retornar 401 sem API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/ux-research/create')
        .send({
          name: 'ux-sem-auth',
          type: UXResearchType.USER,
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
