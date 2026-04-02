/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JwtService } from 'src/common/auth/services/jwt.service';

const createMockExecutionContext = (
  request: Partial<Request> | { headers?: Record<string, string> } = {},
): ExecutionContext => {
  const mockRequest = {
    headers: {} as any,
    ...request,
  };
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
  } as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const jwtServiceMock = {
      verifyTokenAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when Authorization header is missing', async () => {
      const context = createMockExecutionContext({ headers: {} });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token not found',
      );
      expect(jwtService.verifyTokenAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when Authorization header is not Bearer', async () => {
      const context = createMockExecutionContext({
        headers: { authorization: 'Basic some-token' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token not found',
      );
      expect(jwtService.verifyTokenAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when Authorization header is empty', async () => {
      const context = createMockExecutionContext({
        headers: { authorization: '' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token not found',
      );
    });

    it('should return true and set request.user when token is valid', async () => {
      const payload: JwtPayload = { sub: 'user-123', iat: 1234567890 };
      jwtService.verifyTokenAsync.mockResolvedValue(payload);

      const request: Partial<Request> = {
        headers: { authorization: 'Bearer valid-jwt-token' } as any,
      };
      const context = createMockExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyTokenAsync).toHaveBeenCalledWith(
        'valid-jwt-token',
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      jwtService.verifyTokenAsync.mockRejectedValue(new Error('invalid token'));

      const context = createMockExecutionContext({
        headers: { authorization: 'Bearer invalid-token' } as any,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired token',
      );
      expect(jwtService.verifyTokenAsync).toHaveBeenCalledWith('invalid-token');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      jwtService.verifyTokenAsync.mockRejectedValue(new Error('jwt expired'));

      const context = createMockExecutionContext({
        headers: { authorization: 'Bearer expired-token' } as any,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired token',
      );
    });
  });
});
