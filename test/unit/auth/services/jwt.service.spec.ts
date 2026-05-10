import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { JwtService } from 'src/modules/common/auth/services/jwt.service';

type VerifyCallback = (err: Error | null, decoded?: JwtPayload) => void;
let verifyCallback: VerifyCallback | null = null;

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(
    (_token: string, _key: string, _options: unknown, cb: VerifyCallback) => {
      verifyCallback = cb;
    },
  ),
}));

describe('JwtService', () => {
  let service: JwtService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyCallback = null;
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createModule = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtService],
    }).compile();
    return module.get<JwtService>(JwtService);
  };

  it('should be defined', async () => {
    process.env.JWT_PUBLIC_KEY =
      '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----';
    service = await createModule();
    expect(service).toBeDefined();
  });

  describe('verifyTokenAsync', () => {
    it('should throw BadRequestException when JWT_PUBLIC_KEY is not configured', async () => {
      delete process.env.JWT_PUBLIC_KEY;
      service = await createModule();

      await expect(service.verifyTokenAsync('any-token')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyTokenAsync('any-token')).rejects.toThrow(
        'Nenhuma chave de verificação configurada',
      );
    });

    it('should return payload when token is valid with JWT_PUBLIC_KEY', async () => {
      process.env.JWT_PUBLIC_KEY =
        '-----BEGIN PUBLIC KEY-----\nkey\n-----END PUBLIC KEY-----';
      service = await createModule();

      const payload: JwtPayload = { sub: 'user-456', exp: 9999999999 };
      const verifyPromise = service.verifyTokenAsync('valid-token');
      verifyCallback?.(null, payload);

      const result = await verifyPromise;
      expect(result).toEqual(payload);
      expect(result.sub).toBe('user-456');
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      process.env.JWT_PUBLIC_KEY =
        '-----BEGIN PUBLIC KEY-----\nkey\n-----END PUBLIC KEY-----';
      service = await createModule();

      const verifyPromise = service.verifyTokenAsync('invalid-token');
      verifyCallback?.(new Error('invalid signature'), undefined);

      await expect(verifyPromise).rejects.toThrow(UnauthorizedException);
      await expect(verifyPromise).rejects.toThrow('Token inválido ou expirado');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      process.env.JWT_PUBLIC_KEY =
        '-----BEGIN PUBLIC KEY-----\nkey\n-----END PUBLIC KEY-----';
      service = await createModule();

      const verifyPromise = service.verifyTokenAsync('expired-token');
      verifyCallback?.(new Error('jwt expired'), undefined);

      await expect(verifyPromise).rejects.toThrow(UnauthorizedException);
      await expect(verifyPromise).rejects.toThrow('Token inválido ou expirado');
    });
  });
});
