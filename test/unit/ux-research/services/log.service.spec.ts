import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AuditLogPayload } from 'src/modules/ux-research/processors/types/audit-logs.types';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { LOGGING_SERVICE } from 'src/modules/common/logging/logging-service.interface';

const createPayload = (
    overrides?: Partial<AuditLogPayload>,
): AuditLogPayload => ({
    action: 'update',
    entity: 'UXResearch',
    entityId: 'ux-123',
    timestamp: new Date().toISOString(),
    data: { name: 'pesquisa-x' },
    ...overrides,
});

describe('AuditLogService (ux-research / log.service)', () => {
    let service: AuditLogService;
    let auditQueue: { add: jest.Mock };
    let loggingService: { logError: jest.Mock };

    beforeEach(async () => {
        const queueMock = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
        const loggingMock = { logError: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLogService,
                {
                    provide: getQueueToken('audit-ux-research'),
                    useValue: queueMock,
                },
                { provide: LOGGING_SERVICE, useValue: loggingMock },
            ],
        }).compile();

        service = module.get<AuditLogService>(AuditLogService);
        auditQueue = module.get(getQueueToken('audit-ux-research'));
        loggingService = module.get(LOGGING_SERVICE);
    });

    it('deve instanciar o serviço', () => {
        expect(service).toBeDefined();
    });

    describe('dispatchLog', () => {
        it('deve enfileirar job com nome, payload e opções corretas', async () => {
            const payload = createPayload();

            await service.dispatchLog(payload);

            expect(auditQueue.add).toHaveBeenCalledTimes(1);
            expect(auditQueue.add).toHaveBeenCalledWith('log-update', payload, {
                attempts: 3,
                backoff: 5000,
            });
        });

        it('deve retornar true quando o enqueue conclui', async () => {
            const payload = createPayload();

            const result = await service.dispatchLog(payload);

            expect(result).toBe(true);
        });

        it('deve retornar false e registrar logError quando queue.add falha com Error', async () => {
            const payload = createPayload();
            const mockError = new Error('Redis indisponível');
            auditQueue.add.mockRejectedValueOnce(mockError);

            const result = await service.dispatchLog(payload);

            expect(result).toBe(false);
            expect(loggingService.logError).toHaveBeenCalledWith(
                mockError,
                'AuditLogService - Falha ao enfileirar log para entidade: UXResearch',
            );
        });

        it('deve retornar false e envolver valor não-Error em Error ao logar', async () => {
            const payload = createPayload();
            auditQueue.add.mockRejectedValueOnce('falha-string');

            const result = await service.dispatchLog(payload);

            expect(result).toBe(false);
            expect(loggingService.logError).toHaveBeenCalledWith(
                new Error('falha-string'),
                'AuditLogService - Falha ao enfileirar log para entidade: UXResearch',
            );
        });

        it('não deve lançar quando a fila rejeita', async () => {
            const payload = createPayload();
            const mockError = new Error('boom');
            auditQueue.add.mockRejectedValue(mockError);

            await expect(service.dispatchLog(payload)).resolves.toBe(false);
            expect(loggingService.logError).toHaveBeenCalledWith(
                mockError,
                'AuditLogService - Falha ao enfileirar log para entidade: UXResearch',
            );
        });

        it('deve incluir o nome da entidade do payload na mensagem de erro', async () => {
            const payload = createPayload({ entity: 'UXResearchResponse' });
            auditQueue.add.mockRejectedValueOnce(new Error('x'));

            await service.dispatchLog(payload);

            expect(loggingService.logError).toHaveBeenCalledWith(
                expect.any(Error),
                'AuditLogService - Falha ao enfileirar log para entidade: UXResearchResponse',
            );
        });
    });
});
