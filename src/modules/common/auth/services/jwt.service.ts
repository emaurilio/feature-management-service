import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, Secret, verify, VerifyOptions } from 'jsonwebtoken';
import { promisify } from 'util';

const verifyAsync = promisify<string, Secret, VerifyOptions, JwtPayload>(
  verify,
);

@Injectable()
export class JwtService {
  private publicKey = process.env.JWT_PUBLIC_KEY;

  async verifyTokenAsync(token: string): Promise<JwtPayload> {
    const key = this.publicKey;
    if (!key) {
      throw new BadRequestException('Nenhuma chave de verificação configurada');
    }

    const options: VerifyOptions = this.publicKey
      ? { algorithms: ['RS256'] }
      : { algorithms: ['HS256', 'RS256'] };

    try {
      return await verifyAsync(token, key, options);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
