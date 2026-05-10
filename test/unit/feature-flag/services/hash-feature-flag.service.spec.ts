import { createHash } from 'node:crypto';
import { HashFeatureFlagService } from 'src/modules/feature-flag/application/services/hash-feature-flag.service';

describe('HashFeatureFlagService', () => {
    let service: HashFeatureFlagService;

    beforeEach(() => {
        service = new HashFeatureFlagService();
    });

    it('deve retornar inteiro entre 0 e 99 (inclusive)', () => {
        const samples = ['', 'user-1', 'flag:prod', 'utf8-ção', 'x'.repeat(500)];
        for (const id of samples) {
            const h = service.calculateHash(id);
            expect(h).toBeGreaterThanOrEqual(0);
            expect(h).toBeLessThanOrEqual(99);
            expect(Number.isInteger(h)).toBe(true);
        }
    });

    it('deve ser determinístico para o mesmo identificador', () => {
        const id = 'mesmo-identificador-flag';
        expect(service.calculateHash(id)).toBe(service.calculateHash(id));
    });

    it('deve usar sha256 nos primeiros 8 hex chars mod 100', () => {
        const id = 'referência-algoritmo-flag';
        const hash = createHash('sha256').update(id).digest('hex');
        const decimal = parseInt(hash.substring(0, 8), 16);
        expect(service.calculateHash(id)).toBe(decimal % 100);
    });
});
