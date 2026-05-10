/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Job } from 'bullmq';
import { DeadletterLogsProcessor } from 'src/modules/feature-flag/processors/deadletter-logs.processor';
import { DeadLetterLogPayload } from 'src/modules/feature-flag/processors/types/deadletter-logs.types';
import { AuditLogPayload } from 'src/modules/feature-flag/processors/types/audit-logs.types';

const createOriginalPayload = (
  overrides?: Partial<AuditLogPayload>,
): AuditLogPayload => ({
  action: 'test-flag',
  entity: 'feature-flag',
  entityId: 'flag-123',
  timestamp: new Date().toISOString(),
  data: { flagName: 'test-flag', enabled: true },
  ...overrides,
});

const createDeadLetterPayload = (
  overrides?: Partial<DeadLetterLogPayload>,
): DeadLetterLogPayload => ({
  originalPayload: createOriginalPayload(),
  error: 'Elasticsearch connection failed',
  failedAt: new Date().toISOString(),
  ...overrides,
});

const createMockJob = (
  data: DeadLetterLogPayload,
  overrides?: Partial<{ id: string }>,
): Job<DeadLetterLogPayload, void, string> =>
  ({
    id: 'job-1',
    data,
    ...overrides,
  }) as unknown as Job<DeadLetterLogPayload, void, string>;

describe('DeadletterLogsProcessor', () => {
  let processor: DeadletterLogsProcessor;
  let elasticsearchService: jest.Mocked<ElasticsearchService>;

  beforeEach(async () => {
    const elasticsearchMock = {
      index: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadletterLogsProcessor,
        { provide: ElasticsearchService, useValue: elasticsearchMock },
      ],
    }).compile();

    processor = module.get<DeadletterLogsProcessor>(DeadletterLogsProcessor);
    elasticsearchService = module.get(ElasticsearchService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should index document in Elasticsearch when processing succeeds', async () => {
      const payload = createDeadLetterPayload();
      const job = createMockJob(payload);

      await processor.process(job);

      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'deadletter-audit-feature-flags',
        document: expect.objectContaining({
          ...payload,
          processedAt: expect.any(String),
        }),
      });
    });

    it('should include processedAt in indexed document', async () => {
      const payload = createDeadLetterPayload({ error: 'Timeout' });
      const job = createMockJob(payload);

      const beforeCall = Date.now();
      await processor.process(job);
      const afterCall = Date.now();

      const call = elasticsearchService.index.mock.calls[0][0] as {
        index: string;
        document: Record<string, unknown>;
      };
      expect(call.document.processedAt).toBeDefined();
      expect(
        new Date(call.document.processedAt as string).getTime(),
      ).toBeGreaterThanOrEqual(beforeCall);
      expect(
        new Date(call.document.processedAt as string).getTime(),
      ).toBeLessThanOrEqual(afterCall + 1000);
    });

    it('should index full payload including originalPayload and error', async () => {
      const originalPayload = createOriginalPayload({ entity: 'my-flag' });
      const payload = createDeadLetterPayload({
        originalPayload,
        error: 'Connection refused',
        failedAt: '2025-01-01T00:00:00.000Z',
      });
      const job = createMockJob(payload);

      await processor.process(job);

      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'deadletter-audit-feature-flags',
        document: expect.objectContaining({
          originalPayload: { ...originalPayload },
          error: 'Connection refused',
          failedAt: '2025-01-01T00:00:00.000Z',
          processedAt: expect.any(String),
        }),
      });
    });

    it('should throw when Elasticsearch fails', async () => {
      const payload = createDeadLetterPayload();
      const job = createMockJob(payload);
      elasticsearchService.index.mockRejectedValueOnce(
        new Error('ES unavailable'),
      );

      await expect(processor.process(job)).rejects.toThrow('ES unavailable');
    });

    it('should rethrow non-Error values', async () => {
      const payload = createDeadLetterPayload();
      const job = createMockJob(payload);
      elasticsearchService.index.mockRejectedValueOnce('string error');

      await expect(processor.process(job)).rejects.toBe('string error');
    });
  });
});
