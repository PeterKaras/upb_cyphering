import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PassportStrategy } from '@nestjs/passport';
import { jwtConstants } from './constants';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return await this.userService.findOneByEmail(payload.email);
  }
}
