import { createHash } from 'node:crypto';

export class HashUXResearchService {
  calculateHash(identifier: string): number {
    const hash = createHash('sha256').update(identifier).digest('hex');
    const decimal = parseInt(hash.substring(0, 8), 16);

    return decimal % 100;
  }
}
