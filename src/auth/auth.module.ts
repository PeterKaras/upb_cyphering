import { Module } from '@nestjs/common';
import { jwtConstants } from './constants';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      signOptions: { expiresIn: '3d' },
      secret: jwtConstants.secret,
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}