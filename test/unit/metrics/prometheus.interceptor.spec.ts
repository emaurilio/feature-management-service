/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { PrometheusInterceptor } from 'src/modules/common/metrics/prometheus.interceptor';
import { PrometheusService } from 'src/modules/common/metrics/prometheus.service';

const createMockExecutionContext = (
  request: {
    route?: { path: string };
    url?: string;
  } = {},
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

const createMockCallHandler = (
  result: 'success' | 'error' = 'success',
): CallHandler => ({
  handle: () =>
    result === 'success'
      ? of({ data: 'ok' })
      : throwError(() => new Error('Handler failed')),
});

describe('PrometheusInterceptor', () => {
  let interceptor: PrometheusInterceptor;
  let prometheusService: jest.Mocked<PrometheusService>;

  beforeEach(async () => {
    const prometheusMock = {
      recordProcessingTime: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrometheusInterceptor,
        { provide: PrometheusService, useValue: prometheusMock },
      ],
    }).compile();

    interceptor = module.get<PrometheusInterceptor>(PrometheusInterceptor);
    prometheusService = module.get(PrometheusService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should record success metrics when handler completes', (done) => {
      const context = createMockExecutionContext({
        route: { path: '/api/feature-flags' },
      });
      const next = createMockCallHandler('success');

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(prometheusService.recordProcessingTime).toHaveBeenCalledWith(
            '/api/feature-flags',
            'success',
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should record failure metrics when handler throws', (done) => {
      const context = createMockExecutionContext({
        route: { path: '/api/feature-flags' },
      });
      const next = createMockCallHandler('error');

      interceptor.intercept(context, next).subscribe({
        error: (err) => {
          expect(err).toEqual(new Error('Handler failed'));
          expect(prometheusService.recordProcessingTime).toHaveBeenCalledWith(
            '/api/feature-flags',
            'failure',
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should rethrow error after recording failure', (done) => {
      const next = createMockCallHandler('error');
      const context = createMockExecutionContext();

      interceptor.intercept(context, next).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe('Handler failed');
          done();
        },
      });
    });

    it('should use route.path when available', (done) => {
      const context = createMockExecutionContext({
        route: { path: '/metrics' },
        url: '/fallback',
      });
      const next = createMockCallHandler('success');

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(prometheusService.recordProcessingTime).toHaveBeenCalledWith(
            '/metrics',
            'success',
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should fallback to url when route.path is not available', (done) => {
      const context = createMockExecutionContext({
        url: '/api/fallback-path',
      });
      const next = createMockCallHandler('success');

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(prometheusService.recordProcessingTime).toHaveBeenCalledWith(
            '/api/fallback-path',
            'success',
            expect.any(Number),
          );
          done();
        },
      });
    });
  });
});
