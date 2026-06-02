/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  activeUxResearchViaSts,
  checkUxResearchViaSts,
  createUxResearchViaSts,
  disableUxResearchViaSts,
  importUxUsersViaSts,
} from '../helpers/ux-research.helper';

describe('PATCH active UX Research (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('PATCH /v1/sts/ux-research/active', () => {
    it('deve reativar um UX research desativado (200)', async () => {
      const name = `ux-active-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await disableUxResearchViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const response = await activeUxResearchViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.isActive).toBe(true);
    });

    it('deve fazer check voltar a true após reativar', async () => {
      const name = `ux-active-check-${Date.now()}`;
      const userId = `user-ux-active-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await importUxUsersViaSts(app, apiKey, name, [userId]).expect(
        HttpStatus.CREATED,
      );

      await disableUxResearchViaSts(app, apiKey, name).expect(HttpStatus.OK);
      await activeUxResearchViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const check = await checkUxResearchViaSts(app, apiKey, {
        name,
        userId,
      }).expect(HttpStatus.OK);

      expect(check.body.data.checkUxResearch).toBe(true);
    });

    it('deve retornar 400 quando o UX research não existe', async () => {
      const response = await activeUxResearchViaSts(
        app,
        apiKey,
        'ux-inexistente-active',
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('UX Research not found');
    });
  });
});
