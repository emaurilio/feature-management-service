import { generateKeyPairSync } from 'node:crypto';
import { sign } from 'jsonwebtoken';

export interface TestAuthContext {
  apiKey: string;
  jwtToken: string;
  bearerToken: string;
}

export function setupTestAuth(): TestAuthContext {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  process.env.JWT_PUBLIC_KEY = publicKey.export({
    type: 'spki',
    format: 'pem',
  }) as string;
  process.env.API_KEY = 'test-api-key-for-api-tests';

  const jwtToken = sign({ sub: 'api-test-user' }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '1h',
  });

  return {
    apiKey: process.env.API_KEY,
    jwtToken,
    bearerToken: `Bearer ${jwtToken}`,
  };
}
