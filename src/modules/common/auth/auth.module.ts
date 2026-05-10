import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Global } from '@nestjs/common';
import { JwtService } from './services/jwt.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      publicKey: process.env.JWT_PUBLIC_KEY,
      verifyOptions: {
        algorithms: ['RS256'],
      },
    }),
  ],
  providers: [JwtService],
  exports: [JwtModule, JwtService],
})
export class AuthModule {}
