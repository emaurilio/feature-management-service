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
  expectedUxPercentageResult,
  importUxCompaniesViaSts,
  importUxUsersViaSts,
} from '../helpers/ux-research.helper';

describe('POST check UX Research (API real)', () => {
  let app: INestApplication;
  let apiKey: string;
  let bearerToken: string;

  beforeAll(async () => {
    ({ app, apiKey, bearerToken } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/ux-research/check (JWT)', () => {
    it('deve retornar 401 sem token JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/ux-research/check')
        .send({ name: 'qualquer', user_id: 'user-1' });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 400 sem user_id e company_id', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/ux-research/check')
        .set('Authorization', bearerToken)
        .send({ name: 'ux-inexistente' });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message).toBe(
        'User ID or Company ID is required',
      );
    });

    it('deve retornar true para usuário importado (tipo user)', async () => {
      const name = `ux-check-user-${Date.now()}`;
      const userId = `user-ux-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await importUxUsersViaSts(app, apiKey, name, [userId]).expect(
        HttpStatus.CREATED,
      );

      const response = await request(app.getHttpServer())
        .post('/v1/ux-research/check')
        .set('Authorization', bearerToken)
        .send({ name, user_id: userId });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.checkUxResearch).toBe(true);
    });

    it('deve retornar false quando UX research está inativo', async () => {
      const name = `ux-check-inactive-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await disableUxResearchViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const response = await checkUxResearchViaSts(app, apiKey, {
        name,
        userId: 'user-qualquer',
      }).expect(HttpStatus.OK);

      expect(response.body.data.checkUxResearch).toBe(false);
    });

    it('deve calcular rollout por percentual corretamente', async () => {
      const name = `ux-check-pct-${Date.now()}`;
      const userId = `user-pct-${Date.now()}`;
      const percentage = 80;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.PERCENTAGE,
        percentage,
      }).expect(HttpStatus.CREATED);

      const expected = expectedUxPercentageResult(userId, name, 1, percentage);

      const response = await checkUxResearchViaSts(app, apiKey, {
        name,
        userId,
      }).expect(HttpStatus.OK);

      expect(response.body.data.checkUxResearch).toBe(expected);
    });

    it('deve retornar true para empresa importada (tipo company)', async () => {
      const name = `ux-check-company-${Date.now()}`;
      const companyId = `company-ux-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.COMPANY,
      }).expect(HttpStatus.CREATED);

      await importUxCompaniesViaSts(app, apiKey, name, [companyId]).expect(
        HttpStatus.CREATED,
      );

      const response = await checkUxResearchViaSts(app, apiKey, {
        name,
        companyId,
      }).expect(HttpStatus.OK);

      expect(response.body.data.checkUxResearch).toBe(true);
    });
  });
});
