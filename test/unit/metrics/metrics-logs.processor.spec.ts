import { Test, TestingModule } from '@nestjs/testing';
import { PrometheusService } from 'src/modules/common/metrics/prometheus.service';

const mockInc = jest.fn();
const mockSet = jest.fn();
const mockObserve = jest.fn();
const mockLabels = jest.fn(() => ({ inc: mockInc, observe: mockObserve }));

jest.mock('prom-client', () => ({
  Counter: jest.fn().mockImplementation(() => ({
    labels: mockLabels,
  })),
  Gauge: jest.fn().mockImplementation(() => ({
    set: mockSet,
  })),
  Histogram: jest.fn().mockImplementation(() => ({
    labels: mockLabels,
  })),
  register: {},
  collectDefaultMetrics: jest.fn(),
}));

describe('PrometheusService', () => {
  let service: PrometheusService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLabels.mockReturnValue({ inc: mockInc, observe: mockObserve });

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrometheusService],
    }).compile();

    service = module.get<PrometheusService>(PrometheusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordElasticsearchFailure', () => {
    it('should increment counter with flag name and error type', () => {
      service.recordElasticsearchFailure('my-flag', 'ConnectionError');

      expect(mockLabels).toHaveBeenCalledWith('my-flag', 'ConnectionError');
      expect(mockInc).toHaveBeenCalledTimes(1);
    });

    it('should handle different error types', () => {
      service.recordElasticsearchFailure('test-flag', 'TimeoutError');

      expect(mockLabels).toHaveBeenCalledWith('test-flag', 'TimeoutError');
      expect(mockInc).toHaveBeenCalled();
    });
  });

  describe('setFallbackPendingCount', () => {
    it('should set gauge with given count', () => {
      service.setFallbackPendingCount(42);

      expect(mockSet).toHaveBeenCalledWith(42);
    });

    it('should handle zero', () => {
      service.setFallbackPendingCount(0);

      expect(mockSet).toHaveBeenCalledWith(0);
    });
  });

  describe('recordProcessingTime', () => {
    it('should observe duration in seconds for success', () => {
      service.recordProcessingTime('flag-a', 'success', 1500);

      expect(mockLabels).toHaveBeenCalledWith('flag-a', 'success');
      expect(mockObserve).toHaveBeenCalledWith(1.5);
    });

    it('should observe duration in seconds for failure', () => {
      service.recordProcessingTime('flag-b', 'failure', 3000);

      expect(mockLabels).toHaveBeenCalledWith('flag-b', 'failure');
      expect(mockObserve).toHaveBeenCalledWith(3);
    });

    it('should convert milliseconds to seconds', () => {
      service.recordProcessingTime('flag-c', 'success', 500);

      expect(mockObserve).toHaveBeenCalledWith(0.5);
    });
  });
});
