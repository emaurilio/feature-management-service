/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { setupApiTest, teardownApiTest } from '../helpers/api-test-context';
import {
  createFeatureFlagViaSts,
  importCompaniesViaSts,
} from '../helpers/feature-flag.helper';

describe('POST import-companies-ids (API real)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await setupApiTest());
  });

  afterAll(async () => {
    await teardownApiTest(app);
  });

  describe('POST /v1/sts/feature-flag/import-companies-ids', () => {
    it('deve importar empresas para uma flag existente (201)', async () => {
      const flagName = `import-companies-${Date.now()}`;
      const companies = [`company-a-${Date.now()}`, `company-b-${Date.now()}`];

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.COMPANY,
      }).expect(HttpStatus.CREATED);

      const response = await importCompaniesViaSts(
        app,
        apiKey,
        flagName,
        companies,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data.featureFlagName).toBe(flagName);
      expect(response.body.data.totalReceived).toBe(2);
      expect(response.body.data.imported).toBe(2);
      expect(response.body.data.skipped).toBe(0);
    });

    it('deve ignorar empresas já importadas na reimportação', async () => {
      const flagName = `import-companies-dup-${Date.now()}`;
      const companyId = `company-dup-${Date.now()}`;

      await createFeatureFlagViaSts(app, apiKey, {
        name: flagName,
        type: FeatureFlagType.COMPANY,
      }).expect(HttpStatus.CREATED);

      await importCompaniesViaSts(app, apiKey, flagName, [companyId]).expect(
        HttpStatus.CREATED,
      );

      const response = await importCompaniesViaSts(app, apiKey, flagName, [
        companyId,
        `company-nova-${Date.now()}`,
      ]).expect(HttpStatus.CREATED);

      expect(response.body.data.imported).toBe(1);
      expect(response.body.data.skipped).toBe(1);
    });

    it('deve retornar 400 quando a feature flag não existe', async () => {
      const response = await importCompaniesViaSts(app, apiKey, 'flag-inexistente', [
        'company-1',
      ]);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.error.message[0]).toContain('Feature Flag not found');
    });
  });
});
