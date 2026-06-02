/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import { defaultUserData } from '../helpers/feature-flag.helper';
import {
  checkUxResearchViaSts,
  createUxResearchViaSts,
  disableUxResearchViaSts,
  importUxUsersViaSts,
} from '../helpers/ux-research.helper';

describe('PATCH disable UX Research (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('PATCH /v1/sts/ux-research/disable', () => {
    it('deve desativar um UX research (200)', async () => {
      const name = `ux-disable-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await disableUxResearchViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.isActive).toBe(false);
    });

    it('deve fazer check retornar false após disable', async () => {
      const name = `ux-disable-check-${Date.now()}`;
      const userId = `user-ux-disable-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await importUxUsersViaSts(app, apiKey, name, [userId]).expect(
        HttpStatus.CREATED,
      );

      await disableUxResearchViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const check = await checkUxResearchViaSts(app, apiKey, {
        name,
        userId,
      }).expect(HttpStatus.OK);

      expect(check.body.data.checkUxResearch).toBe(false);
    });

    it('deve retornar 400 quando o UX research não existe', async () => {
      const response = await disableUxResearchViaSts(
        app,
        apiKey,
        'ux-inexistente-disable',
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('UX Research not found');
    });

    it('deve retornar 401 sem API key', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/sts/ux-research/disable')
        .send({
          ux_research_name: 'qualquer',
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
