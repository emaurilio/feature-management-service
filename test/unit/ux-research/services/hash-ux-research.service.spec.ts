import { createHash } from 'node:crypto';
import { HashUXResearchService } from 'src/ux-research/application/services/hash-ux-research.service';

describe('HashUXResearchService', () => {
    let service: HashUXResearchService;

    beforeEach(() => {
        service = new HashUXResearchService();
    });

    it('deve retornar inteiro entre 0 e 99 (inclusive)', () => {
        const samples = ['', 'user-1', 'company:abc', 'utf8-ção', 'x'.repeat(500)];
        for (const id of samples) {
            const h = service.calculateHash(id);
            expect(h).toBeGreaterThanOrEqual(0);
            expect(h).toBeLessThanOrEqual(99);
            expect(Number.isInteger(h)).toBe(true);
        }
    });

    it('deve ser determinístico para o mesmo identificador', () => {
        const id = 'mesmo-identificador-123';
        expect(service.calculateHash(id)).toBe(service.calculateHash(id));
    });

    it('deve usar sha256 nos primeiros 8 hex chars mod 100', () => {
        const id = 'referência-algoritmo';
        const hash = createHash('sha256').update(id).digest('hex');
        const decimal = parseInt(hash.substring(0, 8), 16);
        expect(service.calculateHash(id)).toBe(decimal % 100);
    });
});
