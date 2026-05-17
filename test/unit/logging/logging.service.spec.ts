import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggingService } from 'src/modules/common/logging/logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingService],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logRequest', () => {
    it('should log request with method, path, query and body', () => {
      service.logRequest('POST', '/api/flags', '?page=1', '{"name":"x"}');

      expect(logSpy).toHaveBeenCalledWith(
        'Request: method=POST path=/api/flags query=?page=1 body={"name":"x"}',
      );
    });

    it('should log empty query and body', () => {
      service.logRequest('GET', '/health', '', '');

      expect(logSpy).toHaveBeenCalledWith(
        'Request: method=GET path=/health query= body=',
      );
    });
  });

  describe('logResponse', () => {
    it('should log response status and duration', () => {
      service.logResponse(200, 42);

      expect(logSpy).toHaveBeenCalledWith('Response: status=200 durationMs=42');
    });

    it('should log error status codes', () => {
      service.logResponse(500, 1200);

      expect(logSpy).toHaveBeenCalledWith('Response: status=500 durationMs=1200');
    });
  });

  describe('logError', () => {
    it('should log error message and stack without context', () => {
      const error = new Error('Something went wrong');

      service.logError(error);

      expect(errorSpy).toHaveBeenCalledWith(
        'Error: Something went wrong',
        error.stack,
      );
    });

    it('should log error with context', () => {
      const error = new Error('Queue failed');

      service.logError(error, 'AuditLogService');

      expect(errorSpy).toHaveBeenCalledWith(
        'Error [AuditLogService]: Queue failed',
        error.stack,
      );
    });

    it('should stringify non-Error values passed at runtime', () => {
      service.logError({ code: 'ERR' } as unknown as Error);

      expect(errorSpy).toHaveBeenCalledWith(
        'Error: {"code":"ERR"}',
        undefined,
      );
    });

    it('should not include context brackets when context is empty string', () => {
      const error = new Error('fail');

      service.logError(error, '');

      expect(errorSpy).toHaveBeenCalledWith('Error: fail', error.stack);
    });
  });
});
