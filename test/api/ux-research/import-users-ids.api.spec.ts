/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import { defaultUserData } from '../helpers/feature-flag.helper';
import {
  createUxResearchViaSts,
  importUxUsersViaSts,
} from '../helpers/ux-research.helper';

describe('POST import-users-ids UX Research (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/ux-research/import-users-ids', () => {
    it('deve importar usuários para um UX research existente (201)', async () => {
      const name = `ux-import-users-${Date.now()}`;
      const users = [`user-a-${Date.now()}`, `user-b-${Date.now()}`];

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await importUxUsersViaSts(app, apiKey, name, users).expect(
        HttpStatus.CREATED,
      );

      expect(response.body.data.uxResearchName).toBe(name);
      expect(response.body.data.imported).toBe(2);
      expect(response.body.data.skipped).toBe(0);
    });

    it('deve ignorar usuários duplicados na reimportação', async () => {
      const name = `ux-import-dup-${Date.now()}`;
      const userId = `user-dup-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await importUxUsersViaSts(app, apiKey, name, [userId]).expect(
        HttpStatus.CREATED,
      );

      const response = await importUxUsersViaSts(app, apiKey, name, [
        userId,
        `user-novo-${Date.now()}`,
      ]).expect(HttpStatus.CREATED);

      expect(response.body.data.imported).toBe(1);
      expect(response.body.data.skipped).toBe(1);
    });

    it('deve retornar 400 quando o UX research não existe', async () => {
      const response = await importUxUsersViaSts(app, apiKey, 'ux-inexistente', [
        'user-1',
      ]);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('UX Research not found');
    });

    it('deve retornar 401 sem API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sts/ux-research/import-users-ids')
        .send({
          ux_research_name: 'qualquer',
          users_ids: ['user-1'],
          user_data: defaultUserData,
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
