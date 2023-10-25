import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from '../app.service';
import { JwtModule } from '@nestjs/jwt';
import { config } from 'dotenv';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
config();

@Module({
  providers: [AppService, UsersService, AuthService],
  imports: [
    TypeOrmModule.forFeature([
      User,
    ]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
