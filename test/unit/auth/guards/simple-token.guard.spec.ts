/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';

const createMockExecutionContext = (
  request: Partial<Request> = {},
): ExecutionContext => {
  const mockRequest = {
    headers: {},
    ...request,
  };
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
  } as unknown as ExecutionContext;
};

describe('SimpleTokenGuard', () => {
  let guard: SimpleTokenGuard;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env.API_KEY = '1234567890';
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimpleTokenGuard],
    }).compile();

    guard = module.get<SimpleTokenGuard>(SimpleTokenGuard);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when Authorization header is missing', () => {
      const context = createMockExecutionContext({ headers: {} as any });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Token not found');
    });

    it('should throw UnauthorizedException when Authorization header is empty', () => {
      const context = createMockExecutionContext({
        headers: { authorization: '' } as any,
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Token not found');
    });

    it('should return true when token is valid', () => {
      const request: Partial<Request> = {
        headers: { authorization: '1234567890' } as any,
      };
      const context = createMockExecutionContext(request);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      const context = createMockExecutionContext({
        headers: { authorization: 'invalid-token' } as any,
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token');
    });
  });
});
