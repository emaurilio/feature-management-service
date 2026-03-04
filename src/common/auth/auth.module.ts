import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      publicKey: process.env.JWT_PUBLIC_KEY,
      verifyOptions: {
        algorithms: ['RS256'],
      },
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
