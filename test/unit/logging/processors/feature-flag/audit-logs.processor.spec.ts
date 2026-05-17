/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { getQueueToken } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AuditLogsProcessor } from 'src/modules/feature-flag/processors/audit-logs.processor';
import { AuditLogPayload } from 'src/modules/feature-flag/processors/types/audit-logs.types';
import { PrometheusService } from 'src/modules/common/metrics/prometheus.service';

const createMockJob = (
  data: AuditLogPayload,
  overrides?: Partial<{
    id: string;
    attemptsMade: number;
    opts: { attempts?: number };
  }>,
): Job<AuditLogPayload, void, string> =>
  ({
    id: 'job-1',
    data,
    attemptsMade: 0,
    opts: { attempts: 3 },
    ...overrides,
  }) as unknown as Job<AuditLogPayload, void, string>;

const createPayload = (
  overrides?: Partial<AuditLogPayload>,
): AuditLogPayload => ({
  action: 'test-flag',
  entity: 'flag-123',
  entityId: 'flag-123',
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe('AuditLogsProcessor (feature-flag)', () => {
  let processor: AuditLogsProcessor;
  let elasticsearchService: jest.Mocked<ElasticsearchService>;
  let deadletterQueue: { add: jest.Mock };
  let prometheusService: jest.Mocked<PrometheusService>;

  beforeEach(async () => {
    const elasticsearchMock = {
      index: jest.fn().mockResolvedValue({}),
    };
    const deadletterMock = { add: jest.fn().mockResolvedValue(undefined) };
    const prometheusMock = {
      recordProcessingTime: jest.fn(),
      recordElasticsearchFailure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsProcessor,
        { provide: ElasticsearchService, useValue: elasticsearchMock },
        {
          provide: getQueueToken('deadletter-logs'),
          useValue: deadletterMock,
        },
        { provide: PrometheusService, useValue: prometheusMock },
      ],
    }).compile();

    processor = module.get<AuditLogsProcessor>(AuditLogsProcessor);
    elasticsearchService = module.get(ElasticsearchService);
    deadletterQueue = module.get(getQueueToken('deadletter-logs'));
    prometheusService = module.get(PrometheusService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should index document and record success metrics when processing succeeds', async () => {
      const payload = createPayload({ action: 'my-flag' });
      const job = createMockJob(payload);

      await processor.process(job);

      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'audit-feature-flags',
        document: expect.objectContaining({
          ...payload,
          timestamp: expect.any(String),
        }),
      });
      expect(prometheusService.recordProcessingTime).toHaveBeenCalledWith(
        payload.action,
        'success',
        expect.any(Number),
      );
      expect(
        prometheusService.recordElasticsearchFailure,
      ).not.toHaveBeenCalled();
      expect(deadletterQueue.add).not.toHaveBeenCalled();
    });

    it('should record failure metrics and rethrow when Elasticsearch fails', async () => {
      const payload = createPayload({ action: 'my-flag' });
      const job = createMockJob(payload);
      const error = new Error('Elasticsearch connection failed');
      elasticsearchService.index.mockRejectedValueOnce(error);

      await expect(processor.process(job)).rejects.toThrow(
        'Elasticsearch connection failed',
      );

      expect(prometheusService.recordProcessingTime).toHaveBeenCalledWith(
        payload.action,
        'failure',
        expect.any(Number),
      );
      expect(prometheusService.recordElasticsearchFailure).toHaveBeenCalledWith(
        payload.action,
        'Error',
      );
      expect(deadletterQueue.add).not.toHaveBeenCalled();
    });

    it('should send to deadletter when max attempts is reached', async () => {
      const payload = createPayload({ action: 'my-flag' });
      const job = createMockJob(payload, {
        attemptsMade: 3,
        opts: { attempts: 3 },
      });
      elasticsearchService.index.mockRejectedValue(
        new Error('Elasticsearch error'),
      );

      await expect(processor.process(job)).rejects.toThrow(
        'Elasticsearch error',
      );

      expect(deadletterQueue.add).toHaveBeenCalledWith(
        'failed-log',
        expect.objectContaining({
          originalPayload: payload,
          error: 'Elasticsearch error',
          failedAt: expect.stringContaining('T'),
        }),
      );
    });

    it('should not send to deadletter when attempts remain', async () => {
      const payload = createPayload({ action: 'my-flag' });
      const job = createMockJob(payload, {
        attemptsMade: 1,
        opts: { attempts: 3 },
      });
      elasticsearchService.index.mockRejectedValue(
        new Error('Elasticsearch error'),
      );

      await expect(processor.process(job)).rejects.toThrow(
        'Elasticsearch error',
      );

      expect(deadletterQueue.add).not.toHaveBeenCalled();
    });

    it('should record error type when error is not Error instance', async () => {
      const payload = createPayload({ action: 'my-flag' });
      const job = createMockJob(payload, {
        attemptsMade: 3,
        opts: { attempts: 3 },
      });
      elasticsearchService.index.mockRejectedValueOnce('string error');

      await expect(processor.process(job)).rejects.toBe('string error');

      expect(prometheusService.recordElasticsearchFailure).toHaveBeenCalledWith(
        payload.action,
        'Unknown',
      );
    });

    it('should use 1 as default max attempts when opts.attempts is undefined', async () => {
      const payload = createPayload({ action: 'my-flag' });
      const job = createMockJob(payload, { attemptsMade: 1, opts: {} });
      elasticsearchService.index.mockRejectedValue(new Error('fail'));

      await expect(processor.process(job)).rejects.toThrow('fail');

      expect(deadletterQueue.add).toHaveBeenCalled();
    });
  });

  describe('sendToElastic (via process)', () => {
    it('should index with correct structure including processedAt', async () => {
      const payload = createPayload({ action: 'my-flag' });
      const job = createMockJob(payload);

      const beforeCall = Date.now();
      await processor.process(job);
      const afterCall = Date.now();

      const call = elasticsearchService.index.mock.calls[0][0] as {
        index: string;
        document: Record<string, unknown>;
      };
      expect(call.index).toBe('audit-feature-flags');
      expect(call.document).toMatchObject(payload);
      expect(call.document.processedAt).toBeDefined();
      expect(
        new Date(call.document.processedAt as string).getTime(),
      ).toBeGreaterThanOrEqual(beforeCall);
      expect(
        new Date(call.document.processedAt as string).getTime(),
      ).toBeLessThanOrEqual(afterCall + 1000);
    });
  });

  describe('sendToDeadLetter (via process on final failure)', () => {
    it('should not throw when deadletter queue fails', async () => {
      const payload = createPayload();
      const job = createMockJob(payload, {
        attemptsMade: 3,
        opts: { attempts: 3 },
      });
      elasticsearchService.index.mockRejectedValue(new Error('ES fail'));
      deadletterQueue.add.mockRejectedValueOnce(new Error('Deadletter fail'));

      await expect(processor.process(job)).rejects.toThrow('ES fail');
    });
  });
});
