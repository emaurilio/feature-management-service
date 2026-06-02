/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  createUxResearchResponseViaSts,
  createUxResearchViaSts,
  deleteUxResearchResponseViaSts,
  getUxResearchResponsesViaSts,
} from '../helpers/ux-research.helper';

describe('UX Research responses (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/ux-research/create-ux-research-response', () => {
    it('deve criar uma resposta de UX research (201)', async () => {
      const name = `ux-response-${Date.now()}`;
      const userId = `user-response-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await createUxResearchResponseViaSts(app, apiKey, {
        uxResearchName: name,
        userId,
        responseData: JSON.stringify({ rating: 5, comment: 'ótimo' }),
        responseDate: new Date(),
      }).expect(HttpStatus.CREATED);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.userId).toBe(userId);
    });
  });

  describe('POST /v1/sts/ux-research/get-responses', () => {
    it('deve listar respostas paginadas de um UX research (200)', async () => {
      const name = `ux-get-responses-${Date.now()}`;
      const userId = `user-list-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await createUxResearchResponseViaSts(app, apiKey, {
        uxResearchName: name,
        userId,
        responseData: JSON.stringify({ score: 10 }),
        responseDate: new Date(),
      }).expect(HttpStatus.CREATED);

      const response = await getUxResearchResponsesViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.meta.totalItems).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DELETE /v1/sts/ux-research/delete-ux-research-response', () => {
    it('deve deletar uma resposta existente (200)', async () => {
      const name = `ux-del-response-${Date.now()}`;
      const userId = `user-del-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      const created = await createUxResearchResponseViaSts(app, apiKey, {
        uxResearchName: name,
        userId,
        responseData: JSON.stringify({ temp: true }),
        responseDate: new Date(),
      }).expect(HttpStatus.CREATED);

      const response = await deleteUxResearchResponseViaSts(
        app,
        apiKey,
        created.body.data.id,
      ).expect(HttpStatus.OK);

      expect(response.body.data.id).toBe(created.body.data.id);

      const list = await getUxResearchResponsesViaSts(app, apiKey, name);

      expect(list.status).toBe(HttpStatus.NOT_FOUND);
      expect(list.body.error.message).toContain('UX Research Response not found');
    });
  });
});
