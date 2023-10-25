import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { config } from 'dotenv';
import { AuthUserDto } from 'src/auth/dto/auth-user.dto';
import { GetUserDto } from 'src/users/dto/get-user.dto';
import { mapUserToGetUserDto } from 'src/users/mapper/user.mapper';
import { LoggInUser } from './dto/log-in-user.dto';
import * as bcrypt from 'bcrypt';
config();

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<GetUserDto> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    if (isPasswordMatching) {
      return mapUserToGetUserDto(user);
    }
    throw new UnauthorizedException('Unauthorized');
  }

  async login(user: AuthUserDto): Promise<LoggInUser> {
    const fetchedUser = await this.usersService.findOneByEmail(user.email);
    if (!fetchedUser) {
      throw new UnauthorizedException('Unauthorized');
    }
    const payload = {
      email: user.email,
      sub: fetchedUser.id,
    };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_TOKEN,
    });

    return {
      access_token: token,
      user: mapUserToGetUserDto(fetchedUser),
    };
  }
}
