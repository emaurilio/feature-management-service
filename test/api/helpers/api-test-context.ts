import { INestApplication } from '@nestjs/common';
import { setupTestAuth, TestAuthContext } from './auth.helper';
import { createTestApp } from './create-test-app';

export interface ApiTestContext extends TestAuthContext {
  app: INestApplication;
}

export async function setupApiTest(): Promise<ApiTestContext> {
  const auth = setupTestAuth();
  const app = await createTestApp();
  return { ...auth, app };
}

export async function teardownApiTest(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}
