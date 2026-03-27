import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AuditLogPayload } from 'src/feature-flag/processors/types/audit-logs.types';
import { AuditService } from 'src/feature-flag/application/services/audit.service';

const createPayload = (
  overrides?: Partial<AuditLogPayload>,
): AuditLogPayload => ({
  action: 'import',
  entity: 'FeatureFlag',
  entityId: 'flag-123',
  timestamp: new Date().toISOString(),
  data: {
    featureFlagName: 'test-flag',
    updatedBy: 543,
  },
  ...overrides,
});

describe('AuditService', () => {
  let service: AuditService;
  let auditQueue: { add: jest.Mock };

  beforeEach(async () => {
    const queueMock = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getQueueToken('audit-logs'), useValue: queueMock },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditQueue = module.get(getQueueToken('audit-logs'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatchLog', () => {
    it('should enqueue job with correct name, payload and options', async () => {
      const payload = createPayload();

      await service.dispatchLog(payload);

      expect(auditQueue.add).toHaveBeenCalledTimes(1);
      expect(auditQueue.add).toHaveBeenCalledWith('log-update', payload, {
        attempts: 3,
        backoff: 5000,
      });
    });

    it('should return true when enqueue succeeds', async () => {
      const payload = createPayload();

      const result = await service.dispatchLog(payload);

      expect(result).toBe(true);
    });

    it('should return false when queue.add throws', async () => {
      const payload = createPayload();
      auditQueue.add.mockRejectedValueOnce(
        new Error('Redis connection failed'),
      );

      const result = await service.dispatchLog(payload);

      expect(result).toBe(false);
    });

    it('should return false when queue.add rejects with non-Error value', async () => {
      const payload = createPayload();
      auditQueue.add.mockRejectedValueOnce('string error');

      const result = await service.dispatchLog(payload);

      expect(result).toBe(false);
    });

    it('should not throw when queue fails', async () => {
      const payload = createPayload();
      auditQueue.add.mockRejectedValue(new Error('boom'));

      await expect(service.dispatchLog(payload)).resolves.toBe(false);
    });

    it('should handle different payload shapes', async () => {
      const payload = createPayload({
        entityId: 'xyz',
        data: {
          featureFlagName: 'other-flag',
          updatedBy: 4353,
        },
        timestamp: '2025-01-01T00:00:00.000Z',
      });

      await service.dispatchLog(payload);

      expect(auditQueue.add).toHaveBeenCalledWith('log-update', payload, {
        attempts: 3,
        backoff: 5000,
      });
    });
  });
});
