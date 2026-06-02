/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  createUxResearchViaSts,
  deleteUxResearchViaSts,
  importUxCompaniesViaSts,
  searchUxResearchViaSts,
} from '../helpers/ux-research.helper';

describe('STS UX Research — import, delete, search (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/ux-research/import-companies-ids', () => {
    it('deve importar empresas para um UX research existente (201)', async () => {
      const name = `ux-import-companies-${Date.now()}`;
      const companies = [`company-a-${Date.now()}`, `company-b-${Date.now()}`];

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.COMPANY,
      }).expect(HttpStatus.CREATED);

      const response = await importUxCompaniesViaSts(
        app,
        apiKey,
        name,
        companies,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data.uxResearchName).toBe(name);
      expect(response.body.data.imported).toBe(2);
      expect(response.body.data.skipped).toBe(0);
    });

    it('deve retornar 400 quando o UX research não existe', async () => {
      const response = await importUxCompaniesViaSts(
        app,
        apiKey,
        'ux-inexistente',
        ['company-1'],
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('UX Research not found');
    });
  });

  describe('DELETE /v1/sts/ux-research/delete', () => {
    it('deve soft-deletar um UX research existente (200)', async () => {
      const name = `ux-delete-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await deleteUxResearchViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.deleted).toBe(true);
    });

    it('deve remover da busca após delete', async () => {
      const name = `ux-delete-search-${Date.now()}`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      await deleteUxResearchViaSts(app, apiKey, name).expect(HttpStatus.OK);

      const search = await searchUxResearchViaSts(app, apiKey, name).expect(
        HttpStatus.OK,
      );

      expect(search.body.data.items).toHaveLength(0);
    });
  });

  describe('POST /v1/sts/ux-research/search', () => {
    it('deve retornar UX research que correspondem ao filtro (200)', async () => {
      const prefix = `ux-search-${Date.now()}`;
      const name = `${prefix}-exact`;

      await createUxResearchViaSts(app, apiKey, {
        name,
        type: UXResearchType.USER,
      }).expect(HttpStatus.CREATED);

      const response = await searchUxResearchViaSts(app, apiKey, prefix).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.items.some(
          (item: { name: string }) => item.name === name,
        ),
      ).toBe(true);
    });
  });
});
